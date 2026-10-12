<script lang="ts">
	import { renderPage, type PDFDocumentProxy } from '#lib/pdf/pdfjs.ts';
	import { scheduleRender } from '#lib/pdf/thumbs.ts';

	let {
		doc,
		pageNumber,
		rotation = 0,
		width = 160,
		label = ''
	}: {
		doc: PDFDocumentProxy;
		/** One-based page number. */
		pageNumber: number;
		/** Extra rotation in degrees on top of the page's own. */
		rotation?: number;
		/** Target CSS width used for render resolution. */
		width?: number;
		label?: string;
	} = $props();

	let box = $state<HTMLSpanElement>();
	let canvas = $state<HTMLCanvasElement>();
	let baseSize = $state<{ w: number; h: number; rotate: number } | null>(null);
	let visible = $state(false);
	let ready = $state(false);

	const ratio = $derived.by(() => {
		if (!baseSize) return 1.4142;
		const turns = (((baseSize.rotate + rotation) % 360) + 360) % 360;
		return turns === 90 || turns === 270 ? baseSize.w / baseSize.h : baseSize.h / baseSize.w;
	});

	$effect(() => {
		let cancelled = false;
		doc.getPage(pageNumber).then(
			(page) => {
				if (cancelled) return;
				const viewport = page.getViewport({ scale: 1, rotation: 0 });
				baseSize = { w: viewport.width, h: viewport.height, rotate: page.rotate };
			},
			() => undefined
		);
		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		if (!box) return;
		const observer = new IntersectionObserver(
			(entries) => {
				visible = entries.some((entry) => entry.isIntersecting);
			},
			{ rootMargin: '400px' }
		);
		observer.observe(box);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (!visible || !canvas) return;
		const target = canvas;
		const controller = new AbortController();
		const extra = rotation;
		const cssWidth = width;
		scheduleRender(async () => {
			const page = await doc.getPage(pageNumber);
			if (controller.signal.aborted) return;
			const viewport = page.getViewport({ scale: 1, rotation: (page.rotate + extra) % 360 });
			const scratch = document.createElement('canvas');
			await renderPage(page, scratch, {
				scale: cssWidth / viewport.width,
				rotation: extra,
				pixelRatio: Math.min(2, window.devicePixelRatio || 1),
				signal: controller.signal
			});
			if (controller.signal.aborted) return;
			target.width = scratch.width;
			target.height = scratch.height;
			target.getContext('2d')?.drawImage(scratch, 0, 0);
			scratch.width = scratch.height = 0;
			ready = true;
		}, controller.signal);
		return () => controller.abort();
	});
</script>

<span class="thumb" class:ready bind:this={box} style:aspect-ratio={`1 / ${ratio}`}>
	<canvas bind:this={canvas} aria-label={label || undefined} role={label ? 'img' : undefined}
	></canvas>
</span>

<style>
	.thumb {
		position: relative;
		display: block;
		width: 100%;
		background:
			linear-gradient(110deg, #f3f5f9 30%, #fafbfd 50%, #f3f5f9 70%) 0 0 / 300% 100%,
			#f3f5f9;
		animation: shimmer 1.6s linear infinite;
		overflow: hidden;
	}

	.thumb.ready {
		background: #fff;
		animation: none;
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

	@keyframes shimmer {
		to {
			background-position: -300% 0;
		}
	}
</style>
