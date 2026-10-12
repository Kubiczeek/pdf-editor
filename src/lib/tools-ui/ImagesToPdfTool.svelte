<script lang="ts">
	import { onMount } from 'svelte';
	import type { ToolProps } from '#lib/tools/registry.ts';
	import { useI18n, fmt, plural } from '#lib/i18n/index.ts';
	import { toBlob, uid, baseName } from '#lib/pdf/files.ts';
	import {
		imagesToPdf,
		UnsupportedImageError,
		type PageSizeOption,
		type OrientationOption
	} from '#lib/pdf/ops/images.ts';
	import { takeHandoff } from '#lib/stores/handoff.ts';
	import { sortable, moveItem } from '#lib/actions/sortable.ts';
	import { describeError, filterFiles } from './shared.ts';
	import type { ResultFile } from '#lib/components/ResultPanel.svelte';
	import FileDrop from '#lib/components/FileDrop.svelte';
	import Workspace from '#lib/components/Workspace.svelte';
	import ResultPanel from '#lib/components/ResultPanel.svelte';
	import Notice from '#lib/components/Notice.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let _props: ToolProps = $props();
	const i18n = useI18n();

	interface Entry {
		id: string;
		file: File;
		url: string;
		rotation: number;
	}

	let entries = $state<Entry[]>([]);
	let errors = $state<string[]>([]);
	let busy = $state(false);
	let progress = $state<number | null>(null);
	let result = $state<ResultFile[] | null>(null);
	let pageSize = $state<PageSizeOption>('a4');
	let orientation = $state<OrientationOption>('auto');
	let margin = $state(0);

	function add(files: File[]) {
		const { ok, rejected } = filterFiles(files, 'image');
		errors = rejected.map((file) => fmt(i18n.t.errors.notImage, { name: file.name }));
		entries = [
			...entries,
			...ok.map((file) => ({ id: uid('img'), file, url: URL.createObjectURL(file), rotation: 0 }))
		];
	}

	function remove(id: string) {
		const entry = entries.find((e) => e.id === id);
		if (entry) URL.revokeObjectURL(entry.url);
		entries = entries.filter((e) => e.id !== id);
	}

	function rotate(id: string) {
		entries = entries.map((e) => (e.id === id ? { ...e, rotation: (e.rotation + 90) % 360 } : e));
	}

	/** Applies manual rotation by redrawing the image; untouched images are passed through. */
	async function rotated(entry: Entry): Promise<File> {
		if (!entry.rotation) return entry.file;
		const bitmap = await createImageBitmap(entry.file, {
			imageOrientation: 'from-image'
		} as ImageBitmapOptions);
		const swap = entry.rotation % 180 !== 0;
		const canvas = document.createElement('canvas');
		canvas.width = swap ? bitmap.height : bitmap.width;
		canvas.height = swap ? bitmap.width : bitmap.height;
		const ctx = canvas.getContext('2d')!;
		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.rotate((entry.rotation * Math.PI) / 180);
		ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
		bitmap.close();
		const isPng = entry.file.type === 'image/png';
		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, isPng ? 'image/png' : 'image/jpeg', 0.92)
		);
		canvas.width = canvas.height = 0;
		if (!blob) throw new Error('Rotation failed');
		return new File([blob], entry.file.name, { type: blob.type });
	}

	async function create() {
		if (!entries.length) return;
		busy = true;
		progress = 0;
		errors = [];
		try {
			const files: File[] = [];
			for (const entry of entries) files.push(await rotated(entry));
			const bytes = await imagesToPdf(
				files,
				{ pageSize, orientation, margin },
				(f) => (progress = f)
			);
			const name = entries.length === 1 ? `${baseName(entries[0].file.name)}.pdf` : 'images.pdf';
			result = [{ name, blob: toBlob(bytes) }];
		} catch (error) {
			errors = [
				error instanceof UnsupportedImageError
					? fmt(i18n.t.errors.notImage, { name: error.fileName })
					: describeError(i18n.t, error)
			];
		} finally {
			busy = false;
			progress = null;
		}
	}

	function reset() {
		for (const entry of entries) URL.revokeObjectURL(entry.url);
		entries = [];
		result = null;
		errors = [];
	}

	onMount(() => {
		const handed = takeHandoff();
		if (handed) add(handed);
		return () => {
			for (const entry of entries) URL.revokeObjectURL(entry.url);
		};
	});
</script>

