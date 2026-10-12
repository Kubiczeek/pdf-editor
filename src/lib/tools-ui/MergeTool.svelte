<script lang="ts">
	import { onMount } from 'svelte';
	import type { ToolProps } from '#lib/tools/registry.ts';
	import { useI18n, fmt, plural, formatBytes } from '#lib/i18n/index.ts';
	import { toBlob } from '#lib/pdf/files.ts';
	import { closePdf } from '#lib/pdf/pdfjs.ts';
	import { mergeDocuments } from '#lib/pdf/ops/pages.ts';
	import { takeHandoff } from '#lib/stores/handoff.ts';
	import { sortable, moveItem } from '#lib/actions/sortable.ts';
	import { openPdfFile, describeError, filterFiles, toInput, type LoadedPdf } from './shared.ts';
	import type { ResultFile } from '#lib/components/ResultPanel.svelte';
	import FileDrop from '#lib/components/FileDrop.svelte';
	import Workspace from '#lib/components/Workspace.svelte';
	import ResultPanel from '#lib/components/ResultPanel.svelte';
	import Notice from '#lib/components/Notice.svelte';
	import PageThumb from '#lib/components/PageThumb.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let _props: ToolProps = $props();
	const i18n = useI18n();

	let files = $state<LoadedPdf[]>([]);
	let opening = $state(0);
	let errors = $state<string[]>([]);
	let busy = $state(false);
	let progress = $state<number | null>(null);
	let result = $state<ResultFile[] | null>(null);

	const totalPages = $derived(files.reduce((sum, file) => sum + file.pageCount, 0));

	async function add(list: File[]) {
		const { ok, rejected } = filterFiles(list, 'pdf');
		errors = rejected.map((file) => fmt(i18n.t.errors.notPdf, { name: file.name }));
		opening += ok.length;
		for (const file of ok) {
			try {
				const loaded = await openPdfFile(file, i18n.t);
				files = [...files, loaded];
			} catch (error) {
				errors = [...errors, describeError(i18n.t, error)];
			} finally {
				opening--;
			}
		}
	}

	async function remove(id: string) {
		const file = files.find((f) => f.id === id);
		files = files.filter((f) => f.id !== id);
		if (file) await closePdf(file.doc);
	}

	function move(index: number, delta: number) {
		const to = index + delta;
		if (to < 0 || to >= files.length) return;
		files = moveItem(files, index, to);
	}

	function sortByName() {
		files = [...files].sort((a, b) => a.name.localeCompare(b.name, i18n.lang, { numeric: true }));
	}

	async function merge() {
		if (files.length < 2) {
			errors = [i18n.t.merge.needTwo];
			return;
		}
		busy = true;
		progress = 0;
		errors = [];
		try {
			const bytes = await mergeDocuments(files.map(toInput), (f) => (progress = f));
			result = [{ name: 'merged.pdf', blob: toBlob(bytes) }];
		} catch (error) {
			errors = [describeError(i18n.t, error)];
		} finally {
			busy = false;
			progress = null;
		}
	}

	async function reset() {
		result = null;
		errors = [];
		const old = files;
		files = [];
		await Promise.all(old.map((file) => closePdf(file.doc)));
	}

	onMount(() => {
		const handed = takeHandoff();
		if (handed) void add(handed);
		return () => {
			for (const file of files) void closePdf(file.doc);
		};
	});
</script>

