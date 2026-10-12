<script lang="ts">
	import { SITE_URL, SITE_NAME } from '#lib/config.ts';
	import { LOCALES, BCP47, type Lang } from '#lib/i18n/index.ts';

	let {
		lang,
		title,
		description,
		path,
		alternates,
		image = '/og/home-en.png',
		jsonLd = [],
		noindex = false
	}: {
		lang: Lang;
		/** Full document title. */
		title: string;
		description: string;
		/** Canonical path of this page, starting with "/". */
		path: string;
		alternates: Partial<Record<Lang, string>>;
		image?: string;
		jsonLd?: object[];
		noindex?: boolean;
	} = $props();

	const canonical = $derived(SITE_URL + path);
	const otherLocales = $derived(
		(Object.keys(alternates) as Lang[]).filter((l) => l !== lang).map((l) => LOCALES[l])
	);
	/** Serialises JSON-LD safely for embedding in HTML. */
	const ldScripts = $derived(
		jsonLd.map(
			(data) =>
				`<script type="application/ld+json">${JSON.stringify(data)
					.replace(/</g, '\\u003c')
					.replace(/>/g, '\\u003e')
					.replace(/&/g, '\\u0026')}</` + 'script>'
		)
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if noindex}
		<meta name="robots" content="noindex, follow" />
	{:else}
		<meta name="robots" content="index, follow, max-image-preview:large" />
	{/if}
	<link rel="canonical" href={canonical} />
	{#each Object.entries(alternates) as [code, href] (code)}
		<link rel="alternate" hreflang={BCP47[code as Lang]} href={SITE_URL + href} />
	{/each}
	{#if alternates.en}
		<link rel="alternate" hreflang="x-default" href={SITE_URL + alternates.en} />
	{/if}

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={SITE_URL + image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={title} />
	<meta property="og:locale" content={LOCALES[lang]} />
	{#each otherLocales as locale (locale)}
		<meta property="og:locale:alternate" content={locale} />
	{/each}
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={SITE_URL + image} />

	{#each ldScripts as script, i (i)}
		{@html script}
	{/each}
</svelte:head>
