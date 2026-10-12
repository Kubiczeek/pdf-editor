<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { useI18n, homePath, type Lang } from '#lib/i18n/index.ts';
	import { SITE_NAME } from '#lib/config.ts';
	import { CATEGORY_ORDER, toolList, toolPath, type ToolId } from '#lib/tools/registry.ts';
	import { TOOL_ICONS } from '#lib/tools/icons.ts';
	import Logo from './Logo.svelte';
	import Icon from './Icon.svelte';

	let { alternates }: { alternates: Partial<Record<Lang, string>> } = $props();

	const i18n = useI18n();
	const quick: ToolId[] = ['edit', 'sign', 'merge', 'compress'];
	let open = $state(false);
	let menuEl = $state<HTMLElement>();
	let toggleEl = $state<HTMLButtonElement>();

	const otherLang = $derived<Lang>(i18n.lang === 'en' ? 'cs' : 'en');
	const otherHref = $derived(alternates[otherLang] ?? homePath(otherLang));
	const grouped = $derived(
		CATEGORY_ORDER.map((category) => ({
			category,
			tools: toolList().filter((tool) => tool.category === category)
		}))
	);

	afterNavigate(() => {
		open = false;
	});

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			open = false;
			toggleEl?.focus();
		}
	}

	function onPointerDown(event: PointerEvent) {
		if (!open) return;
		const target = event.target as Node;
		if (menuEl?.contains(target) || toggleEl?.contains(target)) return;
		open = false;
	}
</script>

<svelte:window onkeydown={onKeydown} onpointerdown={onPointerDown} />

<header class="site-header">
	<a class="skip" href="#main">{i18n.t.nav.skip}</a>
	<div class="wrap bar">
		<a class="brand" href={homePath(i18n.lang)} aria-label={`${SITE_NAME} – ${i18n.t.nav.home}`}>
			<Logo size={30} />
			<span>{SITE_NAME}</span>
		</a>

		<nav class="quick" aria-label={i18n.t.nav.popular}>
			{#each quick as id (id)}
				<a href={toolPath(i18n.lang, id)}>{i18n.t.tools[id].name}</a>
			{/each}
		</nav>

		<div class="end">
			<button
				bind:this={toggleEl}
				class="menu-toggle"
				aria-expanded={open}
				aria-controls="tools-menu"
				onclick={() => (open = !open)}
			>
				<Icon name={open ? 'x' : 'grid'} size={20} />
				<span>{i18n.t.nav.allTools}</span>
			</button>
			<a
				class="lang"
				href={otherHref}
				hreflang={otherLang}
				lang={otherLang}
				title={i18n.t.nav.switchToLabel}
			>
				<Icon name="globe" size={18} />
				<span>{i18n.t.nav.switchTo}</span>
			</a>
		</div>
	</div>

	<div
		id="tools-menu"
		class="menu"
		class:open
		bind:this={menuEl}
		hidden={!open}
		aria-label={i18n.t.nav.allTools}
	>
		<div class="wrap menu-grid">
			{#each grouped as group (group.category)}
				<section>
					<h2>{i18n.t.categories[group.category]}</h2>
					<ul>
						{#each group.tools as tool (tool.id)}
							<li>
								<a href={toolPath(i18n.lang, tool.id)}>
									<span class="ico" style:--tool={tool.color}>
										<Icon name={TOOL_ICONS[tool.id]} size={18} />
									</span>
									{i18n.t.tools[tool.id].name}
								</a>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	</div>
</header>

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 50;
		background: color-mix(in srgb, var(--desk) 88%, transparent);
		backdrop-filter: saturate(1.4) blur(10px);
		-webkit-backdrop-filter: saturate(1.4) blur(10px);
		border-bottom: 1px solid var(--line);
	}

	.skip {
		position: absolute;
		left: 12px;
		top: 10px;
		padding: 8px 14px;
		background: var(--paper);
		border-radius: var(--radius-s);
		z-index: 60;
		transform: translateY(-200%);
		opacity: 0;
		pointer-events: none;
	}

	.skip:focus {
		transform: none;
		opacity: 1;
		pointer-events: auto;
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 20px;
		min-height: 64px;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		color: var(--ink);
		text-decoration: none;
		font-family: var(--font-display);
		font-weight: 750;
		font-size: 1.3rem;
		letter-spacing: -0.02em;
	}

	.brand:hover {
		color: var(--ink);
	}

	.quick {
		display: flex;
		gap: 4px;
		margin-left: 8px;
	}

	.quick a {
		padding: 8px 12px;
		border-radius: var(--radius-s);
		color: var(--ink-2);
		font-weight: 600;
		text-decoration: none;
		font-size: 0.98rem;
	}

	.quick a:hover {
		color: var(--ink);
		background: rgb(22 33 58 / 0.06);
	}

	.end {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-left: auto;
	}

	.menu-toggle,
	.lang {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 40px;
		padding: 6px 12px;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-m);
		background: var(--paper);
		color: var(--ink);
		font-weight: 650;
		font-size: 0.95rem;
		text-decoration: none;
		cursor: pointer;
	}

	.menu-toggle[aria-expanded='true'] {
		background: var(--highlight);
		border-color: #e3c52f;
	}

	.lang {
		border-color: transparent;
		background: transparent;
		color: var(--ink-2);
	}

	.lang:hover {
		color: var(--ink);
		background: rgb(22 33 58 / 0.06);
	}

	.menu {
		position: absolute;
		left: 0;
		right: 0;
		top: 100%;
		background: var(--paper);
		border-bottom: 1px solid var(--line);
		box-shadow: var(--shadow-pop);
		max-height: calc(100dvh - 64px);
		overflow-y: auto;
	}

	.menu[hidden] {
		display: none;
	}

	.menu-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 28px;
		padding-block: 28px 32px;
	}

	.menu h2 {
		font-size: 0.95rem;
		font-family: var(--font-ui);
		font-weight: 700;
		color: var(--ink-3);
		margin-bottom: 10px;
		letter-spacing: 0;
	}

	.menu ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 2px;
	}

	.menu a {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 7px 8px;
		margin-inline: -8px;
		border-radius: var(--radius-s);
		color: var(--ink);
		text-decoration: none;
		font-weight: 600;
	}

	.menu a:hover {
		background: var(--paper-dim);
	}

	.ico {
		display: inline-grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 8px;
		color: var(--tool);
		background: color-mix(in srgb, var(--tool) 12%, white);
		flex: none;
	}

	@media (max-width: 900px) {
		.quick {
			display: none;
		}

		.menu-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 560px) {
		.bar {
			gap: 10px;
		}

		.menu-toggle span {
			display: none;
		}

		.menu-toggle {
			padding: 6px 10px;
		}

		.lang span {
			font-size: 0.9rem;
		}

		.menu-grid {
			grid-template-columns: 1fr;
			gap: 20px;
		}
	}
</style>
