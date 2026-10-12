import { describe, it, expect } from 'vitest';
import { PDFDocument, degrees } from '@cantoo/pdf-lib';
import { openWithPdfjs, makeFixture, pageTextItems, allText } from './helpers.ts';
import { parseRanges, parsePageSet, formatPageSet, chunkPages } from '#lib/pdf/ranges.ts';
import { pageFrame, applyMatrix, invert } from '#lib/pdf/geometry.ts';
import {
	assemblePages,
	deletePages,
	extractGroups,
	mergeDocuments,
	rotatePages
} from '#lib/pdf/ops/pages.ts';
import { addWatermark, addPageNumbers } from '#lib/pdf/ops/stamp.ts';
import {
	protectPdf,
	unlockPdf,
	readMetadata,
	writeMetadata,
	flattenPdf,
	cropPdf
} from '#lib/pdf/ops/document.ts';
import { loadDoc } from '#lib/pdf/pdflib.ts';
import { PasswordRequiredError } from '#lib/pdf/pdfjs.ts';
import { unpredictPng } from '#lib/pdf/ops/compress.ts';

const A4: [number, number] = [595, 842];
const LETTER: [number, number] = [612, 792];

const input = (bytes: Uint8Array, password?: string) => ({ bytes, password, name: 'test.pdf' });

async function pageSizes(bytes: Uint8Array, password?: string) {
	const doc = await openWithPdfjs(bytes, password);
	const sizes: string[] = [];
	for (let i = 1; i <= doc.numPages; i++) {
		const page = await doc.getPage(i);
		const vp = page.getViewport({ scale: 1 });
		sizes.push(`${Math.round(vp.width)}x${Math.round(vp.height)}`);
	}
	await doc.loadingTask.destroy();
	return sizes;
}

async function labels(bytes: Uint8Array) {
	const doc = await openWithPdfjs(bytes);
	const out: string[] = [];
	for (let i = 1; i <= doc.numPages; i++) {
		const page = await doc.getPage(i);
		const content = await page.getTextContent();
		out.push(
			content.items
				.map((item) => ('str' in item ? item.str : ''))
				.join('')
				.trim()
		);
	}
	await doc.loadingTask.destroy();
	return out;
}

describe('ranges', () => {
	it('parses ranges', () => {
		expect(parseRanges('1-3, 5, 8-', 10)).toEqual([[0, 1, 2], [4], [7, 8, 9]]);
		expect(parseRanges('-2', 5)).toEqual([[0, 1]]);
		expect(parseRanges('3-1', 5)).toEqual([[2, 1, 0]]);
		expect(parseRanges('0', 5)).toBeNull();
		expect(parseRanges('6', 5)).toBeNull();
		expect(parseRanges('a', 5)).toBeNull();
		expect(parseRanges('', 5)).toBeNull();
		expect(parsePageSet('3,1-2,2', 5)).toEqual([0, 1, 2]);
		expect(formatPageSet([0, 1, 2, 4, 6, 7])).toBe('1-3, 5, 7-8');
		expect(chunkPages(5, 2)).toEqual([[0, 1], [2, 3], [4]]);
	});
});

describe('geometry', () => {
	it('matches the pdf.js viewport for every rotation and offset boxes', async () => {
		const doc = await PDFDocument.create();
		for (const rotate of [0, 90, 180, 270]) {
			const page = doc.addPage([400, 300]);
			page.setMediaBox(10, 20, 400, 300);
			page.setCropBox(30, 40, 300, 200);
			page.setRotation(degrees(rotate));
		}
		const bytes = await doc.save();
		const pdf = await openWithPdfjs(bytes);
		for (let i = 1; i <= 4; i++) {
			const page = await pdf.getPage(i);
			const viewport = page.getViewport({ scale: 1 });
			const box = page.view as [number, number, number, number];
			const frame = pageFrame(box, page.rotate);
			expect(frame.width).toBeCloseTo(viewport.width, 6);
			expect(frame.height).toBeCloseTo(viewport.height, 6);
			for (const [x, y] of [
				[0, 0],
				[10, 25],
				[frame.width, frame.height],
				[frame.width / 3, frame.height / 2]
			]) {
				const [px, py] = applyMatrix(frame.toPdf, x, y);
				const [vx, vy] = viewport.convertToViewportPoint(px, py);
				expect(vx).toBeCloseTo(x, 6);
				expect(vy).toBeCloseTo(y, 6);
			}
			const back = applyMatrix(invert(frame.toPdf), ...applyMatrix(frame.toPdf, 12, 34));
			expect(back[0]).toBeCloseTo(12, 6);
			expect(back[1]).toBeCloseTo(34, 6);
		}
		await pdf.loadingTask.destroy();
	});
});

