<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { setI18n, type Lang } from '#lib/i18n/index.ts';
	import Header from '#lib/components/Header.svelte';
	import Footer from '#lib/components/Footer.svelte';
	import PasswordDialog from '#lib/components/PasswordDialog.svelte';
	import LangSuggest from '#lib/components/LangSuggest.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	setI18n(() => data.lang);

	const alternates = $derived(
		((page.data as { alternates?: Partial<Record<Lang, string>> }).alternates ?? {}) as Partial<
			Record<Lang, string>
		>
	);

	$effect(() => {
		document.documentElement.lang = data.lang;
	});

	/** Stop the browser from opening a file dropped outside a drop zone (and losing work). */
	function guardDrop(event: DragEvent) {
		if (Array.from(event.dataTransfer?.types ?? []).includes('Files')) event.preventDefault();
	}
</script>

<svelte:window ondragover={guardDrop} ondrop={guardDrop} />

<LangSuggest lang={data.lang} {alternates} />
<Header {alternates} />
<main id="main">
	{@render children()}
</main>
<Footer />
<PasswordDialog />
