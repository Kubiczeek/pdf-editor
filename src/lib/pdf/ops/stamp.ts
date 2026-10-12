import type { PDFDocument, PDFFont, PDFImage } from '@cantoo/pdf-lib';
import { loadDoc, saveDoc, loadPdfLib } from '../pdflib.ts';
import { embedFont, fontFamily, type FontFamilyId } from '../fonts.ts';
import { framePdfPage } from '../structure.ts';
import { multiply, type Matrix } from '../geometry.ts';
import { withMatrix, pdfColor, sendLastContentStreamToBack } from './draw.ts';
import { yieldToUI } from '../files.ts';
import type { PdfInput, Progress } from './pages.ts';

export interface TextWatermark {
	kind: 'text';
	text: string;
	font: FontFamilyId;
	bold: boolean;
	/** Font size in points. */
	size: number;
	color: string;
}

export interface ImageWatermark {
	kind: 'image';
	bytes: Uint8Array;
	mime: 'image/png' | 'image/jpeg';
	/** Width relative to the page width (0–1). */
	scale: number;
}

export type WatermarkPosition =
	| 'center'
	| 'middle-left'
	| 'middle-right'
	| 'top-left'
	| 'top-center'
	| 'top-right'
	| 'bottom-left'
	| 'bottom-center'
	| 'bottom-right'
	| 'tile';

export interface WatermarkOptions {
	mark: TextWatermark | ImageWatermark;
	position: WatermarkPosition;
	/** Counter-clockwise rotation in degrees as seen on screen. */
	angle: number;
	opacity: number;
	behind: boolean;
	/** Zero-based page indices to stamp; null = all pages. */
	pages: number[] | null;
}

