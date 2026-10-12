<script lang="ts">
	import { onMount } from 'svelte';
	import type { ToolProps } from '#lib/tools/registry.ts';
	import { useI18n, fmt, plural } from '#lib/i18n/index.ts';
	import { outputName, toBlob, uid, pickFiles } from '#lib/pdf/files.ts';
	import { closePdf } from '#lib/pdf/pdfjs.ts';
	import { assemblePages, type PageSpec } from '#lib/pdf/ops/pages.ts';
	import { takeHandoff } from '#lib/stores/handoff.ts';
	import { sortable, moveItem } from '#lib/actions/sortable.ts';
	import {
		openPdfFile,
		describeError,
		filterFiles,
		toInput,
		ACCEPT,
		type LoadedPdf
	} from './shared.ts';
	import type { ResultFile } from '#lib/components/ResultPanel.svelte';
	import FileDrop from '#lib/components/FileDrop.svelte';
	import Workspace from '#lib/components/Workspace.svelte';
	import ResultPanel from '#lib/components/ResultPanel.svelte';
	import Notice from '#lib/components/Notice.svelte';
	import PageThumb from '#lib/components/PageThumb.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let _props: ToolProps = $props();
	const i18n = useI18n();

	interface Item {
		key: string;
		kind: 'page' | 'blank';
		source: number;
		index: number;
		rotation: number;
		/** Display size of blank pages, in points. */
		width: number;
		height: number;
	}

	let sources = $state<LoadedPdf[]>([]);
	let items = $state<Item[]>([]);
	let selected = $state(new Set<string>());
	let opening = $state<string | null>(null);
	let error = $state<string | null>(null);
	let busy = $state(false);
	let progress = $state<number | null>(null);
	let result = $state<ResultFile[] | null>(null);

	async function addSource(file: File): Promise<boolean> {
		opening = file.name;
		try {
			const pdf = await openPdfFile(file, i18n.t);
			const sourceIndex = sources.length;
			sources = [...sources, pdf];
			const newItems: Item[] = Array.from({ length: pdf.pageCount }, (_, index) => ({
				key: uid('pg'),
				kind: 'page',
				source: sourceIndex,
				index,
				rotation: 0,
				width: 0,
				height: 0
			}));
			items = [...items, ...newItems];
			return true;
		} catch (e) {
			error = describeError(i18n.t, e);
			return false;
		} finally {
			opening = null;
		}
	}

	async function open(files: File[]) {
		const { ok, rejected } = filterFiles(files, 'pdf');
		error = rejected.length ? fmt(i18n.t.errors.notPdf, { name: rejected[0].name }) : null;
		for (const file of ok) await addSource(file);
	}

	async function insertPdf() {
		const files = await pickFiles(ACCEPT.pdf, true);
		await open(files);
	}

	function toggle(key: string) {
		const next = new Set(selected);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		selected = next;
	}

	function targets(key?: string): Set<string> {
		if (key) return new Set([key]);
		return selected.size ? selected : new Set(items.map((item) => item.key));
	}

	function rotate(delta: number, key?: string) {
		const keys = targets(key);
		items = items.map((item) =>
			keys.has(item.key)
				? { ...item, rotation: (((item.rotation + delta) % 360) + 360) % 360 }
				: item
		);
	}

	function remove(key?: string) {
		const keys = key ? new Set([key]) : selected;
		if (!keys.size) return;
		if (items.length - keys.size < 1) {
			error = i18n.t.organize.keepOne;
			return;
		}
		items = items.filter((item) => !keys.has(item.key));
		selected = new Set([...selected].filter((k) => !keys.has(k)));
	}

	function duplicate() {
		if (!selected.size) return;
		const next: Item[] = [];
		for (const item of items) {
			next.push(item);
			if (selected.has(item.key)) next.push({ ...item, key: uid('pg') });
		}
		items = next;
	}

	async function addBlank() {
		// Use the size of the last selected page (or the last page) for the blank page.
		const anchorIndex = selected.size
			? Math.max(...items.map((item, i) => (selected.has(item.key) ? i : -1)))
			: items.length - 1;
		const anchor = items[anchorIndex];
		let width = 595.28;
		let height = 841.89;
		if (anchor?.kind === 'blank') {
			width = anchor.width;
			height = anchor.height;
		} else if (anchor) {
			const page = await sources[anchor.source].doc.getPage(anchor.index + 1);
			const viewport = page.getViewport({ scale: 1 });
			width = viewport.width;
			height = viewport.height;
		}
		const blank: Item = {
			key: uid('blank'),
			kind: 'blank',
			source: -1,
			index: -1,
			rotation: 0,
			width,
			height
		};
		const copy = items.slice();
		copy.splice(anchorIndex + 1, 0, blank);
		items = copy;
	}

	function reverse() {
		items = items.slice().reverse();
	}

	async function save() {
		if (!items.length) {
			error = i18n.t.organize.keepOne;
			return;
		}
		busy = true;
		progress = null;
		error = null;
		try {
			const specs: PageSpec[] = items.map((item) =>
				item.kind === 'blank'
					? { kind: 'blank', width: item.width, height: item.height, rotation: item.rotation }
					: { kind: 'page', source: item.source, index: item.index, rotation: item.rotation }
			);
			const bytes = await assemblePages(sources.map(toInput), specs, (f) => (progress = f));
			result = [{ name: outputName(sources[0].name, 'organized'), blob: toBlob(bytes) }];
		} catch (e) {
			error = describeError(i18n.t, e);
		} finally {
			busy = false;
			progress = null;
		}
	}

	async function reset() {
		result = null;
		error = null;
		items = [];
		selected = new Set();
		const old = sources;
		sources = [];
		await Promise.all(old.map((s) => closePdf(s.doc)));
	}

	onMount(() => {
		const handed = takeHandoff();
		if (handed) void open(handed);
		return () => {
			for (const s of sources) void closePdf(s.doc);
		};
	});
