import { loadDoc, saveDoc, loadPdfLib } from '../pdflib.ts';
import { embedFont } from '../fonts.ts';
import { flattenAnnotations, refreshFormAppearances, framePdfPage } from '../structure.ts';
import { displayRectToPdfBox } from '../geometry.ts';
import type { PdfInput } from './pages.ts';

export interface ProtectOptions {
	userPassword: string;
	/** Optional separate password for changing permissions. */
	ownerPassword?: string;
	allowPrinting: boolean;
	allowCopying: boolean;
	allowModifying: boolean;
	allowAnnotating: boolean;
}

function randomPassword(): string {
	const bytes = new Uint8Array(24);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Encrypts with AES-256. */
export async function protectPdf(input: PdfInput, options: ProtectOptions): Promise<Uint8Array> {
	const doc = await loadDoc(input.bytes, input.password);
	const restricted =
		!options.allowPrinting || !options.allowCopying || !options.allowModifying || !options.allowAnnotating;
	// Without a distinct owner password anyone with the open password could lift the restrictions.
	const ownerPassword =
		options.ownerPassword || (restricted ? randomPassword() : options.userPassword);
	doc.encrypt({
		userPassword: options.userPassword,
		ownerPassword,
		permissions: {
			printing: options.allowPrinting ? 'highResolution' : false,
			copying: options.allowCopying,
			modifying: options.allowModifying,
			annotating: options.allowAnnotating,
			fillingForms: options.allowAnnotating || options.allowModifying,
			contentAccessibility: true,
			documentAssembly: options.allowModifying
		},
		algorithm: 'AES-256'
	});
	return saveDoc(doc);
}

/** Saves a decrypted copy (the password was already verified when loading). */
export async function unlockPdf(input: PdfInput): Promise<Uint8Array> {
	const doc = await loadDoc(input.bytes, input.password);
	return saveDoc(doc, { keepProducer: true });
}

export interface PdfMetadata {
	title: string;
	author: string;
	subject: string;
	keywords: string;
	creator: string;
	producer: string;
	creationDate: Date | null;
	modificationDate: Date | null;
}

export async function readMetadata(input: PdfInput): Promise<PdfMetadata> {
	const doc = await loadDoc(input.bytes, input.password);
	const safe = <T>(read: () => T, fallback: T): T => {
		try {
			return read() ?? fallback;
		} catch {
			return fallback;
		}
	};
	return {
		title: safe(() => doc.getTitle() ?? '', ''),
		author: safe(() => doc.getAuthor() ?? '', ''),
		subject: safe(() => doc.getSubject() ?? '', ''),
		keywords: safe(() => doc.getKeywords() ?? '', ''),
		creator: safe(() => doc.getCreator() ?? '', ''),
		producer: safe(() => doc.getProducer() ?? '', ''),
		creationDate: safe(() => doc.getCreationDate() ?? null, null),
		modificationDate: safe(() => doc.getModificationDate() ?? null, null)
	};
}

export interface MetadataUpdate {
	title: string;
	author: string;
	subject: string;
	keywords: string;
	creator: string;
	/** Remove every metadata field and the XMP packet. */
	clearAll: boolean;
}

export async function writeMetadata(input: PdfInput, update: MetadataUpdate): Promise<Uint8Array> {
	const { PDFName } = await loadPdfLib();
	const doc = await loadDoc(input.bytes, input.password);
	// XMP may hold stale copies of the old values that some viewers prefer over /Info.
	doc.catalog.delete(PDFName.of('Metadata'));
	if (update.clearAll) {
		const infoRef = doc.context.trailerInfo.Info;
		const info = infoRef ? doc.context.lookup(infoRef) : undefined;
		if (info && 'keys' in info) {
			const dict = info as unknown as { keys(): unknown[]; delete(key: unknown): boolean };
			for (const key of dict.keys()) dict.delete(key);
		}
		return saveDoc(doc, { touchMetadata: false });
	}
	const keywords = update.keywords
		.split(/[,;]/)
		.map((k) => k.trim())
		.filter(Boolean);
	doc.setTitle(update.title, { showInWindowTitleBar: Boolean(update.title) });
	doc.setAuthor(update.author);
	doc.setSubject(update.subject);
	doc.setKeywords(keywords);
	doc.setCreator(update.creator);
	return saveDoc(doc);
}

export interface FlattenToolOptions {
	forms: boolean;
	annotations: boolean;
}

export async function flattenPdf(
	input: PdfInput,
	options: FlattenToolOptions
): Promise<{ bytes: Uint8Array; count: number }> {
	const doc = await loadDoc(input.bytes, input.password);
	if (options.forms) {
		const font = await embedFont(doc, { family: 'sans', bold: false, italic: false });
		await refreshFormAppearances(doc, font);
	}
	const count = await flattenAnnotations(doc, options);
	return { bytes: await saveDoc(doc), count };
}

/** Margins as fractions (0–1) of the displayed page size. */
export interface CropMargins {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

/** Sets the visible area (CropBox and MediaBox) of pages; content outside stays in the file. */
export async function cropPdf(
	input: PdfInput,
	margins: Map<number, CropMargins> | CropMargins,
	pageCount: number
): Promise<Uint8Array> {
	const doc = await loadDoc(input.bytes, input.password);
	const pages = doc.getPages();
	for (let i = 0; i < Math.min(pageCount, pages.length); i++) {
		const m = margins instanceof Map ? margins.get(i) : margins;
		if (!m) continue;
		const page = pages[i];
		const frame = await framePdfPage(page);
		const rect = {
			x: frame.width * m.left,
			y: frame.height * m.top,
			width: frame.width * (1 - m.left - m.right),
			height: frame.height * (1 - m.top - m.bottom)
		};
		if (rect.width < 1 || rect.height < 1) continue;
		const [x0, y0, x1, y1] = displayRectToPdfBox(frame, rect);
		page.setMediaBox(x0, y0, x1 - x0, y1 - y0);
		page.setCropBox(x0, y0, x1 - x0, y1 - y0);
		// Other boxes must lie inside the media box.
		page.setTrimBox(x0, y0, x1 - x0, y1 - y0);
		page.setBleedBox(x0, y0, x1 - x0, y1 - y0);
		page.setArtBox(x0, y0, x1 - x0, y1 - y0);
	}
	return saveDoc(doc);
}
