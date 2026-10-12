import type { FontFamilyId } from '#lib/pdf/fonts.ts';

/**
 * Coordinates of editor objects are in the page's "base display space":
 * PDF points, origin at the top-left of the page as displayed with its own
 * /Rotate applied (rotation added in the editor is a separate page property).
 */

export type ToolName =
	| 'select'
	| 'editText'
	| 'text'
	| 'signature'
	| 'image'
	| 'draw'
	| 'highlight'
	| 'rect'
	| 'ellipse'
	| 'line'
	| 'arrow'
	| 'whiteout'
	| 'note'
	| 'check'
	| 'cross';

interface BaseObject {
	id: string;
	/** Key of the page the object belongs to. */
	page: string;
	opacity: number;
}

export interface TextObject extends BaseObject {
	type: 'text';
	x: number;
	y: number;
	text: string;
	family: FontFamilyId;
	size: number;
	bold: boolean;
	italic: boolean;
	color: string;
	align: 'left' | 'center' | 'right';
	/** Measured size of the text block (points); maintained by the view. */
	w: number;
	h: number;
	/** Rectangle painted underneath, used when replacing existing text. */
	cover?: { x: number; y: number; w: number; h: number; color: string };
	/** Id of the original text line this object replaces (Edit text mode). */
	sourceLine?: string;
}

export interface ImageObject extends BaseObject {
	type: 'image';
	x: number;
	y: number;
	w: number;
	h: number;
	asset: string;
}

/** Freehand strokes (drawing or a drawn signature), normalised to the box (0–1). */
export interface InkObject extends BaseObject {
	type: 'ink';
	x: number;
	y: number;
	w: number;
	h: number;
	strokes: number[][];
	color: string;
	/** Stroke width in points at the box width `refW`; scales with the box. */
	width: number;
	refW: number;
}

export interface BoxShapeObject extends BaseObject {
	type: 'rect' | 'ellipse';
	x: number;
	y: number;
	w: number;
	h: number;
	stroke: string | null;
	fill: string | null;
	strokeWidth: number;
	/** Highlights multiply with the page so text stays readable. */
	blend: 'normal' | 'multiply';
}

export interface LineObject extends BaseObject {
	type: 'line' | 'arrow';
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	stroke: string;
	strokeWidth: number;
}

export interface SymbolObject extends BaseObject {
	type: 'check' | 'cross';
	x: number;
	y: number;
	w: number;
	h: number;
	color: string;
}

export interface NoteObject extends BaseObject {
	type: 'note';
	x: number;
	y: number;
	text: string;
	color: string;
}

export type EditorObject =
	| TextObject
	| ImageObject
	| InkObject
	| BoxShapeObject
	| LineObject
	| SymbolObject
	| NoteObject;

export interface PageModel {
	key: string;
	kind: 'doc' | 'blank';
	/** Zero-based index in the source document (doc pages only). */
	index: number;
	/** Rotation added in the editor (0/90/180/270). */
	rotation: number;
	/** Base display size in points. */
	width: number;
	height: number;
	/** Visible box in PDF space and the page's own /Rotate (as pdf.js reports them). */
	view: [number, number, number, number];
	rotate: number;
}

export interface FormFieldWidget {
	id: string;
	page: string;
	name: string;
	kind: 'text' | 'checkbox' | 'radio' | 'select' | 'list';
	/** Base display rectangle. */
	x: number;
	y: number;
	w: number;
	h: number;
	multiline: boolean;
	readOnly: boolean;
	maxLen: number;
	/** Export value for checkboxes and radio buttons. */
	exportValue: string;
	options: Array<{ value: string; label: string }>;
	fontSize: number;
	comb: boolean;
	align: 'left' | 'center' | 'right';
}

export type FieldValue = string | boolean;

export interface Asset {
	bytes: Uint8Array;
	mime: 'image/png' | 'image/jpeg';
	url: string;
	width: number;
	height: number;
}

export interface StyleDefaults {
	textFamily: FontFamilyId;
	textSize: number;
	textColor: string;
	textBold: boolean;
	textItalic: boolean;
	strokeColor: string;
	strokeWidth: number;
	fillColor: string | null;
	drawColor: string;
	drawWidth: number;
	highlightColor: string;
	whiteoutColor: string;
	noteColor: string;
	symbolColor: string;
}

export interface SignatureSpec {
	id: string;
	kind: 'ink' | 'text' | 'image';
	/** Ink: normalised strokes and aspect; text: typed name; image: asset id. */
	strokes?: number[][];
	aspect: number;
	text?: string;
	family?: FontFamilyId;
	asset?: string;
	color: string;
	width?: number;
	/** Small preview for the signature list. */
	preview: string;
}
