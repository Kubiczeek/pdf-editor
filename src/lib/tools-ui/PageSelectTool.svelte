<script lang="ts">
	import type { ToolProps } from '#lib/tools/registry.ts';
	import { useI18n, fmt, plural } from '#lib/i18n/index.ts';
	import { parsePageSet, formatPageSet } from '#lib/pdf/ranges.ts';
	import { outputName, toBlob, baseName } from '#lib/pdf/files.ts';
	import { rotatePages, deletePages, extractGroups } from '#lib/pdf/ops/pages.ts';
	import { SinglePdfTool } from './single.svelte.ts';
	import { toInput } from './shared.ts';
	import ToolShell from '#lib/components/ToolShell.svelte';
	import Workspace from '#lib/components/Workspace.svelte';
	import PagePicker from '#lib/components/PagePicker.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let { toolId }: ToolProps = $props();
	const i18n = useI18n();
	const tool = new SinglePdfTool(() => i18n.t);
	const mode = $derived(toolId === 'rotate' ? 'rotate' : toolId === 'delete-pages' ? 'delete' : 'extract');

	let selected = $state(new Set<number>());
	let rotations = $state<Record<number, number>>({});
	let typing = $state(false);
	let typed = $state('');
	let rangeError = $state(false);
	let separate = $state(false);

	const pageCount = $derived(tool.pdf?.pageCount ?? 0);
	const rangeText = $derived(typing ? typed : formatPageSet(selected));

	$effect(() => {
		// New document → clear previous choices.
		void tool.pdf;
		selected = new Set();
		rotations = {};
		separate = false;
	});

	function onRangeInput(value: string) {
		typed = value;
		if (!value.trim()) {
			selected = new Set();
			rangeError = false;
			return;
		}
		const parsed = parsePageSet(value, pageCount);
		rangeError = !parsed;
		if (parsed) selected = new Set(parsed);
	}

	function rotate(delta: number) {
		const targets = selected.size ? [...selected] : Array.from({ length: pageCount }, (_, i) => i);
		const next = { ...rotations };
		for (const index of targets) next[index] = (((next[index] ?? 0) + delta) % 360 + 360) % 360;
		rotations = next;
	}

	function selectAll() {
		selected = new Set(Array.from({ length: pageCount }, (_, i) => i));
	}

	const actionLabel = $derived(
		mode === 'rotate'
			? i18n.t.rotate.action
			: mode === 'delete'
				? plural(i18n.lang, selected.size, i18n.t.deletePages.action)
				: plural(i18n.lang, selected.size, i18n.t.extract.action)
	);

	async function submit() {
		if (!tool.pdf) return;
		if (mode === 'delete') {
			if (!selected.size) return tool.fail(i18n.t.deletePages.none);
			if (selected.size >= pageCount) return tool.fail(i18n.t.deletePages.all);
		}
		if (mode === 'extract' && !selected.size) return tool.fail(i18n.t.extract.none);
		await tool.run(async (pdf, onProgress) => {
			const input = toInput(pdf);
			if (mode === 'rotate') {
				const map = new Map(Object.entries(rotations).map(([k, v]) => [Number(k), v]));
				const bytes = await rotatePages(input, map);
				return [{ name: outputName(pdf.name, 'rotated'), blob: toBlob(bytes) }];
			}
			if (mode === 'delete') {
				const bytes = await deletePages(input, selected, pageCount);
				return [{ name: outputName(pdf.name, 'edited'), blob: toBlob(bytes) }];
			}
			const indices = [...selected].sort((a, b) => a - b);
			if (separate) {
				const outputs = await extractGroups(input, indices.map((i) => [i]), onProgress);
				return outputs.map((bytes, k) => ({
					name: outputName(pdf.name, `page-${indices[k] + 1}`),
					blob: toBlob(bytes)
				}));
			}
			const [bytes] = await extractGroups(input, [indices], onProgress);
			return [{ name: outputName(pdf.name, 'extracted'), blob: toBlob(bytes) }];
		});
	}
