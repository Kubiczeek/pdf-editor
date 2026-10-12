<script lang="ts">
	import type { ToolProps } from '#lib/tools/registry.ts';
	import { useI18n, fmt, plural } from '#lib/i18n/index.ts';
	import { parsePageSet } from '#lib/pdf/ranges.ts';
	import { baseName } from '#lib/pdf/files.ts';
	import { pdfToImages, type ImageFormat } from '#lib/pdf/ops/images.ts';
	import { SinglePdfTool } from './single.svelte.ts';
	import { toInput } from './shared.ts';
	import type { ResultFile } from '#lib/components/ResultPanel.svelte';
	import ToolShell from '#lib/components/ToolShell.svelte';
	import Workspace from '#lib/components/Workspace.svelte';
	import PagePicker from '#lib/components/PagePicker.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let { toolId }: ToolProps = $props();
	const i18n = useI18n();
	const tool = new SinglePdfTool(() => i18n.t);

	const format = $derived<ImageFormat>(toolId === 'pdf-to-png' ? 'png' : 'jpeg');
	const formatLabel = $derived(format === 'png' ? 'PNG' : 'JPG');
	let dpi = $state(150);
	let quality = $state(0.9);
	let scope = $state<'all' | 'some'>('all');
	let selected = $state(new Set<number>());

	const pageCount = $derived(tool.pdf?.pageCount ?? 0);
	const pages = $derived(
		scope === 'all' ? Array.from({ length: pageCount }, (_, i) => i) : [...selected].sort((a, b) => a - b)
	);

	$effect(() => {
		void tool.pdf;
		selected = new Set();
		scope = 'all';
	});

	let rangeText = $state('');
	function onRange(value: string) {
		rangeText = value;
		const parsed = parsePageSet(value, pageCount);
		if (parsed) selected = new Set(parsed);
	}

	async function submit() {
		if (!pages.length) return;
		const chosen = pages.slice();
		const options = { format, dpi, quality };
		await tool.run(async (pdf, onProgress) => {
			const out: ResultFile[] = [];
			const ext = format === 'png' ? 'png' : 'jpg';
			const digits = String(pdf.pageCount).length;
			await pdfToImages(
				toInput(pdf),
				chosen,
				options,
				(image) => {
					out.push({
						name: `${baseName(pdf.name)}-${String(image.page + 1).padStart(digits, '0')}.${ext}`,
						blob: image.blob
					});
				},
				onProgress
			);
			return out;
		});
	}
</script>

<ToolShell {tool} next={['jpg-to-pdf']} zipName={`${baseName(tool.pdf?.name ?? 'document')}-${format === 'png' ? 'png' : 'jpg'}.zip`}>
	{#if tool.pdf}
		<Workspace busy={tool.busy} progress={tool.progress}>
			{#snippet main()}
				<PagePicker
					doc={tool.pdf!.doc}
					{pageCount}
					bind:selected
					selectable={scope === 'some'}
					mark="keep"
					size={130}
				/>
			{/snippet}
			{#snippet side()}
				<div class="field">
					<span class="field-label">{i18n.t.common.pagesLabel}</span>
					<div class="segmented">
						<label><input type="radio" value="all" bind:group={scope} /><span>{i18n.t.common.allPages}</span></label>
						<label><input type="radio" value="some" bind:group={scope} /><span>{i18n.t.common.somePages}</span></label>
					</div>
					{#if scope === 'some'}
						<input
							class="input"
							value={rangeText}
							placeholder={i18n.t.common.rangesHint}
							oninput={(e) => onRange(e.currentTarget.value)}
							aria-label={i18n.t.common.pageRanges}
						/>
						<small class="muted">{fmt(i18n.t.common.selected, { n: selected.size })}</small>
					{/if}
				</div>
				<label class="field">
					<span>{i18n.t.toImage.resolution}</span>
					<select class="select" bind:value={dpi}>
						<option value={72}>{i18n.t.toImage.dpiScreen}</option>
						<option value={150}>{i18n.t.toImage.dpiStandard}</option>
						<option value={300}>{i18n.t.toImage.dpiPrint}</option>
					</select>
				</label>
				{#if format === 'jpeg'}
					<label class="field">
						<span>{i18n.t.toImage.quality} · {Math.round(quality * 100)} %</span>
						<input type="range" min="0.5" max="1" step="0.05" bind:value={quality} />
					</label>
				{/if}
				{#if pages.length > 1}
					<p class="muted">{i18n.t.toImage.zipHint}</p>
				{/if}
			{/snippet}
			{#snippet action()}
				<button class="btn btn-primary btn-lg" onclick={submit} disabled={tool.busy || !pages.length}>
					<Icon name="image" size={20} />
					{fmt(i18n.t.toImage.action, { format: formatLabel })}
				</button>
				<p class="muted center">{plural(i18n.lang, pages.length, i18n.t.common.pages)}</p>
			{/snippet}
		</Workspace>
	{/if}
</ToolShell>

<style>
	.muted {
		color: var(--ink-3);
	}

	.center {
		text-align: center;
		font-size: 0.9rem;
	}
</style>
