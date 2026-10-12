<script lang="ts">
	import type { Component } from 'svelte';
	import { SITE_URL, SITE_NAME } from '#lib/config.ts';
	import { homePath, BCP47, type Lang } from '#lib/i18n/index.ts';
	import { TOOLS, toolPath, type ToolId, type ToolProps } from '#lib/tools/registry.ts';
	import { TOOL_ICONS } from '#lib/tools/icons.ts';
	import type { ToolContent, PageLabels } from '#lib/content/types.ts';
	import { useI18n } from '#lib/i18n/index.ts';
	import Seo from './Seo.svelte';
	import Icon from './Icon.svelte';

	let {
		lang,
		toolId,
		content,
		labels,
		related,
		alternates,
		component: ToolComponent
	}: {
		lang: Lang;
		toolId: ToolId;
		content: ToolContent;
		labels: PageLabels;
		related: ToolId[];
		alternates: Record<Lang, string>;
		component: Component<ToolProps>;
	} = $props();

	const i18n = useI18n();
	const tool = $derived(TOOLS[toolId]);
	const path = $derived(toolPath(lang, toolId));
	const fullTitle = $derived(`${content.title} | ${SITE_NAME}`);
	const featureIcons = ['shield', 'sparkle', 'globe'] as const;

	const jsonLd = $derived([
		{
			'@context': 'https://schema.org',
			'@type': 'WebApplication',
			name: `${i18n.t.tools[toolId].name} – ${SITE_NAME}`,
			url: SITE_URL + path,
			description: content.description,
			applicationCategory: 'BusinessApplication',
			operatingSystem: 'Any',
			browserRequirements: 'Requires JavaScript and a modern web browser',
			inLanguage: BCP47[lang],
			isAccessibleForFree: true,
			offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
			featureList: content.features.map((feature) => feature.title)
		},
		{
			'@context': 'https://schema.org',
			'@type': 'HowTo',
			name: content.stepsTitle,
			step: content.steps.map((text, index) => ({
				'@type': 'HowToStep',
				position: index + 1,
				text
			}))
		},
		{
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: content.faq.map((item) => ({
				'@type': 'Question',
				name: item.q,
				acceptedAnswer: { '@type': 'Answer', text: item.a }
			}))
		},
		{
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL + homePath(lang) },
				{ '@type': 'ListItem', position: 2, name: i18n.t.tools[toolId].name, item: SITE_URL + path }
			]
		}
	]);
</script>

<Seo
	{lang}
	title={fullTitle}
	description={content.description}
	{path}
	{alternates}
	image={`/og/${toolId}-${lang}.png`}
	{jsonLd}
/>

<div class="tool-page" style:--tool={tool.color}>
	<header class="wrap intro">
		<nav class="crumbs" aria-label="Breadcrumb">
			<a href={homePath(lang)}>{labels.breadcrumbHome}</a>
			<Icon name="chevronRight" size={14} />
			<span aria-current="page">{i18n.t.tools[toolId].name}</span>
		</nav>
		<div class="title-row">
			<span class="tool-icon"><Icon name={TOOL_ICONS[toolId]} size={28} /></span>
			<h1>{content.h1}</h1>
		</div>
		<p class="lead">{content.lead}</p>
	</header>

	<section class="wrap stage" aria-label={i18n.t.tools[toolId].name}>
		<ToolComponent {toolId} />
	</section>

	<section class="wrap info">
		<div class="howto">
			<h2>{content.stepsTitle}</h2>
			<ol>
				{#each content.steps as step, index (index)}
					<li><span class="num">{index + 1}</span><span>{step}</span></li>
				{/each}
			</ol>
		</div>
		<div class="why">
			<h2>{labels.why}</h2>
			<ul>
				{#each content.features as feature, index (index)}
					<li>
						<span class="feature-icon"><Icon name={featureIcons[index % featureIcons.length]} size={20} /></span>
						<div>
							<h3>{feature.title}</h3>
							<p>{feature.text}</p>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<section class="wrap faq">
		<h2>{labels.faq}</h2>
		<div class="faq-list">
			{#each content.faq as item, index (index)}
				<details>
					<summary>{item.q}<Icon name="chevronDown" size={20} /></summary>
					<p>{item.a}</p>
				</details>
			{/each}
		</div>
	</section>

	<section class="wrap related">
		<h2>{labels.related}</h2>
		<ul>
			{#each related as id (id)}
				<li>
					<a href={toolPath(lang, id)} style:--tool={TOOLS[id].color}>
						<span class="mini-icon"><Icon name={TOOL_ICONS[id]} size={20} /></span>
						<span>
							<strong>{i18n.t.tools[id].name}</strong>
							<small>{i18n.t.tools[id].short}</small>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	.intro {
		padding-top: clamp(24px, 4vw, 44px);
		padding-bottom: 24px;
	}

	.crumbs {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.9rem;
		color: var(--ink-3);
		margin-bottom: 18px;
	}

	.crumbs a {
		color: var(--ink-2);
		text-decoration: none;
	}

	.crumbs a:hover {
		text-decoration: underline;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.tool-icon {
		display: grid;
		place-items: center;
		flex: none;
		width: 56px;
		height: 56px;
		border-radius: 14px;
		background: var(--paper);
		color: var(--tool);
		box-shadow: var(--shadow-sheet);
		/* A folded corner, like a sheet of paper. */
		clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%);
	}

	.lead {
		max-width: 62ch;
		margin-top: 14px;
		font-size: 1.15rem;
		color: var(--ink-2);
	}

	.stage {
		margin-bottom: 72px;
	}

	.info {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: clamp(32px, 6vw, 80px);
		margin-bottom: 72px;
	}

	.info h2,
	.faq h2,
	.related h2 {
		margin-bottom: 22px;
	}

	ol {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 16px;
		counter-reset: none;
	}

	ol li {
		display: flex;
		gap: 14px;
		align-items: flex-start;
	}

	.num {
		display: grid;
		place-items: center;
		flex: none;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--ink);
		color: #fff;
		font-weight: 700;
		font-family: var(--font-display);
	}

	ol li span:last-child {
		padding-top: 4px;
	}

	.why ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 20px;
	}

	.why li {
		display: flex;
		gap: 14px;
	}

	.feature-icon {
		display: grid;
		place-items: center;
		flex: none;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: var(--highlight-soft);
		color: var(--ink);
	}

	.why h3 {
		margin-bottom: 4px;
	}

	.why p {
		color: var(--ink-2);
	}

	.faq {
		margin-bottom: 72px;
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

	.related ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
	}

	.related a {
		display: flex;
		gap: 12px;
		height: 100%;
		padding: 16px;
		border-radius: var(--radius-m);
		background: var(--paper);
		border: 1px solid var(--line);
		color: var(--ink);
		text-decoration: none;
	}

	.related a:hover {
		border-color: var(--line-strong);
		box-shadow: var(--shadow-sheet);
	}

	.mini-icon {
		display: grid;
		place-items: center;
		flex: none;
		width: 36px;
		height: 36px;
		border-radius: 9px;
		color: var(--tool);
		background: color-mix(in srgb, var(--tool) 12%, white);
	}

	.related strong {
		display: block;
		font-weight: 700;
	}

	.related small {
		display: block;
		color: var(--ink-2);
		font-size: 0.88rem;
		line-height: 1.35;
		margin-top: 2px;
	}

	@media (max-width: 900px) {
		.info {
			grid-template-columns: 1fr;
		}

		.related ul {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 520px) {
		.related ul {
			grid-template-columns: 1fr;
		}

		.tool-icon {
			width: 46px;
			height: 46px;
		}
	}
</style>
