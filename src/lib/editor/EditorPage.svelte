<script lang="ts">
	import { useI18n, fmt } from '#lib/i18n/index.ts';
	import { renderPage, isRenderCancelled } from '#lib/pdf/pdfjs.ts';
	import { baselineOffset } from '#lib/pdf/fonts.ts';
	import { uid } from '#lib/pdf/files.ts';
	import { useEditor, blurActive } from './context.ts';
	import { extractTextLines, sampleColors, type TextLine } from './textlines.ts';
	import {
		rotatedSize,
		layerTransform,
		clientToBase,
		smoothPath,
		pointsBounds,
		normaliseStroke,
		rectPath,
		ellipsePath,
		linePaths,
		LINE_HEIGHT,
		NOTE_SIZE,
		bounds,
		uprightRotation
	} from './geometry.ts';
	import type { PageModel, TextObject, EditorObject } from './types.ts';
	import ObjectView from './ObjectView.svelte';
	import FieldView from './FieldView.svelte';

	let { page, index }: { page: PageModel; index: number } = $props();

	const editor = useEditor();
	const i18n = useI18n();
	const z = $derived(editor.zoom);
	const size = $derived(rotatedSize(page));
	const objects = $derived(editor.objects.filter((o) => o.page === page.key));
	const fields = $derived(editor.fields.filter((f) => f.page === page.key));

	let container = $state<HTMLDivElement>();
	let canvas = $state<HTMLCanvasElement>();
	let visible = $state(false);
	let rendered = $state(false);
	let lines = $state<TextLine[] | null>(null);

	type Draft =
		| { kind: 'stroke'; points: Array<[number, number]> }
		| { kind: 'box'; x0: number; y0: number; x1: number; y1: number }
		| { kind: 'line'; x0: number; y0: number; x1: number; y1: number };
	let draft = $state<Draft | null>(null);

	$effect(() => {
		if (!container) return;
		const observer = new IntersectionObserver(
			(entries) => {
				visible = entries.some((entry) => entry.isIntersecting);
			},
			{ rootMargin: '900px 0px' }
		);
		observer.observe(container);
		return () => observer.disconnect();
	});

	// Free canvas memory for pages far away from the viewport.
	$effect(() => {
		if (!visible && canvas && rendered) {
			canvas.width = 0;
			canvas.height = 0;
			rendered = false;
		}
	});

	$effect(() => {
		if (!visible || !canvas) return;
		const target = canvas;
		const zoom = editor.zoom;
		const rotation = page.rotation;
		const kind = page.kind;
		const pageIndex = page.index;
		const forms = editor.fields.length > 0;
		if (kind === 'blank') {
			target.width = 1;
			target.height = 1;
			rendered = true;
			return;
		}
		const controller = new AbortController();
		const timer = setTimeout(
			async () => {
				try {
					const pdfPage = await editor.doc.getPage(pageIndex + 1);
					if (controller.signal.aborted) return;
					const scratch = document.createElement('canvas');
					await renderPage(pdfPage, scratch, {
						scale: zoom,
						rotation,
						pixelRatio: Math.min(3, window.devicePixelRatio || 1),
						renderForms: !forms,
						signal: controller.signal
					});
					if (controller.signal.aborted) return;
					target.width = scratch.width;
					target.height = scratch.height;
					target.getContext('2d')?.drawImage(scratch, 0, 0);
					scratch.width = scratch.height = 0;
					rendered = true;
				} catch (error) {
					if (!isRenderCancelled(error)) console.error(error);
				}
			},
			rendered ? 140 : 0
		);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	});

	$effect(() => {
		if (editor.tool !== 'editText' || !visible || lines || page.kind !== 'doc') return;
		let cancelled = false;
		editor.doc
			.getPage(page.index + 1)
			.then((p) => extractTextLines(p, page.key))
			.then((result) => {
				if (!cancelled) lines = result;
			})
			.catch(() => {
				if (!cancelled) lines = [];
			});
		return () => {
			cancelled = true;
		};
	});

	const replaced = $derived(
		new Set(objects.map((o) => (o.type === 'text' ? o.sourceLine : undefined)).filter(Boolean))
	);

	function editLine(event: PointerEvent, line: TextLine) {
		event.stopPropagation();
		event.preventDefault();
		blurActive();
		const colors = canvas
			? sampleColors(canvas, page.width, page.height, page.rotation, line)
			: { background: '#ffffff', text: '#000000' };
		const textSize = Math.round(line.size * 100) / 100;
		const lineHeight = textSize * LINE_HEIGHT;
		const pad = textSize * 0.12;
		const obj: TextObject = {
			id: uid('obj'),
			type: 'text',
			page: page.key,
			x: line.x,
			y: line.baseline - baselineOffset(line.family, textSize, lineHeight),
			text: line.text,
			family: line.family,
			size: textSize,
			bold: line.bold,
			italic: line.italic && line.family !== 'mono',
			color: colors.text,
			align: 'left',
			w: line.w,
			h: lineHeight,
			opacity: 1,
			cover: {
				x: line.x - pad,
				y: line.y - pad,
				w: line.w + pad * 2,
				h: line.h + pad * 2,
				color: colors.background
			},
			sourceLine: line.id
		};
		editor.add(obj, { edit: true });
	}

	function point(event: PointerEvent): [number, number] {
		const [x, y] = clientToBase(page, container!, z, event.clientX, event.clientY);
		return [Math.min(page.width, Math.max(0, x)), Math.min(page.height, Math.max(0, y))];
	}

	function onLayerDown(event: PointerEvent) {
		if (event.button !== 0 || !container) return;
		const tool = editor.tool;
		editor.currentPage = index;
		if (tool === 'select' || tool === 'editText') {
			editor.selectedId = null;
			if (editor.editingId) blurActive();
			return;
		}
		event.preventDefault();
		blurActive();
		const [x, y] = point(event);
		const s = editor.style;
		if (tool === 'text') {
			const lineHeight = s.textSize * LINE_HEIGHT;
			const text: TextObject = {
				id: uid('obj'),
				type: 'text',
				page: page.key,
				x,
				y,
				text: '',
				family: s.textFamily,
				size: s.textSize,
				bold: s.textBold,
				italic: s.textItalic,
				color: s.textColor,
				align: 'left',
				w: 0,
				h: lineHeight,
				opacity: 1,
				rot: uprightRotation(page.rotation)
			};
			// Put the start of the first line at the click point.
			const box = bounds(text);
			text.x = x - box.w / 2;
			text.y = y - box.h / 2;
			editor.add(text, { edit: true });
			editor.tool = 'select';
			return;
		}
		if (tool === 'note') {
			editor.add(
				{
					id: uid('obj'),
					type: 'note',
					page: page.key,
					x: Math.max(0, x - NOTE_SIZE / 2),
					y: Math.max(0, y - NOTE_SIZE / 2),
					text: '',
					color: s.noteColor,
					opacity: 1
				},
				{ edit: true }
			);
			editor.tool = 'select';
			return;
		}
		if (tool === 'check' || tool === 'cross') {
			const sizePt = Math.max(10, s.textSize * 1.1);
			editor.add(
				{
					id: uid('obj'),
					type: tool,
					page: page.key,
					x: x - sizePt / 2,
					y: y - sizePt / 2,
					w: sizePt,
					h: sizePt,
					color: s.symbolColor,
					opacity: 1,
					rot: uprightRotation(page.rotation)
				},
				{ select: false }
			);
			return;
		}

		const target = event.currentTarget as HTMLElement;
		target.setPointerCapture(event.pointerId);
		if (tool === 'draw') draft = { kind: 'stroke', points: [[x, y]] };
		else if (tool === 'line' || tool === 'arrow')
			draft = { kind: 'line', x0: x, y0: y, x1: x, y1: y };
		else draft = { kind: 'box', x0: x, y0: y, x1: x, y1: y };
	}

	function onLayerMove(event: PointerEvent) {
		if (!draft || !container) return;
		const [x, y] = point(event);
		if (draft.kind === 'stroke') {
			const last = draft.points[draft.points.length - 1];
			if (Math.hypot(x - last[0], y - last[1]) * z >= 1.5) draft.points.push([x, y]);
		} else {
			draft.x1 = x;
			draft.y1 = y;
		}
	}

	function onLayerUp() {
		const current = draft;
		draft = null;
		if (!current) return;
		const s = editor.style;
		const tool = editor.tool;
		let obj: EditorObject | null = null;
		if (current.kind === 'stroke') {
			const box = pointsBounds(current.points, 0);
			const w = Math.max(box.w, 0.5);
			const h = Math.max(box.h, 0.5);
			const normalBox = { x: box.x, y: box.y, w, h };
			obj = {
				id: uid('obj'),
				type: 'ink',
				page: page.key,
				x: box.x,
				y: box.y,
				w,
				h,
				strokes: [normaliseStroke(current.points, normalBox)],
				color: s.drawColor,
				width: s.drawWidth,
				refW: w,
				opacity: 1
			};
		} else if (current.kind === 'line') {
			if (Math.hypot(current.x1 - current.x0, current.y1 - current.y0) < 3) return;
			obj = {
				id: uid('obj'),
				type: tool === 'arrow' ? 'arrow' : 'line',
				page: page.key,
				x1: current.x0,
				y1: current.y0,
				x2: current.x1,
				y2: current.y1,
				stroke: s.strokeColor,
				strokeWidth: s.strokeWidth,
				opacity: 1
			};
		} else {
			const x = Math.min(current.x0, current.x1);
			const y = Math.min(current.y0, current.y1);
			const w = Math.abs(current.x1 - current.x0);
			const h = Math.abs(current.y1 - current.y0);
			if (w < 3 || h < 3) return;
			if (tool === 'highlight') {
				obj = {
					id: uid('obj'),
					type: 'rect',
					page: page.key,
					x,
					y,
					w,
					h,
					stroke: null,
					fill: s.highlightColor,
					strokeWidth: 0,
					blend: 'multiply',
					opacity: 1
				};
			} else if (tool === 'whiteout') {
				obj = {
					id: uid('obj'),
					type: 'rect',
					page: page.key,
					x,
					y,
					w,
					h,
					stroke: null,
					fill: s.whiteoutColor,
					strokeWidth: 0,
					blend: 'normal',
					opacity: 1
				};
			} else {
				obj = {
					id: uid('obj'),
					type: tool === 'ellipse' ? 'ellipse' : 'rect',
					page: page.key,
					x,
					y,
					w,
					h,
					stroke: s.strokeColor,
					fill: s.fillColor,
					strokeWidth: s.strokeWidth,
					blend: 'normal',
					opacity: 1
				};
			}
		}
		if (obj) editor.add(obj, { select: false });
	}

	const draftPath = $derived.by(() => {
		if (!draft) return null;
		if (draft.kind === 'stroke') return smoothPath(draft.points);
		if (draft.kind === 'line') {
			return linePaths({
				id: '',
				type: editor.tool === 'arrow' ? 'arrow' : 'line',
				page: '',
				x1: draft.x0,
				y1: draft.y0,
				x2: draft.x1,
				y2: draft.y1,
				stroke: '',
				strokeWidth: editor.style.strokeWidth,
				opacity: 1
			}).join('');
		}
		const x = Math.min(draft.x0, draft.x1);
		const y = Math.min(draft.y0, draft.y1);
		const w = Math.abs(draft.x1 - draft.x0);
		const h = Math.abs(draft.y1 - draft.y0);
		return editor.tool === 'ellipse' ? ellipsePath(x, y, w, h) : rectPath(x, y, w, h);
	});

	const draftStyle = $derived.by(() => {
		const s = editor.style;
		switch (editor.tool) {
			case 'draw':
				return { stroke: s.drawColor, width: s.drawWidth, fill: 'none', blend: false };
			case 'highlight':
				return { stroke: 'none', width: 0, fill: s.highlightColor, blend: true };
			case 'whiteout':
				return { stroke: '#aeb8c8', width: 0.5, fill: s.whiteoutColor, blend: false };
			default:
				return {
					stroke: s.strokeColor,
					width: s.strokeWidth,
					fill: s.fillColor ?? 'none',
					blend: false
				};
		}
	});
