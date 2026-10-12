import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocument, StandardFonts, rgb, degrees } from '@cantoo/pdf-lib';
import { setFontSource } from '#lib/pdf/fonts.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
	require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')
).href;

setFontSource(async (url) => new Uint8Array(await readFile(path.join(root, 'static', url))));

export async function openWithPdfjs(bytes: Uint8Array, password?: string) {
	return pdfjs.getDocument({
		data: bytes.slice(),
		password,
		isEvalSupported: false,
		useSystemFonts: false,
		standardFontDataUrl: `${root.replaceAll('\\', '/')}/node_modules/pdfjs-dist/standard_fonts/`,
		verbosity: 0
	}).promise;
}

export interface FixturePage {
	size: [number, number];
	rotate?: number;
	label: string;
}

/** Builds a document whose pages carry a text label (for identifying order). */
export async function makeFixture(pages: FixturePage[], options: { form?: boolean } = {}) {
	const doc = await PDFDocument.create();
	const font = await doc.embedFont(StandardFonts.Helvetica);
	for (const spec of pages) {
		const page = doc.addPage(spec.size);
		page.drawText(spec.label, { x: 40, y: spec.size[1] - 60, size: 18, font, color: rgb(0, 0, 0) });
		if (spec.rotate) page.setRotation(degrees(spec.rotate));
	}
	if (options.form) {
		const form = doc.getForm();
		const field = form.createTextField('name');
		field.setText('Alice');
		field.addToPage(doc.getPage(0), { x: 40, y: 200, width: 200, height: 24 });
		const box = form.createCheckBox('agree');
		box.addToPage(doc.getPage(0), { x: 40, y: 150, width: 16, height: 16 });
		box.check();
	}
	doc.setTitle('Fixture');
	return doc.save();
}

/** Text items of a page with their position in the displayed (rotated) page, y measured from the top. */
export async function pageTextItems(bytes: Uint8Array, pageNumber: number, password?: string) {
	const doc = await openWithPdfjs(bytes, password);
	const page = await doc.getPage(pageNumber);
	const viewport = page.getViewport({ scale: 1 });
	const content = await page.getTextContent();
	const items = content.items
		.filter((item): item is Extract<typeof item, { str: string }> => 'str' in item && item.str.trim() !== '')
		.map((item) => {
			const [a, b, c, d, e, f] = pdfjs.Util.transform(viewport.transform, item.transform);
			// Direction of the baseline on screen: upright text has b ≈ 0 and a > 0.
			return { str: item.str, x: e, y: f, a, b, c, d };
		});
	const result = { items, width: viewport.width, height: viewport.height, rotate: page.rotate };
	await doc.loadingTask.destroy();
	return result;
}

export function allText(items: Array<{ str: string }>): string {
	return items.map((item) => item.str).join(' ');
}
