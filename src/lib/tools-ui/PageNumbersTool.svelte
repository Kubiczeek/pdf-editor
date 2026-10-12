<script lang="ts">
	import type { ToolProps } from '#lib/tools/registry.ts';
	import { useI18n, fmt } from '#lib/i18n/index.ts';
	import { outputName, toBlob } from '#lib/pdf/files.ts';
	import {
		cssFontFamily,
		loadCssFont,
		ensureFontFaces,
		fontFamily,
		type FontFamilyId
	} from '#lib/pdf/fonts.ts';
	import { addPageNumbers, type NumberPosition } from '#lib/pdf/ops/stamp.ts';
	import { SinglePdfTool } from './single.svelte.ts';
	import { toInput } from './shared.ts';
	import ToolShell from '#lib/components/ToolShell.svelte';
	import Workspace from '#lib/components/Workspace.svelte';
	import PagePreview from '#lib/components/PagePreview.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let _props: ToolProps = $props();
	const i18n = useI18n();
	const tool = new SinglePdfTool(() => i18n.t);

	let position = $state<NumberPosition>('bottom-center');
	let formatKey = $state<'formatPlain' | 'formatPage' | 'formatOf' | 'formatPageOf'>('formatPlain');
	let start = $state(1);
	let firstPage = $state(1);
	let lastPage = $state(1);
	let margin = $state(28);
	let size = $state(11);
	let font = $state<FontFamilyId>('sans');
	let bold = $state(false);
	let color = $state('#16213a');
	let previewPage = $state(1);
	let fontReady = $state(0);

	const pageCount = $derived(tool.pdf?.pageCount ?? 0);
	const template = $derived(i18n.t.pageNumbers[formatKey]);

	$effect(() => {
		const count = tool.pdf?.pageCount ?? 0;
		firstPage = 1;
		lastPage = Math.max(1, count);
		previewPage = 1;
	});

	$effect(() => {
		ensureFontFaces();
		loadCssFont({ family: font, bold, italic: false }).then(() => fontReady++);
	});

	const first = $derived(Math.min(Math.max(1, Math.floor(firstPage) || 1), pageCount || 1));
	const last = $derived(Math.max(first, Math.min(pageCount || 1, Math.floor(lastPage) || 1)));

	function labelFor(page: number): string | null {
		if (page < first || page > last) return null;
		const total = last - first + start;
		return template
			.replaceAll('{n}', String(start + page - first))
			.replaceAll('{total}', String(total));
	}

	function measure(text: string): number {
		void fontReady;
		const ctx = document.createElement('canvas').getContext('2d');
		if (!ctx) return text.length * size * 0.5;
		ctx.font = `${bold ? 700 : 400} ${size}px ${cssFontFamily(font)}`;
		return ctx.measureText(text).width;
	}

	const formatKeys = ['formatPlain', 'formatPage', 'formatOf', 'formatPageOf'] as const;
	const positions: NumberPosition[] = [
		'top-left',
		'top-center',
		'top-right',
		'bottom-left',
		'bottom-center',
		'bottom-right'
	];

	async function submit() {
		const options = {
			position,
			template,
			start: Math.floor(start) || 1,
			firstPage: first - 1,
			lastPage: last - 1,
			margin,
			size,
			font,
			bold,
			color
		};
		await tool.run(async (pdf, onProgress) => {
			const bytes = await addPageNumbers(toInput(pdf), options, onProgress);
			return [{ name: outputName(pdf.name, 'numbered'), blob: toBlob(bytes) }];
		});
	}
</script>

