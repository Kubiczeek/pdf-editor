import type { UiDict } from '#lib/i18n/index.ts';
import { fmt } from '#lib/i18n/index.ts';
import {
	openPdf,
	closePdf,
	PasswordRequiredError,
	InvalidPdfError,
	type PDFDocumentProxy
} from '#lib/pdf/pdfjs.ts';
import { readBytes, looksLikePdf, isPdfFile, isImageFile, uid } from '#lib/pdf/files.ts';
import type { PdfInput } from '#lib/pdf/ops/pages.ts';
import { passwordPrompt } from '#lib/stores/password.svelte.ts';

/** An error whose message is already written for the user. */
export class UserFacingError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'UserFacingError';
	}
}

export interface LoadedPdf {
	id: string;
	file: File;
	name: string;
	size: number;
	bytes: Uint8Array;
	password?: string;
	doc: PDFDocumentProxy;
	pageCount: number;
}

/**
 * Reads a file and opens it with pdf.js, asking for a password when needed.
 * Throws UserFacingError with a translated message on failure.
 */
export async function openPdfFile(file: File, t: UiDict): Promise<LoadedPdf> {
	const bytes = await readBytes(file);
	if (!looksLikePdf(bytes)) {
		throw new UserFacingError(
			fmt(isPdfFile(file) ? t.errors.invalidPdf : t.errors.notPdf, { name: file.name })
		);
	}
	let password: string | undefined;
	for (;;) {
		try {
			const doc = await openPdf(bytes, password);
			if (doc.numPages < 1) {
				await closePdf(doc);
				throw new UserFacingError(t.errors.noPages);
			}
			return {
				id: uid('pdf'),
				file,
				name: file.name,
				size: file.size,
				bytes,
				password,
				doc,
				pageCount: doc.numPages
			};
		} catch (error) {
			if (error instanceof PasswordRequiredError) {
				const answer = await passwordPrompt.ask(file.name, error.incorrect);
				if (answer === null) {
					throw new UserFacingError(fmt(t.errors.passwordCancelled, { name: file.name }));
				}
				password = answer;
				continue;
			}
			if (error instanceof UserFacingError) throw error;
			if (error instanceof InvalidPdfError) {
				throw new UserFacingError(fmt(t.errors.invalidPdf, { name: file.name }));
			}
			throw new UserFacingError(fmt(t.errors.invalidPdf, { name: file.name }));
		}
	}
}

export function toInput(pdf: LoadedPdf): PdfInput {
	return { bytes: pdf.bytes, password: pdf.password, name: pdf.name };
}

export function describeError(t: UiDict, error: unknown): string {
	if (error instanceof UserFacingError) return error.message;
	if (error instanceof PasswordRequiredError) return t.password.wrong;
	const message = error instanceof Error ? error.message : String(error);
	if (/memory|allocation|Array buffer/i.test(message)) return t.errors.tooBig;
	return fmt(t.errors.generic, { message });
}

/** Splits dropped files into accepted and rejected ones for a tool. */
export function filterFiles(
	files: File[],
	accepts: 'pdf' | 'image'
): { ok: File[]; rejected: File[] } {
	const ok: File[] = [];
	const rejected: File[] = [];
	for (const file of files) {
		const valid = accepts === 'pdf' ? isPdfFile(file) || file.type === '' : isImageFile(file);
		(valid ? ok : rejected).push(file);
	}
	return { ok, rejected };
}

export const ACCEPT = {
	pdf: 'application/pdf,.pdf',
	image: 'image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif'
} as const;
