import type * as PdfLibNs from '@cantoo/pdf-lib';
import type { PDFDocument } from '@cantoo/pdf-lib';
import { PDF_PRODUCER } from '#lib/config.ts';
import { PasswordRequiredError, InvalidPdfError } from './pdfjs.ts';

export type PdfLib = typeof PdfLibNs;

let libPromise: Promise<PdfLib> | null = null;
let fontkitPromise: Promise<unknown> | null = null;

/** Lazily loads pdf-lib (the maintained @cantoo fork with encryption support). */
export function loadPdfLib(): Promise<PdfLib> {
	if (!libPromise) {
		libPromise = import('@cantoo/pdf-lib').catch((error) => {
			libPromise = null;
			throw error;
		});
	}
	return libPromise;
}

export function loadFontkit(): Promise<unknown> {
	if (!fontkitPromise) {
		fontkitPromise = import('@cantoo/fontkit')
			.then((module) => (module as { default?: unknown }).default ?? module)
			.catch((error) => {
				fontkitPromise = null;
				throw error;
			});
	}
	return fontkitPromise;
}

/**
 * Loads a document for modification. Encrypted files are decrypted with the
 * given password (an empty password opens files that only restrict permissions).
 */
export async function loadDoc(bytes: Uint8Array, password?: string): Promise<PDFDocument> {
	const { PDFDocument } = await loadPdfLib();
	try {
		return await PDFDocument.load(bytes, {
			password: password ?? '',
			updateMetadata: false
		});
	} catch (error) {
		const message = (error as Error)?.message ?? '';
		if (message === 'NEEDS PASSWORD') throw new PasswordRequiredError(false);
		if (message === 'Password incorrect') throw new PasswordRequiredError(true);
		if (/No PDF header found|Failed to parse|invalid|Expected instance of/i.test(message)) {
			throw new InvalidPdfError(message);
		}
		throw error;
	}
}

/** Creates an empty document with metadata defaults used by every tool. */
export async function createDoc(): Promise<PDFDocument> {
	const { PDFDocument } = await loadPdfLib();
	const doc = await PDFDocument.create({ updateMetadata: false });
	return doc;
}

/**
 * Stamps producer and modification date, then serialises the document.
 * Unreachable objects are dropped first: pdf-lib keeps the source file's old
 * cross-reference and object streams, which would otherwise be written again
 * (bloating the file, and in the case of a decrypted file, still pointing at
 * the old /Encrypt dictionary).
 */
export async function saveDoc(
	doc: PDFDocument,
	options: { objectStreams?: boolean; keepProducer?: boolean; touchMetadata?: boolean } = {}
): Promise<Uint8Array> {
	if (options.touchMetadata !== false) {
		try {
			if (!options.keepProducer) doc.setProducer(PDF_PRODUCER);
			doc.setModificationDate(new Date());
		} catch {
			// Broken /Info dictionaries must not prevent saving.
		}
	}
	const { removeUnusedObjects } = await import('./structure.ts');
	await removeUnusedObjects(doc);
	return doc.save({
		useObjectStreams: options.objectStreams ?? true,
		updateFieldAppearances: false
	});
}
