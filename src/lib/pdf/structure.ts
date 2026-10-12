import type {
	PDFDocument,
	PDFPage,
	PDFObject,
	PDFRef as PDFRefType,
	PDFDict as PDFDictType,
	PDFFont
} from '@cantoo/pdf-lib';
import { loadPdfLib, type PdfLib } from './pdflib.ts';
import { normalizeBox, visibleBox, pageFrame, type PageFrame, type Matrix } from './geometry.ts';

function numberArray(lib: PdfLib, value: PDFObject | undefined, doc: PDFDocument): number[] | null {
	const resolved = value instanceof lib.PDFRef ? doc.context.lookup(value) : value;
	if (!(resolved instanceof lib.PDFArray)) return null;
	const out: number[] = [];
	for (let i = 0; i < resolved.size(); i++) {
		const item = resolved.lookup(i);
		if (!(item instanceof lib.PDFNumber)) return null;
		out.push(item.asNumber());
	}
	return out;
}

/** Display frame of a pdf-lib page (visible box + rotation), matching pdf.js. */
export async function framePdfPage(page: PDFPage): Promise<PageFrame> {
	const lib = await loadPdfLib();
	const doc = page.doc;
	const media = numberArray(lib, page.node.MediaBox(), doc) ?? [0, 0, 612, 792];
	const crop = numberArray(lib, page.node.CropBox(), doc);
	const box = visibleBox(media.length === 4 ? media : [0, 0, 612, 792], crop && crop.length === 4 ? crop : null);
	return pageFrame(box, page.getRotation().angle);
}

const INHERITABLE = ['Resources', 'MediaBox', 'CropBox', 'Rotate'];

/** Copies inherited attributes onto each page so pages survive moving between page-tree nodes. */
async function materializeInheritedAttributes(doc: PDFDocument): Promise<void> {
	const { PDFName } = await loadPdfLib();
	for (const page of doc.getPages()) {
		for (const key of INHERITABLE) {
			const name = PDFName.of(key);
			if (!page.node.has(name)) {
				const value = page.node.getInheritableAttribute(name);
				if (value) page.node.set(name, value);
			}
		}
	}
}

/**
 * Replaces the page tree with a flat tree containing exactly `pages`, in order.
 * Pages must belong to `doc` and be unique (use copyPages to duplicate).
 * Unlike removePage/insertPage this keeps every other document structure
 * (form fields, outlines, metadata) intact.
 */
export async function setPageOrder(doc: PDFDocument, pages: PDFPage[]): Promise<void> {
	const { PDFName, PDFPageTree } = await loadPdfLib();
	await materializeInheritedAttributes(doc);
	for (const page of pages) {
		for (const key of INHERITABLE) {
			const name = PDFName.of(key);
			if (!page.node.has(name)) {
				const value = page.node.getInheritableAttribute(name);
				if (value) page.node.set(name, value);
			}
		}
	}
	const seen = new Set<PDFRefType>();
	for (const page of pages) {
		if (seen.has(page.ref)) throw new Error('setPageOrder: duplicate page');
		seen.add(page.ref);
	}
	const tree = PDFPageTree.withContext(doc.context);
	const treeRef = doc.context.register(tree);
	const kids = tree.Kids();
	for (const page of pages) {
		kids.push(page.ref);
		page.node.setParent(treeRef);
	}
	tree.set(PDFName.of('Count'), doc.context.obj(pages.length));
	doc.catalog.set(PDFName.of('Pages'), treeRef);
	// pdf-lib caches the page list; reset it so getPages() reflects the new tree.
	const internals = doc as unknown as { pageCache: { invalidate(): void }; pageCount?: number };
	internals.pageCache.invalidate();
	internals.pageCount = undefined;
}

