<script lang="ts">
	import type { ToolProps } from '#lib/tools/registry.ts';
	import { useI18n, plural } from '#lib/i18n/index.ts';
	import { outputName, toBlob } from '#lib/pdf/files.ts';
	import { unlockPdf } from '#lib/pdf/ops/document.ts';
	import { isEncrypted } from '#lib/pdf/pdflib.ts';
	import { SinglePdfTool } from './single.svelte.ts';
	import { toInput } from './shared.ts';
	import ToolShell from '#lib/components/ToolShell.svelte';
	import Workspace from '#lib/components/Workspace.svelte';
	import PageThumb from '#lib/components/PageThumb.svelte';
	import Notice from '#lib/components/Notice.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let _props: ToolProps = $props();
	const i18n = useI18n();
	const tool = new SinglePdfTool(() => i18n.t);

	let encrypted = $state<boolean | null>(null);

	$effect(() => {
		const pdf = tool.pdf;
		encrypted = null;
		if (!pdf) return;
		let cancelled = false;
		isEncrypted(pdf.bytes).then(
			(value) => !cancelled && (encrypted = value),
			() => !cancelled && (encrypted = true)
		);
		return () => {
			cancelled = true;
		};
	});

	async function submit() {
		await tool.run(async (pdf) => {
			const bytes = await unlockPdf(toInput(pdf));
			return [{ name: outputName(pdf.name, 'unlocked'), blob: toBlob(bytes) }];
		});
	}
</script>

<ToolShell {tool} next={['edit', 'compress', 'merge']}>
	{#if tool.pdf}
		<Workspace busy={tool.busy || encrypted === null} progress={tool.progress}>
			{#snippet main()}
				<div class="doc">
					<div class="cover"><PageThumb doc={tool.pdf!.doc} pageNumber={1} width={200} /></div>
					<div class="info">
						<p class="name">{tool.pdf!.name}</p>
						<p class="muted">{plural(i18n.lang, tool.pdf!.pageCount, i18n.t.common.pages)}</p>
						{#if encrypted === false}
							<Notice>{i18n.t.unlock.notEncrypted}</Notice>
						{:else if encrypted}
							<Notice kind="success">{i18n.t.unlock.ready}</Notice>
						{/if}
						<p class="muted small">{i18n.t.unlock.note}</p>
					</div>
				</div>
			{/snippet}
			{#snippet action()}
				<button class="btn btn-primary btn-lg" onclick={submit} disabled={tool.busy || !encrypted}>
					<Icon name="unlock" size={20} />
					{i18n.t.unlock.action}
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
		width: 180px;
		box-shadow: var(--shadow-sheet);
	}

	.info {
		display: grid;
		gap: 12px;
		flex: 1;
		min-width: 240px;
	}

	.name {
		font-weight: 700;
		font-size: 1.1rem;
		overflow-wrap: anywhere;
	}

	.muted {
		color: var(--ink-3);
	}

	.small {
		font-size: 0.9rem;
	}
</style>
