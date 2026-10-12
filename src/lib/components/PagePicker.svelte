<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PDFDocumentProxy } from '#lib/pdf/pdfjs.ts';
	import { useI18n, fmt } from '#lib/i18n/index.ts';
	import PageThumb from './PageThumb.svelte';
	import Icon from './Icon.svelte';

	let {
		doc,
		pageCount,
		selected = $bindable(new Set<number>()),
		rotations = {},
		mark = 'select',
		selectable = true,
		badge,
		size = 150
	}: {
		doc: PDFDocumentProxy;
		pageCount: number;
		selected?: Set<number>;
		rotations?: Record<number, number>;
		/** How selected pages are marked. */
		mark?: 'select' | 'remove' | 'keep';
		selectable?: boolean;
		badge?: Snippet<[number]>;
		/** Thumbnail width in CSS pixels. */
		size?: number;
	} = $props();

	const i18n = useI18n();
	let anchor = -1;

	function toggle(index: number, event: MouseEvent | KeyboardEvent) {
		if (!selectable) return;
		const next = new Set(selected);
		if (event.shiftKey && anchor >= 0) {
			const [from, to] = anchor < index ? [anchor, index] : [index, anchor];
			const value = !selected.has(index);
			for (let i = from; i <= to; i++) {
				if (value) next.add(i);
				else next.delete(i);
			}
		} else if (next.has(index)) {
			next.delete(index);
		} else {
			next.add(index);
		}
		anchor = index;
		selected = next;
	}

	const pages = $derived(Array.from({ length: pageCount }, (_, i) => i));
</script>

<ul class="grid" style:--size={`${size}px`}>
	{#each pages as index (index)}
		{@const isSelected = selected.has(index)}
		<li>
			<button
				type="button"
				class="page {mark}"
				class:selected={isSelected}
				disabled={!selectable}
				aria-pressed={selectable ? isSelected : undefined}
				aria-label={fmt(i18n.t.common.page, { n: index + 1 })}
				onclick={(event) => toggle(index, event)}
			>
				<span class="paper">
					<PageThumb {doc} pageNumber={index + 1} rotation={rotations[index] ?? 0} width={size} />
					{#if isSelected && mark !== 'select'}
						<span class="overlay" aria-hidden="true">
							<Icon name={mark === 'remove' ? 'trash' : 'check'} size={28} strokeWidth={2.2} />
						</span>
					{/if}
					{#if isSelected && mark === 'select'}
						<span class="tick" aria-hidden="true"
							><Icon name="check" size={16} strokeWidth={3} /></span
						>
					{/if}
				</span>
				<span class="label">
					{index + 1}
					{#if badge}{@render badge(index)}{/if}
				</span>
			</button>
		</li>
	{/each}
</ul>

<style>
	.grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(var(--size), 1fr));
		gap: 18px 16px;
	}

	.page {
		display: grid;
		gap: 8px;
		width: 100%;
		padding: 8px;
		border: 2px solid transparent;
		border-radius: var(--radius-m);
		background: transparent;
		cursor: pointer;
		color: var(--ink-2);
	}

	.page:disabled {
		cursor: default;
	}

	.page:not(:disabled):hover {
		background: rgb(22 33 58 / 0.05);
	}

	.paper {
		position: relative;
		display: grid;
		align-items: center;
		min-height: calc(var(--size) * 0.6);
	}

	.paper :global(.thumb) {
		box-shadow: 0 1px 3px rgb(22 33 58 / 0.2);
	}

	.label {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		font-size: 0.9rem;
		font-weight: 650;
		font-variant-numeric: tabular-nums;
	}

	.selected.select {
		border-color: var(--royal);
		background: var(--royal-tint);
	}

	.selected.keep {
		border-color: var(--ok);
		background: var(--ok-tint);
	}

	.selected.remove {
		border-color: var(--stamp);
		background: var(--stamp-tint);
	}

	.overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		color: #fff;
	}

	.remove .overlay {
		background: rgb(196 43 61 / 0.55);
	}

	.keep .overlay {
		background: rgb(22 121 74 / 0.45);
	}

	.tick {
		position: absolute;
		top: -8px;
		right: -8px;
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--royal);
		color: #fff;
		box-shadow: 0 0 0 3px var(--paper);
	}
</style>