/** Local y-up frame centred at display point (cx, cy), rotated counter-clockwise by `angle`. */
function rotatedFrame(toPdf: Matrix, cx: number, cy: number, angle: number): Matrix {
	const rad = (angle * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	return multiply(toPdf, [cos, -sin, -sin, -cos, cx, cy]);
}

export interface Sized {
	width: number;
	height: number;
}

function anchorPoint(
	position: Exclude<WatermarkPosition, 'tile'>,
	page: Sized,
	box: Sized,
	angle: number
): [number, number] {
	// Half extents of the rotated box, so the mark stays inside the margins.
	const rad = (angle * Math.PI) / 180;
	const hw = (Math.abs(box.width * Math.cos(rad)) + Math.abs(box.height * Math.sin(rad))) / 2;
	const hh = (Math.abs(box.width * Math.sin(rad)) + Math.abs(box.height * Math.cos(rad))) / 2;
	const margin = Math.min(page.width, page.height) * 0.05;
	const [vertical, horizontal] = position === 'center' ? ['middle', 'center'] : position.split('-');
	const x =
		horizontal === 'left'
			? margin + hw
			: horizontal === 'right'
				? page.width - margin - hw
				: page.width / 2;
	const y =
		vertical === 'top' ? margin + hh : vertical === 'bottom' ? page.height - margin - hh : page.height / 2;
	return [x, y];
}

/**
 * Centres (in display space) where the watermark box is drawn. Shared by the
 * PDF writer and the on-screen preview so both match exactly.
 */
export function watermarkCenters(
	position: WatermarkPosition,
	page: Sized,
	box: Sized,
	angle: number
): Array<[number, number]> {
	if (position !== 'tile') return [anchorPoint(position, page, box, angle)];
	const centers: Array<[number, number]> = [];
	const stepX = box.width + Math.max(60, box.width * 0.6);
	const stepY = box.height + Math.max(90, box.height * 2.5);
	const reach = Math.hypot(page.width, page.height);
	let row = 0;
	for (let y = -reach / 2; y <= page.height + reach / 2; y += stepY, row++) {
		const offset = row % 2 ? stepX / 2 : 0;
		for (let x = -reach / 2 + offset; x <= page.width + reach / 2; x += stepX) {
			// Only keep tiles whose centre can reach the page after rotation.
			const pad = Math.max(box.width, box.height);
			if (x > -pad && x < page.width + pad && y > -pad && y < page.height + pad) {
				centers.push([x, y]);
			}
		}
	}
	return centers;
}

export async function addWatermark(
	input: PdfInput,
	options: WatermarkOptions,
	onProgress?: Progress
): Promise<Uint8Array> {
	const doc = await loadDoc(input.bytes, input.password);
	const pages = doc.getPages();
	const targets = options.pages ?? pages.map((_, i) => i);
	const mark = options.mark;

	let font: PDFFont | null = null;
	let image: PDFImage | null = null;
	let color = await pdfColor('#000000');
	let lines: string[] = [];
	let lineHeight = 0;
	let baseline = 0;
	if (mark.kind === 'text') {
		font = await embedFont(doc, { family: mark.font, bold: mark.bold, italic: false });
		color = await pdfColor(mark.color);
		lines = mark.text.split(/\r?\n/);
		lineHeight = mark.size * 1.2;
		const metrics = fontFamily(mark.font);
		baseline = ((metrics.ascent - metrics.descent) * mark.size) / 2;
	} else {
		image = mark.mime === 'image/png' ? await doc.embedPng(mark.bytes) : await doc.embedJpg(mark.bytes);
	}

	for (let t = 0; t < targets.length; t++) {
		const page = pages[targets[t]];
		if (!page) continue;
		const frame = await framePdfPage(page);
		let box: Sized;
		if (font) {
			const width = Math.max(...lines.map((line) => font!.widthOfTextAtSize(line, (mark as TextWatermark).size)));
			box = { width, height: lineHeight * lines.length };
		} else {
			const width = frame.width * (mark as ImageWatermark).scale;
			box = { width, height: (width * image!.height) / image!.width };
		}

		const centers = watermarkCenters(options.position, frame, box, options.angle);

		for (const [cx, cy] of centers) {
			await withMatrix(page, rotatedFrame(frame.toPdf, cx, cy, options.angle), () => {
				if (font) {
					const textMark = mark as TextWatermark;
					lines.forEach((line, i) => {
						const width = font!.widthOfTextAtSize(line, textMark.size);
						// Line i's vertical centre, measured upward from the block centre.
						const lineCenter = box.height / 2 - lineHeight * (i + 0.5);
						page.drawText(line, {
							x: -width / 2,
							y: lineCenter - baseline,
							size: textMark.size,
							font: font!,
							color,
							opacity: options.opacity
						});
					});
				} else {
					page.drawImage(image!, {
						x: -box.width / 2,
						y: -box.height / 2,
						width: box.width,
						height: box.height,
						opacity: options.opacity
					});
				}
			});
		}
		if (options.behind) await sendLastContentStreamToBack(page);
		if (t % 10 === 9) {
			onProgress?.((t + 1) / targets.length);
			await yieldToUI();
		}
	}
	onProgress?.(1);
	return saveDoc(doc);
}

export type NumberPosition =
	| 'top-left'
	| 'top-center'
	| 'top-right'
	| 'bottom-left'
	| 'bottom-center'
	| 'bottom-right';

export interface PageNumberOptions {
	position: NumberPosition;
	/** Template using {n} for the number and {total} for the page count. */
	template: string;
	/** Number printed on the first numbered page. */
	start: number;
	/** Zero-based index of the first page to number (e.g. 1 to skip a cover). */
	firstPage: number;
	/** Zero-based index of the last page to number (inclusive). */
	lastPage: number;
	/** Distance from the page edge in points. */
	margin: number;
	size: number;
	font: FontFamilyId;
	bold: boolean;
	color: string;
}

export async function addPageNumbers(
	input: PdfInput,
	options: PageNumberOptions,
	onProgress?: Progress
): Promise<Uint8Array> {
	const doc = await loadDoc(input.bytes, input.password);
	const pages = doc.getPages();
	const font = await embedFont(doc, { family: options.font, bold: options.bold, italic: false });
	const color = await pdfColor(options.color);
	const metrics = fontFamily(options.font);
	const first = Math.max(0, options.firstPage);
	const last = Math.min(pages.length - 1, options.lastPage);
	const total = last - first + options.start;

	for (let i = first; i <= last; i++) {
		const page = pages[i];
		const frame = await framePdfPage(page);
		const label = options.template
			.replaceAll('{n}', String(options.start + i - first))
			.replaceAll('{total}', String(total));
		const width = font.widthOfTextAtSize(label, options.size);
		const [vertical, horizontal] = options.position.split('-');
		const x =
			horizontal === 'left'
				? options.margin
				: horizontal === 'right'
					? frame.width - options.margin - width
					: (frame.width - width) / 2;
		const baselineY =
			vertical === 'top'
				? options.margin + metrics.ascent * options.size
				: frame.height - options.margin - metrics.descent * options.size;
		await withMatrix(page, multiply(frame.toPdf, [1, 0, 0, -1, x, baselineY]), () => {
			page.drawText(label, { x: 0, y: 0, size: options.size, font, color });
		});
		if (i % 20 === 19) {
			onProgress?.((i - first + 1) / (last - first + 1));
			await yieldToUI();
		}
	}
	onProgress?.(1);
	return saveDoc(doc);
}

export type { PDFDocument };
