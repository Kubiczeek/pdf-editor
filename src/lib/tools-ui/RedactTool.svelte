<script lang="ts">
	import type { ToolProps } from '#lib/tools/registry.ts';
	import { useI18n, fmt, plural } from '#lib/i18n/index.ts';
	import { outputName, toBlob, uid } from '#lib/pdf/files.ts';
	import { redactPdf, type RedactBox } from '#lib/pdf/ops/raster.ts';
	import { SinglePdfTool } from './single.svelte.ts';
	import { toInput } from './shared.ts';
	import ToolShell from '#lib/components/ToolShell.svelte';
	import Workspace from '#lib/components/Workspace.svelte';
	import PagePreview from '#lib/components/PagePreview.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let _props: ToolProps = $props();
	const i18n = useI18n();
	const tool = new SinglePdfTool(() => i18n.t);

	type Box = RedactBox & { id: string };
	let boxes = $state<Box[]>([]);
	let page = $state(1);
	let fill = $state<'#000000' | '#ffffff'>('#000000');
	let draft = $state<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
	let drawing: { scale: number; rect: DOMRect; maxW: number; maxH: number } | null = null;

	const pageCount = $derived(tool.pdf?.pageCount ?? 0);
	const pageBoxes = $derived(boxes.filter((b) => b.page === page - 1));

	$effect(() => {
		void tool.pdf;
		boxes = [];
		page = 1;
	});

	function start(event: PointerEvent, scale: number, maxW: number, maxH: number) {
		if (event.button !== 0) return;
		const target = event.currentTarget as HTMLElement;
		target.setPointerCapture(event.pointerId);
		const rect = target.getBoundingClientRect();
		drawing = { scale, rect, maxW, maxH };
		const x = (event.clientX - rect.left) / scale;
		const y = (event.clientY - rect.top) / scale;
		draft = { x0: x, y0: y, x1: x, y1: y };
	}

	function move(event: PointerEvent) {
		if (!drawing || !draft) return;
		const { rect, scale, maxW, maxH } = drawing;
		draft = {
			...draft,
			x1: Math.min(maxW, Math.max(0, (event.clientX - rect.left) / scale)),
			y1: Math.min(maxH, Math.max(0, (event.clientY - rect.top) / scale))
		};
	}

	function finish() {
		if (draft) {
			const x = Math.min(draft.x0, draft.x1);
			const y = Math.min(draft.y0, draft.y1);
			const width = Math.abs(draft.x1 - draft.x0);
			const height = Math.abs(draft.y1 - draft.y0);
			if (width > 2 && height > 2) {
				boxes = [...boxes, { id: uid('box'), page: page - 1, x, y, width, height }];
			}
		}
		draft = null;
		drawing = null;
	}

	async function submit() {
		if (!boxes.length) return tool.fail(i18n.t.redact.none);
		const list = boxes.map(({ page, x, y, width, height }) => ({ page, x, y, width, height }));
		const color = fill;
		await tool.run(async (pdf, onProgress) => {
			const bytes = await redactPdf(toInput(pdf), list, { dpi: 200, color }, onProgress);
			return [{ name: outputName(pdf.name, 'redacted'), blob: toBlob(bytes) }];
		});
	}
</script>

