<script lang="ts">
	import type { ToolProps } from '#lib/tools/registry.ts';
	import { useI18n, fmt } from '#lib/i18n/index.ts';
	import { parsePageSet } from '#lib/pdf/ranges.ts';
	import { outputName, toBlob, pickFiles } from '#lib/pdf/files.ts';
	import { cssFontFamily, loadCssFont, ensureFontFaces, type FontFamilyId } from '#lib/pdf/fonts.ts';
	import { addWatermark, watermarkCenters, type WatermarkPosition } from '#lib/pdf/ops/stamp.ts';
	import { prepareImage } from '#lib/pdf/ops/images.ts';
	import { SinglePdfTool } from './single.svelte.ts';
	import { toInput, describeError } from './shared.ts';
	import ToolShell from '#lib/components/ToolShell.svelte';
	import Workspace from '#lib/components/Workspace.svelte';
	import PagePreview from '#lib/components/PagePreview.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let _props: ToolProps = $props();
	const i18n = useI18n();
	const tool = new SinglePdfTool(() => i18n.t);

	let kind = $state<'text' | 'image'>('text');
	// svelte-ignore state_referenced_locally
	let text = $state(i18n.t.watermark.defaultText);
	let font = $state<FontFamilyId>('sans');
	let bold = $state(true);
	let size = $state(48);
	let color = $state('#c42b3d');
	let opacity = $state(0.3);
	let angle = $state(45);
	let position = $state<WatermarkPosition>('center');
	let behind = $state(false);
	let scope = $state<'all' | 'some'>('all');
	let rangeText = $state('');
	let image = $state<{ bytes: Uint8Array; mime: 'image/png' | 'image/jpeg'; url: string; w: number; h: number } | null>(null);
	let imageScale = $state(0.4);
	let previewPage = $state(1);
	let fontReady = $state(0);

	const pageCount = $derived(tool.pdf?.pageCount ?? 0);
	const pages = $derived(scope === 'all' ? null : parsePageSet(rangeText, pageCount));

	$effect(() => {
		ensureFontFaces();
		const style = { family: font, bold, italic: false };
		loadCssFont(style).then(() => fontReady++);
	});

	$effect(() => {
		void tool.pdf;
		previewPage = 1;
	});

	/** Text block size in points, measured with the same font the PDF will embed. */
	const textBox = $derived.by(() => {
		void fontReady;
		if (typeof document === 'undefined') return { width: 0, height: 0 };
		const lines = text.split(/\r?\n/);
		const ctx = document.createElement('canvas').getContext('2d');
		if (!ctx) return { width: 0, height: 0 };
		ctx.font = `${bold ? 700 : 400} ${size}px ${cssFontFamily(font)}`;
		const width = Math.max(...lines.map((line) => ctx.measureText(line).width));
		return { width, height: size * 1.2 * lines.length };
	});

	function imageBox(pageWidth: number) {
		if (!image) return { width: 0, height: 0 };
		const width = pageWidth * imageScale;
		return { width, height: (width * image.h) / image.w };
	}

	async function chooseImage() {
		const [file] = await pickFiles('image/png,image/jpeg,image/webp,image/gif', false);
		if (!file) return;
		try {
			const prepared = await prepareImage(file);
			const mime = prepared.kind === 'png' ? 'image/png' : 'image/jpeg';
			const url = URL.createObjectURL(new Blob([prepared.bytes as Uint8Array<ArrayBuffer>], { type: mime }));
			const bitmap = await createImageBitmap(new Blob([prepared.bytes as Uint8Array<ArrayBuffer>], { type: mime }));
			if (image) URL.revokeObjectURL(image.url);
			image = { bytes: prepared.bytes, mime, url, w: bitmap.width, h: bitmap.height };
			bitmap.close();
		} catch (error) {
			tool.fail(describeError(i18n.t, error));
		}
	}

	const positions: Array<Exclude<WatermarkPosition, 'tile'>> = [
		'top-left',
		'top-center',
		'top-right',
		'middle-left',
		'center',
		'middle-right',
		'bottom-left',
		'bottom-center',
		'bottom-right'
	];

	async function submit() {
		if (kind === 'text' && !text.trim()) return tool.fail(i18n.t.watermark.noText);
		if (kind === 'image' && !image) return tool.fail(i18n.t.watermark.noImage);
		if (scope === 'some' && !pages?.length) return tool.fail(fmt(i18n.t.common.rangesInvalid, { n: pageCount }));
		const options = {
			mark:
				kind === 'text'
					? { kind: 'text' as const, text, font, bold, size, color }
					: { kind: 'image' as const, bytes: image!.bytes, mime: image!.mime, scale: imageScale },
			position,
			angle,
			opacity,
			behind,
			pages: scope === 'all' ? null : pages
		};
		await tool.run(async (pdf, onProgress) => {
			const bytes = await addWatermark(toInput(pdf), options, onProgress);
			return [{ name: outputName(pdf.name, 'watermarked'), blob: toBlob(bytes) }];
		});
	}
