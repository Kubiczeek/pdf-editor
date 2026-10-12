import { getContext, setContext } from 'svelte';
import type { EditorState } from './state.svelte.ts';
import type { PageModel } from './types.ts';
import { deltaToBase } from './geometry.ts';

const KEY = Symbol('editor');

export function setEditor(state: EditorState): EditorState {
	setContext(KEY, state);
	return state;
}

export function useEditor(): EditorState {
	return getContext<EditorState>(KEY);
}

/**
 * Tracks a pointer drag and reports the movement in the page's base space.
 * `onStart` runs once the pointer has moved a few pixels (so plain clicks stay clicks).
 */
export function startDrag(
	event: PointerEvent,
	page: PageModel,
	zoom: number,
	handlers: {
		onStart?: () => void;
		onMove: (dx: number, dy: number, event: PointerEvent) => void;
		onEnd?: (moved: boolean) => void;
	}
): void {
	const target = event.currentTarget as Element;
	const pointerId = event.pointerId;
	try {
		target.setPointerCapture(pointerId);
	} catch {
		// Synthetic events can't capture.
	}
	const startX = event.clientX;
	const startY = event.clientY;
	let started = false;

	const move = (e: PointerEvent) => {
		if (e.pointerId !== pointerId) return;
		const cx = e.clientX - startX;
		const cy = e.clientY - startY;
		if (!started) {
			if (Math.hypot(cx, cy) < 3) return;
			started = true;
			handlers.onStart?.();
		}
		const [dx, dy] = deltaToBase(page, cx / zoom, cy / zoom);
		handlers.onMove(dx, dy, e);
	};
	const up = (e: PointerEvent) => {
		if (e.pointerId !== pointerId) return;
		target.removeEventListener('pointermove', move as EventListener);
		target.removeEventListener('pointerup', up as EventListener);
		target.removeEventListener('pointercancel', up as EventListener);
		handlers.onEnd?.(started);
	};
	target.addEventListener('pointermove', move as EventListener);
	target.addEventListener('pointerup', up as EventListener);
	target.addEventListener('pointercancel', up as EventListener);
}

/** Ends any in-progress text edit by blurring the focused element. */
export function blurActive(): void {
	const active = document.activeElement as HTMLElement | null;
	if (active && active !== document.body && typeof active.blur === 'function') active.blur();
}
