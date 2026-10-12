<script lang="ts" module>
	export interface PreviewGeometry {
		/** CSS pixels per PDF point. */
		scale: number;
		/** Displayed page size in points (page rotation applied). */
		width: number;
		height: number;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { renderPage, isRenderCancelled, type PDFDocumentProxy } from '#lib/pdf/pdfjs.ts';

	let {
		doc,
		pageNumber,
		maxWidth = 640,
		maxHeight = 820,
		overlay,
		label
	}: {
		doc: PDFDocumentProxy;
		pageNumber: number;
		maxWidth?: number;
		maxHeight?: number;
		overlay?: Snippet<[PreviewGeometry]>;
		label?: string;
	} = $props();

	let host = $state<HTMLDivElement>();
	let canvas = $state<HTMLCanvasElement>();
	let available = $state(0);
	let size = $state<{ width: number; height: number } | null>(null);
	let ready = $state(false);

	$effect(() => {
		if (!host) return;
		const observer = new ResizeObserver((entries) => {
			available = Math.floor(entries[0].contentRect.width);
		});
		observer.observe(host);
		return () => observer.disconnect();
	});

	$effect(() => {
		let cancelled = false;
		ready = false;
		doc.getPage(pageNumber).then((page) => {
			if (cancelled) return;
			const viewport = page.getViewport({ scale: 1 });
			size = { width: viewport.width, height: viewport.height };
		});
		return () => {
			cancelled = true;
		};
	});

	const geometry = $derived.by<PreviewGeometry | null>(() => {
		if (!size || !available) return null;
		const scale = Math.min(Math.min(maxWidth, available) / size.width, maxHeight / size.height);
		return { scale, width: size.width, height: size.height };
	});

	$effect(() => {
		if (!geometry || !canvas) return;
		const controller = new AbortController();
		const target = canvas;
		const scale = geometry.scale;
		(async () => {
			const page = await doc.getPage(pageNumber);
			if (controller.signal.aborted) return;
			const scratch = document.createElement('canvas');
			await renderPage(page, scratch, {
				scale,
				pixelRatio: Math.min(2, window.devicePixelRatio || 1),
				signal: controller.signal
			});
			if (controller.signal.aborted) return;
			target.width = scratch.width;
			target.height = scratch.height;
			target.getContext('2d')?.drawImage(scratch, 0, 0);
			scratch.width = scratch.height = 0;
			ready = true;
		})().catch((error) => {
			if (!isRenderCancelled(error)) console.error(error);
		});
		return () => controller.abort();
	});
</script>

<div class="host" bind:this={host}>
	{#if geometry}
		<div
			class="page"
			class:ready
			style:width={`${geometry.width * geometry.scale}px`}
			style:height={`${geometry.height * geometry.scale}px`}
		>
			<canvas bind:this={canvas} aria-label={label} role={label ? 'img' : undefined}></canvas>
			{#if overlay}
				<div class="overlay">{@render overlay(geometry)}</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.host {
		display: grid;
		justify-items: center;
		width: 100%;
	}

	.page {
		position: relative;
		background: #fff;
		box-shadow: var(--shadow-sheet);
	}

	canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		transition: opacity 160ms ease;
	}

	.ready canvas {
		opacity: 1;
	}

	.overlay {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}
</style>
