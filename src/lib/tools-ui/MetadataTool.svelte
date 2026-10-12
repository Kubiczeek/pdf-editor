<script lang="ts">
	import type { ToolProps } from '#lib/tools/registry.ts';
	import { useI18n, BCP47 } from '#lib/i18n/index.ts';
	import { outputName, toBlob } from '#lib/pdf/files.ts';
	import { readMetadata, writeMetadata, type PdfMetadata } from '#lib/pdf/ops/document.ts';
	import { SinglePdfTool } from './single.svelte.ts';
	import { toInput, describeError } from './shared.ts';
	import ToolShell from '#lib/components/ToolShell.svelte';
	import Workspace from '#lib/components/Workspace.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let _props: ToolProps = $props();
	const i18n = useI18n();
	const tool = new SinglePdfTool(() => i18n.t);

	let meta = $state<PdfMetadata | null>(null);
	let title = $state('');
	let author = $state('');
	let subject = $state('');
	let keywords = $state('');
	let creator = $state('');
	let clearAll = $state(false);

	$effect(() => {
		const pdf = tool.pdf;
		meta = null;
		if (!pdf) return;
		let cancelled = false;
		readMetadata(toInput(pdf)).then(
			(value) => {
				if (cancelled) return;
				meta = value;
				title = value.title;
				author = value.author;
				subject = value.subject;
				keywords = value.keywords;
				creator = value.creator;
				clearAll = false;
			},
			(error) => !cancelled && tool.fail(describeError(i18n.t, error))
		);
		return () => {
			cancelled = true;
		};
	});

	function formatDate(date: Date | null): string {
		if (!date || Number.isNaN(date.getTime())) return i18n.t.metadata.unknown;
		return new Intl.DateTimeFormat(BCP47[i18n.lang], {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(date);
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		const update = { title, author, subject, keywords, creator, clearAll };
		await tool.run(async (pdf) => {
			const bytes = await writeMetadata(toInput(pdf), update);
			return [{ name: outputName(pdf.name, clearAll ? 'clean' : 'metadata'), blob: toBlob(bytes) }];
		});
	}
</script>

<ToolShell {tool} next={['protect', 'compress']}>
	{#if tool.pdf}
		<form onsubmit={submit}>
			<Workspace busy={tool.busy || !meta} progress={tool.progress}>
				{#snippet main()}
					<fieldset class="grid" disabled={clearAll}>
						<label class="field wide">
							<span>{i18n.t.metadata.title}</span>
							<input class="input" bind:value={title} />
						</label>
						<label class="field">
							<span>{i18n.t.metadata.author}</span>
							<input class="input" bind:value={author} />
						</label>
						<label class="field">
							<span>{i18n.t.metadata.subject}</span>
							<input class="input" bind:value={subject} />
						</label>
						<label class="field wide">
							<span>{i18n.t.metadata.keywords}</span>
							<input class="input" bind:value={keywords} />
							<small class="muted">{i18n.t.metadata.keywordsHint}</small>
						</label>
						<label class="field">
							<span>{i18n.t.metadata.creator}</span>
							<input class="input" bind:value={creator} />
						</label>
						<div class="field">
							<span class="field-label">{i18n.t.metadata.producer}</span>
							<p class="readonly">{meta?.producer || i18n.t.metadata.unknown}</p>
						</div>
						<div class="field">
							<span class="field-label">{i18n.t.metadata.created}</span>
							<p class="readonly">{formatDate(meta?.creationDate ?? null)}</p>
						</div>
						<div class="field">
							<span class="field-label">{i18n.t.metadata.modified}</span>
							<p class="readonly">{formatDate(meta?.modificationDate ?? null)}</p>
						</div>
					</fieldset>
				{/snippet}
				{#snippet side()}
					<p class="name"><Icon name="file" size={18} /> {tool.pdf!.name}</p>
					<label class="option">
						<input type="checkbox" bind:checked={clearAll} />
						<span
							><strong>{i18n.t.metadata.clearAll}</strong><small
								>{i18n.t.metadata.clearAllHint}</small
							></span
						>
					</label>
				{/snippet}
				{#snippet action()}
					<button type="submit" class="btn btn-primary btn-lg" disabled={tool.busy || !meta}>
						<Icon name="tag" size={20} />
						{i18n.t.metadata.action}
					</button>
					<button type="button" class="btn btn-ghost" onclick={() => tool.reset()}
						>{i18n.t.common.startOver}</button
					>
				{/snippet}
			</Workspace>
		</form>
	{/if}
</ToolShell>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 18px;
		border: none;
		margin: 0;
		padding: 0;
	}

	.grid:disabled {
		opacity: 0.5;
	}

	.wide {
		grid-column: 1 / -1;
	}

	.readonly {
		min-height: 42px;
		padding: 0.5em 0;
		color: var(--ink-2);
		overflow-wrap: anywhere;
	}

	.muted {
		color: var(--ink-3);
	}

	.name {
		display: flex;
		gap: 8px;
		align-items: flex-start;
		font-weight: 650;
		overflow-wrap: anywhere;
	}

	.name :global(svg) {
		flex: none;
		margin-top: 3px;
		color: var(--royal);
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
		accent-color: var(--stamp);
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

	@media (max-width: 600px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
