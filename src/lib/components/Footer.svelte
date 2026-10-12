<script lang="ts">
	import { useI18n, homePath, STATIC_PAGES } from '#lib/i18n/index.ts';
	import { SITE_NAME, SITE_AUTHOR, SITE_AUTHOR_URL } from '#lib/config.ts';
	import { CATEGORY_ORDER, toolList, toolPath } from '#lib/tools/registry.ts';
	import Logo from './Logo.svelte';
	import Icon from './Icon.svelte';

	const i18n = useI18n();
	const grouped = $derived(
		CATEGORY_ORDER.map((category) => ({
			category,
			tools: toolList().filter((tool) => tool.category === category)
		}))
	);
	const year = new Date().getFullYear();
</script>

<footer class="site-footer">
	<div class="wrap">
		<div class="top">
			<div class="about">
				<a class="brand" href={homePath(i18n.lang)}>
					<Logo size={28} />
					<span>{SITE_NAME}</span>
				</a>
				<p>{i18n.t.footer.tagline}</p>
				<p class="local"><Icon name="shield" size={18} /> {i18n.t.footer.local}</p>
			</div>
			<nav class="cols" aria-label={i18n.t.nav.allTools}>
				{#each grouped as group (group.category)}
					<div>
						<h2>{i18n.t.categories[group.category]}</h2>
						<ul>
							{#each group.tools as tool (tool.id)}
								<li><a href={toolPath(i18n.lang, tool.id)}>{i18n.t.tools[tool.id].name}</a></li>
							{/each}
						</ul>
					</div>
				{/each}
			</nav>
		</div>
		<div class="bottom">
			<p>
				© {year}
				{SITE_NAME} · {i18n.t.footer.madeBy} <a href={SITE_AUTHOR_URL}>{SITE_AUTHOR}</a>
			</p>
			<p><a href={STATIC_PAGES.privacy[i18n.lang]}>{i18n.t.footer.privacy}</a></p>
			<p class="fonts">{i18n.t.footer.fonts}</p>
		</div>
	</div>
</footer>

<style>
	.site-footer {
		margin-top: 96px;
		background: var(--ink);
		color: #c9d1e0;
		padding-block: 56px 32px;
		font-size: 0.95rem;
	}

	.site-footer a {
		color: #e8ecf5;
		text-decoration: none;
	}

	.site-footer a:hover {
		color: #fff;
		text-decoration: underline;
	}

	.top {
		display: grid;
		grid-template-columns: minmax(220px, 1fr) 3fr;
		gap: 48px;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		font-family: var(--font-display);
		font-weight: 750;
		font-size: 1.25rem;
		color: #fff !important;
		margin-bottom: 12px;
	}

	.about p {
		max-width: 32ch;
		margin-bottom: 12px;
	}

	.local {
		display: flex;
		gap: 8px;
		align-items: flex-start;
		color: #e8ecf5;
	}

	.local :global(svg) {
		flex: none;
		margin-top: 2px;
		color: var(--highlight);
	}

	.cols {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 24px;
	}

	h2 {
		font-family: var(--font-ui);
		font-size: 0.85rem;
		font-weight: 700;
		color: #8f9bb3;
		margin-bottom: 12px;
		letter-spacing: 0;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 8px;
	}

	.bottom a {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.bottom {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 24px;
		margin-top: 48px;
		padding-top: 20px;
		border-top: 1px solid rgb(255 255 255 / 0.12);
		color: #8f9bb3;
		font-size: 0.88rem;
	}

	.fonts {
		flex-basis: 100%;
	}

	@media (max-width: 900px) {
		.top {
			grid-template-columns: 1fr;
		}

		.cols {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