{#if result}
	<ResultPanel files={result} onreset={reset} next={['compress', 'merge', 'organize']} />
{:else}
	<div class="stack">
		{#each errors as error, index (index)}
			<Notice kind="error" ondismiss={() => (errors = errors.filter((_, i) => i !== index))}
				>{error}</Notice
			>
		{/each}
		{#if !entries.length}
			<FileDrop accepts="image" multiple onfiles={add} />
		{:else}
			<Workspace {busy} {progress}>
				{#snippet toolbar()}
					<FileDrop
						accepts="image"
						multiple
						compact
						onfiles={add}
						buttonLabel={i18n.t.fromImages.addImages}
					/>
					<span class="count">{plural(i18n.lang, entries.length, i18n.t.common.pages)}</span>
				{/snippet}
				{#snippet main()}
					<p class="hint">{i18n.t.fromImages.hint}</p>
					<ul
						class="grid"
						use:sortable={{ onReorder: (from, to) => (entries = moveItem(entries, from, to)) }}
					>
						{#each entries as entry, index (entry.id)}
							<li data-sortable>
								<div
									class="frame"
									class:landscape={pageSize !== 'fit' && orientation === 'landscape'}
								>
									<img
										src={entry.url}
										alt={entry.file.name}
										style:transform={`rotate(${entry.rotation}deg)`}
										draggable="false"
									/>
								</div>
								<div class="row">
									<span class="num">{index + 1}</span>
									<span class="name" title={entry.file.name}>{entry.file.name}</span>
									<button
										class="icon-btn"
										onclick={() => rotate(entry.id)}
										aria-label={i18n.t.common.rotateRight}
									>
										<Icon name="rotateRight" size={16} />
									</button>
									<button
										class="icon-btn"
										onclick={() => remove(entry.id)}
										aria-label={i18n.t.common.remove}
									>
										<Icon name="trash" size={16} />
									</button>
								</div>
							</li>
						{/each}
					</ul>
				{/snippet}
				{#snippet side()}
					<label class="field">
						<span>{i18n.t.fromImages.pageSize}</span>
						<select class="select" bind:value={pageSize}>
							<option value="a4">{i18n.t.fromImages.a4}</option>
							<option value="letter">{i18n.t.fromImages.letter}</option>
							<option value="fit">{i18n.t.fromImages.fit}</option>
						</select>
					</label>
					{#if pageSize !== 'fit'}
						<div class="field">
							<span class="field-label">{i18n.t.fromImages.orientation}</span>
							<div class="segmented">
								<label
									><input type="radio" value="auto" bind:group={orientation} /><span
										>{i18n.t.fromImages.auto}</span
									></label
								>
								<label
									><input type="radio" value="portrait" bind:group={orientation} /><span
										>{i18n.t.fromImages.portrait}</span
									></label
								>
								<label
									><input type="radio" value="landscape" bind:group={orientation} /><span
										>{i18n.t.fromImages.landscape}</span
									></label
								>
							</div>
						</div>
					{/if}
					<div class="field">
						<span class="field-label">{i18n.t.fromImages.margin}</span>
						<div class="segmented">
							<label
								><input type="radio" value={0} bind:group={margin} /><span
									>{i18n.t.fromImages.marginNone}</span
								></label
							>
							<label
								><input type="radio" value={20} bind:group={margin} /><span
									>{i18n.t.fromImages.marginSmall}</span
								></label
							>
							<label
								><input type="radio" value={50} bind:group={margin} /><span
									>{i18n.t.fromImages.marginLarge}</span
								></label
							>
						</div>
					</div>
				{/snippet}
				{#snippet action()}
					<button class="btn btn-primary btn-lg" onclick={create} disabled={busy}>
						<Icon name="file" size={20} />
						{i18n.t.fromImages.action}
					</button>
					<button class="btn btn-ghost" onclick={reset}>{i18n.t.common.startOver}</button>
				{/snippet}
			</Workspace>
		{/if}
	</div>
{/if}

<style>
	.count {
		margin-left: auto;
		color: var(--ink-2);
		font-weight: 650;
	}

	.hint {
		margin-bottom: 14px;
		color: var(--ink-2);
	}

	.grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 16px;
	}

	.grid li {
		display: grid;
		gap: 8px;
		padding: 8px;
		border-radius: var(--radius-m);
		background: var(--paper);
		border: 1px solid var(--line);
		cursor: grab;
	}

	.grid li:global(.sortable-ghost) {
		opacity: 0.35;
	}

	.frame {
		display: grid;
		place-items: center;
		aspect-ratio: 210 / 297;
		background: #fff;
		box-shadow: 0 1px 3px rgb(22 33 58 / 0.2);
		overflow: hidden;
	}

	.frame.landscape {
		aspect-ratio: 297 / 210;
	}

	.frame img {
		max-width: 92%;
		max-height: 92%;
		object-fit: contain;
		transition: transform 160ms ease;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.num {
		font-weight: 700;
		color: var(--ink-3);
		min-width: 18px;
	}

	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.88rem;
	}

	.row .icon-btn {
		width: 30px;
		height: 30px;
	}
</style>
