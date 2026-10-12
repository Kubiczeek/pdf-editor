<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { ToolId } from '#lib/tools/registry.ts';
	import { useI18n, fmt, plural, formatNumber } from '#lib/i18n/index.ts';
	import { uid, pickFiles, downloadBlob, outputName } from '#lib/pdf/files.ts';
	import { prepareImage } from '#lib/pdf/ops/images.ts';
	import Icon, { type IconName } from '#lib/components/Icon.svelte';
	import type { EditorState } from './state.svelte.ts';
	import { setEditor, blurActive } from './context.ts';
	import { saveEdits } from './save.ts';
	import { clientToBase, rotatedSize, moved, LINE_HEIGHT } from './geometry.ts';
	import type { SignatureSpec, ToolName, EditorObject } from './types.ts';
	import EditorPage from './EditorPage.svelte';
	import PagesPanel from './PagesPanel.svelte';
	import PropertiesBar from './PropertiesBar.svelte';
	import SignatureDialog from './SignatureDialog.svelte';

	let { state: editor, toolId, onclose }: { state: EditorState; toolId: ToolId; onclose: () => void } = $props();
	// svelte-ignore state_referenced_locally
	setEditor(editor);
	const i18n = useI18n();
	const t = $derived(i18n.t.editor);

	let scroller = $state<HTMLDivElement>();
	let showPanel = $state(true);
	let saving = $state(false);
	let toast = $state<string | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | undefined;
	let signatureOpen = $state(false);
	let shapesOpen = $state(false);
	let shapesRoot = $state<HTMLDivElement>();
	let menuPos = $state({ left: 0, top: 0 });

	const SHAPES: Array<{ tool: ToolName; icon: IconName }> = [
		{ tool: 'rect', icon: 'square' },
		{ tool: 'ellipse', icon: 'circle' },
		{ tool: 'line', icon: 'line' },
		{ tool: 'arrow', icon: 'arrow' },
		{ tool: 'check', icon: 'tick' },
		{ tool: 'cross', icon: 'cross' }
	];
	const shapeActive = $derived(SHAPES.find((s) => s.tool === editor.tool));

	function notify(message: string) {
		toast = message;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = null), 4000);
	}

	// The tool hint shows briefly whenever the tool changes, then gets out of the way.
	let hintVisible = $state(true);
	$effect(() => {
		void editor.tool;
		hintVisible = true;
		const timer = setTimeout(() => (hintVisible = false), 4500);
		return () => clearTimeout(timer);
	});

	// ---------- Zoom ----------

	function fitZoom(): number {
		if (!scroller) return 1;
		const widest = Math.max(...editor.pages.map((p) => rotatedSize(p).width));
		const available = scroller.clientWidth - (scroller.clientWidth < 600 ? 28 : 56);
		return Math.min(4, Math.max(0.25, available / widest));
	}

	function setZoom(next: number) {
		const el = scroller;
		const previous = editor.zoom;
		const zoom = Math.min(4, Math.max(0.25, Math.round(next * 100) / 100));
		if (!el || zoom === previous) {
			editor.zoom = zoom;
			return;
		}
		const centerY = el.scrollTop + el.clientHeight / 2;
		const centerX = el.scrollLeft + el.clientWidth / 2;
		editor.zoom = zoom;
		tick().then(() => {
			el.scrollTop = centerY * (zoom / previous) - el.clientHeight / 2;
			el.scrollLeft = centerX * (zoom / previous) - el.clientWidth / 2;
		});
	}

	function onWheel(event: WheelEvent) {
		if (!(event.ctrlKey || event.metaKey)) return;
		event.preventDefault();
		setZoom(editor.zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1));
	}

	// ---------- Current page and placement ----------

	let scrollFrame = 0;
	function onScroll() {
		if (scrollFrame) return;
		scrollFrame = requestAnimationFrame(() => {
			scrollFrame = 0;
			if (!scroller) return;
			const box = scroller.getBoundingClientRect();
			const middle = box.top + box.height / 2;
			const wraps = scroller.querySelectorAll<HTMLElement>('[data-page-index]');
			let best = editor.currentPage;
			let bestDistance = Infinity;
			wraps.forEach((wrap) => {
				const rect = wrap.getBoundingClientRect();
				const distance = rect.top <= middle && rect.bottom >= middle ? 0 : Math.min(Math.abs(rect.top - middle), Math.abs(rect.bottom - middle));
				if (distance < bestDistance) {
					bestDistance = distance;
					best = Number(wrap.dataset.pageIndex);
				}
			});
			editor.currentPage = best;
		});
	}

	function jumpTo(index: number) {
		editor.currentPage = index;
		const wrap = scroller?.querySelector<HTMLElement>(`[data-page-index="${index}"]`);
		wrap?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		if (window.innerWidth < 900) showPanel = false;
	}

	/** Centre of the visible part of the current page, in its base space. */
	function placementPoint(): { page: number; x: number; y: number } {
		const index = Math.min(editor.currentPage, editor.pages.length - 1);
		const page = editor.pages[index];
		const pageEl = scroller?.querySelector<HTMLElement>(`[data-page-index="${index}"] .page`);
		if (!pageEl || !scroller) return { page: index, x: page.width / 2, y: page.height / 2 };
		const a = pageEl.getBoundingClientRect();
		const b = scroller.getBoundingClientRect();
		const top = Math.max(a.top, b.top);
		const bottom = Math.min(a.bottom, b.bottom);
		const left = Math.max(a.left, b.left);
		const right = Math.min(a.right, b.right);
		const cx = bottom > top && right > left ? (left + right) / 2 : a.left + a.width / 2;
		const cy = bottom > top && right > left ? (top + bottom) / 2 : a.top + a.height / 2;
		const [x, y] = clientToBase(page, pageEl, editor.zoom, cx, cy);
		return { page: index, x, y };
	}

	function fitInto(w: number, h: number, maxW: number, maxH: number) {
		const scale = Math.min(1, maxW / w, maxH / h);
		return { w: w * scale, h: h * scale };
	}

	function placeObject(build: (pageKey: string, x: number, y: number, pageW: number, pageH: number) => EditorObject) {
		const { page, x, y } = placementPoint();
		const model = editor.pages[page];
		const obj = build(model.key, x, y, model.width, model.height);
		// Keep the new object on the page.
		const box = 'w' in obj && 'h' in obj ? { w: obj.w, h: obj.h } : { w: 0, h: 0 };
		if ('x' in obj && 'y' in obj) {
			obj.x = Math.min(Math.max(0, obj.x), Math.max(0, model.width - box.w));
			obj.y = Math.min(Math.max(0, obj.y), Math.max(0, model.height - box.h));
		}
		editor.setTool('select');
		editor.add(obj);
	}

	async function insertImage(file?: File) {
		const chosen = file ?? (await pickFiles('image/*', false))[0];
		if (!chosen) return;
		try {
			const prepared = await prepareImage(chosen);
			const mime = prepared.kind === 'png' ? 'image/png' : 'image/jpeg';
			const blob = new Blob([prepared.bytes as Uint8Array<ArrayBuffer>], { type: mime });
			const bitmap = await createImageBitmap(blob);
			const assetId = uid('asset');
			editor.assets.set(assetId, {
				bytes: prepared.bytes,
				mime,
				url: URL.createObjectURL(blob),
				width: bitmap.width,
				height: bitmap.height
			});
			const natural = { w: bitmap.width * 0.75, h: bitmap.height * 0.75 };
			bitmap.close();
			placeObject((page, x, y, pw, ph) => {
				const size = fitInto(natural.w, natural.h, pw * 0.6, ph * 0.6);
				return { id: uid('obj'), type: 'image', page, x: x - size.w / 2, y: y - size.h / 2, w: size.w, h: size.h, asset: assetId, opacity: 1 };
			});
		} catch {
			notify(t.imageError);
		}
	}

	function placeSignature(spec: SignatureSpec) {
		placeObject((page, x, y, pw) => {
			const maxW = Math.min(200, pw * 0.4);
			if (spec.kind === 'text' && spec.text && spec.family) {
				const size = Math.max(12, Math.min(32, (maxW / Math.max(0.5, spec.aspect)) / LINE_HEIGHT));
				const h = size * LINE_HEIGHT;
				const w = h * spec.aspect;
				return {
					id: uid('obj'),
					type: 'text',
					page,
					x: x - w / 2,
					y: y - h / 2,
					text: spec.text,
					family: spec.family,
					size,
					bold: false,
					italic: false,
					color: spec.color,
					align: 'left',
					w,
					h,
					opacity: 1
				};
			}
			let w = maxW;
			let h = w / Math.max(0.1, spec.aspect);
			if (h > 90) {
				h = 90;
				w = h * spec.aspect;
			}
			if (spec.kind === 'image' && spec.asset) {
				return { id: uid('obj'), type: 'image', page, x: x - w / 2, y: y - h / 2, w, h, asset: spec.asset, opacity: 1 };
			}
			return {
				id: uid('obj'),
				type: 'ink',
				page,
				x: x - w / 2,
				y: y - h / 2,
				w,
				h,
				strokes: spec.strokes ?? [],
				color: spec.color,
				width: (spec.width ?? 0.01) * w,
				refW: w,
				opacity: 1
			};
		});
	}

	// ---------- Saving ----------

	const suffix = $derived(toolId === 'sign' ? 'signed' : toolId === 'fill-form' ? 'filled' : 'edited');

	async function save() {
		if (saving) return;
		blurActive();
		await tick();
		saving = true;
		try {
			const bytes = await saveEdits(editor);
			downloadBlob(bytes, outputName(editor.fileName, suffix));
			editor.dirty = false;
		} catch (error) {
			console.error(error);
			notify(fmt(t.saveError, { message: error instanceof Error ? error.message : String(error) }));
		} finally {
			saving = false;
		}
	}

	function requestClose() {
		if (editor.dirty && !confirm(t.closeConfirm)) return;
		onclose();
	}

	// ---------- Keyboard, clipboard, page lifecycle ----------

	function isTyping(target: EventTarget | null): boolean {
		const el = target as HTMLElement | null;
		if (!el) return false;
		return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
	}

	let lastNudge = 0;
	function onKeydown(event: KeyboardEvent) {
		if (signatureOpen) return;
		const mod = event.ctrlKey || event.metaKey;
		const key = event.key.toLowerCase();
		if (mod && key === 's') {
			event.preventDefault();
			void save();
			return;
		}
		if (isTyping(event.target)) return;
		if (mod && key === 'z') {
			event.preventDefault();
			if (event.shiftKey) editor.redo();
			else editor.undo();
		} else if (mod && key === 'y') {
			event.preventDefault();
			editor.redo();
		} else if (mod && key === 'd' && editor.selectedId) {
			event.preventDefault();
			editor.duplicate(editor.selectedId);
		} else if ((key === 'delete' || key === 'backspace') && editor.selectedId) {
			event.preventDefault();
			editor.remove(editor.selectedId);
		} else if (key === 'escape') {
			if (editor.selectedId) editor.selectedId = null;
			else editor.setTool('select');
		} else if (key.startsWith('arrow') && editor.selected) {
			event.preventDefault();
			const step = event.shiftKey ? 10 : 1;
			const dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0;
			const dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0;
			if (Date.now() - lastNudge > 600) editor.checkpoint();
			lastNudge = Date.now();
			editor.patch(editor.selected.id, moved(editor.selected, dx, dy));
		} else if (mod && (key === '=' || key === '+')) {
			event.preventDefault();
			setZoom(editor.zoom * 1.2);
		} else if (mod && key === '-') {
			event.preventDefault();
			setZoom(editor.zoom / 1.2);
		}
	}

	function onPaste(event: ClipboardEvent) {
		if (isTyping(event.target)) return;
		const file = Array.from(event.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
		if (file) {
			event.preventDefault();
			void insertImage(file);
		}
	}

	function onBeforeUnload(event: BeforeUnloadEvent) {
		if (editor.dirty) {
			event.preventDefault();
			event.returnValue = '';
		}
	}

	onMount(() => {
		const root = document.documentElement;
		const previous = root.style.overflow;
		root.style.overflow = 'hidden';
		if (window.innerWidth < 900) showPanel = false;
		editor.zoom = Math.min(fitZoom(), window.innerWidth < 900 ? 4 : 1.5);
		if (toolId === 'sign') signatureOpen = true;
		if (toolId === 'fill-form') {
			notify(editor.fields.length ? plural(i18n.lang, new Set(editor.fields.map((f) => f.name)).size, t.formsFound) : t.noForms);
		}
		return () => {
			root.style.overflow = previous;
			clearTimeout(toastTimer);
			for (const asset of editor.assets.values()) URL.revokeObjectURL(asset.url);
		};
	});

	const tools: Array<{ tool: ToolName; icon: IconName }> = [
		{ tool: 'select', icon: 'cursor' },
		{ tool: 'editText', icon: 'editText' },
		{ tool: 'text', icon: 'type' },
		{ tool: 'draw', icon: 'pencil' },
		{ tool: 'highlight', icon: 'highlighter' },
		{ tool: 'whiteout', icon: 'eraser' },
		{ tool: 'note', icon: 'note' }
	];

	function chooseTool(tool: ToolName) {
		blurActive();
		editor.setTool(tool);
		shapesOpen = false;
	}
</script>

<svelte:window
	onkeydown={onKeydown}
	onpaste={onPaste}
	onbeforeunload={onBeforeUnload}
	onpointerdown={(e) => {
		if (shapesOpen && shapesRoot && !shapesRoot.contains(e.target as Node)) shapesOpen = false;
	}}
/>

<div class="shell" role="application" aria-label={i18n.t.tools.edit.name}>
	<header class="top">
		<button class="icon-btn" onclick={requestClose} aria-label={t.close} title={t.close}>
			<Icon name="x" size={22} />
		</button>
		<button class="icon-btn panel-toggle" class:on={showPanel} onclick={() => (showPanel = !showPanel)} aria-label={t.pagesPanel} title={t.pagesPanel} aria-pressed={showPanel}>
			<Icon name="sidebar" size={20} />
		</button>
		<div class="file">
			<Icon name="file" size={18} />
			<span class="name" title={editor.fileName}>{editor.fileName}</span>
			{#if editor.dirty}<span class="dot" title={t.unsaved}></span>{/if}
		</div>
		<div class="group">
			<button class="icon-btn" onclick={() => editor.undo()} disabled={!editor.canUndo} aria-label={t.undo} title={`${t.undo} (Ctrl+Z)`}>
				<Icon name="undo" size={20} />
			</button>
			<button class="icon-btn" onclick={() => editor.redo()} disabled={!editor.canRedo} aria-label={t.redo} title={`${t.redo} (Ctrl+Y)`}>
				<Icon name="redo" size={20} />
			</button>
		</div>
		<div class="group zoom">
			<button class="icon-btn" onclick={() => setZoom(editor.zoom / 1.2)} aria-label={t.zoomOut} title={t.zoomOut}>
				<Icon name="zoomOut" size={20} />
			</button>
			<span class="pct">{formatNumber(i18n.lang, Math.round(editor.zoom * 100))} %</span>
			<button class="icon-btn" onclick={() => setZoom(editor.zoom * 1.2)} aria-label={t.zoomIn} title={t.zoomIn}>
				<Icon name="zoomIn" size={20} />
			</button>
			<button class="icon-btn fit-btn" onclick={() => setZoom(fitZoom())} aria-label={t.fitWidth} title={t.fitWidth}>
				<Icon name="fit" size={20} />
			</button>
		</div>
		<button class="btn btn-primary save" onclick={save} disabled={saving}>
			<Icon name="download" size={18} />
			<span>{saving ? t.saving : t.save}</span>
		</button>
	</header>

	<nav class="toolbar" aria-label={t.toolsLabel}>
		{#each tools.slice(0, 3) as item (item.tool)}
			<button class="tool" class:active={editor.tool === item.tool} aria-pressed={editor.tool === item.tool} onclick={() => chooseTool(item.tool)} title={t.hints[item.tool]}>
				<Icon name={item.icon} size={20} />
				<span>{t.tools[item.tool]}</span>
			</button>
		{/each}
		<button class="tool" onclick={() => { chooseTool('select'); signatureOpen = true; }} title={t.hints.signature}>
			<Icon name="signature" size={20} />
			<span>{t.tools.signature}</span>
		</button>
		<button class="tool" onclick={() => { chooseTool('select'); void insertImage(); }} title={t.hints.image}>
			<Icon name="image" size={20} />
			<span>{t.tools.image}</span>
		</button>
		{#each tools.slice(3) as item (item.tool)}
			<button class="tool" class:active={editor.tool === item.tool} aria-pressed={editor.tool === item.tool} onclick={() => chooseTool(item.tool)} title={t.hints[item.tool]}>
				<Icon name={item.icon} size={20} />
				<span>{t.tools[item.tool]}</span>
			</button>
		{/each}
		<div class="shapes" bind:this={shapesRoot}>
			<button
				class="tool"
				class:active={Boolean(shapeActive)}
				aria-expanded={shapesOpen}
				onclick={(e) => {
					const rect = e.currentTarget.getBoundingClientRect();
					menuPos = { left: Math.min(rect.left, window.innerWidth - 200), top: rect.bottom + 4 };
					shapesOpen = !shapesOpen;
				}}
			>
				<Icon name={shapeActive?.icon ?? 'square'} size={20} />
				<span>{shapeActive ? t.tools[shapeActive.tool] : t.shapes}</span>
				<Icon name="chevronDown" size={14} />
			</button>
			{#if shapesOpen}
				<div class="menu" role="menu" style:left={`${menuPos.left}px`} style:top={`${menuPos.top}px`}>
					{#each SHAPES as item (item.tool)}
						<button role="menuitem" class:active={editor.tool === item.tool} onclick={() => chooseTool(item.tool)}>
							<Icon name={item.icon} size={18} />
							{t.tools[item.tool]}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</nav>

	<div class="body" class:with-panel={showPanel}>
		{#if showPanel}
			<PagesPanel onjump={jumpTo} onnotice={notify} />
		{/if}
		<div class="scroller" bind:this={scroller} onscroll={onScroll} onwheel={onWheel}>
			<div class="float">
				<p class="hint" class:hidden={!hintVisible} aria-live="polite">{t.hints[editor.tool]}</p>
				<PropertiesBar />
			</div>
			<div class="pages">
				{#each editor.pages as page, index (page.key)}
					<EditorPage {page} {index} />
				{/each}
			</div>
		</div>
	</div>

	{#if saving}
		<div class="saving" role="status">
			<span class="spinner" aria-hidden="true"></span>
			{t.saving}
		</div>
	{/if}

	{#if toast}
		<div class="toast" role="status">
			<span>{toast}</span>
			<button class="icon-btn" onclick={() => (toast = null)} aria-label={i18n.t.common.close}>
				<Icon name="x" size={16} />
			</button>
		</div>
	{/if}

	<SignatureDialog bind:open={signatureOpen} onuse={placeSignature} />
</div>

<style>
	.shell {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: grid;
		grid-template-rows: auto auto minmax(0, 1fr);
		background: var(--desk);
	}

	.top {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		background: var(--paper);
		border-bottom: 1px solid var(--line);
	}

	.file {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		flex: 1;
		font-weight: 650;
	}

	.file :global(svg) {
		flex: none;
		color: var(--royal);
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dot {
		flex: none;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--highlight);
		box-shadow: 0 0 0 1px #c9a90f;
	}

	.group {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.pct {
		min-width: 52px;
		text-align: center;
		font-size: 0.9rem;
		font-weight: 650;
		font-variant-numeric: tabular-nums;
	}

	.icon-btn.on {
		background: var(--royal-tint);
		color: var(--royal);
	}

	.save {
		min-height: 40px;
	}

	.toolbar {
		display: flex;
		align-items: stretch;
		gap: 2px;
		padding: 6px 10px;
		background: var(--paper);
		border-bottom: 1px solid var(--line);
		overflow-x: auto;
		scrollbar-width: thin;
	}

	.tool {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		min-width: 64px;
		padding: 6px 8px;
		border: none;
		border-radius: var(--radius-m);
		background: transparent;
		color: var(--ink-2);
		font-size: 0.78rem;
		font-weight: 650;
		line-height: 1.1;
		white-space: nowrap;
		cursor: pointer;
	}

	.tool:hover {
		background: rgb(22 33 58 / 0.06);
		color: var(--ink);
	}

	.tool.active {
		background: var(--highlight);
		color: var(--ink);
	}

	.shapes {
		position: relative;
	}

	.shapes > .tool {
		flex-direction: column;
		height: 100%;
	}

	.shapes > .tool :global(svg:last-child) {
		position: absolute;
		right: 4px;
		top: 6px;
	}

	.menu {
		position: fixed;
		z-index: 120;
		display: grid;
		min-width: 180px;
		padding: 6px;
		border-radius: var(--radius-m);
		background: var(--paper);
		box-shadow: var(--shadow-pop);
	}

	.menu button {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border: none;
		border-radius: var(--radius-s);
		background: none;
		font-weight: 600;
		text-align: left;
		cursor: pointer;
	}

	.menu button:hover,
	.menu button.active {
		background: var(--highlight-soft);
	}

	.body {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		min-height: 0;
	}

	.body.with-panel {
		grid-template-columns: 170px minmax(0, 1fr);
	}

	.scroller {
		position: relative;
		overflow: auto;
		overscroll-behavior: contain;
	}

	.float {
		position: sticky;
		top: 8px;
		left: 0;
		z-index: 20;
		display: grid;
		justify-items: center;
		gap: 6px;
		padding: 0 12px;
		pointer-events: none;
		height: 0;
	}

	.float > :global(*) {
		pointer-events: auto;
	}

	.hint {
		transition: opacity 300ms ease;
		padding: 4px 12px;
		border-radius: 99px;
		background: rgb(22 33 58 / 0.78);
		color: #fff;
		font-size: 0.82rem;
		font-weight: 600;
		max-width: min(92vw, 640px);
		text-align: center;
	}

	.hint.hidden {
		opacity: 0;
		pointer-events: none;
	}

	.pages {
		display: grid;
		justify-content: center;
		gap: 22px;
		padding: 104px 24px 48px;
		width: max-content;
		min-width: 100%;
	}

	.saving {
		position: fixed;
		inset: 0;
		z-index: 130;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 12px;
		background: rgb(255 255 255 / 0.7);
		font-weight: 700;
	}

	.spinner {
		width: 28px;
		height: 28px;
		border: 3px solid var(--royal-tint);
		border-top-color: var(--royal);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.toast {
		position: fixed;
		left: 50%;
		bottom: 20px;
		z-index: 140;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 8px;
		max-width: min(92vw, 560px);
		padding: 10px 10px 10px 16px;
		border-radius: var(--radius-m);
		background: var(--ink);
		color: #fff;
		box-shadow: var(--shadow-pop);
		font-weight: 600;
	}

	.toast .icon-btn {
		color: #fff;
	}

	@media (max-width: 900px) {
		.body.with-panel {
			grid-template-columns: minmax(0, 1fr);
		}

		.body.with-panel :global(.panel) {
			position: fixed;
			left: 0;
			top: 0;
			bottom: 0;
			z-index: 110;
			width: min(240px, 70vw);
			box-shadow: var(--shadow-pop);
		}

		.pages {
			padding: 96px 10px 40px;
		}
	}

	@media (max-width: 640px) {
		.zoom .pct,
		.zoom .fit-btn,
		.file .name,
		.file .dot,
		.save span {
			display: none;
		}

		.save {
			min-height: 38px;
			padding: 0.4em 0.7em;
		}

		.hint {
			font-size: 0.75rem;
		}

		.top {
			gap: 4px;
			padding: 6px;
		}

		.tool {
			min-width: 56px;
		}
	}
</style>
