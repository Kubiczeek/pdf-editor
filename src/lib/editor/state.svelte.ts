import type { PDFDocumentProxy } from '#lib/pdf/pdfjs.ts';
import { uid } from '#lib/pdf/files.ts';
import { moved } from './geometry.ts';
import type {
	Asset,
	EditorObject,
	FieldValue,
	FormFieldWidget,
	PageModel,
	SignatureSpec,
	StyleDefaults,
	ToolName
} from './types.ts';

interface Snapshot {
	pages: PageModel[];
	objects: EditorObject[];
	formValues: Record<string, FieldValue>;
}

const HISTORY_LIMIT = 100;

export class EditorState {
	readonly doc: PDFDocumentProxy;
	readonly bytes: Uint8Array;
	readonly password: string | undefined;
	readonly fileName: string;

	pages = $state<PageModel[]>([]);
	objects = $state<EditorObject[]>([]);
	fields = $state<FormFieldWidget[]>([]);
	formValues = $state<Record<string, FieldValue>>({});
	/** Values as loaded, to detect which fields changed. */
	initialValues: Record<string, FieldValue> = {};

	tool = $state<ToolName>('select');
	selectedId = $state<string | null>(null);
	editingId = $state<string | null>(null);
	zoom = $state(1);
	currentPage = $state(0);
	dirty = $state(false);
	signatures = $state<SignatureSpec[]>([]);
	style = $state<StyleDefaults>({
		textFamily: 'sans',
		textSize: 14,
		textColor: '#000000',
		textBold: false,
		textItalic: false,
		strokeColor: '#c42b3d',
		strokeWidth: 2,
		fillColor: null,
		drawColor: '#1f35c4',
		drawWidth: 2.5,
		highlightColor: '#ffe14d',
		whiteoutColor: '#ffffff',
		noteColor: '#ffd23f',
		symbolColor: '#1f35c4'
	});

	readonly assets = new Map<string, Asset>();

	#past = $state<Snapshot[]>([]);
	#future = $state<Snapshot[]>([]);

	constructor(init: { doc: PDFDocumentProxy; bytes: Uint8Array; password?: string; fileName: string }) {
		this.doc = init.doc;
		this.bytes = init.bytes;
		this.password = init.password;
		this.fileName = init.fileName;
	}

	get canUndo() {
		return this.#past.length > 0;
	}

	get canRedo() {
		return this.#future.length > 0;
	}

	get selected(): EditorObject | null {
		return this.objects.find((o) => o.id === this.selectedId) ?? null;
	}

	pageByKey(key: string): PageModel | undefined {
		return this.pages.find((p) => p.key === key);
	}

	objectsOn(key: string): EditorObject[] {
		return this.objects.filter((o) => o.page === key);
	}

	#snapshot(): Snapshot {
		return {
			pages: $state.snapshot(this.pages) as PageModel[],
			objects: $state.snapshot(this.objects) as EditorObject[],
			formValues: $state.snapshot(this.formValues) as Record<string, FieldValue>
		};
	}

	/** Records the current state so the next change can be undone. Call before mutating. */
	checkpoint(): void {
		this.#past = [...this.#past.slice(-(HISTORY_LIMIT - 1)), this.#snapshot()];
		this.#future = [];
		this.dirty = true;
	}

	undo(): void {
		const previous = this.#past.at(-1);
		if (!previous) return;
		this.#future = [...this.#future, this.#snapshot()];
		this.#past = this.#past.slice(0, -1);
		this.#restore(previous);
	}

	redo(): void {
		const next = this.#future.at(-1);
		if (!next) return;
		this.#past = [...this.#past, this.#snapshot()];
		this.#future = this.#future.slice(0, -1);
		this.#restore(next);
	}

	#restore(snapshot: Snapshot): void {
		this.pages = snapshot.pages;
		this.objects = snapshot.objects;
		this.formValues = snapshot.formValues;
		if (this.selectedId && !this.objects.some((o) => o.id === this.selectedId)) this.selectedId = null;
		this.editingId = null;
		this.dirty = true;
	}

	add(obj: EditorObject, options: { select?: boolean; edit?: boolean } = {}): void {
		this.checkpoint();
		this.objects = [...this.objects, obj];
		if (options.select !== false) this.selectedId = obj.id;
		if (options.edit) this.editingId = obj.id;
	}

	/** Live update without a history entry (use checkpoint() once before a drag). */
	patch(id: string, changes: Partial<EditorObject>): void {
		const obj = this.objects.find((o) => o.id === id);
		if (obj) Object.assign(obj, changes);
	}

	update(id: string, changes: Partial<EditorObject>): void {
		this.checkpoint();
		this.patch(id, changes);
	}

	remove(id: string): void {
		if (!this.objects.some((o) => o.id === id)) return;
		this.checkpoint();
		this.objects = this.objects.filter((o) => o.id !== id);
		if (this.selectedId === id) this.selectedId = null;
		if (this.editingId === id) this.editingId = null;
	}

	duplicate(id: string): void {
		const obj = this.objects.find((o) => o.id === id);
		if (!obj) return;
		const copy = { ...($state.snapshot(obj) as EditorObject), id: uid('obj') };
		Object.assign(copy, moved(copy, 12, 12));
		this.add(copy);
	}

	bringToFront(id: string): void {
		const obj = this.objects.find((o) => o.id === id);
		if (!obj) return;
		this.checkpoint();
		this.objects = [...this.objects.filter((o) => o.id !== id), obj];
	}

	setTool(tool: ToolName): void {
		this.tool = tool;
		this.editingId = null;
		if (tool !== 'select') this.selectedId = null;
	}

	setField(name: string, value: FieldValue): void {
		if (this.formValues[name] === value) return;
		this.checkpoint();
		this.formValues = { ...this.formValues, [name]: value };
	}

	rotatePage(key: string, delta: number): void {
		const page = this.pageByKey(key);
		if (!page) return;
		this.checkpoint();
		page.rotation = (((page.rotation + delta) % 360) + 360) % 360;
	}

	deletePage(key: string): boolean {
		if (this.pages.length <= 1) return false;
		this.checkpoint();
		this.pages = this.pages.filter((p) => p.key !== key);
		this.objects = this.objects.filter((o) => o.page !== key);
		if (this.selectedId && !this.objects.some((o) => o.id === this.selectedId)) this.selectedId = null;
		this.currentPage = Math.min(this.currentPage, this.pages.length - 1);
		return true;
	}

	movePage(from: number, to: number): void {
		if (from === to) return;
		this.checkpoint();
		const pages = this.pages.slice();
		const [page] = pages.splice(from, 1);
		pages.splice(to, 0, page);
		this.pages = pages;
	}

	insertBlankPage(after: number): void {
		const reference = this.pages[after] ?? this.pages[this.pages.length - 1];
		const swap = reference ? reference.rotation % 180 !== 0 : false;
		const width = reference ? (swap ? reference.height : reference.width) : 595.28;
		const height = reference ? (swap ? reference.width : reference.height) : 841.89;
		const page: PageModel = {
			key: uid('page'),
			kind: 'blank',
			index: -1,
			rotation: 0,
			width,
			height,
			view: [0, 0, width, height],
			rotate: 0
		};
		this.checkpoint();
		const pages = this.pages.slice();
		pages.splice(after + 1, 0, page);
		this.pages = pages;
	}

	/** Whether the document structure (order, rotation, added/removed pages) changed. */
	get pagesChanged(): boolean {
		return this.pages.some((p, i) => p.kind !== 'doc' || p.index !== i || p.rotation !== 0) ||
			this.pages.length !== this.doc.numPages;
	}
}
