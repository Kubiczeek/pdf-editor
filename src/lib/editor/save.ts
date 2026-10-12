import type { PDFDocument, PDFPage, PDFImage } from '@cantoo/pdf-lib';
import { loadDoc, saveDoc, loadPdfLib } from '#lib/pdf/pdflib.ts';
import { embedFont, baselineOffset, fieldFontSize, daFontSize } from '#lib/pdf/fonts.ts';
import { pageFrame, normalizeBox, localFrame, displayRectToPdfBox, normalizeRotation, type PageFrame } from '#lib/pdf/geometry.ts';
import { setPageOrder } from '#lib/pdf/structure.ts';
import { withMatrix, hexToRgb01 } from '#lib/pdf/ops/draw.ts';
import type { EditorState } from './state.svelte.ts';
import type { EditorObject, TextObject } from './types.ts';
import {
	inkPaths,
	inkWidth,
	ellipsePath,
	rectPath,
	linePaths,
	symbolPath,
	symbolStroke,
	NOTE_SIZE,
	LINE_HEIGHT
} from './geometry.ts';

type Lib = Awaited<ReturnType<typeof loadPdfLib>>;

async function applyFormValues(lib: Lib, doc: PDFDocument, state: EditorState): Promise<void> {
	const changed = Object.entries(state.formValues).filter(([name, value]) => state.initialValues[name] !== value);
	if (!changed.length) return;
	let form;
	try {
		form = doc.getForm();
	} catch {
		return;
	}
	for (const [name, value] of changed) {
		try {
			const field = form.getFieldMaybe(name);
			if (!field) continue;
			// Use a size that fits Noto's metrics (pdf-lib's automatic size clips descenders).
			if (field instanceof lib.PDFTextField || field instanceof lib.PDFDropdown || field instanceof lib.PDFOptionList) {
				const requested = daFontSize(field.acroField.getDefaultAppearance());
				const height = field.acroField.getWidgets()[0]?.getRectangle().height ?? 20;
				const multiline = field instanceof lib.PDFTextField && field.isMultiline();
				const size = fieldFontSize(height, multiline, requested);
				if (size !== requested) field.setFontSize(size);
			}
			if (field instanceof lib.PDFTextField) {
				const text = String(value);
				const max = field.getMaxLength();
				field.setText(max !== undefined && text.length > max ? text.slice(0, max) : text);
			} else if (field instanceof lib.PDFCheckBox) {
				if (value) field.check();
				else field.uncheck();
			} else if (field instanceof lib.PDFRadioGroup) {
				if (typeof value === 'string' && value && value !== 'Off') field.select(value);
				else field.clear();
			} else if (field instanceof lib.PDFDropdown || field instanceof lib.PDFOptionList) {
				if (typeof value === 'string' && value) field.select(value);
				else field.clear();
			}
		} catch {
			// Skip values a field refuses (e.g. options that don't exist).
		}
	}
	try {
		const font = await embedFont(doc, { family: 'sans', bold: false, italic: false });
		form.updateFieldAppearances(font);
	} catch {
		// Viewers regenerate appearances when NeedAppearances is set.
		try {
			form.acroForm.dict.set(lib.PDFName.of('NeedAppearances'), lib.PDFBool.True);
		} catch {
			// ignore
		}
	}
}

function color(lib: Lib, hex: string) {
	return lib.rgb(...hexToRgb01(hex));
}

async function drawText(lib: Lib, doc: PDFDocument, page: PDFPage, frame: PageFrame, obj: TextObject) {
	const lines = obj.text.replace(/\t/g, '    ').split('\n');
	const font = await embedFont(doc, { family: obj.family, bold: obj.bold, italic: obj.italic });
	const lineHeight = obj.size * LINE_HEIGHT;
	const widths = lines.map((line) => (line ? font.widthOfTextAtSize(line, obj.size) : 0));
	const width = Math.max(0, ...widths);
	const height = lines.length * lineHeight;
	const baseline = baselineOffset(obj.family, obj.size, lineHeight);
	await withMatrix(page, localFrame(frame, obj.x, obj.y, height), () => {
		lines.forEach((line, i) => {
			if (!line.trim()) return;
			const x = obj.align === 'center' ? (width - widths[i]) / 2 : obj.align === 'right' ? width - widths[i] : 0;
			page.drawText(line, {
				x,
				y: height - (i * lineHeight + baseline),
				size: obj.size,
				font,
				color: color(lib, obj.color),
				opacity: obj.opacity
			});
		});
	});
}

