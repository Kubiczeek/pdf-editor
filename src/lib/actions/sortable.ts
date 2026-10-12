import type { Action } from 'svelte/action';

export interface SortableOptions {
	/** Called with indices among the draggable children. */
	onReorder: (from: number, to: number) => void;
	/** CSS selector of the drag handle (defaults to the whole item). */
	handle?: string;
	/** CSS selector of draggable items. */
	draggable?: string;
	disabled?: boolean;
}

/**
 * Drag-and-drop reordering via SortableJS (works with mouse and touch).
 * Sortable moves DOM nodes itself; we undo that move and let Svelte re-render
 * from state, so the keyed {#each} stays the single source of truth.
 */
export const sortable: Action<HTMLElement, SortableOptions> = (node, initial) => {
	let options = initial;
	let instance: { destroy(): void; option(name: string, value: unknown): void } | null = null;
	let destroyed = false;

	// The exact node that followed the dragged item (may be a comment anchor Svelte relies on).
	let originalNext: Node | null = null;

	import('sortablejs').then(({ default: Sortable }) => {
		if (destroyed) return;
		instance = Sortable.create(node, {
			animation: 160,
			handle: options.handle,
			draggable: options.draggable ?? '[data-sortable]',
			delay: 180,
			delayOnTouchOnly: true,
			ghostClass: 'sortable-ghost',
			chosenClass: 'sortable-chosen',
			dragClass: 'sortable-drag',
			disabled: options.disabled ?? false,
			onStart(event) {
				originalNext = event.item.nextSibling;
			},
			onEnd(event) {
				const from = event.oldDraggableIndex;
				const to = event.newDraggableIndex;
				if (from === undefined || to === undefined || from === to) return;
				// Put the node back where Svelte expects it before updating state.
				event.from.insertBefore(event.item, originalNext);
				originalNext = null;
				options.onReorder(from, to);
			}
		});
	});

	return {
		update(next) {
			options = next;
			instance?.option('disabled', next.disabled ?? false);
		},
		destroy() {
			destroyed = true;
			instance?.destroy();
		}
	};
};

/** Returns a copy of `list` with the item at `from` moved to `to`. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
	const copy = list.slice();
	const [item] = copy.splice(from, 1);
	copy.splice(to, 0, item);
	return copy;
}
