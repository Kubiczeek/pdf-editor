/**
 * Coordinate helpers.
 *
 * "Display space" is the page as a reader sees it: origin top-left, y pointing
 * down, units in PDF points, with the page's /Rotate applied. Every tool that
 * places content works in display space and converts to PDF user space with
 * the affine matrix returned by `displayToPdfMatrix`.
 */

/** Affine matrix [a, b, c, d, e, f]: x' = a·x + c·y + e, y' = b·x + d·y + f. */
export type Matrix = [number, number, number, number, number, number];

/** A box in PDF user space as [x0, y0, x1, y1] (normalised so x0 < x1, y0 < y1). */
export type Box = [number, number, number, number];

export function normalizeBox(box: readonly number[]): Box {
	const [a, b, c, d] = box;
	return [Math.min(a, c), Math.min(b, d), Math.max(a, c), Math.max(b, d)];
}

export function normalizeRotation(rotation: number): 0 | 90 | 180 | 270 {
	if (!Number.isFinite(rotation) || rotation % 90 !== 0) return 0;
	return (((rotation % 360) + 360) % 360) as 0 | 90 | 180 | 270;
}

/** Visible box of a page, mirroring pdf.js: CropBox ∩ MediaBox, falling back to MediaBox. */
export function visibleBox(mediaBox: readonly number[], cropBox?: readonly number[] | null): Box {
	const media = normalizeBox(mediaBox);
	if (!cropBox) return media;
	const crop = normalizeBox(cropBox);
	const box: Box = [
		Math.max(media[0], crop[0]),
		Math.max(media[1], crop[1]),
		Math.min(media[2], crop[2]),
		Math.min(media[3], crop[3])
	];
	return box[2] - box[0] > 0 && box[3] - box[1] > 0 ? box : media;
}

export interface PageFrame {
	/** Visible box in PDF user space. */
	box: Box;
	rotation: 0 | 90 | 180 | 270;
	/** Display width/height in points. */
	width: number;
	height: number;
	/** Maps display space to PDF user space. */
	toPdf: Matrix;
}

export function pageFrame(box: Box, rotation: number): PageFrame {
	const rot = normalizeRotation(rotation);
	const [x0, y0, x1, y1] = box;
	const w = x1 - x0;
	const h = y1 - y0;
	let toPdf: Matrix;
	switch (rot) {
		case 90:
			toPdf = [0, 1, 1, 0, x0, y0];
			break;
		case 180:
			toPdf = [-1, 0, 0, 1, x1, y0];
			break;
		case 270:
			toPdf = [0, -1, -1, 0, x1, y1];
			break;
		default:
			toPdf = [1, 0, 0, -1, x0, y1];
	}
	const swap = rot === 90 || rot === 270;
	return { box, rotation: rot, width: swap ? h : w, height: swap ? w : h, toPdf };
}

/** Matrix product: applying `inner` first, then `outer`. */
export function multiply(outer: Matrix, inner: Matrix): Matrix {
	const [a1, b1, c1, d1, e1, f1] = inner;
	const [a2, b2, c2, d2, e2, f2] = outer;
	return [
		a1 * a2 + b1 * c2,
		a1 * b2 + b1 * d2,
		c1 * a2 + d1 * c2,
		c1 * b2 + d1 * d2,
		e1 * a2 + f1 * c2 + e2,
		e1 * b2 + f1 * d2 + f2
	];
}

export function applyMatrix(m: Matrix, x: number, y: number): [number, number] {
	return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

export function invert(m: Matrix): Matrix {
	const [a, b, c, d, e, f] = m;
	const det = a * d - b * c;
	if (!det) return [1, 0, 0, 1, 0, 0];
	return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det];
}

/**
 * Matrix for a local, y-up drawing frame whose origin is the bottom-left
 * corner of the display-space rectangle (x, y, w, h); maps to PDF space.
 */
export function localFrame(frame: PageFrame, x: number, y: number, h: number): Matrix {
	return multiply(frame.toPdf, [1, 0, 0, -1, x, y + h]);
}

/** Converts a display-space rectangle to a PDF user-space box. */
export function displayRectToPdfBox(
	frame: PageFrame,
	rect: { x: number; y: number; width: number; height: number }
): Box {
	const p1 = applyMatrix(frame.toPdf, rect.x, rect.y);
	const p2 = applyMatrix(frame.toPdf, rect.x + rect.width, rect.y + rect.height);
	return normalizeBox([p1[0], p1[1], p2[0], p2[1]]);
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}
