import type { PDFPageProxy } from '#lib/pdf/pdfjs.ts';
import { loadPdfjs } from '#lib/pdf/pdfjs.ts';
import type { FontFamilyId } from '#lib/pdf/fonts.ts';

export interface TextLine {
	id: string;
	text: string;
	/** Box in base display space (points). */
	x: number;
	y: number;
	w: number;
	h: number;
	/** Baseline y in base display space. */
	baseline: number;
	size: number;
	family: FontFamilyId;
	bold: boolean;
	italic: boolean;
}

interface Run {
	str: string;
	x: number;
	baseline: number;
	width: number;
	size: number;
	ascent: number;
	descent: number;
	fontName: string;
	family: string;
}

function guessFamily(cssFamily: string, fontName: string): FontFamilyId {
	const name = `${cssFamily} ${fontName}`.toLowerCase();
	if (/mono|courier|consol|menlo/.test(name)) return 'mono';
	if (/serif/.test(cssFamily.toLowerCase()) && !/sans/.test(cssFamily.toLowerCase()))
		return 'serif';
	if (/times|georgia|garamond|cambria|book|minion|palatino|serif/.test(name) && !/sans/.test(name))
		return 'serif';
	return 'sans';
}

/**
 * Groups pdf.js text runs into lines that can be edited as a unit.
 * Only horizontal text is returned; rotated text is left alone.
 */
export async function extractTextLines(page: PDFPageProxy, idPrefix: string): Promise<TextLine[]> {
	const lib = await loadPdfjs();
	const viewport = page.getViewport({ scale: 1 });
	const content = await page.getTextContent();
	const runs: Run[] = [];
	for (const item of content.items) {
		if (!('str' in item) || !item.str.trim()) continue;
		const tx = lib.Util.transform(viewport.transform, item.transform);
		// Skip rotated or mirrored text.
		if (Math.abs(tx[1]) > 0.01 * Math.abs(tx[0]) || tx[0] <= 0) continue;
		const size = Math.hypot(tx[2], tx[3]);
		if (!size || size < 2) continue;
		const style = content.styles[item.fontName] ?? {
			ascent: 0.8,
			descent: -0.2,
			fontFamily: 'sans-serif'
		};
		const ascent = style.ascent && style.ascent > 0 ? style.ascent : 0.8;
		const descent = style.descent && style.descent < 0 ? -style.descent : 0.2;
		runs.push({
			str: item.str,
			x: tx[4],
			baseline: tx[5],
			width: item.width * (viewport.scale || 1),
			size,
			ascent,
			descent,
			fontName: item.fontName,
			family: style.fontFamily ?? ''
		});
	}

	const lines: TextLine[] = [];
	let current: Run[] = [];
	const flush = () => {
		if (!current.length) return;
		const first = current[0];
		const size = Math.max(...current.map((r) => r.size));
		const left = Math.min(...current.map((r) => r.x));
		const right = Math.max(...current.map((r) => r.x + r.width));
		let text = '';
		let prevEnd = -Infinity;
		for (const run of [...current].sort((a, b) => a.x - b.x)) {
			const gap = run.x - prevEnd;
			if (text && gap > size * 0.18 && !text.endsWith(' ') && !run.str.startsWith(' ')) text += ' ';
			text += run.str;
			prevEnd = run.x + run.width;
		}
		const ascent = Math.max(...current.map((r) => r.ascent));
		const descent = Math.max(...current.map((r) => r.descent));
		const fontObj = commonFont(page, first.fontName);
		lines.push({
			id: `${idPrefix}-${lines.length}`,
			text: text.replace(/\s+$/, ''),
			x: left,
			y: first.baseline - ascent * size,
			w: Math.max(1, right - left),
			h: (ascent + descent) * size,
			baseline: first.baseline,
			size,
			family: guessFamily(first.family, fontObj?.name ?? first.fontName),
			bold:
				Boolean(fontObj?.bold || fontObj?.black) ||
				/bold|black|heavy|semibold/i.test(fontObj?.name ?? ''),
			italic: Boolean(fontObj?.italic) || /italic|oblique/i.test(fontObj?.name ?? '')
		});
		current = [];
	};

	for (const run of runs) {
		const last = current[current.length - 1];
		if (last) {
			const sameLine = Math.abs(run.baseline - last.baseline) < Math.max(run.size, last.size) * 0.3;
			const gap = run.x - (last.x + last.width);
			const similarSize = Math.abs(run.size - last.size) < Math.max(run.size, last.size) * 0.25;
			if (!(sameLine && similarSize && gap > -last.size * 0.5 && gap < last.size * 2.2)) flush();
		}
		current.push(run);
	}
	flush();
	return lines;
}