<ToolShell {tool} next={['protect', 'compress', 'metadata']}>
	{#if tool.pdf}
		<Workspace busy={tool.busy} progress={tool.progress}>
			{#snippet main()}
				<p class="hint">{i18n.t.redact.hint}</p>
				<PagePreview doc={tool.pdf!.doc} pageNumber={page} maxWidth={620} maxHeight={800}>
					{#snippet overlay(geo)}
						<div
							class="draw-layer"
							role="presentation"
							onpointerdown={(e) => start(e, geo.scale, geo.width, geo.height)}
							onpointermove={move}
							onpointerup={finish}
							onpointercancel={finish}
						>
							{#each pageBoxes as box (box.id)}
								<div
									class="box"
									class:white={fill === '#ffffff'}
									style:left={`${box.x * geo.scale}px`}
									style:top={`${box.y * geo.scale}px`}
									style:width={`${box.width * geo.scale}px`}
									style:height={`${box.height * geo.scale}px`}
								>
									<button
										class="remove"
										onpointerdown={(e) => e.stopPropagation()}
										onclick={() => (boxes = boxes.filter((b) => b.id !== box.id))}
										aria-label={i18n.t.redact.removeBox}
									>
										<Icon name="x" size={14} strokeWidth={2.6} />
									</button>
								</div>
							{/each}
							{#if draft}
								<div
									class="box draft"
									style:left={`${Math.min(draft.x0, draft.x1) * geo.scale}px`}
									style:top={`${Math.min(draft.y0, draft.y1) * geo.scale}px`}
									style:width={`${Math.abs(draft.x1 - draft.x0) * geo.scale}px`}
									style:height={`${Math.abs(draft.y1 - draft.y0) * geo.scale}px`}
								></div>
							{/if}
						</div>
					{/snippet}
				</PagePreview>
				{#if pageCount > 1}
					<div class="pager">
						<button
							class="icon-btn"
							onclick={() => (page = Math.max(1, page - 1))}
							disabled={page <= 1}
							aria-label={i18n.t.crop.prev}
						>
							<Icon name="chevronLeft" size={18} />
						</button>
						<span>{fmt(i18n.t.common.pageOf, { n: page, total: pageCount })}</span>
						<button
							class="icon-btn"
							onclick={() => (page = Math.min(pageCount, page + 1))}
							disabled={page >= pageCount}
							aria-label={i18n.t.crop.next}
						>
							<Icon name="chevronRight" size={18} />
						</button>
					</div>
				{/if}
			{/snippet}
			{#snippet side()}
				<p class="count">
					<Icon name="redact" size={18} />
					{plural(i18n.lang, boxes.length, i18n.t.redact.boxes)}
				</p>
				<div class="buttons">
					<button class="btn" onclick={() => (boxes = boxes.slice(0, -1))} disabled={!boxes.length}>
						<Icon name="undo" size={18} />
						{i18n.t.redact.undo}
					</button>
					<button
						class="btn btn-ghost"
						onclick={() => (boxes = boxes.filter((b) => b.page !== page - 1))}
						disabled={!pageBoxes.length}
					>
						<Icon name="trash" size={18} />
						{i18n.t.redact.clearPage}
					</button>
				</div>
				<div class="field">
					<span class="field-label">{i18n.t.redact.color}</span>
					<div class="segmented">
						<label
							><input type="radio" value="#000000" bind:group={fill} /><span
								>{i18n.t.redact.black}</span
							></label
						>
						<label
							><input type="radio" value="#ffffff" bind:group={fill} /><span
								>{i18n.t.redact.white}</span
							></label
						>
					</div>
				</div>
			{/snippet}
			{#snippet action()}
				<button
					class="btn btn-primary btn-lg"
					onclick={submit}
					disabled={tool.busy || !boxes.length}
				>
					<Icon name="redact" size={20} />
					{i18n.t.redact.action}
				</button>
				<button class="btn btn-ghost" onclick={() => tool.reset()}>{i18n.t.common.startOver}</button
				>
			{/snippet}
		</Workspace>
	{/if}
</ToolShell>

<style>
	.hint {
		margin-bottom: 14px;
		color: var(--ink-2);
		max-width: 70ch;
	}

	.draw-layer {
		position: absolute;
		inset: 0;
		cursor: crosshair;
		touch-action: none;
	}

	.box {
		position: absolute;
		background: #000;
	}

	.box.white {
		background: #fff;
		outline: 1px dashed var(--stamp);
	}

	.box.draft {
		background: rgb(0 0 0 / 0.55);
		outline: 1px solid var(--stamp);
	}

	.remove {
		position: absolute;
		top: -10px;
		right: -10px;
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: var(--stamp);
		color: #fff;
		cursor: pointer;
		opacity: 0;
	}

	.box:hover .remove,
	.remove:focus-visible {
		opacity: 1;
	}

	@media (hover: none) {
		.remove {
			opacity: 1;
		}
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

	.count {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 650;
	}

	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
</style>
