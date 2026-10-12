<script lang="ts">
	import type { ToolProps } from '#lib/tools/registry.ts';
	import { useI18n, plural } from '#lib/i18n/index.ts';
	import { outputName, toBlob } from '#lib/pdf/files.ts';
	import { flattenPdf } from '#lib/pdf/ops/document.ts';
	import { SinglePdfTool } from './single.svelte.ts';
	import { toInput } from './shared.ts';
	import ToolShell from '#lib/components/ToolShell.svelte';
	import Workspace from '#lib/components/Workspace.svelte';
	import PageThumb from '#lib/components/PageThumb.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let _props: ToolProps = $props();
	const i18n = useI18n();
	const tool = new SinglePdfTool(() => i18n.t);

	let forms = $state(true);
	let annotations = $state(true);

	async function submit() {
		if (!forms && !annotations) return tool.fail(i18n.t.flatten.pickOne);
		const options = { forms, annotations };
		await tool.run(async (pdf) => {
			const { bytes, count } = await flattenPdf(toInput(pdf), options);
			tool.resultNote = count
				? plural(i18n.lang, count, i18n.t.flatten.result)
				: i18n.t.flatten.nothing;
			return [{ name: outputName(pdf.name, 'flattened'), blob: toBlob(bytes) }];
		});
	}
</script>

<ToolShell {tool} next={['protect', 'compress', 'merge']}>
	{#if tool.pdf}
		<Workspace busy={tool.busy} progress={tool.progress}>
			{#snippet main()}
				<div class="doc">
					<div class="cover"><PageThumb doc={tool.pdf!.doc} pageNumber={1} width={200} /></div>
					<div>
						<p class="name">{tool.pdf!.name}</p>
						<p class="muted">{plural(i18n.lang, tool.pdf!.pageCount, i18n.t.common.pages)}</p>
					</div>
				</div>
			{/snippet}
			{#snippet side()}
				<label class="option">
					<input type="checkbox" bind:checked={forms} />
					<span
						><strong>{i18n.t.flatten.forms}</strong><small>{i18n.t.flatten.formsHint}</small></span
					>
				</label>
				<label class="option">
					<input type="checkbox" bind:checked={annotations} />
					<span
						><strong>{i18n.t.flatten.annotations}</strong><small
							>{i18n.t.flatten.annotationsHint}</small
						></span
					>
				</label>
			{/snippet}
			{#snippet action()}
				<button
					class="btn btn-primary btn-lg"
					onclick={submit}
					disabled={tool.busy || (!forms && !annotations)}
				>
					<Icon name="layers" size={20} />
					{i18n.t.flatten.action}
				</button>
				<button class="btn btn-ghost" onclick={() => tool.reset()}>{i18n.t.common.startOver}</button
				>
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
		width: 180px;
		box-shadow: var(--shadow-sheet);
	}

	.name {
		font-weight: 700;
		font-size: 1.1rem;
		overflow-wrap: anywhere;
	}

	.muted {
		color: var(--ink-3);
	}

	.option {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding: 12px;
		border: 1px solid var(--line);
		border-radius: var(--radius-m);
		cursor: pointer;
	}

	.option input {
		width: 20px;
		height: 20px;
		margin-top: 2px;
		accent-color: var(--royal);
		flex: none;
	}

	.option strong {
		display: block;
	}

	.option small {
		display: block;
		color: var(--ink-2);
		line-height: 1.35;
	}
</style>
