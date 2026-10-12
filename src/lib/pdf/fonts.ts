import type { PDFDocument, PDFFont } from '@cantoo/pdf-lib';
import { loadFontkit } from './pdflib.ts';

export type FontFamilyId = 'sans' | 'serif' | 'mono' | 'dancing' | 'caveat' | 'vibes';

export interface FontFamily {
	id: FontFamilyId;
	label: string;
	/** CSS family name registered with @font-face. */
	css: string;
	/** Fallback stack used while the web font loads. */
	fallback: string;
	handwriting: boolean;
	/** Typographic ascender/descender (positive) as a fraction of the em; all fonts set USE_TYPO_METRICS. */
	ascent: number;
	descent: number;
	files: { regular: string; bold?: string; italic?: string; boldItalic?: string };
}

export const FONT_FAMILIES: FontFamily[] = [
	{
		id: 'sans',
		label: 'Noto Sans',
		css: 'KP Noto Sans',
		fallback: 'Arial, Helvetica, sans-serif',
		handwriting: false,
		ascent: 1.069,
		descent: 0.293,
		files: {
			regular: '/fonts/NotoSans-Regular.ttf',
			bold: '/fonts/NotoSans-Bold.ttf',
			italic: '/fonts/NotoSans-Italic.ttf',
			boldItalic: '/fonts/NotoSans-BoldItalic.ttf'
		}
	},
	{
		id: 'serif',
		label: 'Noto Serif',
		css: 'KP Noto Serif',
		fallback: '"Times New Roman", Times, serif',
		handwriting: false,
		ascent: 1.069,
		descent: 0.293,
		files: {
			regular: '/fonts/NotoSerif-Regular.ttf',
			bold: '/fonts/NotoSerif-Bold.ttf',
			italic: '/fonts/NotoSerif-Italic.ttf',
			boldItalic: '/fonts/NotoSerif-BoldItalic.ttf'
		}
	},
	{
		id: 'mono',
		label: 'Noto Sans Mono',
		css: 'KP Noto Sans Mono',
		fallback: '"Courier New", Courier, monospace',
		handwriting: false,
		ascent: 1.069,
		descent: 0.293,
		files: { regular: '/fonts/NotoSansMono-Regular.ttf', bold: '/fonts/NotoSansMono-Bold.ttf' }
	},
	{
		id: 'dancing',
		label: 'Dancing Script',
		css: 'KP Dancing Script',
		fallback: 'cursive',
		handwriting: true,
		ascent: 0.92,
		descent: 0.28,
		files: { regular: '/fonts/DancingScript-Regular.ttf', bold: '/fonts/DancingScript-Bold.ttf' }
	},
	{
		id: 'caveat',
		label: 'Caveat',
		css: 'KP Caveat',
		fallback: 'cursive',
		handwriting: true,
		ascent: 0.96,
		descent: 0.3,
		files: { regular: '/fonts/Caveat-Regular.ttf', bold: '/fonts/Caveat-Bold.ttf' }
	},
	{
		id: 'vibes',
		label: 'Great Vibes',
		css: 'KP Great Vibes',
		fallback: 'cursive',
		handwriting: true,
		ascent: 0.851,
		descent: 0.401,
		files: { regular: '/fonts/GreatVibes-Regular.ttf' }
	}
];

export function fontFamily(id: FontFamilyId): FontFamily {
	return FONT_FAMILIES.find((family) => family.id === id) ?? FONT_FAMILIES[0];
}

export interface FontStyle {
	family: FontFamilyId;
	bold: boolean;
	italic: boolean;
}

/** Resolves the closest available file for a style (e.g. mono has no italic). */
export function fontFileFor(style: FontStyle): { url: string; bold: boolean; italic: boolean } {
	const { files } = fontFamily(style.family);
	if (style.bold && style.italic && files.boldItalic)
		return { url: files.boldItalic, bold: true, italic: true };
	if (style.bold && files.bold) return { url: files.bold, bold: true, italic: false };
	if (style.italic && files.italic) return { url: files.italic, bold: false, italic: true };
	return { url: files.regular, bold: false, italic: false };
}

/** Whether the requested style has a real face (otherwise the UI should disable it). */
export function supportsStyle(family: FontFamilyId, kind: 'bold' | 'italic'): boolean {
	const { files } = fontFamily(family);
	return kind === 'bold' ? Boolean(files.bold) : Boolean(files.italic);
}

export function cssFontFamily(id: FontFamilyId): string {
	const family = fontFamily(id);
	return `"${family.css}", ${family.fallback}`;
}

