import type { PDFDocument, PDFObject, PDFRawStream as PDFRawStreamType, PDFRef } from '@cantoo/pdf-lib';
import { loadDoc, saveDoc, loadPdfLib, createDoc } from '../pdflib.ts';
import { openPdf, renderPage, closePdf } from '../pdfjs.ts';
import { yieldToUI } from '../files.ts';
import type { PdfInput, Progress } from './pages.ts';

export type CompressLevel = 'low' | 'medium' | 'high' | 'extreme';

const PRESETS: Record<Exclude<CompressLevel, 'extreme'>, { maxDim: number; quality: number; flate: boolean }> = {
	low: { maxDim: 2600, quality: 0.85, flate: false },
	medium: { maxDim: 1700, quality: 0.72, flate: true },
	high: { maxDim: 1100, quality: 0.55, flate: true }
};

/** Images larger than this are left alone to avoid exhausting memory. */
const MAX_SOURCE_PIXELS = 60_000_000;

export interface CompressResult {
	bytes: Uint8Array;
	originalSize: number;
	/** True when the output is not smaller and the original was returned. */
	unchanged: boolean;
}

type Canvas = HTMLCanvasElement | OffscreenCanvas;

function makeCanvas(width: number, height: number): Canvas {
	if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	return canvas;
}

async function canvasToJpeg(canvas: Canvas, quality: number): Promise<Uint8Array> {
	let blob: Blob | null;
	if ('convertToBlob' in canvas) {
		blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
	} else {
		blob = await new Promise<Blob | null>((resolve) =>
			(canvas as HTMLCanvasElement).toBlob(resolve, 'image/jpeg', quality)
		);
	}
	if (!blob) throw new Error('JPEG encoding failed');
	return new Uint8Array(await blob.arrayBuffer());
}

/** Reverses PNG row predictors (DecodeParms /Predictor ≥ 10). */
export function unpredictPng(
	data: Uint8Array,
	columns: number,
	colors: number,
	bitsPerComponent: number
): Uint8Array | null {
	const bpp = Math.max(1, Math.ceil((colors * bitsPerComponent) / 8));
	const rowLength = Math.ceil((columns * colors * bitsPerComponent) / 8);
	const rows = Math.floor(data.length / (rowLength + 1));
	const out = new Uint8Array(rows * rowLength);
	let previous = new Uint8Array(rowLength);
	for (let r = 0; r < rows; r++) {
		const filter = data[r * (rowLength + 1)];
		const src = data.subarray(r * (rowLength + 1) + 1, (r + 1) * (rowLength + 1));
		const cur = out.subarray(r * rowLength, (r + 1) * rowLength);
		for (let i = 0; i < rowLength; i++) {
			const left = i >= bpp ? cur[i - bpp] : 0;
			const up = previous[i];
			const upLeft = i >= bpp ? previous[i - bpp] : 0;
			let predicted: number;
			switch (filter) {
				case 0:
					predicted = 0;
					break;
				case 1:
					predicted = left;
					break;
				case 2:
					predicted = up;
					break;
				case 3:
					predicted = (left + up) >> 1;
					break;
				case 4: {
					const p = left + up - upLeft;
					const pa = Math.abs(p - left);
					const pb = Math.abs(p - up);
					const pc = Math.abs(p - upLeft);
					predicted = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
					break;
				}
				default:
					return null;
			}
			cur[i] = (src[i] + predicted) & 255;
		}
		previous = cur;
	}
	return out;
}

interface ImageInfo {
	width: number;
	height: number;
	components: 1 | 3;
	filter: 'DCTDecode' | 'FlateDecode';
	hasMatte: boolean;
}