</script>

<ToolShell
	{tool}
	next={mode === 'extract' ? ['merge', 'compress', 'edit'] : ['compress', 'edit', 'merge']}
	zipName={`${baseName(tool.pdf?.name ?? 'document')}-pages.zip`}
>
	{#if tool.pdf}
		<Workspace busy={tool.busy} progress={tool.progress}>
			{#snippet toolbar()}
				{#if mode === 'rotate'}
					<button class="btn" onclick={() => rotate(-90)}>
						<Icon name="rotateLeft" size={18} />
						{selected.size ? i18n.t.common.rotateLeft : i18n.t.rotate.rotateAllLeft}
					</button>
					<button class="btn" onclick={() => rotate(90)}>
						<Icon name="rotateRight" size={18} />
						{selected.size ? i18n.t.common.rotateRight : i18n.t.rotate.rotateAllRight}
					</button>
				{/if}
				<span class="spacer"></span>
				{#if selected.size}
					<span class="count">{fmt(i18n.t.common.selected, { n: selected.size })}</span>
					<button class="btn btn-ghost" onclick={() => (selected = new Set())}>{i18n.t.common.selectNone}</button>
				{:else}
					<button class="btn btn-ghost" onclick={selectAll}>{i18n.t.common.selectAll}</button>
				{/if}
			{/snippet}
			{#snippet main()}
				<p class="hint">
					{mode === 'rotate' ? i18n.t.rotate.hint : mode === 'delete' ? i18n.t.deletePages.hint : i18n.t.extract.hint}
				</p>
				<PagePicker
					doc={tool.pdf!.doc}
					{pageCount}
					bind:selected
					{rotations}
					mark={mode === 'delete' ? 'remove' : mode === 'extract' ? 'keep' : 'select'}
				/>
			{/snippet}
			{#snippet side()}
				<div class="file">
					<Icon name="file" size={20} />
					<div>
						<strong>{tool.pdf!.name}</strong>
						<small>{plural(i18n.lang, pageCount, i18n.t.common.pages)}</small>
					</div>
				</div>
				{#if mode !== 'rotate'}
					<label class="field">
						<span>{mode === 'delete' ? i18n.t.deletePages.input : i18n.t.extract.input}</span>
						<input
							class="input"
							value={rangeText}
							placeholder={i18n.t.common.rangesHint}
							aria-invalid={rangeError}
							onfocus={() => {
								typing = true;
								typed = formatPageSet(selected);
							}}
							onblur={() => {
								typing = false;
								rangeError = false;
							}}
							oninput={(e) => onRangeInput(e.currentTarget.value)}
						/>
						{#if rangeError}
							<small class="error">{fmt(i18n.t.common.rangesInvalid, { n: pageCount })}</small>
						{/if}
					</label>
				{/if}
				{#if mode === 'extract'}
					<label class="check">
						<input type="checkbox" bind:checked={separate} />
						<span>{i18n.t.extract.separate}</span>
					</label>
				{/if}
			{/snippet}
			{#snippet action()}
				<button
					class="btn btn-primary btn-lg"
					onclick={submit}
					disabled={tool.busy || (mode !== 'rotate' && selected.size === 0)}
				>
					{actionLabel}
				</button>
				<button class="btn btn-ghost" onclick={() => tool.reset()}>{i18n.t.common.startOver}</button>
			{/snippet}
		</Workspace>
	{/if}
</ToolShell>

<style>
	.spacer {
		flex: 1;
	}

	.count {
		font-weight: 650;
		color: var(--ink-2);
	}

	.hint {
		margin-bottom: 16px;
		color: var(--ink-2);
	}

	.file {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		overflow-wrap: anywhere;
	}

	.file :global(svg) {
		flex: none;
		color: var(--royal);
		margin-top: 2px;
	}

	.file small {
		display: block;
		color: var(--ink-3);
	}

	.error {
		color: var(--stamp);
	}

	input[aria-invalid='true'] {
		border-color: var(--stamp);
	}
</style>
