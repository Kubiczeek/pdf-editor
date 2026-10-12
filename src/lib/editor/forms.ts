import type { PDFDocumentProxy } from '#lib/pdf/pdfjs.ts';
import type { FieldValue, FormFieldWidget, PageModel } from './types.ts';

export { fieldFontSize } from '#lib/pdf/fonts.ts';

interface WidgetData {
	annotationType: number;
	id: string;
	fieldName?: string;
	fieldType?: string;
	fieldValue?: unknown;
	rect: number[];
	readOnly?: boolean;
	hidden?: boolean;
	multiLine?: boolean;
	maxLen?: number;
	comb?: boolean;
	checkBox?: boolean;
	radioButton?: boolean;
	pushButton?: boolean;
	exportValue?: string;
	buttonValue?: string;
	combo?: boolean;
	options?: Array<{ exportValue: string; displayValue: string }>;
	textAlignment?: number;
	defaultAppearanceData?: { fontSize?: number };
}

const WIDGET = 20;

/** Reads fillable form widgets and their current values for the editor overlay. */
export async function loadFormFields(
	doc: PDFDocumentProxy,
	pages: PageModel[]
): Promise<{ fields: FormFieldWidget[]; values: Record<string, FieldValue> }> {
	const fields: FormFieldWidget[] = [];
	const values: Record<string, FieldValue> = {};
	for (const model of pages) {
		if (model.kind !== 'doc') continue;
		let annotations: WidgetData[];
		try {
			const page = await doc.getPage(model.index + 1);
			annotations = (await page.getAnnotations({ intent: 'display' })) as WidgetData[];
			const viewport = page.getViewport({ scale: 1 });
			for (const data of annotations) {
				if (data.annotationType !== WIDGET || !data.fieldName || data.hidden) continue;
				let kind: FormFieldWidget['kind'] | null = null;
				if (data.fieldType === 'Tx') kind = 'text';
				else if (data.fieldType === 'Btn' && data.checkBox) kind = 'checkbox';
				else if (data.fieldType === 'Btn' && data.radioButton) kind = 'radio';
				else if (data.fieldType === 'Ch') kind = data.combo ? 'select' : 'list';
				if (!kind) continue;
				const [x1, y1] = viewport.convertToViewportPoint(data.rect[0], data.rect[1]);
				const [x2, y2] = viewport.convertToViewportPoint(data.rect[2], data.rect[3]);
				const x = Math.min(x1, x2);
				const y = Math.min(y1, y2);
				const w = Math.abs(x2 - x1);
				const h = Math.abs(y2 - y1);
				if (w < 2 || h < 2) continue;
				const name = data.fieldName;
				const raw = data.fieldValue;
				if (!(name in values)) {
					if (kind === 'checkbox') {
						values[name] =
							typeof raw === 'string' &&
							raw !== 'Off' &&
							raw !== '' &&
							(!data.exportValue || raw === data.exportValue);
					} else if (kind === 'radio') {
						values[name] = typeof raw === 'string' ? raw : 'Off';
					} else if (Array.isArray(raw)) {
						values[name] = String(raw[0] ?? '');
					} else {
						values[name] = raw === undefined || raw === null ? '' : String(raw);
					}
				}
				fields.push({
					id: `${model.key}-${data.id}`,
					page: model.key,
					name,
					kind,
					x,
					y,
					w,
					h,
					multiline: Boolean(data.multiLine),
					readOnly: Boolean(data.readOnly),
					maxLen: data.maxLen ?? 0,
					exportValue: kind === 'radio' ? (data.buttonValue ?? '') : (data.exportValue ?? 'Yes'),
					options: (data.options ?? []).map((o) => ({
						value: o.exportValue,
						label: o.displayValue ?? o.exportValue
					})),
					fontSize: data.defaultAppearanceData?.fontSize ?? 0,
					comb: Boolean(data.comb),
					align: data.textAlignment === 1 ? 'center' : data.textAlignment === 2 ? 'right' : 'left'
				});
			}
		} catch {
			// A page whose annotations can't be read simply has no fillable fields.
		}
	}
	return { fields, values };
}
