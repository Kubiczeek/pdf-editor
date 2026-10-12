<script lang="ts">
	import { SITE_NAME } from '#lib/config.ts';
	import { STATIC_PAGES, type Lang } from '#lib/i18n/index.ts';
	import type { PrivacyContent } from '#lib/content/types.ts';
	import Seo from './Seo.svelte';

	let { lang, content }: { lang: Lang; content: PrivacyContent } = $props();
</script>

<Seo
	{lang}
	title={`${content.title} | ${SITE_NAME}`}
	description={content.description}
	path={STATIC_PAGES.privacy[lang]}
	alternates={STATIC_PAGES.privacy}
	image={`/og/home-${lang}.png`}
/>

<article class="wrap doc">
	<h1>{content.h1}</h1>
	<p class="updated">{content.updated}</p>
	{#each content.sections as section (section.heading)}
		<section>
			<h2>{section.heading}</h2>
			{#each section.paragraphs as paragraph (paragraph)}
				<p>{paragraph}</p>
			{/each}
		</section>
	{/each}
</article>

<style>
	.doc {
		max-width: 780px;
		padding-top: clamp(32px, 6vw, 64px);
	}

	.updated {
		margin-top: 10px;
		color: var(--ink-3);
	}

	section {
		margin-top: 40px;
	}

	h2 {
		font-size: 1.45rem;
		margin-bottom: 12px;
	}

	p + p {
		margin-top: 12px;
	}

	p {
		color: var(--ink-2);
		max-width: 68ch;
	}
</style>
