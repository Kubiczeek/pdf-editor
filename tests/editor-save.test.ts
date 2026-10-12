import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts, degrees } from '@cantoo/pdf-lib';
import { openWithPdfjs, pageTextItems } from './helpers.ts';
import { EditorState } from '#lib/editor/state.svelte.ts';
import { saveEdits } from '#lib/editor/save.ts';
import { loadFormFields } from '#lib/editor/forms.ts';
import type { PageModel } from '#lib/editor/types.ts';

async function editorFor(bytes: Uint8Array) {
	const doc = await openWithPdfjs(bytes);
	const state = new EditorState({ doc: doc as never, bytes, fileName: 'test.pdf' });
	const pages: PageModel[] = [];
	for (let i = 0; i < doc.numPages; i++) {
		const page = await doc.getPage(i + 1);
		const viewport = page.getViewport({ scale: 1 });
		const [a, b, c, d] = page.view;
		pages.push({
			key: `p${i}`,
			kind: 'doc',
			index: i,
			rotation: 0,
			width: viewport.width,
			height: viewport.height,
			view: [a, b, c, d],
			rotate: page.rotate
		});
	}
	state.pages = pages;
	const { fields, values } = await loadFormFields(doc as never, pages);
	state.fields = fields;
	state.formValues = values;
	state.initialValues = { ...values };
	return { state, doc };
}

describe('editor save', () => {
	it('writes text upright at the right place on rotated pages', async () => {
		const src = await PDFDocument.create();
		src.addPage([595, 842]);
		src.addPage([595, 842]).setRotation(degrees(90));
		const bytes = await src.save();
		const { state, doc } = await editorFor(bytes);
		for (const page of state.pages) {
			state.objects.push({
				id: `t-${page.key}`,
				type: 'text',
				page: page.key,
				x: 100,
				y: 200,
				text: 'Žluťoučký kůň',
				family: 'sans',
				size: 20,
				bold: false,
				italic: false,
				color: '#000000',
				align: 'left',
				w: 150,
				h: 25,
				opacity: 1
			});
		}
		const out = await saveEdits(state);
		await doc.loadingTask.destroy();
		for (const pageNumber of [1, 2]) {
			const page = await pageTextItems(out, pageNumber);
			const item = page.items.find((i) => i.str === 'Žluťoučký kůň');
			expect(item, `page ${pageNumber}`).toBeDefined();
			expect(item!.a).toBeGreaterThan(0);
			expect(Math.abs(item!.b)).toBeLessThan(0.001);
			expect(item!.x).toBeCloseTo(100, 0);
			// Baseline: top + line-height/2 + (ascent - descent) * size / 2 = 200 + 12.5 + 7.76
			expect(item!.y).toBeCloseTo(220.26, 0);
		}
	});

	it('fills form fields with readable appearances', async () => {
		const src = await PDFDocument.create();
		const page = src.addPage([595, 842]);
		const form = src.getForm();
		form.createTextField('name').addToPage(page, { x: 100, y: 700, width: 300, height: 24 });
		form.createCheckBox('ok').addToPage(page, { x: 100, y: 650, width: 16, height: 16 });
		const bytes = await src.save();
		const { state, doc } = await editorFor(bytes);
		state.formValues = { ...state.formValues, name: 'Jan Dvořák', ok: true };
		const out = await saveEdits(state);
		await doc.loadingTask.destroy();
		const result = await PDFDocument.load(out);
		const field = result.getForm().getTextField('name');
		expect(field.getText()).toBe('Jan Dvořák');
		expect(result.getForm().getCheckBox('ok').isChecked()).toBe(true);
		const da = field.acroField.getDefaultAppearance() ?? '';
		// pdf-lib had stored 18 pt (sized for Helvetica); it must be capped so Noto's descenders fit.
		const size = Number(/([\d.]+)\s+Tf/.exec(da)?.[1]);
		expect(size).toBeGreaterThan(8);
		expect(size).toBeLessThanOrEqual(13);
	});

	it('reorders, rotates, deletes and inserts pages', async () => {
		const src = await PDFDocument.create();
		const font = await src.embedFont(StandardFonts.Helvetica);
		for (const label of ['A', 'B', 'C']) src.addPage([400, 600]).drawText(label, { x: 50, y: 500, size: 30, font });
		const bytes = await src.save();
		const { state, doc } = await editorFor(bytes);
		state.movePage(2, 0); // C A B
		state.rotatePage(state.pages[1].key, 90); // A rotated
		state.deletePage(state.pages[2].key); // drop B
		state.insertBlankPage(0); // C, blank, A
		const out = await saveEdits(state);
		await doc.loadingTask.destroy();
		const pdf = await openWithPdfjs(out);
		expect(pdf.numPages).toBe(3);
		const labels: string[] = [];
		for (let i = 1; i <= 3; i++) {
			const p = await pdf.getPage(i);
			const content = await p.getTextContent();
			labels.push(content.items.map((it) => ('str' in it ? it.str : '')).join('') + `@${p.rotate}`);
		}
		await pdf.loadingTask.destroy();
		expect(labels).toEqual(['C@0', '@0', 'A@90']);
	});
});
