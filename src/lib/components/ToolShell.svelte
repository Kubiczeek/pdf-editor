<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { useI18n, fmt } from '#lib/i18n/index.ts';
	import type { ToolId } from '#lib/tools/registry.ts';
	import type { SinglePdfTool } from '#lib/tools-ui/single.svelte.ts';
	import FileDrop from './FileDrop.svelte';
	import ResultPanel from './ResultPanel.svelte';
	import Notice from './Notice.svelte';

	let {
		tool,
		children,
		next = [],
		zipName,
		resultExtra
	}: {
		tool: SinglePdfTool;
		children: Snippet;
		next?: ToolId[];
		zipName?: string;
		resultExtra?: Snippet;
	} = $props();

	const i18n = useI18n();

	onMount(() => {
		tool.pickupHandoff();
		return () => {
			void tool.close();
		};
	});
</script>

{#if tool.result}
	<ResultPanel
		files={tool.result}
		note={tool.resultNote}
		onreset={() => tool.reset()}
		{next}
		{zipName}
		extra={resultExtra}
	/>
{:else if tool.pdf}
	<div class="stack">
		{#if tool.error}
			<Notice kind="error" ondismiss={() => (tool.error = null)}>{tool.error}</Notice>
		{/if}
		{@render children()}
	</div>
{:else}
	<div class="stack">
		{#if tool.opening}
			<div class="opening" role="status">
				<span class="spinner" aria-hidden="true"></span>
				{fmt(i18n.t.common.loadingFile, { name: tool.opening })}
			</div>
		{:else}
			<FileDrop accepts="pdf" onfiles={(files) => tool.open(files)} />
		{/if}
		{#if tool.error}
			<Notice kind="error" ondismiss={() => (tool.error = null)}>{tool.error}</Notice>
		{/if}
	</div>
{/if}