async function inspectImage(doc: PDFDocument, stream: PDFRawStreamType): Promise<ImageInfo | null> {
	const { PDFName, PDFNumber, PDFArray, PDFBool, PDFStream, PDFDict } = await loadPdfLib();
	const dict = stream.dict;
	const num = (key: string) => {
		const value = dict.lookup(PDFName.of(key));
		return value instanceof PDFNumber ? value.asNumber() : undefined;
	};
	if (dict.lookup(PDFName.of('Subtype')) !== PDFName.of('Image')) return null;
	const imageMask = dict.lookup(PDFName.of('ImageMask'));
	if (imageMask instanceof PDFBool && imageMask.asBoolean()) return null;
	if (dict.has(PDFName.of('Mask')) || dict.has(PDFName.of('Decode'))) return null;
	const width = num('Width');
	const height = num('Height');
	if (!width || !height || width * height > MAX_SOURCE_PIXELS) return null;

	let filterValue = dict.lookup(PDFName.of('Filter'));
	if (filterValue instanceof PDFArray) {
		if (filterValue.size() !== 1) return null;
		filterValue = filterValue.lookup(0);
	}
	let filter: ImageInfo['filter'];
	if (filterValue === PDFName.of('DCTDecode')) filter = 'DCTDecode';
	else if (filterValue === PDFName.of('FlateDecode')) filter = 'FlateDecode';
	else return null;

	const bpc = num('BitsPerComponent') ?? 8;
	if (bpc !== 8) return null;

	let colorSpace = dict.lookup(PDFName.of('ColorSpace'));
	let components: 1 | 3 | null = null;
	if (colorSpace === PDFName.of('DeviceRGB') || colorSpace === PDFName.of('CalRGB')) components = 3;
	else if (colorSpace === PDFName.of('DeviceGray') || colorSpace === PDFName.of('CalGray')) components = 1;
	else if (colorSpace instanceof PDFArray && colorSpace.size() >= 1) {
		const family = colorSpace.lookup(0);
		if (family === PDFName.of('CalRGB')) components = 3;
		else if (family === PDFName.of('CalGray')) components = 1;
		else if (family === PDFName.of('ICCBased')) {
			const profile = colorSpace.lookup(1);
			const n = profile instanceof PDFStream ? profile.dict.lookup(PDFName.of('N')) : undefined;
			const count = n instanceof PDFNumber ? n.asNumber() : 0;
			if (count === 3) components = 3;
			else if (count === 1) components = 1;
		}
	}
	colorSpace = undefined;
	if (!components) return null;

	let hasMatte = false;
	const smask = dict.lookup(PDFName.of('SMask'));
	if (smask instanceof PDFStream) hasMatte = smask.dict.has(PDFName.of('Matte'));
	else if (smask instanceof PDFDict) hasMatte = smask.has(PDFName.of('Matte'));
	return { width, height, components, filter, hasMatte };
}

async function decodeToCanvas(
	doc: PDFDocument,
	stream: PDFRawStreamType,
	info: ImageInfo
): Promise<Canvas | null> {
	if (info.filter === 'DCTDecode') {
		const blob = new Blob([stream.contents as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' });
		let bitmap: ImageBitmap;
		try {
			bitmap = await createImageBitmap(blob, { imageOrientation: 'none' } as ImageBitmapOptions);
		} catch {
			return null;
		}
		if (bitmap.width !== info.width || bitmap.height !== info.height) {
			bitmap.close();
			return null;
		}
		const canvas = makeCanvas(info.width, info.height);
		const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
		if (!ctx) return null;
		ctx.drawImage(bitmap, 0, 0);
		bitmap.close();
		return canvas;
	}

	const { PDFName, PDFNumber, PDFDict, PDFArray } = await loadPdfLib();
	const { unzlibSync, inflateSync } = await import('fflate');
	let raw: Uint8Array;
	try {
		raw = unzlibSync(stream.contents);
	} catch {
		try {
			raw = inflateSync(stream.contents);
		} catch {
			return null;
		}
	}
	let params = stream.dict.lookup(PDFName.of('DecodeParms'));
	if (params instanceof PDFArray) params = params.lookup(0);
	if (params instanceof PDFDict) {
		const predictorValue = params.lookup(PDFName.of('Predictor'));
		const predictor = predictorValue instanceof PDFNumber ? predictorValue.asNumber() : 1;
		if (predictor === 2) return null;
		if (predictor >= 10) {
			const colorsValue = params.lookup(PDFName.of('Colors'));
			const columnsValue = params.lookup(PDFName.of('Columns'));
			const colors = colorsValue instanceof PDFNumber ? colorsValue.asNumber() : 1;
			const columns = columnsValue instanceof PDFNumber ? columnsValue.asNumber() : 1;
			if (colors !== info.components || columns !== info.width) return null;
			const unpredicted = unpredictPng(raw, columns, colors, 8);
			if (!unpredicted) return null;
			raw = unpredicted;
		}
	}
	const expected = info.width * info.height * info.components;
	if (raw.length < expected) return null;
	const pixels = new ImageData(info.width, info.height);
	const out = pixels.data;
	if (info.components === 3) {
		for (let i = 0, j = 0; i < expected; i += 3, j += 4) {
			out[j] = raw[i];
			out[j + 1] = raw[i + 1];
			out[j + 2] = raw[i + 2];
			out[j + 3] = 255;
		}
	} else {
		for (let i = 0, j = 0; i < expected; i++, j += 4) {
			out[j] = out[j + 1] = out[j + 2] = raw[i];
			out[j + 3] = 255;
		}
	}
	const canvas = makeCanvas(info.width, info.height);
	const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
	if (!ctx) return null;
	ctx.putImageData(pixels, 0, 0);
	void doc;
	return canvas;
}

async function recompressImages(
	doc: PDFDocument,
	preset: (typeof PRESETS)[keyof typeof PRESETS],
	onProgress?: Progress
): Promise<void> {
	const { PDFRawStream, PDFName, PDFNumber } = await loadPdfLib();
	const candidates: Array<[PDFRef, PDFRawStreamType]> = [];
	for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
		if (obj instanceof PDFRawStream && obj.dict.lookup(PDFName.of('Subtype')) === PDFName.of('Image')) {
			candidates.push([ref, obj]);
		}
	}
	const skipKeys = new Set(['Filter', 'DecodeParms', 'Length', 'ColorSpace', 'BitsPerComponent', 'Width', 'Height', 'DL']);
	for (let i = 0; i < candidates.length; i++) {
		const [ref, stream] = candidates[i];
		try {
			const info = await inspectImage(doc, stream);
			if (info && (info.filter === 'DCTDecode' || preset.flate)) {
				const source = await decodeToCanvas(doc, stream, info);
				if (source) {
					const scale = info.hasMatte ? 1 : Math.min(1, preset.maxDim / Math.max(info.width, info.height));
					const width = Math.max(1, Math.round(info.width * scale));
					const height = Math.max(1, Math.round(info.height * scale));
					let target = source;
					if (scale < 1) {
						target = makeCanvas(width, height);
						const ctx = target.getContext('2d') as CanvasRenderingContext2D;
						ctx.imageSmoothingEnabled = true;
						ctx.imageSmoothingQuality = 'high';
						ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
					}
					const jpeg = await canvasToJpeg(target, preset.quality);
					if (jpeg.length < stream.contents.length * 0.9) {
						const dict = doc.context.obj({});
						for (const [key, value] of stream.dict.entries()) {
							if (!skipKeys.has(key.asString().slice(1))) dict.set(key, value);
						}
						dict.set(PDFName.of('Width'), PDFNumber.of(width));
						dict.set(PDFName.of('Height'), PDFNumber.of(height));
						dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));
						dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));
						dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
						doc.context.assign(ref, PDFRawStream.of(dict, jpeg));
					}
				}
			}
		} catch {
			// Leave images we cannot process untouched.
		}
		onProgress?.((i + 1) / Math.max(1, candidates.length));
		await yieldToUI();
	}
}

