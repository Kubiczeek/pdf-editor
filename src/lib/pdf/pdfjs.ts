import type * as Pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';

export type { PDFDocumentProxy, PDFPageProxy };
export type PdfjsLib = typeof Pdfjs;

let libPromise: Promise<PdfjsLib> | null = null;

/** Lazily loads pdf.js (legacy build for wide browser support) and configures its worker. */
export function loadPdfjs(): Promise<PdfjsLib> {
	if (!libPromise) {
		libPromise = Promise.all([
			import('pdfjs-dist/legacy/build/pdf.mjs'),
			import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')
		])
			.then(([lib, worker]) => {
				lib.GlobalWorkerOptions.workerSrc = worker.default;
				return lib;
			})
			.catch((error) => {
				libPromise = null;
				throw error;
			});
	}
	return libPromise;
}

export class PasswordRequiredError extends Error {
	readonly incorrect: boolean;
	constructor(incorrect: boolean) {
		super(incorrect ? 'Incorrect password' : 'Password required');
		this.name = 'PasswordRequiredError';
		this.incorrect = incorrect;
	}
}

export class InvalidPdfError extends Error {
	constructor(message = 'Invalid PDF') {
		super(message);
		this.name = 'InvalidPdfError';
	}
}

/**
 * Opens a PDF for rendering. The bytes are copied because pdf.js transfers
 * the buffer to its worker.
 */
export async function openPdf(bytes: Uint8Array, password?: string): Promise<PDFDocumentProxy> {
	const lib = await loadPdfjs();
	const task = lib.getDocument({
		data: bytes.slice(),
		password,
		cMapUrl: '/pdfjs/cmaps/',
		cMapPacked: true,
		standardFontDataUrl: '/pdfjs/standard_fonts/',
		wasmUrl: '/pdfjs/wasm/',
		iccUrl: '/pdfjs/iccs/',
		enableXfa: false
	});
	try {
		return await task.promise;
	} catch (error) {
		const name = (error as { name?: string })?.name;
		if (name === 'PasswordException') {
			const code = (error as { code?: number }).code;
			throw new PasswordRequiredError(code === lib.PasswordResponses.INCORRECT_PASSWORD);
		}
		if (name === 'InvalidPDFException' || name === 'FormatError') {
			throw new InvalidPdfError((error as Error).message);
		}
		throw error;
	}
}

/** Releases a document and its worker resources (pdf.js 6 moved destroy() to the loading task). */
export async function closePdf(doc: PDFDocumentProxy | null | undefined): Promise<void> {
	if (!doc) return;
	try {
		await doc.loadingTask.destroy();
	} catch {
		// Already destroyed.
	}
}

export interface RenderOptions {
	/** CSS pixels per PDF point. */
	scale: number;
	/** Extra rotation on top of the page's own /Rotate. */
	rotation?: number;
	/** Device pixel ratio multiplier for crisp output. */
	pixelRatio?: number;
	/** Upper bound for canvas area in pixels (iOS limits canvases to ~16.7M px). */
	maxPixels?: number;
	background?: string;
	/** Render form widgets into the canvas (true) or leave them for an HTML layer (false). */
	renderForms?: boolean;
	signal?: AbortSignal;
}

/** Renders a page into the given canvas (resizing it). Resolves when done, rejects on cancel. */
export async function renderPage(
	page: PDFPageProxy,
	canvas: HTMLCanvasElement,
	options: RenderOptions
): Promise<void> {
	const lib = await loadPdfjs();
	const rotation = (((page.rotate + (options.rotation ?? 0)) % 360) + 360) % 360;
	let pixelRatio = options.pixelRatio ?? 1;
	const viewport = page.getViewport({ scale: options.scale, rotation });
	const maxPixels = options.maxPixels ?? 16_000_000;
	const area = viewport.width * viewport.height * pixelRatio * pixelRatio;
	if (area > maxPixels) pixelRatio *= Math.sqrt(maxPixels / area);
	const outputViewport = page.getViewport({ scale: options.scale * pixelRatio, rotation });
	canvas.width = Math.max(1, Math.floor(outputViewport.width));
	canvas.height = Math.max(1, Math.floor(outputViewport.height));
	const task = page.render({
		canvas,
		viewport: outputViewport,
		background: options.background,
		annotationMode:
			options.renderForms === false ? lib.AnnotationMode.ENABLE_FORMS : lib.AnnotationMode.ENABLE
	});
	const abort = () => task.cancel();
	options.signal?.addEventListener('abort', abort);
	try {
		await task.promise;
	} finally {
		options.signal?.removeEventListener('abort', abort);
	}
}

export function isRenderCancelled(error: unknown): boolean {
	return (error as { name?: string })?.name === 'RenderingCancelledException';
}

/** Page size in PDF points as displayed (rotation applied). */
export function displaySize(page: PDFPageProxy, extraRotation = 0) {
	const viewport = page.getViewport({ scale: 1, rotation: (page.rotate + extraRotation) % 360 });
	return { width: viewport.width, height: viewport.height };
}