interface FontInfo {
	name?: string;
	bold?: boolean;
	black?: boolean;
	italic?: boolean;
}

function commonFont(page: PDFPageProxy, fontName: string): FontInfo | null {
	try {
		const objs = (
			page as unknown as { commonObjs: { has(id: string): boolean; get(id: string): FontInfo } }
		).commonObjs;
		return objs.has(fontName) ? objs.get(fontName) : null;
	} catch {
		return null;
	}
}

function toHex(r: number, g: number, b: number): string {
	return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Samples the rendered page to guess the background colour around a text line
 * (for the cover rectangle) and the text colour inside it.
 */
export function sampleColors(
	canvas: HTMLCanvasElement,
	pageWidth: number,
	pageHeight: number,
	rotation: number,
	box: { x: number; y: number; w: number; h: number }
): { background: string; text: string } {
	const fallback = { background: '#ffffff', text: '#000000' };
	if (!canvas.width || !canvas.height || rotation % 360 !== 0) return fallback;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) return fallback;
	const sx = canvas.width / pageWidth;
	const sy = canvas.height / pageHeight;
	const pad = 2;
	const x0 = Math.max(0, Math.floor((box.x - pad) * sx));
	const y0 = Math.max(0, Math.floor((box.y - pad) * sy));
	const x1 = Math.min(canvas.width, Math.ceil((box.x + box.w + pad) * sx));
	const y1 = Math.min(canvas.height, Math.ceil((box.y + box.h + pad) * sy));
	const w = x1 - x0;
	const h = y1 - y0;
	if (w < 2 || h < 2) return fallback;
	let data: Uint8ClampedArray;
	try {
		data = ctx.getImageData(x0, y0, w, h).data;
	} catch {
		return fallback;
	}
	// Background: most common colour along the border (quantised).
	const counts = new Map<number, { n: number; r: number; g: number; b: number }>();
	const add = (i: number) => {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];
		const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
		const entry = counts.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
		entry.n++;
		entry.r += r;
		entry.g += g;
		entry.b += b;
		counts.set(key, entry);
	};
	for (let x = 0; x < w; x++) {
		add(x * 4);
		add(((h - 1) * w + x) * 4);
	}
	for (let y = 0; y < h; y++) {
		add(y * w * 4);
		add((y * w + w - 1) * 4);
	}
	let best = { n: 0, r: 255, g: 255, b: 255 };
	for (const entry of counts.values()) if (entry.n > best.n) best = entry;
	const bg = [best.r / best.n, best.g / best.n, best.b / best.n];
	// Text: average of the pixels furthest from the background.
	const pixels: Array<{ d: number; i: number }> = [];
	for (let i = 0; i < data.length; i += 4) {
		const d =
			Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]);
		if (d > 60) pixels.push({ d, i });
	}
	let text = fallback.text;
	if (pixels.length) {
		pixels.sort((a, b) => b.d - a.d);
		const take = pixels.slice(0, Math.max(1, Math.floor(pixels.length * 0.3)));
		let r = 0;
		let g = 0;
		let b = 0;
		for (const { i } of take) {
			r += data[i];
			g += data[i + 1];
			b += data[i + 2];
		}
		text = toHex(r / take.length, g / take.length, b / take.length);
		// Near-black text is almost always intended as pure black.
		const max = Math.max(r, g, b) / take.length;
		if (max < 60) text = '#000000';
	}
	return { background: toHex(bg[0], bg[1], bg[2]), text };
}
