import { multiply, applyMatrix, type Matrix } from '#lib/pdf/geometry.ts';
import type { EditorObject, PageModel, InkObject, LineObject, SymbolObject } from './types.ts';

export const NOTE_SIZE = 22;
/** Line height of text objects as a multiple of the font size (shared by view and writer). */
export const LINE_HEIGHT = 1.25;

export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

/** Size of the page container (points) once the editor rotation is applied. */
export function rotatedSize(page: PageModel): { width: number; height: number } {
	const swap = page.rotation % 180 !== 0;
	return swap ? { width: page.height, height: page.width } : { width: page.width, height: page.height };
}

/** CSS transform placing the unrotated object layer onto the rotated page container. */
export function layerTransform(page: PageModel, zoom: number): string {
	const w = page.width * zoom;
	const h = page.height * zoom;
	switch (page.rotation) {
		case 90:
			return `translate(${h}px, 0) rotate(90deg)`;
		case 180:
			return `translate(${w}px, ${h}px) rotate(180deg)`;
		case 270:
			return `translate(0, ${w}px) rotate(270deg)`;
		default:
			return 'none';
	}
}

/** Converts a point in the rotated container (points) to base display space. */
export function containerToBase(page: PageModel, cx: number, cy: number): [number, number] {
	switch (page.rotation) {
		case 90:
			return [cy, page.height - cx];
		case 180:
			return [page.width - cx, page.height - cy];
		case 270:
			return [page.width - cy, cx];
		default:
			return [cx, cy];
	}
}

/** Converts a movement in the rotated container to a movement in base space. */
export function deltaToBase(page: PageModel, dx: number, dy: number): [number, number] {
	switch (page.rotation) {
		case 90:
			return [dy, -dx];
		case 180:
			return [-dx, -dy];
		case 270:
			return [-dy, dx];
		default:
			return [dx, dy];
	}
}

/** Pointer position → base display space of the page whose container is `el`. */
export function clientToBase(page: PageModel, el: Element, zoom: number, clientX: number, clientY: number) {
	const rect = el.getBoundingClientRect();
	return containerToBase(page, (clientX - rect.left) / zoom, (clientY - rect.top) / zoom);
}

/** Content rotation of an object, normalised to 0/90/180/270. */
export function objectRotation(obj: { rot?: number }): 0 | 90 | 180 | 270 {
	const rot = obj.rot ?? 0;
	return (((Math.round(rot / 90) * 90) % 360) + 360) % 360 as 0 | 90 | 180 | 270;
}

/** Rotation that makes new content upright on a page rotated by `pageRotation` in the editor. */
export function uprightRotation(pageRotation: number): number {
	return (360 - (((pageRotation % 360) + 360) % 360)) % 360;
}

/**
 * Bounding box in base space. For rotatable objects (x, y) is the top-left of
 * this box and (w, h) the unrotated content size, so a 90° content rotation
 * swaps the box's width and height.
 */
export function bounds(obj: EditorObject): Rect {
	switch (obj.type) {
		case 'line':
		case 'arrow': {
			const x = Math.min(obj.x1, obj.x2);
			const y = Math.min(obj.y1, obj.y2);
			return { x, y, w: Math.abs(obj.x2 - obj.x1), h: Math.abs(obj.y2 - obj.y1) };
		}
		case 'note':
			return { x: obj.x, y: obj.y, w: NOTE_SIZE, h: NOTE_SIZE };
		case 'rect':
		case 'ellipse':
			return { x: obj.x, y: obj.y, w: obj.w, h: obj.h };
		default: {
			const swap = objectRotation(obj) % 180 !== 0;
			return { x: obj.x, y: obj.y, w: swap ? obj.h : obj.w, h: swap ? obj.w : obj.h };
		}
	}
}

const COS: Record<number, number> = { 0: 1, 90: 0, 180: -1, 270: 0 };
const SIN: Record<number, number> = { 0: 0, 90: 1, 180: 0, 270: -1 };

/**
 * Maps unrotated content coordinates (y down, origin at the content's
 * top-left, size w × h) of a rotatable object into base space.
 */
export function contentMatrix(obj: { x: number; y: number; w: number; h: number; rot?: number }, height = obj.h): Matrix {
	const rot = objectRotation(obj);
	const swap = rot % 180 !== 0;
	const bw = swap ? height : obj.w;
	const bh = swap ? obj.w : height;
	const cos = COS[rot];
	const sin = SIN[rot];
	// translate(centre) · rotate(rot, clockwise on screen) · translate(-w/2, -h/2)
	return multiply([1, 0, 0, 1, obj.x + bw / 2, obj.y + bh / 2], multiply([cos, sin, -sin, cos, 0, 0], [1, 0, 0, 1, -obj.w / 2, -height / 2]));
}

/** Returns the fields to change to move an object by (dx, dy). */
export function moved(obj: EditorObject, dx: number, dy: number): Partial<EditorObject> {
	if ('x1' in obj) {
		return { x1: obj.x1 + dx, y1: obj.y1 + dy, x2: obj.x2 + dx, y2: obj.y2 + dy } as Partial<LineObject>;
	}
	return { x: obj.x + dx, y: obj.y + dy } as Partial<EditorObject>;
}

