import { loadDoc, createDoc, saveDoc } from '../pdflib.ts';
import { openPdf, renderPage, closePdf } from '../pdfjs.ts';
import { yieldToUI } from '../files.ts';
import type { PdfInput, Progress } from './pages.ts';

/** Rectangle in display space (points, origin top-left, page rotation applied). */
export interface RedactBox {
	page: number;
	x: number;
	y: number;
	width: number;
	height: number;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
	return new Promise((resolve, reject) =>
		canvas.toBlob(
			async (blob) => {
				if (!blob) return reject(new Error('Encoding failed'));
				resolve(new Uint8Array(await blob.arrayBuffer()));
			},
			'image/jpeg',
			quality
		)
	);
}

/**
 * Permanently redacts areas: every page with a box is re-rendered as an image
 * with the boxes painted in, so no text or graphics survive underneath.
 * Pages without boxes are copied unchanged. Metadata is not carried over.
 */
export async function redactPdf(
	input: PdfInput,
	boxes: RedactBox[],
	options: { dpi: number; color: string },
	onProgress?: Progress
): Promise<Uint8Array> {
	const rendered = await openPdf(input.bytes, input.password);
	const source = await loadDoc(input.bytes, input.password);
	const out = await createDoc();
	const byPage = new Map<number, RedactBox[]>();
	for (const box of boxes) {
		const list = byPage.get(box.page) ?? [];
		list.push(box);
		byPage.set(box.page, list);
	}
	try {
		const count = source.getPageCount();
		for (let i = 0; i < count; i++) {
			const pageBoxes = byPage.get(i);
			if (!pageBoxes?.length) {
				const [copy] = await out.copyPages(source, [i]);
				out.addPage(copy);
			} else {
				const page = await rendered.getPage(i + 1);
				const scale = options.dpi / 72;
				const canvas = document.createElement('canvas');
				await renderPage(page, canvas, { scale, pixelRatio: 1, maxPixels: 40_000_000 });
				const viewport = page.getViewport({ scale: 1 });
				const ctx = canvas.getContext('2d')!;
				const sx = canvas.width / viewport.width;
				const sy = canvas.height / viewport.height;
				ctx.fillStyle = options.color;
				for (const box of pageBoxes) {
					const x = Math.floor(box.x * sx);
					const y = Math.floor(box.y * sy);
					ctx.fillRect(x, y, Math.ceil((box.x + box.width) * sx) - x, Math.ceil((box.y + box.height) * sy) - y);
				}
				const jpeg = await canvasToJpeg(canvas, 0.9);
				canvas.width = canvas.height = 0;
				const image = await out.embedJpg(jpeg);
				const newPage = out.addPage([viewport.width, viewport.height]);
				newPage.drawImage(image, { x: 0, y: 0, width: viewport.width, height: viewport.height });
				page.cleanup();
			}
			onProgress?.((i + 1) / count);
			await yieldToUI();
		}
	} finally {
		await closePdf(rendered);
	}
	return saveDoc(out);
}

/** Extracts plain text per page, preserving line breaks reported by pdf.js. */
export async function extractText(input: PdfInput, onProgress?: Progress): Promise<string[]> {
	const doc = await openPdf(input.bytes, input.password);
	const pages: string[] = [];
	try {
		for (let i = 1; i <= doc.numPages; i++) {
			const page = await doc.getPage(i);
			const content = await page.getTextContent();
			let text = '';
			for (const item of content.items) {
				if ('str' in item) {
					text += item.str;
					if (item.hasEOL) text += '\n';
				}
			}
			pages.push(text.replace(/[ \t]+\n/g, '\n').trimEnd());
			page.cleanup();
			onProgress?.(i / doc.numPages);
			if (i % 10 === 0) await yieldToUI();
		}
	} finally {
		await closePdf(doc);
	}
	return pages;
}