let cssInjected = false;

/** Registers @font-face rules for all editor fonts (the browser only downloads faces in use). */
export function ensureFontFaces(): void {
	if (cssInjected || typeof document === 'undefined') return;
	cssInjected = true;
	const rules: string[] = [];
	for (const family of FONT_FAMILIES) {
		const faces: Array<[string | undefined, number, string]> = [
			[family.files.regular, 400, 'normal'],
			[family.files.bold, 700, 'normal'],
			[family.files.italic, 400, 'italic'],
			[family.files.boldItalic, 700, 'italic']
		];
		for (const [url, weight, style] of faces) {
			if (!url) continue;
			rules.push(
				`@font-face{font-family:"${family.css}";src:url("${url}") format("truetype");font-weight:${weight};font-style:${style};font-display:block}`
			);
		}
	}
	const styleEl = document.createElement('style');
	styleEl.dataset.fonts = 'editor';
	styleEl.textContent = rules.join('\n');
	document.head.appendChild(styleEl);
}

/** Waits until a face is ready for display (no-op outside the browser). */
export async function loadCssFont(style: FontStyle): Promise<void> {
	if (typeof document === 'undefined' || !document.fonts) return;
	ensureFontFaces();
	const resolved = fontFileFor(style);
	const family = fontFamily(style.family);
	try {
		await document.fonts.load(
			`${resolved.italic ? 'italic ' : ''}${resolved.bold ? 700 : 400} 16px "${family.css}"`
		);
	} catch {
		// Fallback fonts are fine for display.
	}
}

type FontSource = (url: string) => Promise<Uint8Array>;

let fontSource: FontSource = async (url) => {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Failed to load font ${url}: ${response.status}`);
	return new Uint8Array(await response.arrayBuffer());
};

/** Allows tests to read fonts from disk instead of over HTTP. */
export function setFontSource(source: FontSource): void {
	fontSource = source;
	byteCache.clear();
}

const byteCache = new Map<string, Promise<Uint8Array>>();

export function fontBytes(url: string): Promise<Uint8Array> {
	let cached = byteCache.get(url);
	if (!cached) {
		cached = fontSource(url).catch((error) => {
			byteCache.delete(url);
			throw error;
		});
		byteCache.set(url, cached);
	}
	return cached;
}

const docFonts = new WeakMap<PDFDocument, Map<string, Promise<PDFFont>>>();

/** Embeds (subsetted) a font into a document once and reuses it. */
export async function embedFont(doc: PDFDocument, style: FontStyle): Promise<PDFFont> {
	const { url } = fontFileFor(style);
	let fonts = docFonts.get(doc);
	if (!fonts) {
		fonts = new Map();
		docFonts.set(doc, fonts);
	}
	let font = fonts.get(url);
	if (!font) {
		font = (async () => {
			const fontkit = await loadFontkit();
			doc.registerFontkit(fontkit as Parameters<PDFDocument['registerFontkit']>[0]);
			return doc.embedFont(await fontBytes(url), { subset: true });
		})();
		fonts.set(url, font);
	}
	return font;
}

/** Baseline offset (from the top of a line box) used by both the editor overlay and the PDF writer. */
export function baselineOffset(family: FontFamilyId, fontSize: number, lineHeight: number): number {
	const { ascent, descent } = fontFamily(family);
	return lineHeight / 2 + ((ascent - descent) * fontSize) / 2;
}

/**
 * Font size for form-field appearances drawn with Noto Sans, shared by the
 * editor's inputs and the generated PDF appearances.
 *
 * `requested` is the size from the field's /DA (0 = automatic). pdf-lib centres
 * only the ascent of the first line, so with Noto's metrics descenders stay
 * inside the box only when size ≤ 0.6 × inner height; larger sizes are capped.
 */
export function fieldFontSize(height: number, multiline: boolean, requested: number): number {
	const inner = Math.max(4, height - 4);
	const fit = Math.max(4, Math.floor(inner * 0.6 * 2) / 2);
	const wanted =
		requested > 0 ? requested : multiline ? 10 : Math.min(12, Math.round(height * 0.55 * 2) / 2);
	return Math.max(4, Math.min(wanted, fit));
}

/** Reads the font size from a /DA string such as "/Helv 12 Tf 0 g" (0 when absent or automatic). */
export function daFontSize(da: string | undefined): number {
	return Number(/([\d.]+)\s+Tf/.exec(da ?? '')?.[1] ?? 0) || 0;
}
