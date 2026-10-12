<script lang="ts">
	import { useI18n, fmt } from '#lib/i18n/index.ts';
	import { sortable } from '#lib/actions/sortable.ts';
	import PageThumb from '#lib/components/PageThumb.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { useEditor } from './context.ts';

	let {
		onjump,
		onnotice
	}: { onjump: (index: number) => void; onnotice: (message: string) => void } = $props();
	const editor = useEditor();
	const i18n = useI18n();
</script>

<aside class="panel" aria-label={i18n.t.editor.pagesPanel}>
	<ol use:sortable={{ onReorder: (from, to) => editor.movePage(from, to) }}>
		{#each editor.pages as page, index (page.key)}
			<li data-sortable class:current={index === editor.currentPage}>
				<button
					class="thumb-btn"
					onclick={() => onjump(index)}
					aria-label={fmt(i18n.t.common.page, { n: index + 1 })}
					aria-current={index === editor.currentPage ? 'page' : undefined}
				>
					{#if page.kind === 'doc'}
						<PageThumb
							doc={editor.doc}
							pageNumber={page.index + 1}
							rotation={page.rotation}
							width={120}
						/>
					{:else}
						<span
							class="blank"
							style:aspect-ratio={page.rotation % 180
								? `${page.height} / ${page.width}`
								: `${page.width} / ${page.height}`}
						></span>
					{/if}
				</button>
				<div class="row">
					<span class="num">{index + 1}</span>
					<button
						class="icon-btn"
						onclick={() => editor.rotatePage(page.key, 90)}
						aria-label={i18n.t.editor.rotatePage}
						title={i18n.t.editor.rotatePage}
					>
						<Icon name="rotateRight" size={16} />
					</button>
					<button
						class="icon-btn"
						onclick={() => {
							if (!editor.deletePage(page.key)) onnotice(i18n.t.editor.cantDeleteLast);
						}}
						aria-label={i18n.t.editor.deletePage}
						title={i18n.t.editor.deletePage}
					>
						<Icon name="trash" size={16} />
					</button>
				</div>
			</li>
		{/each}
	</ol>
	<button class="btn add" onclick={() => editor.insertBlankPage(editor.currentPage)}>
		<Icon name="plus" size={18} />
		{i18n.t.editor.addBlankPage}
	</button>
</aside>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
		height: 100%;
		padding: 14px 12px;
		overflow-y: auto;
		background: var(--paper);
		border-right: 1px solid var(--line);
	}

	ol {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 12px;
	}

	li {
		display: grid;
		gap: 4px;
		padding: 6px;
		border-radius: var(--radius-m);
		border: 2px solid transparent;
		cursor: grab;
	}

	li.current {
		border-color: var(--royal);
		background: var(--royal-tint);
	}

	li:global(.sortable-ghost) {
		opacity: 0.4;
	}

	.thumb-btn {
		display: block;
		width: 100%;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
	}

	.thumb-btn :global(.thumb),
	.blank {
		box-shadow: 0 1px 3px rgb(22 33 58 / 0.25);
	}

	.blank {
		display: block;
		width: 100%;
		background: #fff;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.num {
		flex: 1;
		font-size: 0.85rem;
		font-weight: 650;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}

	.row .icon-btn {
		width: 28px;
		height: 28px;
	}

	.add {
		min-height: 38px;
		font-size: 0.9rem;
		border-style: dashed;
	}
</style>