</script>

<ToolShell {tool} next={['protect', 'flatten', 'compress']}>
	{#if tool.pdf}
		<Workspace busy={tool.busy} progress={tool.progress}>
			{#snippet main()}
				<PagePreview doc={tool.pdf!.doc} pageNumber={previewPage} maxWidth={560} maxHeight={720}>
					{#snippet overlay(geo)}
						{@const box = kind === 'text' ? textBox : imageBox(geo.width)}
						{#if (kind === 'text' && text.trim()) || (kind === 'image' && image)}
							{#each watermarkCenters(position, geo, box, angle) as [cx, cy], i (i)}
								<div
									class="mark"
									style:left={`${cx * geo.scale}px`}
									style:top={`${cy * geo.scale}px`}
									style:opacity={opacity}
									style:transform={`translate(-50%, -50%) rotate(${-angle}deg)`}
								>
									{#if kind === 'text'}
										<span
											class="mark-text"
											style:font-family={cssFontFamily(font)}
											style:font-weight={bold ? 700 : 400}
											style:font-size={`${size * geo.scale}px`}
											style:color
										>{text}</span>
									{:else if image}
										<img src={image.url} alt="" style:width={`${box.width * geo.scale}px`} />
									{/if}
								</div>
							{/each}
						{/if}
					{/snippet}
				</PagePreview>
				{#if pageCount > 1}
					<div class="pager">
						<button class="icon-btn" onclick={() => (previewPage = Math.max(1, previewPage - 1))} disabled={previewPage <= 1} aria-label={i18n.t.crop.prev}>
							<Icon name="chevronLeft" size={18} />
						</button>
						<span>{fmt(i18n.t.common.pageOf, { n: previewPage, total: pageCount })}</span>
						<button class="icon-btn" onclick={() => (previewPage = Math.min(pageCount, previewPage + 1))} disabled={previewPage >= pageCount} aria-label={i18n.t.crop.next}>
							<Icon name="chevronRight" size={18} />
						</button>
					</div>
				{/if}
			{/snippet}
			{#snippet side()}
				<div class="segmented full">
					<label><input type="radio" value="text" bind:group={kind} /><span>{i18n.t.watermark.text}</span></label>
					<label><input type="radio" value="image" bind:group={kind} /><span>{i18n.t.watermark.image}</span></label>
				</div>
				{#if kind === 'text'}
					<label class="field">
						<span>{i18n.t.watermark.textLabel}</span>
						<textarea class="textarea short" bind:value={text} rows="2"></textarea>
					</label>
					<div class="row">
						<label class="field grow">
							<span>{i18n.t.common.font}</span>
							<select class="select" bind:value={font}>
								<option value="sans">Noto Sans</option>
								<option value="serif">Noto Serif</option>
								<option value="mono">Noto Sans Mono</option>
							</select>
						</label>
						<label class="field">
							<span>{i18n.t.common.color}</span>
							<input type="color" bind:value={color} />
						</label>
					</div>
					<label class="check"><input type="checkbox" bind:checked={bold} /><span>{i18n.t.common.bold}</span></label>
					<label class="field">
						<span>{i18n.t.common.size} · {size} pt</span>
						<input type="range" min="8" max="160" step="1" bind:value={size} />
					</label>
				{:else}
					<button class="btn" onclick={chooseImage}>
						<Icon name="image" size={18} />
						{image ? i18n.t.watermark.changeImage : i18n.t.watermark.chooseImage}
					</button>
					<label class="field">
						<span>{i18n.t.watermark.imageSize} · {Math.round(imageScale * 100)} %</span>
						<input type="range" min="0.05" max="1" step="0.01" bind:value={imageScale} />
					</label>
				{/if}
				<div class="field">
					<span class="field-label">{i18n.t.common.position}</span>
					<div class="positions">
						{#each positions as value (value)}
							<label class="pos" title={i18n.t.watermark.positions[value]}>
								<input
									type="radio"
									name="wm-pos"
									{value}
									bind:group={position}
									aria-label={i18n.t.watermark.positions[value]}
								/>
								<span></span>
							</label>
						{/each}
					</div>
					<label class="check">
						<input type="checkbox" checked={position === 'tile'} onchange={(e) => (position = e.currentTarget.checked ? 'tile' : 'center')} />
						<span>{i18n.t.watermark.tile}</span>
					</label>
				</div>
				<label class="field">
					<span>{i18n.t.watermark.rotation} · {angle}°</span>
					<input type="range" min="-90" max="90" step="5" bind:value={angle} />
				</label>
				<label class="field">
					<span>{i18n.t.common.opacity} · {Math.round(opacity * 100)} %</span>
					<input type="range" min="0.05" max="1" step="0.05" bind:value={opacity} />
				</label>
				<label class="check">
					<input type="checkbox" bind:checked={behind} />
					<span>{i18n.t.watermark.behind}<small class="muted block">{i18n.t.watermark.behindHint}</small></span>
				</label>
				<div class="field">
					<span class="field-label">{i18n.t.common.pagesLabel}</span>
					<div class="segmented">
						<label><input type="radio" value="all" bind:group={scope} /><span>{i18n.t.common.allPages}</span></label>
						<label><input type="radio" value="some" bind:group={scope} /><span>{i18n.t.common.somePages}</span></label>
					</div>
					{#if scope === 'some'}
						<input class="input" bind:value={rangeText} placeholder={i18n.t.common.rangesHint} aria-label={i18n.t.common.pageRanges} aria-invalid={!pages} />
					{/if}
				</div>
			{/snippet}
			{#snippet action()}
				<button class="btn btn-primary btn-lg" onclick={submit} disabled={tool.busy}>
					<Icon name="droplet" size={20} />
					{i18n.t.watermark.action}
				</button>
				<button class="btn btn-ghost" onclick={() => tool.reset()}>{i18n.t.common.startOver}</button>
			{/snippet}
		</Workspace>
	{/if}
</ToolShell>

<style>
	.mark {
		position: absolute;
		pointer-events: none;
		transform-origin: center;
	}

	.mark-text {
		display: block;
		white-space: pre;
		line-height: 1.2;
		text-align: center;
		font-kerning: none;
	}

	.mark img {
		display: block;
		max-width: none;
	}

	.pager {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: 12px;
		font-weight: 600;
		color: var(--ink-2);
	}

	.full {
		display: flex;
	}

	.full label {
		flex: 1;
		text-align: center;
	}

	.short {
		min-height: 64px;
	}

	.row {
		display: flex;
		gap: 12px;
		align-items: flex-end;
	}

	.grow {
		flex: 1;
	}

	.positions {
		display: grid;
		grid-template-columns: repeat(3, 36px);
		gap: 6px;
		padding: 8px;
		width: max-content;
		border-radius: var(--radius-m);
		background: var(--desk);
		margin-bottom: 8px;
	}

	.pos {
		position: relative;
		cursor: pointer;
	}

	.pos input {
		position: absolute;
		opacity: 0;
	}

	.pos span {
		display: block;
		width: 36px;
		height: 28px;
		border-radius: 5px;
		background: var(--paper);
		border: 1px solid var(--line);
	}

	.pos input:checked + span {
		background: var(--royal);
		border-color: var(--royal);
	}

	.pos input:focus-visible + span {
		box-shadow: var(--focus);
	}

	.muted {
		color: var(--ink-3);
		font-size: 0.88rem;
	}

	.block {
		display: block;
	}
</style>
