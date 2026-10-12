<script lang="ts">
	import { SITE_URL, SITE_NAME, SITE_AUTHOR, SITE_AUTHOR_URL } from '#lib/config.ts';
	import { homePath, BCP47, useI18n, type Lang } from '#lib/i18n/index.ts';
	import { CATEGORY_ORDER, toolList, toolPath } from '#lib/tools/registry.ts';
	import { TOOL_ICONS } from '#lib/tools/icons.ts';
	import type { HomeContent } from '#lib/content/types.ts';
	import Seo from './Seo.svelte';
	import Icon from './Icon.svelte';
	import HomeDrop from './HomeDrop.svelte';

	let { lang, content }: { lang: Lang; content: HomeContent } = $props();

	const i18n = useI18n();
	const alternates = { en: homePath('en'), cs: homePath('cs') };
	const privacyIcons = ['shield', 'eye', 'sparkle'] as const;

	const grouped = $derived(
		CATEGORY_ORDER.map((category) => ({
			category,
			tools: toolList().filter((tool) => tool.category === category)
		}))
	);

	const jsonLd = $derived([
		{
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: SITE_NAME,
			url: SITE_URL + homePath(lang),
			inLanguage: BCP47[lang],
			description: content.description,
			publisher: { '@type': 'Person', name: SITE_AUTHOR, url: SITE_AUTHOR_URL }
		},
		{
			'@context': 'https://schema.org',
			'@type': 'WebApplication',
			name: SITE_NAME,
			url: SITE_URL + homePath(lang),
			applicationCategory: 'BusinessApplication',
			operatingSystem: 'Any',
			browserRequirements: 'Requires JavaScript and a modern web browser',
			isAccessibleForFree: true,
			offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
			featureList: toolList().map((tool) => i18n.t.tools[tool.id].name)
		},
		{
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: content.faq.map((item) => ({
				'@type': 'Question',
				name: item.q,
				acceptedAnswer: { '@type': 'Answer', text: item.a }
			}))
		}
	]);
</script>

<Seo
	{lang}
	title={`${content.title} | ${SITE_NAME}`}
	description={content.description}
	path={homePath(lang)}
	{alternates}
	image={`/og/home-${lang}.png`}
	{jsonLd}
/>

<section class="hero wrap">
	<div class="hero-text">
		<h1>{content.h1}</h1>
		<p class="lead">{content.lead}</p>
		<ul class="points">
			{#each content.points as point (point)}
				<li><Icon name="check" size={18} strokeWidth={2.4} />{point}</li>
			{/each}
		</ul>
	</div>
	<div class="hero-drop">
		<HomeDrop />
	</div>
</section>

<section class="wrap tools" id="tools">
	<h2>{content.toolsTitle}</h2>
	{#each grouped as group (group.category)}
		<div class="group">
			<h3>{i18n.t.categories[group.category]}</h3>
			<ul>
				{#each group.tools as tool (tool.id)}
					<li>
						<a href={toolPath(lang, tool.id)} style:--tool={tool.color}>
							<span class="tool-icon"><Icon name={TOOL_ICONS[tool.id]} size={22} /></span>
							<span class="text">
								<strong>{i18n.t.tools[tool.id].name}</strong>
								<small>{i18n.t.tools[tool.id].short}</small>
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</section>

<section class="privacy">
	<div class="wrap">
		<h2>{content.privacyTitle}</h2>
		<div class="privacy-grid">
			{#each content.privacy as item, index (index)}
				<div>
					<span class="p-icon"
						><Icon name={privacyIcons[index % privacyIcons.length]} size={22} /></span
					>
					<h3>{item.title}</h3>
					<p>{item.text}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="wrap faq">
	<h2>{content.faqTitle}</h2>
	<div class="faq-list">
		{#each content.faq as item, index (index)}
			<details>
				<summary>{item.q}<Icon name="chevronDown" size={20} /></summary>
				<p>{item.a}</p>
			</details>
		{/each}
	</div>
</section>

<style>
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
		align-items: center;
		gap: clamp(28px, 6vw, 80px);
		padding-top: clamp(32px, 6vw, 72px);
		padding-bottom: clamp(48px, 7vw, 96px);
	}

	h1 {
		font-size: clamp(2.2rem, 1.2rem + 3.2vw, 3.7rem);
		max-width: 17ch;
	}

	.lead {
		margin-top: 20px;
		font-size: clamp(1.1rem, 1rem + 0.4vw, 1.3rem);
		color: var(--ink-2);
		max-width: 46ch;
	}

	.points {
		list-style: none;
		margin: 28px 0 0;
		padding: 0;
		display: grid;
		gap: 10px;
		font-weight: 650;
	}

	.points li {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.points :global(svg) {
		color: var(--ok);
		flex: none;
	}

	.tools h2 {
		margin-bottom: 8px;
	}

	.group {
		margin-top: 36px;
	}

	.group h3 {
		font-family: var(--font-ui);
		font-size: 1rem;
		font-weight: 700;
		color: var(--ink-3);
		margin-bottom: 12px;
		letter-spacing: 0;
	}

	.group ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 10px;
	}

	.group a {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		height: 100%;
		padding: 14px;
		border-radius: var(--radius-m);
		background: var(--paper);
		color: var(--ink);
		text-decoration: none;
		border: 1px solid transparent;
		transition:
			border-color 120ms ease,
			box-shadow 120ms ease;
	}

	.group a:hover {
		border-color: var(--line-strong);
		box-shadow: var(--shadow-sheet);
	}

	.tool-icon {
		display: grid;
		place-items: center;
		flex: none;
		width: 42px;
		height: 42px;
		border-radius: 10px;
		color: var(--tool);
		background: color-mix(in srgb, var(--tool) 12%, white);
	}

	.text strong {
		display: block;
		font-size: 1.02rem;
	}

	.text small {
		display: block;
		color: var(--ink-2);
		font-size: 0.9rem;
		line-height: 1.35;
		margin-top: 2px;
	}

	.privacy {
		margin-top: 96px;
		padding-block: clamp(48px, 7vw, 88px);
		background: var(--paper);
		border-block: 1px solid var(--line);
	}

	.privacy-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: clamp(24px, 4vw, 48px);
		margin-top: 32px;
	}

	.p-icon {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: var(--highlight-soft);
		margin-bottom: 14px;
	}

	.privacy h3 {
		margin-bottom: 8px;
	}

	.privacy p {
		color: var(--ink-2);
	}

	.faq {
		margin-top: 96px;
	}

	.faq h2 {
		margin-bottom: 22px;
	}

	.faq-list {
		max-width: 820px;
		background: var(--paper);
		border-radius: var(--radius-l);
		box-shadow: var(--shadow-sheet);
		overflow: hidden;
	}

	details {
		border-bottom: 1px solid var(--line);
	}

	details:last-child {
		border-bottom: none;
	}

	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 18px 22px;
		font-weight: 700;
		cursor: pointer;
		list-style: none;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary :global(svg) {
		flex: none;
		color: var(--ink-3);
		transition: transform 160ms ease;
	}

	details[open] summary :global(svg) {
		transform: rotate(180deg);
	}

	summary:hover {
		background: var(--paper-dim);
	}

	details p {
		padding: 0 22px 20px;
		color: var(--ink-2);
		max-width: 70ch;
	}

	@media (max-width: 1000px) {
		.group ul {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (max-width: 860px) {
		.hero {
			grid-template-columns: 1fr;
		}

		h1 {
			max-width: 18ch;
		}

		.group ul {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.privacy-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 520px) {
		.group ul {
			grid-template-columns: 1fr;
		}
	}
</style>
