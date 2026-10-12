<script lang="ts">
	import { page } from '$app/state';
	import { SITE_NAME } from '#lib/config.ts';
	import { homePath, langFromPath } from '#lib/i18n/index.ts';

	const lang = $derived(langFromPath(page.url.pathname));
	const notFound = $derived(page.status === 404);
	const text = $derived(
		lang === 'cs'
			? {
					title: notFound ? 'Stránka nenalezena' : 'Něco se pokazilo',
					body: notFound
						? 'Tato stránka neexistuje. Možná se změnila adresa nástroje.'
						: 'Stránku se nepodařilo zobrazit. Zkuste ji obnovit.',
					back: 'Zpět na všechny nástroje'
				}
			: {
					title: notFound ? 'Page not found' : 'Something went wrong',
					body: notFound
						? 'This page doesn’t exist. The tool may have moved.'
						: 'The page couldn’t be displayed. Try reloading it.',
					back: 'Back to all tools'
				}
	);
</script>

<svelte:head>
	<title>{text.title} | {SITE_NAME}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="wrap error">
	<p class="code">{page.status}</p>
	<h1>{text.title}</h1>
	<p>{text.body}</p>
	<a class="btn btn-primary" href={homePath(lang)}>{text.back}</a>
</section>

<style>
	.error {
		display: grid;
		justify-items: start;
		gap: 16px;
		padding-block: clamp(48px, 10vw, 120px);
	}

	.code {
		font-family: var(--font-display);
		font-size: 5rem;
		font-weight: 800;
		line-height: 1;
		color: var(--line-strong);
	}

	.error > p:not(.code) {
		color: var(--ink-2);
		max-width: 50ch;
	}
</style>
