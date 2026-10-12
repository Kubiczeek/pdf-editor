<script lang="ts" module>
	export interface ResultFile {
		name: string;
		blob: Blob;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { useI18n, formatBytes } from '#lib/i18n/index.ts';
	import { downloadBlob } from '#lib/pdf/files.ts';
	import { makeZip } from '#lib/pdf/zip.ts';
	import { setHandoff } from '#lib/stores/handoff.ts';
	import { TOOLS, toolPath, type ToolId } from '#lib/tools/registry.ts';
	import { TOOL_ICONS } from '#lib/tools/icons.ts';
	import Icon from './Icon.svelte';

	let {
		files,
		zipName = 'files.zip',
		onreset,
		note,
		next = [],
		extra
	}: {
		files: ResultFile[];
		zipName?: string;
		onreset: () => void;
		note?: string;
		/** Tools the result can be passed on to. */
		next?: ToolId[];
		extra?: Snippet;
	} = $props();

	const i18n = useI18n();
	let zipping = $state(false);
	const total = $derived(files.reduce((sum, file) => sum + file.blob.size, 0));
	const nextTools = $derived(
		next.filter((id) => {
			const accepts = TOOLS[id].accepts;
			return files.every((file) =>
				accepts === 'pdf'
					? file.blob.type === 'application/pdf'
					: file.blob.type.startsWith('image/')
			);
		})
	);

	async function downloadZip() {
		zipping = true;
		try {
			const entries = await Promise.all(
				files.map(async (file) => ({
					name: file.name,
					data: new Uint8Array(await file.blob.arrayBuffer())
				}))
			);
			downloadBlob(await makeZip(entries), zipName, 'application/zip');
		} finally {
			zipping = false;
		}
	}

	function continueWith(id: ToolId) {
		setHandoff(files.map((file) => new File([file.blob], file.name, { type: file.blob.type })));
		goto(toolPath(i18n.lang, id));
	}
</script>

<div class="result">
	<div class="head">
		<span class="ok"><Icon name="check" size={26} strokeWidth={2.4} /></span>
		<div>
			<h2>
				{files.length > 1
					? i18n.t.common.readyMany
					: files[0].blob.type === 'application/pdf'
						? i18n.t.common.readyOne
						: i18n.t.common.readyFile}
			</h2>
			<p class="meta">{i18n.t.common.processedLocally} · {formatBytes(i18n.lang, total)}</p>
		</div>
	</div>

	{#if note}<p class="note">{note}</p>{/if}
	{#if extra}{@render extra()}{/if}

	<div class="actions">
		{#if files.length === 1}
			<button
				class="btn btn-primary btn-lg"
				onclick={() => downloadBlob(files[0].blob, files[0].name)}
			>
				<Icon name="download" size={20} />
				{files[0].blob.type === 'application/pdf'
					? i18n.t.common.downloadPdf
					: i18n.t.common.download}
			</button>
		{:else}
			<button class="btn btn-primary btn-lg" onclick={downloadZip} disabled={zipping}>
				<Icon name="download" size={20} />
				{i18n.t.common.downloadZip}
			</button>
		{/if}
		<button class="btn" onclick={onreset}>
			<Icon name="rotateLeft" size={18} />
			{i18n.t.common.startOver}
		</button>
	</div>

	{#if files.length > 1}
		<ul class="list">
			{#each files as file, index (index)}
				<li>
					<Icon name={file.blob.type === 'application/pdf' ? 'file' : 'image'} size={18} />
					<span class="name">{file.name}</span>
					<span class="size">{formatBytes(i18n.lang, file.blob.size)}</span>
					<button
						class="icon-btn"
						onclick={() => downloadBlob(file.blob, file.name)}
						aria-label={`${i18n.t.common.download} ${file.name}`}
					>
						<Icon name="download" size={18} />
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if nextTools.length}
		<div class="next">
			<p>{i18n.t.common.continueWith}</p>
			<div class="next-list">
				{#each nextTools as id (id)}
					<button class="chip" onclick={() => continueWith(id)} style:--tool={TOOLS[id].color}>
						<Icon name={TOOL_ICONS[id]} size={18} />
						{i18n.t.tools[id].name}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.result {
		display: grid;
		gap: 20px;
		padding: clamp(20px, 4vw, 36px);
		background: var(--paper);
		border-radius: var(--radius-l);
		box-shadow: var(--shadow-sheet);
	}

	.head {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.ok {
		display: grid;
		place-items: center;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: var(--ok-tint);
		color: var(--ok);
		flex: none;
	}

	h2 {
		font-size: 1.6rem;
	}

	.meta,
	.note {
		color: var(--ink-2);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		border: 1px solid var(--line);
		border-radius: var(--radius-m);
		max-height: 320px;
		overflow-y: auto;
	}

	.list li {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 8px 6px 14px;
		border-bottom: 1px solid var(--line);
		color: var(--ink-2);
	}

	.list li:last-child {
		border-bottom: none;
	}

	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--ink);
	}

	.size {
		font-size: 0.9rem;
		font-variant-numeric: tabular-nums;
	}

	.next {
		display: grid;
		gap: 10px;
		padding-top: 16px;
		border-top: 1px solid var(--line);
	}

	.next p {
		font-weight: 650;
		color: var(--ink-2);
	}

	.next-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		border: 1px solid var(--line);
		border-radius: 99px;
		background: var(--paper);
		font-weight: 600;
		cursor: pointer;
	}

	.chip :global(svg) {
		color: var(--tool);
	}

	.chip:hover {
		border-color: var(--line-strong);
		background: var(--paper-dim);
	}
</style>
