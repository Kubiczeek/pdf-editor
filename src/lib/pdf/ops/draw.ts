import type { PDFPage } from '@cantoo/pdf-lib';
import { loadPdfLib } from '../pdflib.ts';
import type { Matrix } from '../geometry.ts';

/** Runs `draw` with the given matrix concatenated onto the page's CTM. */
export async function withMatrix(page: PDFPage, matrix: Matrix, draw: () => void | Promise<void>) {
	const { pushGraphicsState, popGraphicsState, concatTransformationMatrix } = await loadPdfLib();
	page.pushOperators(pushGraphicsState(), concatTransformationMatrix(...matrix));
	try {
		await draw();
	} finally {
		page.pushOperators(popGraphicsState());
	}
}

/** Parses "#rrggbb" into 0–1 components. */
export function hexToRgb01(hex: string): [number, number, number] {
	const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
	if (!match) return [0, 0, 0];
	const value = parseInt(match[1], 16);
	return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

export async function pdfColor(hex: string) {
	const { rgb } = await loadPdfLib();
	return rgb(...hexToRgb01(hex));
}

/**
 * Moves the most recently added content stream of a page to the front so it
 * paints underneath the existing content.
 */
export async function sendLastContentStreamToBack(page: PDFPage): Promise<void> {
	const { PDFArray, PDFName } = await loadPdfLib();
	const contents = page.node.lookup(PDFName.of('Contents'));
	if (!(contents instanceof PDFArray) || contents.size() < 2) return;
	const last = contents.get(contents.size() - 1);
	contents.remove(contents.size() - 1);
	contents.insert(0, last);
}
