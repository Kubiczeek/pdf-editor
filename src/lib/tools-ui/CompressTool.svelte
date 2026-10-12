<script lang="ts">
	import type { ToolProps } from '#lib/tools/registry.ts';
	import { useI18n, fmt, plural, formatBytes, formatNumber } from '#lib/i18n/index.ts';
	import { outputName, toBlob } from '#lib/pdf/files.ts';
	import { compressPdf, type CompressLevel } from '#lib/pdf/ops/compress.ts';
	import { SinglePdfTool } from './single.svelte.ts';
	import { toInput } from './shared.ts';
	import ToolShell from '#lib/components/ToolShell.svelte';
	import Workspace from '#lib/components/Workspace.svelte';
	import PageThumb from '#lib/components/PageThumb.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let _props: ToolProps = $props();
	const i18n = useI18n();
	const tool = new SinglePdfTool(() => i18n.t);

	let level = $state<CompressLevel>('medium');
	let stats = $state<{ before: number; after: number; unchanged: boolean } | null>(null);

	const levels = $derived<Array<{ id: CompressLevel; label: string; desc: string }>>([
		{ id: 'low', label: i18n.t.compress.low, desc: i18n.t.compress.lowDesc },
		{ id: 'medium', label: i18n.t.compress.medium, desc: i18n.t.compress.mediumDesc },
		{ id: 'high', label: i18n.t.compress.high, desc: i18n.t.compress.highDesc },
		{ id: 'extreme', label: i18n.t.compress.extreme, desc: i18n.t.compress.extremeDesc }
	]);

	async function submit() {
		const chosen = level;
		await tool.run(async (pdf, onProgress) => {
			const result = await compressPdf(toInput(pdf), chosen, onProgress);
			stats = { before: result.originalSize, after: result.bytes.length, unchanged: result.unchanged };
			tool.resultNote = result.unchanged ? i18n.t.compress.unchanged : undefined;
			return [{ name: outputName(pdf.name, 'compressed'), blob: toBlob(result.bytes) }];
		});
	}

	const saved = $derived(stats && !stats.unchanged ? Math.max(0, (1 - stats.after / stats.before) * 100) : 0);
</script>

<ToolShell {tool} next={['merge', 'protect', 'split']}>
	{#snippet resultExtra()}
		{#if stats && !stats.unchanged}
			<div class="saving">
				<span class="sizes">{fmt(i18n.t.common.sizeChange, { before: formatBytes(i18n.lang, stats.before), after: formatBytes(i18n.lang, stats.after) })}</span>
				<span class="pct">{fmt(i18n.t.compress.saved, { p: formatNumber(i18n.lang, saved, saved < 10 ? 1 : 0) })}</span>
				<span class="meter" aria-hidden="true"><span style:width={`${Math.max(2, 100 - saved)}%`}></span></span>
			</div>
		{/if}
	{/snippet}
	{#if tool.pdf}
		<Workspace busy={tool.busy} progress={tool.progress}>
			{#snippet main()}
				<div class="doc">
					<div class="cover"><PageThumb doc={tool.pdf!.doc} pageNumber={1} width={220} /></div>
					<div>
						<p class="name">{tool.pdf!.name}</p>
						<p class="muted">
							{plural(i18n.lang, tool.pdf!.pageCount, i18n.t.common.pages)} · {formatBytes(i18n.lang, tool.pdf!.size)}
						</p>
					</div>
				</div>
			{/snippet}
			{#snippet side()}
				<fieldset>
					<legend class="field-label">{i18n.t.compress.level}</legend>
					<div class="levels">
						{#each levels as option (option.id)}
							<label class="level" class:active={level === option.id}>
								<input type="radio" name="level" value={option.id} bind:group={level} />
								<span>
									<strong>{option.label}</strong>
									<small>{option.desc}</small>
								</span>
							</label>
						{/each}
					</div>
				</fieldset>
			{/snippet}
			{#snippet action()}
				<button class="btn btn-primary btn-lg" onclick={submit} disabled={tool.busy}>
					<Icon name="compress" size={20} />
					{i18n.t.compress.action}
				</button>
				<button class="btn btn-ghost" onclick={() => tool.reset()}>{i18n.t.common.startOver}</button>
			{/snippet}
		</Workspace>
	{/if}
</ToolShell>

<style>
	.doc {
		display: flex;
		gap: 24px;
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.cover {
		width: 200px;
		box-shadow: var(--shadow-sheet);
	}

	.name {
		font-weight: 700;
		font-size: 1.15rem;
		overflow-wrap: anywhere;
	}

	.muted {
		color: var(--ink-2);
	}

	fieldset {
		border: none;
		padding: 0;
		margin: 0;
	}

	.levels {
		display: grid;
		gap: 8px;
		margin-top: 8px;
	}

	.level {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding: 12px;
		border: 1px solid var(--line);
		border-radius: var(--radius-m);
		cursor: pointer;
	}

	.level.active {
		border-color: var(--royal);
		background: var(--royal-tint);
	}

	.level input {
		margin-top: 4px;
		accent-color: var(--royal);
	}

	.level strong {
		display: block;
	}

	.level small {
		display: block;
		color: var(--ink-2);
		line-height: 1.35;
	}

	.saving {
		display: grid;
		gap: 8px;
		padding: 16px;
		border-radius: var(--radius-m);
		background: var(--ok-tint);
	}

	.sizes {
		font-weight: 650;
		font-variant-numeric: tabular-nums;
	}

	.pct {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 750;
		color: var(--ok);
		line-height: 1;
	}

	.meter {
		height: 8px;
		border-radius: 99px;
		background: #c9e6d4;
		overflow: hidden;
	}

	.meter span {
		display: block;
		height: 100%;
		background: var(--ok);
	}
</style>
