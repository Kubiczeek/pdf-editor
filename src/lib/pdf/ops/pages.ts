import type { PDFDocument, PDFPage } from '@cantoo/pdf-lib';
import { loadDoc, createDoc, saveDoc, loadPdfLib } from '../pdflib.ts';
import { setPageOrder } from '../structure.ts';
import { normalizeRotation } from '../geometry.ts';
import { yieldToUI } from '../files.ts';

export interface PdfInput {
	bytes: Uint8Array;
	password?: string;
	name: string;
}

export type Progress = (fraction: number) => void;

/** A page of the output: either an existing page of one of the inputs, or a blank page. */
export type PageSpec =
	| { kind: 'page'; source: number; index: number; rotation: number }
	| { kind: 'blank'; width: number; height: number; rotation: number };

async function setAbsoluteRotation(page: PDFPage, angle: number): Promise<void> {
	const { degrees } = await loadPdfLib();
	page.setRotation(degrees(normalizeRotation(angle)));
}

/**
 * Builds a document from page specs. The first input is modified in place so
 * its form fields, outline and metadata survive; pages from other inputs are copied in.
 */
export async function assemblePages(
	inputs: PdfInput[],
	specs: PageSpec[],
	onProgress?: Progress
): Promise<Uint8Array> {
	if (!inputs.length) throw new Error('No input');
	if (!specs.length) throw new Error('No pages');
	const base = await loadDoc(inputs[0].bytes, inputs[0].password);
	const basePages = base.getPages();
	const baseRotations = basePages.map((page) => page.getRotation().angle);
	const others = new Map<number, PDFDocument>();
	const usedBase = new Set<number>();
	const result: Array<{ page: PDFPage; rotation: number }> = [];

	// Copies must be taken before any rotation is changed on the originals.
	for (let i = 0; i < specs.length; i++) {
		const spec = specs[i];
		if (spec.kind === 'blank') {
			const page = base.addPage([spec.width, spec.height]);
			result.push({ page, rotation: spec.rotation });
		} else if (spec.source === 0) {
			const original = basePages[spec.index];
			if (!original) throw new Error(`Page ${spec.index + 1} does not exist`);
			if (!usedBase.has(spec.index)) {
				usedBase.add(spec.index);
				result.push({ page: original, rotation: baseRotations[spec.index] + spec.rotation });
			} else {
				const [copy] = await base.copyPages(base, [spec.index]);
				result.push({ page: copy, rotation: baseRotations[spec.index] + spec.rotation });
			}
		} else {
			let doc = others.get(spec.source);
			if (!doc) {
				const input = inputs[spec.source];
				if (!input) throw new Error('Unknown source');
				doc = await loadDoc(input.bytes, input.password);
				others.set(spec.source, doc);
			}
			const sourcePage = doc.getPage(spec.index);
			const [copy] = await base.copyPages(doc, [spec.index]);
			result.push({ page: copy, rotation: sourcePage.getRotation().angle + spec.rotation });
		}
		if (i % 20 === 19) {
			onProgress?.((i + 1) / specs.length);
			await yieldToUI();
		}
	}
	for (const { page, rotation } of result) await setAbsoluteRotation(page, rotation);
	await setPageOrder(
		base,
		result.map((entry) => entry.page)
	);
	onProgress?.(1);
	return saveDoc(base);
}

/** Rotates selected pages in place (angles are added to the current rotation). */
export async function rotatePages(
	input: PdfInput,
	rotations: Map<number, number>
): Promise<Uint8Array> {
	const doc = await loadDoc(input.bytes, input.password);
	const pages = doc.getPages();
	for (const [index, delta] of rotations) {
		const page = pages[index];
		if (page && delta % 360 !== 0)
			await setAbsoluteRotation(page, page.getRotation().angle + delta);
	}
	return saveDoc(doc);
}

/** Removes the given pages, keeping everything else (forms, outline) intact. */
export async function deletePages(input: PdfInput, remove: Set<number>, pageCount: number) {
	const specs: PageSpec[] = [];
	for (let i = 0; i < pageCount; i++) {
		if (!remove.has(i)) specs.push({ kind: 'page', source: 0, index: i, rotation: 0 });
	}
	return assemblePages([input], specs);
}

/** Copies pages (in the given order) into fresh documents, one per group. */
export async function extractGroups(
	input: PdfInput,
	groups: number[][],
	onProgress?: Progress
): Promise<Uint8Array[]> {
	const source = await loadDoc(input.bytes, input.password);
	const outputs: Uint8Array[] = [];
	for (let g = 0; g < groups.length; g++) {
		const out = await createDoc();
		const title = source.getTitle();
		if (title) out.setTitle(title);
		const pages = await out.copyPages(source, groups[g]);
		for (const page of pages) out.addPage(page);
		outputs.push(await saveDoc(out));
		onProgress?.((g + 1) / groups.length);
		await yieldToUI();
	}
	return outputs;
}

/** Concatenates whole documents. */
export async function mergeDocuments(
	inputs: PdfInput[],
	onProgress?: Progress
): Promise<Uint8Array> {
	const out = await createDoc();
	for (let i = 0; i < inputs.length; i++) {
		const source = await loadDoc(inputs[i].bytes, inputs[i].password);
		const pages = await out.copyPages(source, source.getPageIndices());
		for (const page of pages) out.addPage(page);
		onProgress?.((i + 1) / inputs.length);
		await yieldToUI();
	}
	return saveDoc(out);
}