const r = (n: number) => Math.round(n * 100) / 100;

/** Smooth SVG path through freehand points (absolute display coordinates). */
export function smoothPath(points: Array<[number, number]>): string {
	if (!points.length) return '';
	if (points.length === 1) {
		const [x, y] = points[0];
		return `M${r(x)} ${r(y)}L${r(x + 0.01)} ${r(y)}`;
	}
	let d = `M${r(points[0][0])} ${r(points[0][1])}`;
	for (let i = 1; i < points.length - 1; i++) {
		const [x, y] = points[i];
		const [nx, ny] = points[i + 1];
		d += `Q${r(x)} ${r(y)} ${r((x + nx) / 2)} ${r((y + ny) / 2)}`;
	}
	const last = points[points.length - 1];
	d += `L${r(last[0])} ${r(last[1])}`;
	return d;
}

/** Absolute stroke paths of an ink object. */
export function inkPaths(obj: InkObject): string[] {
	const m = contentMatrix(obj);
	return obj.strokes.map((stroke) => {
		const pts: Array<[number, number]> = [];
		for (let i = 0; i + 1 < stroke.length; i += 2) pts.push(applyMatrix(m, stroke[i] * obj.w, stroke[i + 1] * obj.h));
		return smoothPath(pts);
	});
}

export function inkWidth(obj: InkObject): number {
	return obj.refW > 0 ? (obj.width * obj.w) / obj.refW : obj.width;
}

/** Ellipse as four cubic Bézier segments. */
export function ellipsePath(x: number, y: number, w: number, h: number): string {
	const k = 0.5522847498;
	const cx = x + w / 2;
	const cy = y + h / 2;
	const rx = w / 2;
	const ry = h / 2;
	return [
		`M${r(cx + rx)} ${r(cy)}`,
		`C${r(cx + rx)} ${r(cy + k * ry)} ${r(cx + k * rx)} ${r(cy + ry)} ${r(cx)} ${r(cy + ry)}`,
		`C${r(cx - k * rx)} ${r(cy + ry)} ${r(cx - rx)} ${r(cy + k * ry)} ${r(cx - rx)} ${r(cy)}`,
		`C${r(cx - rx)} ${r(cy - k * ry)} ${r(cx - k * rx)} ${r(cy - ry)} ${r(cx)} ${r(cy - ry)}`,
		`C${r(cx + k * rx)} ${r(cy - ry)} ${r(cx + rx)} ${r(cy - k * ry)} ${r(cx + rx)} ${r(cy)}Z`
	].join('');
}

export function rectPath(x: number, y: number, w: number, h: number): string {
	return `M${r(x)} ${r(y)}H${r(x + w)}V${r(y + h)}H${r(x)}Z`;
}

/** Shaft and open arrowhead of a line/arrow object. */
export function linePaths(obj: LineObject): string[] {
	const shaft = `M${r(obj.x1)} ${r(obj.y1)}L${r(obj.x2)} ${r(obj.y2)}`;
	if (obj.type !== 'arrow') return [shaft];
	const angle = Math.atan2(obj.y2 - obj.y1, obj.x2 - obj.x1);
	const len = Math.max(8, obj.strokeWidth * 4.5);
	const spread = Math.PI / 7;
	const a1 = [obj.x2 - len * Math.cos(angle - spread), obj.y2 - len * Math.sin(angle - spread)];
	const a2 = [obj.x2 - len * Math.cos(angle + spread), obj.y2 - len * Math.sin(angle + spread)];
	const head = `M${r(a1[0])} ${r(a1[1])}L${r(obj.x2)} ${r(obj.y2)}L${r(a2[0])} ${r(a2[1])}`;
	return [shaft, head];
}

export function symbolPath(obj: SymbolObject): string {
	const m = contentMatrix(obj);
	const { w, h } = obj;
	const p = (fx: number, fy: number) => {
		const [px, py] = applyMatrix(m, fx * w, fy * h);
		return `${r(px)} ${r(py)}`;
	};
	if (obj.type === 'check') {
		return `M${p(0.12, 0.55)}L${p(0.4, 0.82)}L${p(0.9, 0.16)}`;
	}
	return `M${p(0.15, 0.15)}L${p(0.85, 0.85)}M${p(0.85, 0.15)}L${p(0.15, 0.85)}`;
}

export function symbolStroke(obj: SymbolObject): number {
	return Math.max(1, Math.min(obj.w, obj.h) * 0.12);
}

/** Normalises freehand points into an ink object's box. */
export function normaliseStroke(points: Array<[number, number]>, box: Rect): number[] {
	const out: number[] = [];
	for (const [x, y] of points) {
		out.push(box.w ? (x - box.x) / box.w : 0.5, box.h ? (y - box.y) / box.h : 0.5);
	}
	return out;
}

export function pointsBounds(points: Array<[number, number]>, pad = 0): Rect {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const [x, y] of points) {
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
	}
	return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
}