/** Drops embedded page thumbnails and other data viewers regenerate on demand. */
async function stripExtras(doc: PDFDocument): Promise<void> {
	const { PDFName } = await loadPdfLib();
	for (const page of doc.getPages()) {
		page.node.delete(PDFName.of('Thumb'));
		page.node.delete(PDFName.of('PieceInfo'));
	}
	doc.catalog.delete(PDFName.of('PieceInfo'));
}

/** Renders every page to a JPEG and rebuilds the document (text becomes an image). */
async function rasterize(input: PdfInput, onProgress?: Progress): Promise<Uint8Array> {
	const source = await openPdf(input.bytes, input.password);
	const out = await createDoc();
	try {
		const dpi = 110;
		for (let i = 1; i <= source.numPages; i++) {
			const page = await source.getPage(i);
			const canvas = document.createElement('canvas');
			await renderPage(page, canvas, { scale: dpi / 72, pixelRatio: 1 });
			const jpeg = await canvasToJpeg(canvas, 0.6);
			const image = await out.embedJpg(jpeg);
			const viewport = page.getViewport({ scale: 1 });
			const pdfPage = out.addPage([viewport.width, viewport.height]);
			pdfPage.drawImage(image, { x: 0, y: 0, width: viewport.width, height: viewport.height });
			page.cleanup();
			canvas.width = canvas.height = 0;
			onProgress?.(i / source.numPages);
			await yieldToUI();
		}
	} finally {
		await closePdf(source);
	}
	return saveDoc(out);
}

export async function compressPdf(
	input: PdfInput,
	level: CompressLevel,
	onProgress?: Progress
): Promise<CompressResult> {
	const originalSize = input.bytes.length;
	let bytes: Uint8Array;
	if (level === 'extreme') {
		bytes = await rasterize(input, onProgress);
	} else {
		const doc = await loadDoc(input.bytes, input.password);
		await recompressImages(doc, PRESETS[level], (f) => onProgress?.(f * 0.9));
		await stripExtras(doc);
		bytes = await saveDoc(doc, { objectStreams: true });
		onProgress?.(1);
	}
	// Encrypted inputs come out decrypted, so even an equal size is a useful result there.
	if (bytes.length >= originalSize && !input.password) {
		return { bytes: input.bytes, originalSize, unchanged: true };
	}
	return { bytes, originalSize, unchanged: false };
}

export type { PDFObject };
