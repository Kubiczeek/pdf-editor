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
	<button type="button" class="btn fd-compact" onclick={choose}>
		<Icon name="plus" size={18} />
		{buttonLabel ?? i18n.t.common.addMore}
	</button>
{:else}
	<div
		class="fd-drop"
		class:fd-over={over || windowOver}
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
		<div class="fd-icon" aria-hidden="true">
			<Icon name={accepts === 'image' ? 'image' : 'file'} size={34} strokeWidth={1.6} />
		</div>
		{#if title}<p class="fd-title">{title}</p>{/if}
		<button type="button" class="btn btn-primary btn-lg" onclick={choose}>
			<Icon name="upload" size={20} />
			{label}
		</button>
		<p class="fd-sub">{subtitle ?? (multiple ? i18n.t.common.orDropMany : i18n.t.common.orDrop)}</p>
		<p class="fd-local"><Icon name="shield" size={16} /> {i18n.t.common.staysLocal}</p>
	</div>
{/if}

{#if windowOver && !compact}
	<div class="fd-overlay" aria-hidden="true">
		<div><Icon name="upload" size={40} /> {i18n.t.common.dropNow}</div>
	</div>
{/if}
