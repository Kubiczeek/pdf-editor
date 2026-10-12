<script lang="ts">
	import { tick } from 'svelte';
	import { useI18n } from '#lib/i18n/index.ts';
	import { cssFontFamily } from '#lib/pdf/fonts.ts';
	import { useEditor, startDrag, blurActive } from './context.ts';
	import type { EditorObject, PageModel } from './types.ts';
	import {
		bounds,
		moved,
		objectRotation,
		inkPaths,
		inkWidth,
		ellipsePath,
		rectPath,
		linePaths,
		symbolPath,
		symbolStroke,
		NOTE_SIZE,
		LINE_HEIGHT,
		type Rect
	} from './geometry.ts';

	let { obj, page }: { obj: EditorObject; page: PageModel } = $props();

	const editor = useEditor();
	const i18n = useI18n();
	const z = $derived(editor.zoom);
	const selected = $derived(editor.selectedId === obj.id);
	const editing = $derived(editor.editingId === obj.id);
	const interactive = $derived(
		editor.tool === 'select' || (editor.tool === 'editText' && obj.type === 'text')
	);
	const box = $derived(bounds(obj));
	const rotation = $derived('rot' in obj ? objectRotation(obj) : 0);
	const isVector = $derived(
		obj.type === 'ink' ||
			obj.type === 'rect' ||
			obj.type === 'ellipse' ||
			obj.type === 'line' ||
			obj.type === 'arrow' ||
			obj.type === 'check' ||
			obj.type === 'cross'
	);

	let textEl = $state<HTMLDivElement>();
	let noteArea = $state<HTMLTextAreaElement>();

	const plaintextOnly = (() => {
		if (typeof document === 'undefined') return false;
		const probe = document.createElement('div');
		probe.contentEditable = 'plaintext-only';
		return probe.contentEditable === 'plaintext-only';
	})();

	/** SVG shapes in base coordinates for vector objects. */
	const vector = $derived.by(() => {
		switch (obj.type) {
			case 'ink':
				return {
					paths: inkPaths(obj),
					stroke: obj.color,
					width: inkWidth(obj),
					fill: null as string | null
				};
			case 'rect':
				return {
					paths: [rectPath(obj.x, obj.y, obj.w, obj.h)],
					stroke: obj.stroke,
					width: obj.strokeWidth,
					fill: obj.fill
				};
			case 'ellipse':
				return {
					paths: [ellipsePath(obj.x, obj.y, obj.w, obj.h)],
					stroke: obj.stroke,
					width: obj.strokeWidth,
					fill: obj.fill
				};
			case 'line':
			case 'arrow':
				return { paths: linePaths(obj), stroke: obj.stroke, width: obj.strokeWidth, fill: null };
			case 'check':
			case 'cross':
				return {
					paths: [symbolPath(obj)],
					stroke: obj.color,
					width: symbolStroke(obj),
					fill: null
				};
			default:
				return null;
		}
	});

	// Keep the measured size of text objects up to date (used for selection and alignment).
	$effect(() => {
		if (obj.type !== 'text' || !textEl) return;
		const el = textEl;
		const id = obj.id;
		const measure = () => {
			const zoom = editor.zoom;
			const w = el.offsetWidth / zoom;
			const h = el.offsetHeight / zoom;
			const current = editor.objects.find((o) => o.id === id);
			if (
				current &&
				current.type === 'text' &&
				(Math.abs(current.w - w) > 0.01 || Math.abs(current.h - h) > 0.01)
			) {
				// Keep the start of the text (its unrotated top-left) fixed on the page while it grows.
				const dw = w - current.w;
				const dh = h - current.h;
				const rot = objectRotation(current);
				const dx = rot === 90 ? -dh : rot === 180 ? -dw : 0;
				const dy = rot === 180 ? -dh : rot === 270 ? -dw : 0;
				editor.patch(id, { w, h, x: current.x + dx, y: current.y + dy });
			}
		};
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		measure();
		return () => observer.disconnect();
	});

	// Text content is written imperatively so the caret isn't disturbed while typing.
	$effect(() => {
		if (obj.type !== 'text' || !textEl) return;
		const text = obj.text;
		if (!editing && textEl.innerText !== text) textEl.innerText = text;
	});

	$effect(() => {
		if (editing && obj.type === 'text' && textEl) {
			const el = textEl;
			tick().then(() => {
				el.focus({ preventScroll: true });
				const range = document.createRange();
				range.selectNodeContents(el);
				range.collapse(false);
				const selection = window.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range);
			});
		}
		if (editing && obj.type === 'note' && noteArea) {
			const area = noteArea;
			tick().then(() => area.focus({ preventScroll: true }));
		}
	});

	function beginEdit() {
		if (editor.editingId === obj.id) return;
		editor.checkpoint();
		editor.selectedId = obj.id;
		editor.editingId = obj.id;
	}

	function endTextEdit() {
		if (editor.editingId !== obj.id) return;
		editor.editingId = null;
		if (obj.type === 'text') {
			const text = obj.text.replace(/\r/g, '');
			if (textEl && text !== textEl.innerText) textEl.innerText = text;
			if (!text.trim() && !obj.cover) {
				// Discard empty text boxes (the checkpoint taken when editing began restores it on undo).
				editor.objects = editor.objects.filter((o) => o.id !== obj.id);
				editor.selectedId = null;
			}
		}
	}

	function onPointerDown(event: PointerEvent) {
		if (!interactive || event.button !== 0) return;
		event.stopPropagation();
		if (editing && obj.type === 'text') return; // let the caret move
		if (editor.editingId && editor.editingId !== obj.id) blurActive();
		if (obj.type !== 'note') event.preventDefault();
		const wasSelected = selected;
		editor.selectedId = obj.id;
		if (editor.tool === 'editText' && obj.type === 'text') {
			beginEdit();
			return;
		}
		if (editor.editingId && editor.editingId !== obj.id) editor.editingId = null;
		const start = $state.snapshot(obj) as EditorObject;
		startDrag(event, page, z, {
			onStart: () => editor.checkpoint(),
			onMove: (dx, dy) => editor.patch(obj.id, moved(start, dx, dy)),
			onEnd: (didMove) => {
				if (didMove) return;
				if (obj.type === 'text' && wasSelected) beginEdit();
				if (obj.type === 'note') beginEdit();
			}
		});
	}

	type Handle = 'nw' | 'ne' | 'sw' | 'se' | 'p1' | 'p2';
	const CORNERS = ['nw', 'ne', 'sw', 'se'] as const;

	function resizeBox(start: Rect, handle: Handle, dx: number, dy: number, lock: boolean): Rect {
		let { x, y, w, h } = start;
		if (handle.includes('e')) w = start.w + dx;
		if (handle.includes('w')) w = start.w - dx;
		if (handle.includes('s')) h = start.h + dy;
		if (handle.includes('n')) h = start.h - dy;
		const min = 4;
		w = Math.max(min, w);
		h = Math.max(min, h);
		if (lock && start.w > 0 && start.h > 0) {
			const ratio = start.w / start.h;
			if (Math.abs(w / start.w - 1) >= Math.abs(h / start.h - 1)) h = w / ratio;
			else w = h * ratio;
		}
		if (handle.includes('w')) x = start.x + start.w - w;
		if (handle.includes('n')) y = start.y + start.h - h;
		return { x, y, w, h };
	}

	function onHandle(event: PointerEvent, handle: Handle) {
		event.stopPropagation();
		event.preventDefault();
		const start = $state.snapshot(obj) as EditorObject;
		startDrag(event, page, z, {
			onStart: () => editor.checkpoint(),
			onMove: (dx, dy, e) => {
				if ('x1' in start) {
					if (handle === 'p1') editor.patch(obj.id, { x1: start.x1 + dx, y1: start.y1 + dy });
					else editor.patch(obj.id, { x2: start.x2 + dx, y2: start.y2 + dy });
				} else if (start.type === 'text') {
					const width = Math.max(1, bounds(start).w);
					const scale = Math.max(0.1, (width + dx) / width);
					editor.patch(obj.id, {
						size: Math.min(300, Math.max(4, Math.round(start.size * scale * 10) / 10))
					});
				} else if (start.type !== 'note') {
					const rotatable =
						start.type === 'image' ||
						start.type === 'ink' ||
						start.type === 'check' ||
						start.type === 'cross';
					const next = resizeBox(bounds(start), handle, dx, dy, rotatable !== e.shiftKey);
					// The box is in page space; rotated content stores its unrotated size.
					const swap = rotatable && objectRotation(start) % 180 !== 0;
					editor.patch(obj.id, {
						x: next.x,
						y: next.y,
						w: swap ? next.h : next.w,
						h: swap ? next.w : next.h
					});
				}
			}
		});
	}

	function onTextKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			(event.currentTarget as HTMLElement).blur();
		}
		if (event.key === 'Tab') {
			event.preventDefault();
			document.execCommand('insertText', false, '    ');
		}
	}

	const asset = $derived(obj.type === 'image' ? editor.assets.get(obj.asset) : undefined);