describe('page operations', () => {
	it('merges documents in order', async () => {
		const a = await makeFixture([
			{ size: A4, label: 'A1' },
			{ size: A4, label: 'A2' }
		]);
		const b = await makeFixture([{ size: LETTER, label: 'B1' }]);
		const merged = await mergeDocuments([input(a), input(b)]);
		expect(await labels(merged)).toEqual(['A1', 'A2', 'B1']);
		expect(await pageSizes(merged)).toEqual(['595x842', '595x842', '612x792']);
	});

	it('reorders, duplicates, rotates and inserts pages while keeping form fields', async () => {
		const a = await makeFixture(
			[
				{ size: A4, label: 'P1' },
				{ size: LETTER, label: 'P2' },
				{ size: [300, 300], label: 'P3' }
			],
			{ form: true }
		);
		const b = await makeFixture([{ size: [200, 400], label: 'X1' }]);
		const out = await assemblePages(
			[input(a), input(b)],
			[
				{ kind: 'page', source: 0, index: 2, rotation: 0 },
				{ kind: 'page', source: 0, index: 0, rotation: 90 },
				{ kind: 'blank', width: 100, height: 50, rotation: 0 },
				{ kind: 'page', source: 1, index: 0, rotation: 0 },
				{ kind: 'page', source: 0, index: 0, rotation: 0 }
			]
		);
		expect(await labels(out)).toEqual(['P3', 'P1', '', 'X1', 'P1']);
		expect(await pageSizes(out)).toEqual(['300x300', '842x595', '100x50', '200x400', '595x842']);
		const doc = await PDFDocument.load(out);
		const form = doc.getForm();
		expect(form.getTextField('name').getText()).toBe('Alice');
		expect(form.getCheckBox('agree').isChecked()).toBe(true);
		expect(doc.getTitle()).toBe('Fixture');
	});

	it('deletes and extracts pages', async () => {
		const a = await makeFixture([
			{ size: A4, label: 'P1' },
			{ size: A4, label: 'P2' },
			{ size: A4, label: 'P3' },
			{ size: A4, label: 'P4' }
		]);
		expect(await labels(await deletePages(input(a), new Set([1, 3]), 4))).toEqual(['P1', 'P3']);
		const groups = await extractGroups(input(a), [[3, 0], [1]]);
		expect(groups).toHaveLength(2);
		expect(await labels(groups[0])).toEqual(['P4', 'P1']);
		expect(await labels(groups[1])).toEqual(['P2']);
	});

	it('rotates pages relative to their current rotation', async () => {
		const a = await makeFixture([
			{ size: A4, label: 'P1', rotate: 90 },
			{ size: A4, label: 'P2' }
		]);
		const out = await rotatePages(
			input(a),
			new Map([
				[0, 90],
				[1, -90]
			])
		);
		const doc = await openWithPdfjs(out);
		expect((await doc.getPage(1)).rotate).toBe(180);
		expect((await doc.getPage(2)).rotate).toBe(270);
		await doc.loadingTask.destroy();
	});
});

describe('stamping', () => {
	it('places an upright, centred watermark with Czech characters on rotated pages', async () => {
		for (const rotate of [0, 90, 180, 270]) {
			const a = await makeFixture([{ size: A4, label: 'P1', rotate }]);
			const out = await addWatermark(input(a), {
				mark: {
					kind: 'text',
					text: 'Důvěrné – Příliš žluťoučký kůň',
					font: 'sans',
					bold: true,
					size: 30,
					color: '#ff0000'
				},
				position: 'center',
				angle: 0,
				opacity: 0.5,
				behind: false,
				pages: null
			});
			const page = await pageTextItems(out, 1);
			const mark = page.items.find((item) => item.str.includes('Důvěrné'));
			expect(mark, `rotation ${rotate}`).toBeDefined();
			expect(mark!.str).toBe('Důvěrné – Příliš žluťoučký kůň');
			// Upright on screen: baseline points right.
			expect(mark!.a).toBeGreaterThan(0);
			expect(Math.abs(mark!.b)).toBeLessThan(0.001);
			// Baseline sits slightly below the vertical centre of the displayed page.
			expect(mark!.y).toBeGreaterThan(page.height / 2);
			expect(mark!.y).toBeLessThan(page.height / 2 + 20);
			expect(mark!.x).toBeGreaterThan(0);
			expect(mark!.x).toBeLessThan(page.width / 2);
		}
	});

	it('draws page numbers at the bottom centre of the displayed page', async () => {
		const a = await makeFixture([
			{ size: A4, label: 'P1' },
			{ size: A4, label: 'P2', rotate: 90 },
			{ size: A4, label: 'P3', rotate: 270 }
		]);
		const out = await addPageNumbers(input(a), {
			position: 'bottom-center',
			template: 'Strana {n} z {total}',
			start: 1,
			firstPage: 0,
			lastPage: 2,
			margin: 30,
			size: 12,
			font: 'sans',
			bold: false,
			color: '#000000'
		});
		for (let p = 1; p <= 3; p++) {
			const page = await pageTextItems(out, p);
			const label = page.items.find((item) => item.str.startsWith('Strana'));
			expect(label?.str).toBe(`Strana ${p} z 3`);
			expect(label!.a).toBeGreaterThan(0);
			expect(Math.abs(label!.b)).toBeLessThan(0.001);
			expect(label!.y).toBeGreaterThan(page.height - 40);
			expect(label!.y).toBeLessThan(page.height - 25);
			expect(Math.abs(label!.x - (page.width / 2 - 40))).toBeLessThan(25);
		}
	});

	it('tiles a watermark and can place it behind content', async () => {
		const a = await makeFixture([{ size: A4, label: 'P1' }]);
		const out = await addWatermark(input(a), {
			mark: { kind: 'text', text: 'COPY', font: 'serif', bold: false, size: 24, color: '#888888' },
			position: 'tile',
			angle: 45,
			opacity: 0.3,
			behind: true,
			pages: [0]
		});
		const page = await pageTextItems(out, 1);
		expect(page.items.filter((item) => item.str === 'COPY').length).toBeGreaterThan(4);
		expect(allText(page.items)).toContain('P1');
	});
});