async function drawPath(
	lib: Lib,
	page: PDFPage,
	frame: PageFrame,
	paths: string[],
	options: {
		stroke?: string | null;
		strokeWidth?: number;
		fill?: string | null;
		opacity: number;
		multiply?: boolean;
	}
) {
	await withMatrix(page, localFrame(frame, 0, 0, frame.height), () => {
		page.pushOperators(lib.setLineJoin(lib.LineJoinStyle.Round));
		for (const d of paths) {
			if (!d) continue;
			page.drawSvgPath(d, {
				x: 0,
				y: frame.height,
				color: options.fill ? color(lib, options.fill) : undefined,
				opacity: options.fill ? options.opacity : undefined,
				borderColor: options.stroke ? color(lib, options.stroke) : undefined,
				borderWidth: options.stroke ? options.strokeWidth : 0,
				borderOpacity: options.stroke ? options.opacity : undefined,
				borderLineCap: lib.LineCapStyle.Round,
				blendMode: options.multiply ? lib.BlendMode.Multiply : undefined
			});
		}
	});
}

async function addNote(lib: Lib, doc: PDFDocument, page: PDFPage, frame: PageFrame, obj: Extract<EditorObject, { type: 'note' }>) {
	const [x0, y0, x1, y1] = displayRectToPdfBox(frame, { x: obj.x, y: obj.y, width: NOTE_SIZE, height: NOTE_SIZE });
	const annot = doc.context.obj({
		Type: 'Annot',
		Subtype: 'Text',
		Rect: [x0, y0, x1, y1],
		Contents: lib.PDFHexString.fromText(obj.text),
		Name: 'Comment',
		C: hexToRgb01(obj.color),
		CA: obj.opacity,
		M: lib.PDFString.fromDate(new Date()),
		F: 4,
		Open: false
	});
	page.node.addAnnot(doc.context.register(annot));
}

export async function saveEdits(state: EditorState): Promise<Uint8Array> {
	const lib = await loadPdfLib();
	const doc = await loadDoc(state.bytes, state.password);
	const original = doc.getPages();

	await applyFormValues(lib, doc, state);

	const target = new Map<string, PDFPage>();
	for (const model of state.pages) {
		if (model.kind === 'doc') {
			const page = original[model.index];
			if (page) target.set(model.key, page);
		} else {
			target.set(model.key, doc.addPage([model.width, model.height]));
		}
	}

	const images = new Map<string, PDFImage>();
	for (const model of state.pages) {
		const page = target.get(model.key);
		if (!page) continue;
		const objects = state.objects.filter((o) => o.page === model.key);
		if (!objects.length) continue;
		const frame = pageFrame(normalizeBox(model.view), model.rotate);
		for (const obj of objects) {
			switch (obj.type) {
				case 'text':
					if (obj.cover) {
						await drawPath(lib, page, frame, [rectPath(obj.cover.x, obj.cover.y, obj.cover.w, obj.cover.h)], {
							fill: obj.cover.color,
							opacity: 1
						});
					}
					if (obj.text.trim()) await drawText(lib, doc, page, frame, obj);
					break;
				case 'image': {
					const asset = state.assets.get(obj.asset);
					if (!asset) break;
					let image = images.get(obj.asset);
					if (!image) {
						image = asset.mime === 'image/png' ? await doc.embedPng(asset.bytes) : await doc.embedJpg(asset.bytes);
						images.set(obj.asset, image);
					}
					const embedded = image;
					await withMatrix(page, localFrame(frame, obj.x, obj.y, obj.h), () => {
						page.drawImage(embedded, { x: 0, y: 0, width: obj.w, height: obj.h, opacity: obj.opacity });
					});
					break;
				}
				case 'ink':
					await drawPath(lib, page, frame, inkPaths(obj), {
						stroke: obj.color,
						strokeWidth: inkWidth(obj),
						opacity: obj.opacity
					});
					break;
				case 'rect':
				case 'ellipse': {
					const d = obj.type === 'rect' ? rectPath(obj.x, obj.y, obj.w, obj.h) : ellipsePath(obj.x, obj.y, obj.w, obj.h);
					await drawPath(lib, page, frame, [d], {
						stroke: obj.stroke,
						strokeWidth: obj.strokeWidth,
						fill: obj.fill,
						opacity: obj.opacity,
						multiply: obj.blend === 'multiply'
					});
					break;
				}
				case 'line':
				case 'arrow':
					await drawPath(lib, page, frame, linePaths(obj), {
						stroke: obj.stroke,
						strokeWidth: obj.strokeWidth,
						opacity: obj.opacity
					});
					break;
				case 'check':
				case 'cross':
					await drawPath(lib, page, frame, [symbolPath(obj)], {
						stroke: obj.color,
						strokeWidth: symbolStroke(obj),
						opacity: obj.opacity
					});
					break;
				case 'note':
					await addNote(lib, doc, page, frame, obj);
					break;
			}
		}
	}

	if (state.pagesChanged) {
		const ordered: PDFPage[] = [];
		for (const model of state.pages) {
			const page = target.get(model.key);
			if (!page) continue;
			page.setRotation(lib.degrees(normalizeRotation(model.rotate + model.rotation)));
			ordered.push(page);
		}
		await setPageOrder(doc, ordered);
	}

	return saveDoc(doc);
}