</script>

{#if result}
	<ResultPanel files={result} onreset={reset} next={['compress', 'page-numbers', 'edit']} />
{:else}
	<div class="stack">
		{#if error}
			<Notice kind="error" ondismiss={() => (error = null)}>{error}</Notice>
		{/if}
		{#if !sources.length}
			{#if opening}
				<div class="opening">{fmt(i18n.t.common.loadingFile, { name: opening })}</div>
			{:else}
				<FileDrop accepts="pdf" multiple onfiles={open} />
			{/if}
		{:else}
			<Workspace {busy} {progress}>
				{#snippet toolbar()}
					<button
						class="btn"
						onclick={() => rotate(-90)}
						title={i18n.t.common.rotateLeft}
						aria-label={i18n.t.common.rotateLeft}
					>
						<Icon name="rotateLeft" size={18} /><span class="lbl">{i18n.t.common.rotateLeft}</span>
					</button>
					<button
						class="btn"
						onclick={() => rotate(90)}
						title={i18n.t.common.rotateRight}
						aria-label={i18n.t.common.rotateRight}
					>
						<Icon name="rotateRight" size={18} /><span class="lbl">{i18n.t.common.rotateRight}</span
						>
					</button>
					<button
						class="btn"
						onclick={duplicate}
						disabled={!selected.size}
						aria-label={i18n.t.common.duplicate}
					>
						<Icon name="copy" size={18} /><span class="lbl">{i18n.t.common.duplicate}</span>
					</button>
					<button
						class="btn btn-danger"
						onclick={() => remove()}
						disabled={!selected.size}
						aria-label={i18n.t.common.delete}
					>
						<Icon name="trash" size={18} /><span class="lbl">{i18n.t.common.delete}</span>
					</button>
					<span class="sep"></span>
					<button class="btn" onclick={addBlank}>
						<Icon name="plus" size={18} />{i18n.t.organize.addBlank}
					</button>
					<button class="btn" onclick={insertPdf}>
						<Icon name="files" size={18} />{i18n.t.organize.insertPdf}
					</button>
					<button class="btn btn-ghost" onclick={reverse}>
						<Icon name="reverse" size={18} />{i18n.t.organize.reverse}
					</button>
				{/snippet}
				{#snippet main()}
					<div class="sel-row">
						<p class="hint">{i18n.t.organize.hint}</p>
						{#if selected.size}
							<span class="count">{fmt(i18n.t.common.selected, { n: selected.size })}</span>
							<button class="btn btn-ghost" onclick={() => (selected = new Set())}
								>{i18n.t.common.selectNone}</button
							>
						{:else}
							<button
								class="btn btn-ghost"
								onclick={() => (selected = new Set(items.map((i) => i.key)))}
							>
								{i18n.t.common.selectAll}
							</button>
						{/if}
					</div>
					<ul
						class="grid"
						use:sortable={{ onReorder: (from, to) => (items = moveItem(items, from, to)) }}
					>
						{#each items as item, position (item.key)}
							<li data-sortable class:selected={selected.has(item.key)}>
								<button
									class="page"
									aria-pressed={selected.has(item.key)}
									aria-label={fmt(i18n.t.common.page, { n: position + 1 })}
									onclick={() => toggle(item.key)}
								>
									{#if item.kind === 'page'}
										<PageThumb
											doc={sources[item.source].doc}
											pageNumber={item.index + 1}
											rotation={item.rotation}
											width={150}
										/>
									{:else}
										<span
											class="blank"
											style:aspect-ratio={item.rotation % 180 === 0
												? `${item.width} / ${item.height}`
												: `${item.height} / ${item.width}`}
										>
											{i18n.t.organize.blank}
										</span>
									{/if}
								</button>
								<span class="num">
									{position + 1}
									{#if sources.length > 1 && item.kind === 'page'}
										<span class="src" title={sources[item.source].name}
											>{String.fromCharCode(65 + (item.source % 26))}</span
										>
									{/if}
								</span>
								<span class="quick">
									<button
										class="icon-btn"
										onclick={() => rotate(90, item.key)}
										aria-label={i18n.t.common.rotateRight}
									>
										<Icon name="rotateRight" size={16} />
									</button>
									<button
										class="icon-btn"
										onclick={() => remove(item.key)}
										aria-label={i18n.t.common.delete}
									>
										<Icon name="trash" size={16} />
									</button>
								</span>
							</li>
						{/each}
					</ul>
					{#if opening}
						<p class="muted">{fmt(i18n.t.common.loadingFile, { name: opening })}</p>
					{/if}
				{/snippet}
				{#snippet side()}
					<div class="sources">
						{#each sources as source, index (source.id)}
							<p>
								{#if sources.length > 1}<span class="src"
										>{String.fromCharCode(65 + (index % 26))}</span
									>{/if}
								<span class="sname">{source.name}</span>
							</p>
						{/each}
						<p class="muted">{plural(i18n.lang, items.length, i18n.t.common.pages)}</p>
					</div>
				{/snippet}
				{#snippet action()}
					<button class="btn btn-primary btn-lg" onclick={save} disabled={busy || !items.length}>
						<Icon name="download" size={20} />
						{i18n.t.organize.action}
					</button>
					<button class="btn btn-ghost" onclick={reset}>{i18n.t.common.startOver}</button>
				{/snippet}
			</Workspace>
		{/if}
	</div>
{/if}

<style>
	.sep {
		width: 1px;
		align-self: stretch;
		background: var(--line);
		margin-inline: 4px;
	}

	.sel-row {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
		margin-bottom: 16px;
	}

	.hint {
		flex: 1;
		min-width: 220px;
		color: var(--ink-2);
	}

	.count {
		font-weight: 650;
		color: var(--ink-2);
	}

	.grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 18px 16px;
	}

	.grid li {
		position: relative;
		display: grid;
		gap: 6px;
		padding: 8px;
		border: 2px solid transparent;
		border-radius: var(--radius-m);
		cursor: grab;
	}

	.grid li:hover {
		background: rgb(22 33 58 / 0.05);
	}

	.grid li.selected {
		border-color: var(--royal);
		background: var(--royal-tint);
	}

	.grid li:global(.sortable-ghost) {
		opacity: 0.35;
	}

	.page {
		display: grid;
		align-items: center;
		min-height: 100px;
		padding: 0;
		border: none;
		background: none;
		cursor: inherit;
	}

	.page :global(.thumb) {
		box-shadow: 0 1px 3px rgb(22 33 58 / 0.2);
	}

	.blank {
		display: grid;
		place-items: center;
		width: 100%;
		background: #fff;
		box-shadow: 0 1px 3px rgb(22 33 58 / 0.2);
		color: var(--ink-3);
		font-size: 0.85rem;
	}

	.num {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		font-size: 0.9rem;
		font-weight: 650;
		color: var(--ink-2);
	}

	.src {
		display: inline-grid;
		place-items: center;
		width: 20px;
		height: 20px;
		border-radius: 5px;
		background: var(--ink);
		color: #fff;
		font-size: 0.72rem;
		font-weight: 700;
		flex: none;
	}

	.quick {
		position: absolute;
		top: 4px;
		right: 4px;
		display: flex;
		gap: 2px;
		padding: 2px;
		border-radius: var(--radius-s);
		background: var(--paper);
		box-shadow: 0 1px 4px rgb(22 33 58 / 0.25);
		opacity: 0;
		transition: opacity 120ms ease;
	}

	.grid li:hover .quick,
	.grid li:focus-within .quick {
		opacity: 1;
	}

	.quick .icon-btn {
		width: 30px;
		height: 30px;
	}

	.sources {
		display: grid;
		gap: 8px;
	}

	.sources p {
		display: flex;
		align-items: center;
		gap: 8px;
		overflow-wrap: anywhere;
	}

	.sname {
		font-weight: 600;
	}

	.muted {
		color: var(--ink-3);
	}

	@media (hover: none) {
		.quick {
			opacity: 1;
		}
	}

	@media (max-width: 700px) {
		.lbl {
			display: none;
		}
	}
</style>