{#if result}
	<ResultPanel files={result} onreset={reset} next={['compress', 'organize', 'page-numbers', 'protect']} />
{:else}
	<div class="stack">
		{#each errors as error, index (index)}
			<Notice kind="error" ondismiss={() => (errors = errors.filter((_, i) => i !== index))}>{error}</Notice>
		{/each}
		{#if files.length === 0 && opening === 0}
			<FileDrop accepts="pdf" multiple onfiles={add} />
		{:else}
			<Workspace {busy} {progress}>
				{#snippet toolbar()}
					<FileDrop accepts="pdf" multiple compact onfiles={add} buttonLabel={i18n.t.common.addMore} />
					<button class="btn btn-ghost" onclick={sortByName} disabled={files.length < 2}>
						<Icon name="sort" size={18} />
						{i18n.t.merge.sortName}
					</button>
				{/snippet}
				{#snippet main()}
					<p class="hint">{i18n.t.merge.hint}</p>
					<ol class="files" use:sortable={{ onReorder: (from, to) => (files = moveItem(files, from, to)) }}>
						{#each files as file, index (file.id)}
							<li data-sortable>
								<span class="grip" aria-hidden="true"><Icon name="grip" size={18} /></span>
								<span class="order">{index + 1}</span>
								<span class="preview"><PageThumb doc={file.doc} pageNumber={1} width={56} /></span>
								<span class="meta">
									<strong>{file.name}</strong>
									<small>
										{plural(i18n.lang, file.pageCount, i18n.t.common.pages)} · {formatBytes(i18n.lang, file.size)}
									</small>
								</span>
								<span class="buttons">
									<button class="icon-btn" onclick={() => move(index, -1)} disabled={index === 0} aria-label={i18n.t.common.moveUp}>
										<Icon name="chevronUp" size={18} />
									</button>
									<button
										class="icon-btn"
										onclick={() => move(index, 1)}
										disabled={index === files.length - 1}
										aria-label={i18n.t.common.moveDown}
									>
										<Icon name="chevronDown" size={18} />
									</button>
									<button class="icon-btn" onclick={() => remove(file.id)} aria-label={`${i18n.t.common.remove} ${file.name}`}>
										<Icon name="trash" size={18} />
									</button>
								</span>
							</li>
						{/each}
						{#if opening > 0}
							<li class="loading">
								<span class="spinner" aria-hidden="true"></span>
								{i18n.t.common.working}
							</li>
						{/if}
					</ol>
				{/snippet}
				{#snippet side()}
					<p class="summary">
						{fmt(i18n.t.merge.total, {
							files: plural(i18n.lang, files.length, i18n.t.common.files),
							pages: plural(i18n.lang, totalPages, i18n.t.common.pages)
						})}
					</p>
					{#if files.length < 2}
						<p class="muted">{i18n.t.merge.needTwo}</p>
					{/if}
				{/snippet}
				{#snippet action()}
					<button class="btn btn-primary btn-lg" onclick={merge} disabled={busy || files.length < 2 || opening > 0}>
						<Icon name="merge" size={20} />
						{i18n.t.merge.action}
					</button>
					<button class="btn btn-ghost" onclick={reset}>{i18n.t.common.startOver}</button>
				{/snippet}
			</Workspace>
		{/if}
	</div>
{/if}

<style>
	.stack {
		display: grid;
		gap: 16px;
	}

	.hint {
		margin-bottom: 14px;
		color: var(--ink-2);
	}

	.files {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 8px;
	}

	.files li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 10px 10px 8px;
		border: 1px solid var(--line);
		border-radius: var(--radius-m);
		background: var(--paper);
		cursor: grab;
		user-select: none;
	}

	.files li:global(.sortable-ghost) {
		opacity: 0.4;
		background: var(--highlight-soft);
	}

	.grip {
		color: var(--ink-3);
	}

	.order {
		width: 24px;
		text-align: center;
		font-weight: 700;
		color: var(--ink-3);
		font-variant-numeric: tabular-nums;
	}

	.preview {
		display: block;
		width: 48px;
		flex: none;
		box-shadow: 0 1px 3px rgb(22 33 58 / 0.25);
	}

	.meta {
		flex: 1;
		min-width: 0;
	}

	.meta strong {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta small {
		color: var(--ink-3);
	}

	.buttons {
		display: flex;
		gap: 2px;
	}

	.loading {
		justify-content: center;
		color: var(--ink-2);
		font-weight: 600;
		cursor: default;
	}

	.spinner {
		width: 18px;
		height: 18px;
		border: 3px solid var(--royal-tint);
		border-top-color: var(--royal);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.summary {
		font-weight: 650;
	}

	.muted {
		color: var(--ink-2);
	}

	@media (max-width: 520px) {
		.order,
		.grip {
			display: none;
		}
	}
</style>
