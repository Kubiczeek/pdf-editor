<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	import { useI18n } from '#lib/i18n/index.ts';

	let {
		kind = 'info',
		children,
		ondismiss
	}: { kind?: 'info' | 'error' | 'success'; children: Snippet; ondismiss?: () => void } = $props();

	const i18n = useI18n();
</script>

<div class="notice {kind}" role={kind === 'error' ? 'alert' : 'status'}>
	<Icon name={kind === 'error' ? 'alert' : kind === 'success' ? 'check' : 'info'} size={20} />
	<div class="body">{@render children()}</div>
	{#if ondismiss}
		<button class="icon-btn dismiss" onclick={ondismiss} aria-label={i18n.t.common.close}>
			<Icon name="x" size={16} />
		</button>
	{/if}
</div>

<style>
	.body {
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.dismiss {
		width: 28px;
		height: 28px;
		margin: -4px -6px -4px 0;
	}
</style>