<ToolShell {tool} next={['compress', 'protect', 'merge']}>
	{#if tool.pdf}
		<Workspace busy={tool.busy} progress={tool.progress}>
			{#snippet main()}
				<PagePreview doc={tool.pdf!.doc} pageNumber={previewPage} maxWidth={560} maxHeight={720}>
					{#snippet overlay(geo)}
						{@const label = labelFor(previewPage)}
						{#if label}
							{@const width = measure(label)}
							{@const metrics = fontFamily(font)}
							{@const [vertical, horizontal] = position.split('-')}
							{@const x =
								horizontal === 'left'
									? margin
									: horizontal === 'right'
										? geo.width - margin - width
										: (geo.width - width) / 2}
							{@const baseline =
								vertical === 'top'
									? margin + metrics.ascent * size
									: geo.height - margin - metrics.descent * size}
							<span
								class="num"
								style:left={`${x * geo.scale}px`}
								style:top={`${(baseline - metrics.ascent * size) * geo.scale}px`}
								style:font-family={cssFontFamily(font)}
								style:font-weight={bold ? 700 : 400}
								style:font-size={`${size * geo.scale}px`}
								style:line-height={metrics.ascent + metrics.descent}
								style:color>{label}</span
							>
						{/if}
					{/snippet}
				</PagePreview>
				{#if pageCount > 1}
					<div class="pager">
						<button
							class="icon-btn"
							onclick={() => (previewPage = Math.max(1, previewPage - 1))}
							disabled={previewPage <= 1}
							aria-label={i18n.t.crop.prev}
						>
							<Icon name="chevronLeft" size={18} />
						</button>
						<span>{fmt(i18n.t.common.pageOf, { n: previewPage, total: pageCount })}</span>
						<button
							class="icon-btn"
							onclick={() => (previewPage = Math.min(pageCount, previewPage + 1))}
							disabled={previewPage >= pageCount}
							aria-label={i18n.t.crop.next}
						>
							<Icon name="chevronRight" size={18} />
						</button>
					</div>
				{/if}
			{/snippet}
			{#snippet side()}
				<div class="field">
					<span class="field-label">{i18n.t.common.position}</span>
					<div class="positions">
						{#each positions as value (value)}
							<label
								class="pos"
								class:bottom={value.startsWith('bottom')}
								title={i18n.t.pageNumbers.positions[value]}
							>
								<input
									type="radio"
									name="pn-pos"
									{value}
									bind:group={position}
									aria-label={i18n.t.pageNumbers.positions[value]}
								/>
								<span></span>
							</label>
						{/each}
					</div>
				</div>
				<label class="field">
					<span>{i18n.t.pageNumbers.format}</span>
					<select class="select" bind:value={formatKey}>
						{#each formatKeys as key (key)}
							<option value={key}
								>{i18n.t.pageNumbers[key]
									.replace('{n}', '1')
									.replace('{total}', String(pageCount))}</option
							>
						{/each}
					</select>
				</label>
				<div class="row">
					<label class="field">
						<span>{i18n.t.pageNumbers.firstPage}</span>
						<input class="input" type="number" min="1" max={pageCount} bind:value={firstPage} />
					</label>
					<label class="field">
						<span>{i18n.t.pageNumbers.lastPage}</span>
						<input class="input" type="number" min="1" max={pageCount} bind:value={lastPage} />
					</label>
				</div>
				<label class="field">
					<span>{i18n.t.pageNumbers.start}</span>
					<input class="input" type="number" min="0" bind:value={start} />
				</label>
				<div class="row">
					<label class="field grow">
						<span>{i18n.t.common.font}</span>
						<select class="select" bind:value={font}>
							<option value="sans">Noto Sans</option>
							<option value="serif">Noto Serif</option>
							<option value="mono">Noto Sans Mono</option>
						</select>
					</label>
					<label class="field">
						<span>{i18n.t.common.color}</span>
						<input type="color" bind:value={color} />
					</label>
				</div>
				<label class="check"
					><input type="checkbox" bind:checked={bold} /><span>{i18n.t.common.bold}</span></label
				>
				<label class="field">
					<span>{i18n.t.common.size} · {size} pt</span>
					<input type="range" min="6" max="36" step="1" bind:value={size} />
				</label>
				<label class="field">
					<span>{i18n.t.common.margin} · {margin} pt</span>
					<input type="range" min="8" max="96" step="2" bind:value={margin} />
				</label>
			{/snippet}
			{#snippet action()}
				<button class="btn btn-primary btn-lg" onclick={submit} disabled={tool.busy}>
					<Icon name="hash" size={20} />
					{i18n.t.pageNumbers.action}
				</button>
				<button class="btn btn-ghost" onclick={() => tool.reset()}>{i18n.t.common.startOver}</button
				>
			{/snippet}
		</Workspace>
	{/if}
</ToolShell>

<style>
	.num {
		position: absolute;
		white-space: pre;
		font-kerning: none;
		pointer-events: none;
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

	.positions {
		display: grid;
		grid-template-columns: repeat(3, 40px);
		grid-template-rows: 26px 26px;
		row-gap: 34px;
		column-gap: 6px;
		padding: 10px;
		width: max-content;
		border-radius: 6px;
		background: var(--paper);
		border: 1px solid var(--line-strong);
	}

	.pos {
		position: relative;
		cursor: pointer;
	}

	.pos input {
		position: absolute;
		opacity: 0;
	}

	.pos span {
		display: block;
		height: 26px;
		border-radius: 4px;
		background: var(--desk);
	}

	.pos input:checked + span {
		background: var(--royal);
	}

	.pos input:focus-visible + span {
		box-shadow: var(--focus);
	}

	.row {
		display: flex;
		gap: 12px;
		align-items: flex-end;
	}

	.row .field {
		flex: 1;
	}

	.grow {
		flex: 1;
	}
</style>