</script>

<div class="page-wrap" data-page-index={index}>
	<div
		class="page tool-{editor.tool}"
		bind:this={container}
		style:width={`${size.width * z}px`}
		style:height={`${size.height * z}px`}
	>
		<canvas bind:this={canvas} aria-label={fmt(i18n.t.common.page, { n: index + 1 })}></canvas>
		<div
			class="layer"
			style:width={`${page.width * z}px`}
			style:height={`${page.height * z}px`}
			style:transform={layerTransform(page, z)}
			onpointerdown={onLayerDown}
			onpointermove={onLayerMove}
			onpointerup={onLayerUp}
			onpointercancel={onLayerUp}
			role="presentation"
		>
			{#if editor.tool === 'editText' && lines}
				{#each lines as line (line.id)}
					{#if !replaced.has(line.id)}
						<div
							class="line"
							style:left={`${line.x * z}px`}
							style:top={`${line.y * z}px`}
							style:width={`${line.w * z}px`}
							style:height={`${line.h * z}px`}
							onpointerdown={(e) => editLine(e, line)}
							role="button"
							tabindex="-1"
							aria-label={line.text}
						></div>
					{/if}
				{/each}
			{/if}
			{#each fields as field (field.id)}
				<FieldView {field} />
			{/each}
			{#each objects as obj (obj.id)}
				<ObjectView {obj} {page} />
			{/each}
			{#if draftPath}
				<svg
					class="draft"
					class:multiply={draftStyle.blend}
					viewBox={`0 0 ${page.width} ${page.height}`}
					width={page.width * z}
					height={page.height * z}
					aria-hidden="true"
				>
					<path
						d={draftPath}
						fill={draftStyle.fill}
						stroke={draftStyle.stroke}
						stroke-width={draftStyle.width}
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{/if}
		</div>
	</div>
	<span class="page-num">{index + 1}</span>
</div>

<style>
	.page-wrap {
		display: grid;
		justify-items: center;
		gap: 8px;
	}

	.page {
		position: relative;
		background: #fff;
		box-shadow: var(--shadow-sheet);
		touch-action: pan-x pan-y pinch-zoom;
	}

	.page:not(.tool-select):not(.tool-editText) {
		touch-action: none;
		cursor: crosshair;
	}

	.page.tool-text {
		cursor: text;
	}

	.page.tool-note,
	.page.tool-check,
	.page.tool-cross {
		cursor: copy;
	}

	canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.layer {
		position: absolute;
		left: 0;
		top: 0;
		transform-origin: 0 0;
	}

	.line {
		position: absolute;
		border-radius: 2px;
		cursor: text;
		outline: 1px dashed rgb(31 53 196 / 0.35);
		outline-offset: 1px;
	}

	.line:hover {
		background: rgb(255 225 77 / 0.35);
		outline: 1.5px solid var(--royal);
	}

	.draft {
		position: absolute;
		left: 0;
		top: 0;
		pointer-events: none;
		overflow: visible;
	}

	.draft.multiply {
		mix-blend-mode: multiply;
	}

	.page-num {
		font-size: 0.85rem;
		font-weight: 650;
		color: var(--ink-3);
		font-variant-numeric: tabular-nums;
	}
</style>
