<script lang="ts">
	import { useI18n } from '#lib/i18n/index.ts';
	import { pickFiles } from '#lib/pdf/files.ts';
	import { ACCEPT } from '#lib/tools-ui/shared.ts';
	import Icon from './Icon.svelte';

	let {
		accepts = 'pdf',
		multiple = false,
		onfiles,
		title,
		subtitle,
		buttonLabel,
		compact = false,
		global = true
	}: {
		accepts?: 'pdf' | 'image';
		multiple?: boolean;
		onfiles: (files: File[]) => void;
		title?: string;
		subtitle?: string;
		buttonLabel?: string;
		/** Small inline variant used for "add more". */
		compact?: boolean;
		/** Also accept files dropped anywhere on the page. */
		global?: boolean;
	} = $props();

	const i18n = useI18n();
	let over = $state(false);
	let windowOver = $state(false);
	let depth = 0;

	const label = $derived(
		buttonLabel ??
			(accepts === 'image'
				? i18n.t.common.chooseImages
				: multiple
					? i18n.t.common.choosePdfs
					: i18n.t.common.choosePdf)
	);

	async function choose() {
		const files = await pickFiles(ACCEPT[accepts], multiple);
		if (files.length) onfiles(multiple ? files : files.slice(0, 1));
	}

	function hasFiles(event: DragEvent) {
		return Array.from(event.dataTransfer?.types ?? []).includes('Files');
	}

	function onDrop(event: DragEvent) {
		if (!hasFiles(event)) return;
		event.preventDefault();
		event.stopPropagation();
		over = false;
		windowOver = false;
		depth = 0;
		const files = Array.from(event.dataTransfer?.files ?? []);
		if (files.length) onfiles(multiple ? files : files.slice(0, 1));
	}

	function onWindowDragEnter(event: DragEvent) {
		if (!global || !hasFiles(event)) return;
		depth++;
		windowOver = true;
	}

	function onWindowDragLeave(event: DragEvent) {
		if (!global || !hasFiles(event)) return;
		depth = Math.max(0, depth - 1);
		if (depth === 0) windowOver = false;
	}

	function onWindowDragOver(event: DragEvent) {
		if (!global || !hasFiles(event)) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
	}

	function onWindowDrop(event: DragEvent) {
		if (!global) return;
		onDrop(event);
	}
</script>

<svelte:window
	ondragenter={onWindowDragEnter}
	ondragleave={onWindowDragLeave}
	ondragover={onWindowDragOver}
	ondrop={onWindowDrop}
/>

{#if compact}
	<button type="button" class="btn compact" onclick={choose}>
		<Icon name="plus" size={18} />
		{buttonLabel ?? i18n.t.common.addMore}
	</button>
{:else}
	<div
		class="drop"
		class:over={over || windowOver}
		role="presentation"
		ondragenter={(e) => hasFiles(e) && (over = true)}
		ondragover={(e) => {
			if (hasFiles(e)) {
				e.preventDefault();
				over = true;
			}
		}}
		ondragleave={(e) => {
			if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) over = false;
		}}
		ondrop={onDrop}
	>
		<div class="sheet-icon" aria-hidden="true">
			<Icon name={accepts === 'image' ? 'image' : 'file'} size={34} strokeWidth={1.6} />
		</div>
		{#if title}<p class="title">{title}</p>{/if}
		<button type="button" class="btn btn-primary btn-lg" onclick={choose}>
			<Icon name="upload" size={20} />
			{label}
		</button>
		<p class="sub">{subtitle ?? (multiple ? i18n.t.common.orDropMany : i18n.t.common.orDrop)}</p>
		<p class="local"><Icon name="shield" size={16} /> {i18n.t.common.staysLocal}</p>
	</div>
{/if}

{#if windowOver && !compact}
	<div class="window-overlay" aria-hidden="true">
		<div><Icon name="upload" size={40} /> {i18n.t.common.dropNow}</div>
	</div>
{/if}

<style>
	.drop {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		min-height: 300px;
		padding: 40px 24px;
		border: 2px dashed var(--line-strong);
		border-radius: var(--radius-l);
		background: var(--paper);
		text-align: center;
		transition:
			background-color 140ms ease,
			border-color 140ms ease;
	}

	.drop.over {
		border-color: #d9b81c;
		background: var(--highlight-soft);
	}

	.sheet-icon {
		display: grid;
		place-items: center;
		width: 72px;
		height: 72px;
		border-radius: 18px;
		background: var(--royal-tint);
		color: var(--royal);
		margin-bottom: 4px;
	}

	.title {
		font-family: var(--font-display);
		font-size: 1.45rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.sub {
		color: var(--ink-2);
	}

	.local {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 6px;
		font-size: 0.88rem;
		color: var(--ink-3);
	}

	.local :global(svg) {
		color: var(--ok);
	}

	.compact {
		border-style: dashed;
	}

	.window-overlay {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: grid;
		place-items: center;
		background: rgb(255 243 168 / 0.82);
		pointer-events: none;
	}

	.window-overlay div {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 22px 32px;
		border: 2px dashed #b89a0f;
		border-radius: var(--radius-l);
		background: var(--paper);
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
	}
</style>