/** Removes objects that are no longer reachable from the document catalog. */
export async function removeUnusedObjects(doc: PDFDocument): Promise<void> {
	const { PDFRef, PDFDict, PDFArray, PDFStream } = await loadPdfLib();
	const { context } = doc;
	const reachable = new Set<PDFRefType>();
	const stack: PDFObject[] = [];
	const trailer = context.trailerInfo;
	for (const entry of [trailer.Root, trailer.Info, trailer.Encrypt, trailer.ID]) {
		if (entry) stack.push(entry);
	}
	while (stack.length) {
		const obj = stack.pop()!;
		if (obj instanceof PDFRef) {
			if (reachable.has(obj)) continue;
			reachable.add(obj);
			const target = context.lookup(obj);
			if (target) stack.push(target);
		} else if (obj instanceof PDFDict) {
			for (const [, value] of obj.entries()) stack.push(value);
		} else if (obj instanceof PDFArray) {
			for (let i = 0; i < obj.size(); i++) stack.push(obj.get(i));
		} else if (obj instanceof PDFStream) {
			stack.push(obj.dict);
		}
	}
	for (const [ref] of context.enumerateIndirectObjects()) {
		if (!reachable.has(ref)) context.delete(ref);
	}
}

export interface FlattenOptions {
	/** Bake form-field widgets into the page and remove the interactive form. */
	forms: boolean;
	/** Bake other annotations (comments, highlights, stamps, drawings). Links are kept. */
	annotations: boolean;
}

/**
 * Draws annotation appearance streams into page content and removes the
 * annotations, following the appearance-mapping algorithm of ISO 32000 §12.5.5.
 */