describe('security', () => {
	it('protects with a password and unlocks again', async () => {
		const a = await makeFixture([{ size: A4, label: 'Secret page' }]);
		const locked = await protectPdf(input(a), {
			userPassword: 'heslo123',
			allowPrinting: true,
			allowCopying: false,
			allowModifying: false,
			allowAnnotating: false
		});
		await expect(openWithPdfjs(locked)).rejects.toMatchObject({ name: 'PasswordException' });
		const opened = await pageTextItems(locked, 1, 'heslo123');
		expect(allText(opened.items)).toContain('Secret page');
		await expect(loadDoc(locked)).rejects.toBeInstanceOf(PasswordRequiredError);
		await expect(loadDoc(locked, 'wrong')).rejects.toMatchObject({ incorrect: true });

		const unlocked = await unlockPdf(input(locked, 'heslo123'));
		const plain = await pageTextItems(unlocked, 1);
		expect(allText(plain.items)).toContain('Secret page');
		const reloaded = await PDFDocument.load(unlocked);
		expect(reloaded.isEncrypted).toBe(false);
	});
});

describe('document tools', () => {
	it('edits and clears metadata', async () => {
		const a = await makeFixture([{ size: A4, label: 'P1' }]);
		const out = await writeMetadata(input(a), {
			title: 'Výroční zpráva',
			author: 'Jakub',
			subject: 'Test',
			keywords: 'a, b',
			creator: 'Me',
			clearAll: false
		});
		const meta = await readMetadata(input(out));
		expect(meta.title).toBe('Výroční zpráva');
		expect(meta.author).toBe('Jakub');
		expect(meta.keywords).toContain('a');
		const cleared = await writeMetadata(input(out), {
			title: '',
			author: '',
			subject: '',
			keywords: '',
			creator: '',
			clearAll: true
		});
		const clearedMeta = await readMetadata(input(cleared));
		expect(clearedMeta.title).toBe('');
		expect(clearedMeta.author).toBe('');
		expect(clearedMeta.producer).toBe('');
	});

	it('flattens form fields into page content', async () => {
		const a = await makeFixture([{ size: A4, label: 'P1' }], { form: true });
		const { bytes, count } = await flattenPdf(input(a), { forms: true, annotations: true });
		expect(count).toBe(2);
		const doc = await PDFDocument.load(bytes);
		expect(doc.getForm().getFields()).toHaveLength(0);
		expect(doc.getPage(0).node.Annots()?.size() ?? 0).toBe(0);
		const page = await pageTextItems(bytes, 1);
		expect(allText(page.items)).toContain('Alice');
	});

	it('crops pages by display-relative margins', async () => {
		const a = await makeFixture([
			{ size: [600, 800], label: 'P1' },
			{ size: [600, 800], label: 'P2', rotate: 90 }
		]);
		const out = await cropPdf(input(a), { top: 0.1, right: 0.25, bottom: 0.2, left: 0.05 }, 2);
		expect(await pageSizes(out)).toEqual(['420x560', '560x420']);
	});
});

describe('png predictor', () => {
	it('reverses sub, up, average and paeth filters', () => {
		// 2x2 RGB image, rows: [1,2,3, 4,5,6], [7,8,9, 10,11,12]
		const raw = [
			[1, 2, 3, 4, 5, 6],
			[7, 8, 9, 10, 11, 12]
		];
		const sub = [1, 1, 2, 3, 3, 3, 3];
		const up = [2, 6, 6, 6, 6, 6, 6];
		const out1 = unpredictPng(new Uint8Array([...sub, ...up]), 2, 3, 8);
		expect(Array.from(out1!)).toEqual(raw.flat());
		// Paeth on first row equals sub; average on the second row.
		const paeth = [4, 1, 2, 3, 3, 3, 3];
		const avg = [
			3,
			7 - 0,
			8 - 1,
			9 - 1,
			10 - Math.floor((7 + 4) / 2),
			11 - Math.floor((8 + 5) / 2),
			12 - Math.floor((9 + 6) / 2)
		];
		const out2 = unpredictPng(new Uint8Array([...paeth, ...avg]), 2, 3, 8);
		expect(Array.from(out2!)).toEqual(raw.flat());
	});
});
