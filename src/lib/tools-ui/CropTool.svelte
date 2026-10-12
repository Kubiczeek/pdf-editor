<script lang="ts">
	import type { ToolProps } from '#lib/tools/registry.ts';
	import { useI18n, fmt } from '#lib/i18n/index.ts';
	import { outputName, toBlob } from '#lib/pdf/files.ts';
	import { renderPage } from '#lib/pdf/pdfjs.ts';
	import { cropPdf, type CropMargins } from '#lib/pdf/ops/document.ts';
	import { clamp } from '#lib/pdf/geometry.ts';
	import { SinglePdfTool } from './single.svelte.ts';
	import { toInput, describeError } from './shared.ts';
	import ToolShell from '#lib/components/ToolShell.svelte';
	import Workspace from '#lib/components/Workspace.svelte';
	import PagePreview from '#lib/components/PagePreview.svelte';
	import Notice from '#lib/components/Notice.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let _props: ToolProps = $props();
	const i18n = useI18n();
	const tool = new SinglePdfTool(() => i18n.t);

	const NONE: CropMargins = { top: 0, right: 0, bottom: 0, left: 0 };
	const MIN = 0.05;

	let scope = $state<'all' | 'this'>('all');
	let global = $state<CropMargins>({ top: 0.05, right: 0.05, bottom: 0.05, left: 0.05 });
	let custom = $state<Record<number, CropMargins>>({});
	let page = $state(1);
	let detecting = $state(false);

	const pageCount = $derived(tool.pdf?.pageCount ?? 0);
	const current = $derived(scope === 'all' ? global : (custom[page] ?? NONE));

	$effect(() => {
		void tool.pdf;
		page = 1;
		custom = {};
		global = { top: 0.05, right: 0.05, bottom: 0.05, left: 0.05 };
	});

	function setCurrent(margins: CropMargins) {
		if (scope === 'all') global = margins;
		else custom = { ...custom, [page]: margins };
	}

	type Handle = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
	let drag: { handle: Handle; x: number; y: number; w: number; h: number; start: CropMargins } | null = null;

	function begin(event: PointerEvent, handle: Handle, geoWidth: number, geoHeight: number) {
		event.preventDefault();
		event.stopPropagation();
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		drag = { handle, x: event.clientX, y: event.clientY, w: geoWidth, h: geoHeight, start: { ...current } };
	}

	function onMove(event: PointerEvent) {
		if (!drag) return;
		const dx = (event.clientX - drag.x) / drag.w;
		const dy = (event.clientY - drag.y) / drag.h;
		const s = drag.start;
		const m = { ...s };
		const h = drag.handle;
		if (h === 'move') {
			const width = 1 - s.left - s.right;
			const height = 1 - s.top - s.bottom;
			m.left = clamp(s.left + dx, 0, 1 - width);
			m.right = 1 - width - m.left;
			m.top = clamp(s.top + dy, 0, 1 - height);
			m.bottom = 1 - height - m.top;
		} else {
			if (h.includes('n')) m.top = clamp(s.top + dy, 0, 1 - s.bottom - MIN);
			if (h.includes('s')) m.bottom = clamp(s.bottom - dy, 0, 1 - s.top - MIN);
			if (h.includes('w')) m.left = clamp(s.left + dx, 0, 1 - s.right - MIN);
			if (h.includes('e')) m.right = clamp(s.right - dx, 0, 1 - s.left - MIN);
		}
		setCurrent(m);
	}

	function end() {
		drag = null;
	}

	/** Finds the bounding box of non-white pixels on the current page. */
	async function detect() {
		if (!tool.pdf) return;
		detecting = true;
		try {
			const pdfPage = await tool.pdf.doc.getPage(page);
			const canvas = document.createElement('canvas');
			const viewport = pdfPage.getViewport({ scale: 1 });
			await renderPage(pdfPage, canvas, { scale: 500 / viewport.width, pixelRatio: 1 });
			const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
			const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
			let minX = width;
			let minY = height;
			let maxX = -1;
			let maxY = -1;
			for (let y = 0; y < height; y++) {
				for (let x = 0; x < width; x++) {
					const i = (y * width + x) * 4;
					if (data[i] < 242 || data[i + 1] < 242 || data[i + 2] < 242) {
						if (x < minX) minX = x;
						if (x > maxX) maxX = x;
						if (y < minY) minY = y;
						if (y > maxY) maxY = y;
					}
				}
			}
			canvas.width = canvas.height = 0;
			if (maxX < 0) return;
			const pad = 0.012;
			setCurrent({
				left: clamp(minX / width - pad, 0, 1),
				top: clamp(minY / height - pad, 0, 1),
				right: clamp(1 - (maxX + 1) / width - pad, 0, 1),
				bottom: clamp(1 - (maxY + 1) / height - pad, 0, 1)
			});
		} catch (error) {
			tool.fail(describeError(i18n.t, error));
		} finally {
			detecting = false;
		}
	}

	async function submit() {
		const margins =
			scope === 'all'
				? { ...global }
				: new Map(Object.entries(custom).map(([k, v]) => [Number(k) - 1, v]));
		await tool.run(async (pdf) => {
			const bytes = await cropPdf(toInput(pdf), margins, pdf.pageCount);
			return [{ name: outputName(pdf.name, 'cropped'), blob: toBlob(bytes) }];
		});
	}

	const handles: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