export async function flattenAnnotations(doc: PDFDocument, options: FlattenOptions): Promise<number> {
	const lib = await loadPdfLib();
	const { PDFName, PDFDict, PDFRef, PDFStream, PDFNumber } = lib;
	const { context } = doc;
	let flattened = 0;

	const resolveAppearance = (annot: PDFDictType): PDFRefType | null => {
		const ap = annot.lookup(PDFName.of('AP'));
		if (!(ap instanceof PDFDict)) return null;
		const normal = ap.get(PDFName.of('N'));
		const resolved = normal ? context.lookup(normal) : undefined;
		if (resolved instanceof PDFStream) {
			return normal instanceof PDFRef ? normal : context.register(resolved);
		}
		if (resolved instanceof PDFDict) {
			const state = annot.lookup(PDFName.of('AS'));
			let stateEntry = state instanceof lib.PDFName ? resolved.get(state) : undefined;
			if (!stateEntry) {
				const keys = resolved.keys();
				if (keys.length === 1) stateEntry = resolved.get(keys[0]);
			}
			const stream = stateEntry ? context.lookup(stateEntry) : undefined;
			if (stream instanceof PDFStream) {
				return stateEntry instanceof PDFRef ? stateEntry : context.register(stream);
			}
		}
		return null;
	};

	const drawAppearance = (page: PDFPage, annot: PDFDictType, apRef: PDFRefType) => {
		const stream = context.lookup(apRef);
		if (!(stream instanceof PDFStream)) return;
		const rectValues = numberArray(lib, annot.get(PDFName.of('Rect')), doc);
		const bboxValues = numberArray(lib, stream.dict.get(PDFName.of('BBox')), doc);
		if (!rectValues || rectValues.length !== 4 || !bboxValues || bboxValues.length !== 4) return;
		const matrixValues = numberArray(lib, stream.dict.get(PDFName.of('Matrix')), doc);
		const m: Matrix =
			matrixValues && matrixValues.length === 6
				? (matrixValues as Matrix)
				: [1, 0, 0, 1, 0, 0];
		const rect = normalizeBox(rectValues);
		const bbox = normalizeBox(bboxValues);
		const corners = [
			[bbox[0], bbox[1]],
			[bbox[2], bbox[1]],
			[bbox[0], bbox[3]],
			[bbox[2], bbox[3]]
		].map(([x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]);
		const xs = corners.map((c) => c[0]);
		const ys = corners.map((c) => c[1]);
		const tx0 = Math.min(...xs);
		const ty0 = Math.min(...ys);
		const tw = Math.max(...xs) - tx0;
		const th = Math.max(...ys) - ty0;
		const rw = rect[2] - rect[0];
		const rh = rect[3] - rect[1];
		if (tw <= 0 || th <= 0 || rw <= 0 || rh <= 0) return;
		const sx = rw / tw;
		const sy = rh / th;
		if (!stream.dict.has(PDFName.of('Subtype'))) stream.dict.set(PDFName.of('Subtype'), PDFName.of('Form'));
		if (!stream.dict.has(PDFName.of('Type'))) stream.dict.set(PDFName.of('Type'), PDFName.of('XObject'));
		const name = page.node.newXObject('FlatAnnot', apRef);
		page.pushOperators(
			lib.pushGraphicsState(),
			lib.concatTransformationMatrix(sx, 0, 0, sy, rect[0] - sx * tx0, rect[1] - sy * ty0),
			lib.drawObject(name),
			lib.popGraphicsState()
		);
	};

	for (const page of doc.getPages()) {
		const annots = page.node.Annots();
		if (!annots || annots.size() === 0) continue;
		const keep: PDFObject[] = [];
		const removed = new Set<PDFObject>();
		const entries: Array<{ entry: PDFObject; dict: PDFDictType | null }> = [];
		for (let i = 0; i < annots.size(); i++) {
			const entry = annots.get(i);
			const dict = context.lookup(entry);
			entries.push({ entry, dict: dict instanceof PDFDict ? dict : null });
		}
		for (const { entry, dict } of entries) {
			if (!dict) {
				keep.push(entry);
				continue;
			}
			const subtype = dict.lookup(PDFName.of('Subtype'));
			const isWidget = subtype === PDFName.of('Widget');
			const isOther = !isWidget && subtype !== PDFName.of('Link') && subtype !== PDFName.of('Popup');
			if (!((isWidget && options.forms) || (isOther && options.annotations))) {
				keep.push(entry);
				continue;
			}
			const flagsObj = dict.lookup(PDFName.of('F'));
			const flags = flagsObj instanceof PDFNumber ? flagsObj.asNumber() : 0;
			const hidden = (flags & 2) !== 0 || (flags & 32) !== 0;
			if (!hidden) {
				const apRef = resolveAppearance(dict);
				if (apRef) drawAppearance(page, dict, apRef);
			}
			removed.add(entry);
			flattened++;
		}
		// Drop popups whose parent annotation has been flattened.
		const finalKeep = keep.filter((entry) => {
			const dict = context.lookup(entry);
			if (!(dict instanceof PDFDict)) return true;
			if (dict.lookup(PDFName.of('Subtype')) !== PDFName.of('Popup')) return true;
			const parent = dict.get(PDFName.of('Parent'));
			return !(parent && removed.has(parent));
		});
		page.node.set(PDFName.of('Annots'), context.obj(finalKeep));
	}

	if (options.forms) {
		doc.catalog.delete(PDFName.of('AcroForm'));
	}
	return flattened;
}

/** Generates missing appearance streams for form fields using an embedded Unicode font. */
export async function refreshFormAppearances(
	doc: PDFDocument,
	font: PDFFont
): Promise<void> {
	const lib = await loadPdfLib();
	try {
		const form = doc.getForm();
		const needAppearances =
			form.acroForm.dict.lookup(lib.PDFName.of('NeedAppearances'))?.toString() === 'true';
		for (const field of form.getFields()) {
			try {
				const widgets = field.acroField.getWidgets();
				const missing = widgets.some((widget) => !widget.getAppearances()?.normal);
				if (!missing && !needAppearances) continue;
				if (
					field instanceof lib.PDFTextField ||
					field instanceof lib.PDFDropdown ||
					field instanceof lib.PDFOptionList ||
					field instanceof lib.PDFButton
				) {
					field.updateAppearances(font);
				} else if (field instanceof lib.PDFCheckBox || field instanceof lib.PDFRadioGroup) {
					field.updateAppearances();
				}
			} catch {
				// A single malformed field must not break the whole document.
			}
		}
	} catch {
		// Documents without (or with unreadable) forms.
	}
}
