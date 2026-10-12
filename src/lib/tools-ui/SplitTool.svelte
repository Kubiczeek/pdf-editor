<script lang="ts">
	import type { ToolProps } from '#lib/tools/registry.ts';
	import { useI18n, fmt, plural } from '#lib/i18n/index.ts';
	import { parseRanges, chunkPages, formatPageSet } from '#lib/pdf/ranges.ts';
	import { outputName, toBlob, baseName } from '#lib/pdf/files.ts';
	import { extractGroups } from '#lib/pdf/ops/pages.ts';
	import { SinglePdfTool } from './single.svelte.ts';
	import { toInput } from './shared.ts';
	import ToolShell from '#lib/components/ToolShell.svelte';
	import Workspace from '#lib/components/Workspace.svelte';
	import PagePicker from '#lib/components/PagePicker.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let _props: ToolProps = $props();
	const i18n = useI18n();
	const tool = new SinglePdfTool(() => i18n.t);

	let mode = $state<'ranges' | 'every' | 'all'>('ranges');
	let rangesText = $state('');
	let every = $state(2);

	const pageCount = $derived(tool.pdf?.pageCount ?? 0);

	$effect(() => {
		// Suggest a sensible first split for a newly opened file.
		const count = tool.pdf?.pageCount ?? 0;
		if (count) {
			const half = Math.ceil(count / 2);
			const span = (a: number, b: number) => (a === b ? `${a}` : `${a}-${b}`);
			rangesText = count > 1 ? `${span(1, half)}, ${span(half + 1, count)}` : '1';
		}
	});

	const groups = $derived.by<number[][] | null>(() => {
		if (!pageCount) return null;
		if (mode === 'all') return chunkPages(pageCount, 1);
		if (mode === 'every') {
			const n = Math.floor(Number(every));
			return n >= 1 ? chunkPages(pageCount, n) : null;
		}
		return parseRanges(rangesText, pageCount);
	});

	/** Colour band per output file, shown under each page. */
	const PALETTE = [
		'#1f35c4',
		'#c2185b',
		'#2e7d32',
		'#e0a100',
		'#6a5acd',
		'#00838f',
		'#d84315',
		'#455a64'
	];
	const groupOfPage = $derived.by(() => {
		const map = new Map<number, number>();
		groups?.forEach((group, g) => group.forEach((page) => !map.has(page) && map.set(page, g)));
		return map;
	});

	async function submit() {
		if (!groups?.length) return;
		const current = groups;
		await tool.run(async (pdf, onProgress) => {
			const outputs = await extractGroups(toInput(pdf), current, onProgress);
			return outputs.map((bytes, g) => {
				const pages = current[g];
				const label =
					pages.length === 1
						? `page-${pages[0] + 1}`
						: `pages-${formatPageSet(pages).replace(/,\s*/g, '_')}`;
				return { name: outputName(pdf.name, label), blob: toBlob(bytes) };
			});
		});
	}
</script>

<ToolShell
	{tool}
	next={['merge', 'compress']}
	zipName={`${baseName(tool.pdf?.name ?? 'document')}-split.zip`}
>
	{#if tool.pdf}
		<Workspace busy={tool.busy} progress={tool.progress}>
			{#snippet main()}
				<PagePicker doc={tool.pdf!.doc} {pageCount} selectable={false} size={130}>
					{#snippet badge(index)}
						{#if groupOfPage.has(index)}
							<span
								class="band"
								style:background={PALETTE[groupOfPage.get(index)! % PALETTE.length]}
							>
								{groupOfPage.get(index)! + 1}
							</span>
						{/if}
					{/snippet}
				</PagePicker>
			{/snippet}
			{#snippet side()}
				<fieldset class="field">
					<legend class="field-label">{i18n.t.split.mode}</legend>
					<div class="modes">
						{#each [['ranges', i18n.t.split.modeRanges], ['every', i18n.t.split.modeEvery], ['all', i18n.t.split.modeAll]] as [value, label] (value)}
							<label class="mode" class:active={mode === value}>
								<input type="radio" name="split-mode" {value} bind:group={mode} />
								<span>{label}</span>
							</label>
						{/each}
					</div>
				</fieldset>
				{#if mode === 'ranges'}
					<label class="field">
						<span>{i18n.t.common.pageRanges}</span>
						<input
							class="input"
							bind:value={rangesText}
							aria-invalid={!groups}
							placeholder="1-3, 4-6"
						/>
						<small class="muted">{i18n.t.split.rangesHint}</small>
						{#if !groups && rangesText.trim()}
							<small class="error">{fmt(i18n.t.common.rangesInvalid, { n: pageCount })}</small>
						{/if}
					</label>
				{:else if mode === 'every'}
					<label class="field">
						<span>{i18n.t.split.everyLabel}</span>
						<input class="input" type="number" min="1" max={pageCount} bind:value={every} />
					</label>
				{/if}
				{#if groups}
					<p class="summary">
						<Icon name="files" size={18} />
						{plural(i18n.lang, groups.length, i18n.t.split.willCreate)}
					</p>
				{/if}
			{/snippet}
			{#snippet action()}
				<button
					class="btn btn-primary btn-lg"
					onclick={submit}
					disabled={tool.busy || !groups?.length}
				>
					<Icon name="scissors" size={20} />
					{i18n.t.split.action}
				</button>
				<button class="btn btn-ghost" onclick={() => tool.reset()}>{i18n.t.common.startOver}</button
				>
			{/snippet}
		</Workspace>
	{/if}
</ToolShell>

<style>
	fieldset {
		border: none;
		margin: 0;
		padding: 0;
	}

	.modes {
		display: grid;
		gap: 6px;
		margin-top: 6px;
	}

	.mode {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border: 1px solid var(--line);
		border-radius: var(--radius-m);
		cursor: pointer;
		font-weight: 600;
	}

	.mode.active {
		border-color: var(--royal);
		background: var(--royal-tint);
	}

	.mode input {
		accent-color: var(--royal);
	}

	.band {
		display: inline-grid;
		place-items: center;
		min-width: 20px;
		height: 20px;
		padding: 0 6px;
		border-radius: 99px;
		color: #fff;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.summary {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 650;
	}

	.muted {
		color: var(--ink-3);
	}

	.error {
		color: var(--stamp);
	}
</style>
