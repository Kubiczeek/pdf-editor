<script lang="ts">
	import { onMount } from 'svelte';
	import { ui, type Lang } from '#lib/i18n/index.ts';
	import Icon from './Icon.svelte';

	let { lang, alternates }: { lang: Lang; alternates: Partial<Record<Lang, string>> } = $props();

	const KEY = 'kubipdf-lang-dismissed';
	let suggested = $state<Lang | null>(null);

	onMount(() => {
		try {
			if (localStorage.getItem(KEY)) return;
		} catch {
			// Storage can be blocked; the banner then simply shows.
		}
		const preferred = (navigator.languages?.length ? navigator.languages : [navigator.language])
			.filter(Boolean)
			.map((value) => value.toLowerCase());
		const wantsCzech = preferred.length > 0 && /^(cs|sk)\b/.test(preferred[0]);
		if (lang === 'en' && wantsCzech) suggested = 'cs';
		else if (
			lang === 'cs' &&
			preferred.length > 0 &&
			!wantsCzech &&
			!preferred.some((l) => /^(cs|sk)\b/.test(l))
		)
			suggested = 'en';
	});

	function dismiss() {
		suggested = null;
		try {
			localStorage.setItem(KEY, '1');
		} catch {
			// ignore
		}
	}
</script>

{#if suggested && alternates[suggested]}
	<aside class="suggest" lang={suggested} aria-label={ui[suggested].nav.language}>
		<div class="wrap row">
			<Icon name="globe" size={18} />
			<p>
				{ui[suggested].langSuggest}
				<a href={alternates[suggested]} hreflang={suggested} onclick={dismiss}
					>{ui[suggested].langSuggestLink}</a
				>
			</p>
			<button class="icon-btn" onclick={dismiss} aria-label={ui[suggested].nav.close}>
				<Icon name="x" size={18} />
			</button>
		</div>
	</aside>
{/if}

<style>
	.suggest {
		background: var(--highlight-soft);
		border-bottom: 1px solid #ecd76a;
		font-size: 0.95rem;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 44px;
	}

	p {
		flex: 1;
	}

	a {
		font-weight: 650;
		margin-left: 6px;
	}
</style>
