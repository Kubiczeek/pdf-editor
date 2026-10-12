import { createDoc, saveDoc } from '../pdflib.ts';
import { openPdf, renderPage, closePdf } from '../pdfjs.ts';
import { readBytes, yieldToUI } from '../files.ts';
import type { PdfInput, Progress } from './pages.ts';

export type ImageFormat = 'jpeg' | 'png';

export interface RenderedImage {
	page: number;
	blob: Blob;
	width: number;
	height: number;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
	return new Promise((resolve, reject) =>
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('Encoding failed'))),
			type,
			quality
		)
	);
}

/** Renders the selected pages (zero-based) to images at the given DPI. */
export async function pdfToImages(
	input: PdfInput,
	pages: number[],
	options: { format: ImageFormat; dpi: number; quality: number },
	onImage: (image: RenderedImage) => void | Promise<void>,
	onProgress?: Progress
): Promise<void> {
	const doc = await openPdf(input.bytes, input.password);
	try {
		for (let i = 0; i < pages.length; i++) {
			const page = await doc.getPage(pages[i] + 1);
			const canvas = document.createElement('canvas');
			await renderPage(page, canvas, {
				scale: options.dpi / 72,
				pixelRatio: 1,
				maxPixels: 40_000_000,
				background: options.format === 'png' ? 'rgb(255,255,255)' : undefined
			});
			const type = options.format === 'png' ? 'image/png' : 'image/jpeg';
			const blob = await canvasToBlob(
				canvas,
				type,
				options.format === 'jpeg' ? options.quality : undefined
			);
			await onImage({ page: pages[i], blob, width: canvas.width, height: canvas.height });
			canvas.width = canvas.height = 0;
			page.cleanup();
			onProgress?.((i + 1) / pages.length);
			await yieldToUI();
		}
	} finally {
		await closePdf(doc);
	}
}

export type PageSizeOption = 'fit' | 'a4' | 'letter';
export type OrientationOption = 'auto' | 'portrait' | 'landscape';

export interface ImagesToPdfOptions {
	pageSize: PageSizeOption;
	orientation: OrientationOption;
	/** Margin in points. */
	margin: number;
}

const SIZES: Record<Exclude<PageSizeOption, 'fit'>, [number, number]> = {
	a4: [595.28, 841.89],
	letter: [612, 792]
};

/** Reads the EXIF orientation of a JPEG (1 = normal). */
export function jpegOrientation(bytes: Uint8Array): number {
	if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
	let offset = 2;
	while (offset + 4 < bytes.length) {
		if (bytes[offset] !== 0xff) return 1;
		const marker = bytes[offset + 1];
		const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
		if (marker === 0xe1 && length >= 8) {
			const start = offset + 4;
			const isExif =
				bytes[start] === 0x45 &&
				bytes[start + 1] === 0x78 &&
				bytes[start + 2] === 0x69 &&
				bytes[start + 3] === 0x66;
			if (isExif) {
				const tiff = start + 6;
				const little = bytes[tiff] === 0x49;
				const read16 = (p: number) =>
					little ? bytes[p] | (bytes[p + 1] << 8) : (bytes[p] << 8) | bytes[p + 1];
				const read32 = (p: number) =>
					little
						? (bytes[p] | (bytes[p + 1] << 8) | (bytes[p + 2] << 16) | (bytes[p + 3] << 24)) >>> 0
						: ((bytes[p] << 24) | (bytes[p + 1] << 16) | (bytes[p + 2] << 8) | bytes[p + 3]) >>> 0;
				const ifd = tiff + read32(tiff + 4);
				if (ifd + 2 > bytes.length) return 1;
				const entries = read16(ifd);
				for (let e = 0; e < entries; e++) {
					const entry = ifd + 2 + e * 12;
					if (entry + 10 > bytes.length) return 1;
					if (read16(entry) === 0x0112) {
						const value = read16(entry + 8);
						return value >= 1 && value <= 8 ? value : 1;
					}
				}
			}
		}
		if (marker === 0xda) return 1;
		offset += 2 + length;
	}
	return 1;
}

export class UnsupportedImageError extends Error {
	readonly fileName: string;
	constructor(fileName: string) {
		super(`Unsupported image: ${fileName}`);
		this.name = 'UnsupportedImageError';
		this.fileName = fileName;
	}
}

interface PreparedImage {
	bytes: Uint8Array;
	kind: 'jpg' | 'png';
}

async function decodeToCanvas(file: Blob): Promise<HTMLCanvasElement> {
	const bitmap = await createImageBitmap(file, {
		imageOrientation: 'from-image'
	} as ImageBitmapOptions);
	const canvas = document.createElement('canvas');
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	const ctx = canvas.getContext('2d')!;
	ctx.drawImage(bitmap, 0, 0);
	bitmap.close();
	return canvas;
}

function hasTransparency(canvas: HTMLCanvasElement): boolean {
	const ctx = canvas.getContext('2d')!;
	const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
	for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
	return false;
}

/** Converts any browser-decodable image into bytes pdf-lib can embed. */
export async function prepareImage(file: File): Promise<PreparedImage> {
	const bytes = await readBytes(file);
	const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
	const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
	if (isJpeg && jpegOrientation(bytes) === 1) return { bytes, kind: 'jpg' };
	if (isPng) return { bytes, kind: 'png' };
	let canvas: HTMLCanvasElement;
	try {
		canvas = await decodeToCanvas(file);
	} catch {
		throw new UnsupportedImageError(file.name);
	}
	const transparent = !isJpeg && hasTransparency(canvas);
	const blob = await canvasToBlob(canvas, transparent ? 'image/png' : 'image/jpeg', 0.92);
	canvas.width = canvas.height = 0;
	return { bytes: await readBytes(blob), kind: transparent ? 'png' : 'jpg' };
}

export async function imagesToPdf(
	files: File[],
	options: ImagesToPdfOptions,
	onProgress?: Progress
): Promise<Uint8Array> {
	const doc = await createDoc();
	for (let i = 0; i < files.length; i++) {
		const prepared = await prepareImage(files[i]);
		const image =
			prepared.kind === 'jpg'
				? await doc.embedJpg(prepared.bytes)
				: await doc.embedPng(prepared.bytes);
		// Image size in points, assuming 96 DPI screen pixels for "fit" pages.
		const imgW = (image.width * 72) / 96;
		const imgH = (image.height * 72) / 96;
		let pageW: number;
		let pageH: number;
		if (options.pageSize === 'fit') {
			pageW = imgW + options.margin * 2;
			pageH = imgH + options.margin * 2;
		} else {
			[pageW, pageH] = SIZES[options.pageSize];
			const landscape =
				options.orientation === 'landscape' ||
				(options.orientation === 'auto' && image.width > image.height);
			if (landscape) [pageW, pageH] = [pageH, pageW];
		}
		const page = doc.addPage([pageW, pageH]);
		const availW = Math.max(1, pageW - options.margin * 2);
		const availH = Math.max(1, pageH - options.margin * 2);
		const scale = options.pageSize === 'fit' ? 1 : Math.min(availW / imgW, availH / imgH);
		const drawW = imgW * scale;
		const drawH = imgH * scale;
		page.drawImage(image, {
			x: (pageW - drawW) / 2,
			y: (pageH - drawH) / 2,
			width: drawW,
			height: drawH
		});
		onProgress?.((i + 1) / files.length);
		await yieldToUI();
	}
	return saveDoc(doc);
}

export type { PdfInput };
