<script lang="ts">
	import type { ToolProps } from '#lib/tools/registry.ts';
	import { useI18n, fmt, plural, formatNumber } from '#lib/i18n/index.ts';
	import { downloadBlob, outputName } from '#lib/pdf/files.ts';
	import { extractText } from '#lib/pdf/ops/raster.ts';
	import { SinglePdfTool } from './single.svelte.ts';
	import { toInput } from './shared.ts';
	import ToolShell from '#lib/components/ToolShell.svelte';
	import Workspace from '#lib/components/Workspace.svelte';
	import Notice from '#lib/components/Notice.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let _props: ToolProps = $props();
	const i18n = useI18n();
	const tool = new SinglePdfTool(() => i18n.t);

	let text = $state<string | null>(null);
	let copied = $state(false);

	$effect(() => {
		void tool.pdf;
		text = null;
	});

	async function extract() {
		await tool.run(async (pdf, onProgress) => {
			const pages = await extractText(toInput(pdf), onProgress);
			text = pages
				.map((page, i) =>
					pages.length > 1 ? `— ${fmt(i18n.t.common.page, { n: i + 1 })} —\n${page}` : page
				)
				.join('\n\n')
				.trim();
		});
	}

	async function copy() {
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			const area = document.querySelector<HTMLTextAreaElement>('#extracted-text');
			area?.select();
			document.execCommand('copy');
		}
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function download() {
		if (!text || !tool.pdf) return;
		downloadBlob(
			new Blob([text], { type: 'text/plain;charset=utf-8' }),
			outputName(tool.pdf.name, '', 'txt'),
			'text/plain'
		);
	}
</script>

<ToolShell {tool}>
	{#if tool.pdf}
		<Workspace busy={tool.busy} progress={tool.progress}>
			{#snippet main()}
				{#if text === null}
					<div class="intro">
						<Icon name="fileText" size={40} strokeWidth={1.4} />
						<p class="name">{tool.pdf!.name}</p>
						<p class="muted">{plural(i18n.lang, tool.pdf!.pageCount, i18n.t.common.pages)}</p>
					</div>
				{:else if !text}
					<Notice>{i18n.t.toText.empty}</Notice>
				{:else}
					<textarea id="extracted-text" class="textarea output" readonly value={text}></textarea>
					<p class="muted">
						{fmt(i18n.t.toText.chars, { n: formatNumber(i18n.lang, text.length) })}
					</p>
				{/if}
			{/snippet}
			{#snippet action()}
				{#if text}
					<button class="btn btn-primary btn-lg" onclick={copy}>
						<Icon name={copied ? 'check' : 'copy'} size={20} />
						{copied ? i18n.t.toText.copied : i18n.t.toText.copy}
					</button>
					<button class="btn" onclick={download}>
						<Icon name="download" size={18} />
						{i18n.t.toText.downloadTxt}
					</button>
				{:else}
					<button
						class="btn btn-primary btn-lg"
						onclick={extract}
						disabled={tool.busy || text !== null}
					>
						<Icon name="fileText" size={20} />
						{i18n.t.toText.action}
					</button>
				{/if}
				<button class="btn btn-ghost" onclick={() => tool.reset()}>{i18n.t.common.startOver}</button
				>
			{/snippet}
		</Workspace>
	{/if}
</ToolShell>

<style>
	.intro {
		display: grid;
		justify-items: center;
		gap: 8px;
		padding: 48px 16px;
		text-align: center;
		color: var(--ink-2);
	}

	.name {
		font-weight: 700;
		color: var(--ink);
		overflow-wrap: anywhere;
	}

	.muted {
		color: var(--ink-3);
		margin-top: 8px;
	}

	.output {
		min-height: 420px;
		font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
		font-size: 0.92rem;
		white-space: pre-wrap;
	}
</style>