</script>

<svelte:window onpointermove={onMove} onpointerup={end} onpointercancel={end} />

<ToolShell {tool} next={['compress', 'rotate', 'merge']}>
	{#if tool.pdf}
		<Workspace busy={tool.busy || detecting} progress={tool.progress}>
			{#snippet main()}
				<p class="hint">{i18n.t.crop.hint}</p>
				<PagePreview doc={tool.pdf!.doc} pageNumber={page} maxWidth={600} maxHeight={760}>
					{#snippet overlay(geo)}
						{@const w = geo.width * geo.scale}
						{@const h = geo.height * geo.scale}
						<div class="crop-layer">
							<div
								class="frame"
								style:left={`${current.left * 100}%`}
								style:top={`${current.top * 100}%`}
								style:right={`${current.right * 100}%`}
								style:bottom={`${current.bottom * 100}%`}
								onpointerdown={(e) => begin(e, 'move', w, h)}
								role="presentation"
							>
								{#each handles as handle (handle)}
									<span class="handle {handle}" onpointerdown={(e) => begin(e, handle, w, h)} role="presentation"></span>
								{/each}
							</div>
						</div>
					{/snippet}
				</PagePreview>
				{#if pageCount > 1}
					<div class="pager">
						<button class="icon-btn" onclick={() => (page = Math.max(1, page - 1))} disabled={page <= 1} aria-label={i18n.t.crop.prev}>
							<Icon name="chevronLeft" size={18} />
						</button>
						<span>{fmt(i18n.t.common.pageOf, { n: page, total: pageCount })}</span>
						<button class="icon-btn" onclick={() => (page = Math.min(pageCount, page + 1))} disabled={page >= pageCount} aria-label={i18n.t.crop.next}>
							<Icon name="chevronRight" size={18} />
						</button>
					</div>
				{/if}
			{/snippet}
			{#snippet side()}
				<div class="segmented full">
					<label><input type="radio" value="all" bind:group={scope} /><span>{i18n.t.crop.applyAll}</span></label>
					<label><input type="radio" value="this" bind:group={scope} /><span>{i18n.t.crop.applyThis}</span></label>
				</div>
				<button class="btn" onclick={detect} disabled={detecting}>
					<Icon name="sparkle" size={18} />
					{i18n.t.crop.detect}
				</button>
				<button class="btn btn-ghost" onclick={() => setCurrent({ ...NONE })}>
					<Icon name="rotateLeft" size={18} />
					{i18n.t.common.reset}
				</button>
				<Notice>{i18n.t.crop.note}</Notice>
			{/snippet}
			{#snippet action()}
				<button
					class="btn btn-primary btn-lg"
					onclick={submit}
					disabled={tool.busy || (scope === 'this' && Object.keys(custom).length === 0)}
				>
					<Icon name="crop" size={20} />
					{i18n.t.crop.action}
				</button>
				<button class="btn btn-ghost" onclick={() => tool.reset()}>{i18n.t.common.startOver}</button>
			{/snippet}
		</Workspace>
	{/if}
</ToolShell>

<style>
	.hint {
		margin-bottom: 14px;
		color: var(--ink-2);
	}

	.crop-layer {
		position: absolute;
		inset: 0;
		touch-action: none;
	}

	.frame {
		position: absolute;
		border: 2px solid var(--royal);
		box-shadow: 0 0 0 9999px rgb(22 33 58 / 0.45);
		cursor: move;
		touch-action: none;
	}

	.handle {
		position: absolute;
		width: 16px;
		height: 16px;
		border: 2px solid var(--royal);
		background: var(--highlight);
		border-radius: 3px;
		touch-action: none;
	}

	.nw {
		left: -9px;
		top: -9px;
		cursor: nwse-resize;
	}
	.n {
		left: calc(50% - 8px);
		top: -9px;
		cursor: ns-resize;
	}
	.ne {
		right: -9px;
		top: -9px;
		cursor: nesw-resize;
	}
	.e {
		right: -9px;
		top: calc(50% - 8px);
		cursor: ew-resize;
	}
	.se {
		right: -9px;
		bottom: -9px;
		cursor: nwse-resize;
	}
	.s {
		left: calc(50% - 8px);
		bottom: -9px;
		cursor: ns-resize;
	}
	.sw {
		left: -9px;
		bottom: -9px;
		cursor: nesw-resize;
	}
	.w {
		left: -9px;
		top: calc(50% - 8px);
		cursor: ew-resize;
	}

	.pager {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: 12px;
		font-weight: 600;
		color: var(--ink-2);
	}

	.full {
		display: flex;
	}

	.full label {
		flex: 1;
		text-align: center;
	}
</style>