</script>

{#if obj.type === 'text' && obj.cover}
	<div
		class="cover"
		style:left={`${obj.cover.x * z}px`}
		style:top={`${obj.cover.y * z}px`}
		style:width={`${obj.cover.w * z}px`}
		style:height={`${obj.cover.h * z}px`}
		style:background={obj.cover.color}
	></div>
{/if}

{#if obj.type === 'text'}
	<div
		class="obj text"
		class:selected
		class:editing
		class:interactive
		class:rotated={rotation !== 0}
		style:left={`${obj.x * z}px`}
		style:top={`${obj.y * z}px`}
		style:width={rotation !== 0 ? `${box.w * z}px` : undefined}
		style:height={rotation !== 0 ? `${box.h * z}px` : undefined}
		style:--rot={`${rotation}deg`}
		style:opacity={obj.opacity}
		onpointerdown={onPointerDown}
		ondblclick={() => interactive && beginEdit()}
		role="presentation"
	>
		<div
			bind:this={textEl}
			class="text-body"
			contenteditable={editing ? (plaintextOnly ? 'plaintext-only' : 'true') : 'false'}
			spellcheck={editing}
			data-placeholder={i18n.t.editor.textPlaceholder}
			style:font-family={cssFontFamily(obj.family)}
			style:font-size={`${obj.size * z}px`}
			style:line-height={`${obj.size * LINE_HEIGHT * z}px`}
			style:font-weight={obj.bold ? 700 : 400}
			style:font-style={obj.italic ? 'italic' : 'normal'}
			style:color={obj.color}
			style:text-align={obj.align}
			oninput={(e) => editor.patch(obj.id, { text: e.currentTarget.innerText.replace(/\r/g, '') })}
			onblur={endTextEdit}
			onkeydown={onTextKeydown}
			role="textbox"
			tabindex="-1"
			aria-multiline="true"
		></div>
		{#if selected && !editing}
			<span class="handle se" onpointerdown={(e) => onHandle(e, 'se')} role="presentation"></span>
		{/if}
	</div>
{:else if obj.type === 'image'}
	<div
		class="obj box"
		class:selected
		class:interactive
		style:left={`${box.x * z}px`}
		style:top={`${box.y * z}px`}
		style:width={`${box.w * z}px`}
		style:height={`${box.h * z}px`}
		style:opacity={obj.opacity}
		onpointerdown={onPointerDown}
		role="presentation"
	>
		{#if asset}
			<img
				src={asset.url}
				alt=""
				draggable="false"
				style:width={`${obj.w * z}px`}
				style:height={`${obj.h * z}px`}
				style:transform={`translate(-50%, -50%) rotate(${rotation}deg)`}
			/>
		{/if}
	</div>
{:else if obj.type === 'note'}
	<div
		class="obj note"
		class:selected
		class:interactive
		style:left={`${obj.x * z}px`}
		style:top={`${obj.y * z}px`}
		style:width={`${NOTE_SIZE * z}px`}
		style:height={`${NOTE_SIZE * z}px`}
		style:--note={obj.color}
		style:opacity={obj.opacity}
		onpointerdown={onPointerDown}
		role="presentation"
	>
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M3 3h18v14H11l-5 4v-4H3z"
				fill="var(--note)"
				stroke="#5c4a00"
				stroke-width="1.2"
				stroke-linejoin="round"
			/>
			<path d="M7 8h10M7 12h7" stroke="#5c4a00" stroke-width="1.4" stroke-linecap="round" />
		</svg>
		{#if selected}
			<div class="note-pop" onpointerdown={(e) => e.stopPropagation()} role="presentation">
				<textarea
					bind:this={noteArea}
					class="textarea"
					placeholder={i18n.t.editor.notePlaceholder}
					value={obj.text}
					onfocus={() => beginEdit()}
					oninput={(e) => editor.patch(obj.id, { text: e.currentTarget.value })}
					onblur={() => editor.editingId === obj.id && (editor.editingId = null)}></textarea>
			</div>
		{/if}
	</div>
{:else if isVector && vector}
	<svg
		class="vec"
		class:interactive
		class:multiply={obj.type === 'rect' || obj.type === 'ellipse'
			? obj.blend === 'multiply'
			: false}
		viewBox={`0 0 ${page.width} ${page.height}`}
		width={page.width * z}
		height={page.height * z}
		style:opacity={obj.opacity}
		aria-hidden="true"
	>
		{#each vector.paths as d, i (i)}
			<path
				{d}
				fill={vector.fill ?? 'none'}
				stroke={vector.stroke ?? 'none'}
				stroke-width={vector.stroke ? vector.width : 0}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				{d}
				class="hit"
				fill={vector.fill ? 'transparent' : 'none'}
				stroke="transparent"
				stroke-width={Math.max(vector.width, 12 / z)}
				onpointerdown={onPointerDown}
				role="presentation"
			/>
		{/each}
	</svg>
{/if}

{#if selected && obj.type !== 'text' && obj.type !== 'note'}
	{#if obj.type === 'line' || obj.type === 'arrow'}
		<span
			class="handle point"
			style:left={`${obj.x1 * z}px`}
			style:top={`${obj.y1 * z}px`}
			onpointerdown={(e) => onHandle(e, 'p1')}
			role="presentation"
		></span>
		<span
			class="handle point"
			style:left={`${obj.x2 * z}px`}
			style:top={`${obj.y2 * z}px`}
			onpointerdown={(e) => onHandle(e, 'p2')}
			role="presentation"
		></span>
	{:else}
		<div
			class="frame"
			style:left={`${box.x * z}px`}
			style:top={`${box.y * z}px`}
			style:width={`${box.w * z}px`}
			style:height={`${box.h * z}px`}
		>
			{#each CORNERS as handle (handle)}
				<span class="handle {handle}" onpointerdown={(e) => onHandle(e, handle)} role="presentation"
				></span>
			{/each}
		</div>
	{/if}
{/if}

<style>
	.obj {
		position: absolute;
		pointer-events: none;
	}

	.obj.interactive {
		pointer-events: auto;
		cursor: move;
		touch-action: none;
	}

	.text.editing {
		touch-action: auto;
	}

	.cover {
		position: absolute;
		pointer-events: none;
	}

	.text {
		padding: 0;
		outline: 1px dashed transparent;
		outline-offset: 3px;
	}

	.text.interactive:hover {
		outline-color: rgb(31 53 196 / 0.5);
	}

	.text.selected {
		outline: 1.5px solid var(--royal);
	}

	.text.editing {
		outline: 2px solid var(--royal);
		cursor: text;
		background: rgb(255 255 255 / 0.4);
	}

	.text.rotated .text-body {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%) rotate(var(--rot));
	}

	.text-body {
		min-width: 4px;
		white-space: pre;
		font-kerning: none;
		font-synthesis: none;
		caret-color: var(--royal);
		outline: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.editing .text-body {
		user-select: text;
		-webkit-user-select: text;
		cursor: text;
	}

	.text-body:empty::before {
		content: attr(data-placeholder);
		color: rgb(22 33 58 / 0.4);
	}

	.box img {
		position: absolute;
		left: 50%;
		top: 50%;
		display: block;
		max-width: none;
		user-select: none;
		-webkit-user-drag: none;
	}

	.box.interactive:hover {
		outline: 1px dashed rgb(31 53 196 / 0.6);
	}

	.note svg {
		width: 100%;
		height: 100%;
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.3));
	}

	.note-pop {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		z-index: 5;
		width: 240px;
		padding: 8px;
		border-radius: var(--radius-m);
		background: #fffbe0;
		box-shadow: var(--shadow-pop);
		cursor: default;
	}

	.note-pop textarea {
		min-height: 90px;
		background: #fff;
		font-size: 14px;
	}

	.vec {
		position: absolute;
		left: 0;
		top: 0;
		overflow: visible;
		pointer-events: none;
	}

	.vec.multiply {
		mix-blend-mode: multiply;
	}

	.vec .hit {
		pointer-events: none;
	}

	.vec.interactive .hit {
		pointer-events: auto;
		cursor: move;
		touch-action: none;
	}

	.frame {
		position: absolute;
		outline: 1.5px solid var(--royal);
		pointer-events: none;
	}

	.handle {
		position: absolute;
		width: 12px;
		height: 12px;
		margin: -6px 0 0 -6px;
		border: 2px solid var(--royal);
		border-radius: 3px;
		background: #fff;
		pointer-events: auto;
		touch-action: none;
		z-index: 3;
	}

	.frame .handle {
		margin: 0;
	}

	.frame .nw {
		left: -7px;
		top: -7px;
		cursor: nwse-resize;
	}

	.frame .ne {
		right: -7px;
		top: -7px;
		cursor: nesw-resize;
	}

	.frame .sw {
		left: -7px;
		bottom: -7px;
		cursor: nesw-resize;
	}

	.frame .se,
	.text .se {
		right: -7px;
		bottom: -7px;
		cursor: nwse-resize;
	}

	.text .se {
		margin: 0;
		right: -10px;
		bottom: -10px;
	}

	.point {
		cursor: grab;
		border-radius: 50%;
	}

	@media (pointer: coarse) {
		.handle {
			width: 20px;
			height: 20px;
			margin: -10px 0 0 -10px;
		}

		.frame .handle,
		.text .se {
			margin: 0;
		}
	}
</style>
