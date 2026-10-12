<script lang="ts">
	import { useI18n } from '#lib/i18n/index.ts';
	import { uid, pickFiles, readBytes } from '#lib/pdf/files.ts';
	import { cssFontFamily, loadCssFont, ensureFontFaces, type FontFamilyId } from '#lib/pdf/fonts.ts';
	import { smoothPath, pointsBounds, normaliseStroke } from './geometry.ts';
	import { useEditor } from './context.ts';
	import type { SignatureSpec } from './types.ts';
	import Icon from '#lib/components/Icon.svelte';

	let { open = $bindable(false), onuse }: { open?: boolean; onuse: (spec: SignatureSpec) => void } = $props();

	const editor = useEditor();
	const i18n = useI18n();
	let dialog = $state<HTMLDialogElement>();
	let tab = $state<'draw' | 'type' | 'upload'>('draw');
	let ink = $state('#16213a');
	const INKS = ['#16213a', '#1f35c4', '#0f7b6c', '#c42b3d'];
	const HAND_FONTS: FontFamilyId[] = ['dancing', 'vibes', 'caveat'];
	const TABS = [
		{ id: 'draw', label: 'drawTab', icon: 'pencil' },
		{ id: 'type', label: 'typeTab', icon: 'type' },
		{ id: 'upload', label: 'uploadTab', icon: 'upload' }
	] as const;

	// Draw
	let pad = $state<HTMLCanvasElement>();
	let strokes = $state<Array<Array<[number, number]>>>([]);
	let drawing = false;
	const PEN = 3;

	// Type
	let name = $state('');
	let handFont = $state<FontFamilyId>('dancing');

	// Upload
	let upload = $state<{ url: string; bytes: Uint8Array; width: number; height: number } | null>(null);
	let removeBg = $state(true);
	let uploadSource = $state<ImageBitmap | null>(null);

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			dialog.showModal();
			ensureFontFaces();
			for (const family of HAND_FONTS) void loadCssFont({ family, bold: false, italic: false });
		} else if (!open && dialog.open) dialog.close();
	});

	$effect(() => {
		// Redraw the pad whenever strokes or ink change.
		if (!pad) return;
		const ctx = pad.getContext('2d');
		if (!ctx) return;
		const ratio = window.devicePixelRatio || 1;
		const width = pad.clientWidth;
		const height = pad.clientHeight;
		if (pad.width !== Math.round(width * ratio)) {
			pad.width = Math.round(width * ratio);
			pad.height = Math.round(height * ratio);
		}
		ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
		ctx.clearRect(0, 0, width, height);
		ctx.strokeStyle = ink;
		ctx.lineWidth = PEN;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		for (const stroke of strokes) ctx.stroke(new Path2D(smoothPath(stroke)));
	});

	function padPoint(event: PointerEvent): [number, number] {
		const rect = pad!.getBoundingClientRect();
		return [event.clientX - rect.left, event.clientY - rect.top];
	}

	function padDown(event: PointerEvent) {
		event.preventDefault();
		pad!.setPointerCapture(event.pointerId);
		drawing = true;
		strokes = [...strokes, [padPoint(event)]];
	}

	function padMove(event: PointerEvent) {
		if (!drawing) return;
		const current = strokes[strokes.length - 1];
		const next = padPoint(event);
		const last = current[current.length - 1];
		if (Math.hypot(next[0] - last[0], next[1] - last[1]) >= 1) current.push(next);
	}

	function padUp() {
		drawing = false;
	}

	async function chooseUpload() {
		const [file] = await pickFiles('image/*', false);
		if (!file) return;
		try {
			uploadSource?.close();
			uploadSource = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
			await processUpload();
		} catch {
			uploadSource = null;
			upload = null;
		}
	}

	/** Optionally makes light pixels transparent and trims to the ink. */
	async function processUpload() {
		const source = uploadSource;
		if (!source) return;
		const maxSide = 1600;
		const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
		const w = Math.max(1, Math.round(source.width * scale));
		const h = Math.max(1, Math.round(source.height * scale));
		const canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
		ctx.drawImage(source, 0, 0, w, h);
		let crop = { x: 0, y: 0, w, h };
		if (removeBg) {
			const data = ctx.getImageData(0, 0, w, h);
			const px = data.data;
			let minX = w;
			let minY = h;
			let maxX = -1;
			let maxY = -1;
			for (let i = 0; i < px.length; i += 4) {
				const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
				// Fade from opaque ink (≤150) to transparent paper (≥215).
				const alpha = lum >= 215 ? 0 : lum <= 150 ? 255 : Math.round(((215 - lum) / 65) * 255);
				px[i + 3] = Math.min(px[i + 3], alpha);
				if (px[i + 3] > 40) {
					const p = i / 4;
					const x = p % w;
					const y = Math.floor(p / w);
					if (x < minX) minX = x;
					if (x > maxX) maxX = x;
					if (y < minY) minY = y;
					if (y > maxY) maxY = y;
				}
			}
			ctx.putImageData(data, 0, 0);
			if (maxX >= 0) {
				const margin = 6;
				crop = {
					x: Math.max(0, minX - margin),
					y: Math.max(0, minY - margin),
					w: Math.min(w, maxX + margin) - Math.max(0, minX - margin),
					h: Math.min(h, maxY + margin) - Math.max(0, minY - margin)
				};
			}
		}
		const out = document.createElement('canvas');
		out.width = crop.w;
		out.height = crop.h;
		out.getContext('2d')!.drawImage(canvas, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
		const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/png'));
		canvas.width = canvas.height = 0;
		if (!blob) return;
		if (upload) URL.revokeObjectURL(upload.url);
		upload = { url: URL.createObjectURL(blob), bytes: await readBytes(blob), width: crop.w, height: crop.h };
	}

	function renderPreview(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): string {
		const canvas = document.createElement('canvas');
		canvas.width = 240;
		canvas.height = 80;
		const ctx = canvas.getContext('2d')!;
		draw(ctx, 240, 80);
		return canvas.toDataURL('image/png');
	}

	const canUse = $derived(
		tab === 'draw' ? strokes.length > 0 : tab === 'type' ? name.trim().length > 0 : upload !== null
	);

	function use() {
		let spec: SignatureSpec | null = null;
		if (tab === 'draw' && strokes.length) {
			const all = strokes.flat();
			const box = pointsBounds(all, PEN / 2);
			const w = Math.max(box.w, 1);
			const h = Math.max(box.h, 1);
			const normalBox = { x: box.x, y: box.y, w, h };
			const normalised = strokes.map((s) => normaliseStroke(s, normalBox));
			const color = ink;
			spec = {
				id: uid('sig'),
				kind: 'ink',
				strokes: normalised,
				aspect: w / h,
				color,
				width: PEN / w,
				preview: renderPreview((ctx, pw, ph) => {
					const s = Math.min(pw / w, ph / h) * 0.9;
					ctx.translate((pw - w * s) / 2, (ph - h * s) / 2);
					ctx.scale(s, s);
					ctx.strokeStyle = color;
					ctx.lineWidth = PEN;
					ctx.lineCap = 'round';
					ctx.lineJoin = 'round';
					for (const stroke of strokes) ctx.stroke(new Path2D(smoothPath(stroke.map(([x, y]) => [x - box.x, y - box.y]))));
				})
			};
		} else if (tab === 'type' && name.trim()) {
			const text = name.trim();
			const family = handFont;
			const color = ink;
			const measure = document.createElement('canvas').getContext('2d')!;
			measure.font = `48px ${cssFontFamily(family)}`;
			const width = measure.measureText(text).width;
			spec = {
				id: uid('sig'),
				kind: 'text',
				text,
				family,
				aspect: width / (48 * 1.25),
				color,
				preview: renderPreview((ctx, pw, ph) => {
					const size = Math.min(40, (pw * 0.9 * 48) / Math.max(1, width));
					ctx.font = `${size}px ${cssFontFamily(family)}`;
					ctx.fillStyle = color;
					ctx.textBaseline = 'middle';
					ctx.textAlign = 'center';
					ctx.fillText(text, pw / 2, ph / 2);
				})
			};
		} else if (tab === 'upload' && upload) {
			const assetId = uid('asset');
			editor.assets.set(assetId, {
				bytes: upload.bytes,
				mime: 'image/png',
				url: upload.url,
				width: upload.width,
				height: upload.height
			});
			spec = {
				id: uid('sig'),
				kind: 'image',
				asset: assetId,
				aspect: upload.width / upload.height,
				color: ink,
				preview: upload.url
			};
			upload = null;
		}
		if (!spec) return;
		editor.signatures = [spec, ...editor.signatures];
		strokes = [];
		open = false;
		onuse(spec);
	}

	function reuse(spec: SignatureSpec) {
		open = false;
		onuse(spec);
	}
</script>

<dialog bind:this={dialog} class="dialog" oncancel={() => (open = false)} aria-labelledby="sig-title">
	<div class="body">
		<div class="head">
			<h2 id="sig-title">{i18n.t.signature.title}</h2>
			<button class="icon-btn" onclick={() => (open = false)} aria-label={i18n.t.common.close}>
				<Icon name="x" size={20} />
			</button>
		</div>

		<div class="tabs" role="tablist">
			{#each TABS as item (item.id)}
				<button role="tab" aria-selected={tab === item.id} class:active={tab === item.id} onclick={() => (tab = item.id)}>
					<Icon name={item.icon} size={18} />
					{i18n.t.signature[item.label]}
				</button>
			{/each}
		</div>

		{#if tab !== 'upload'}
			<div class="inks" role="radiogroup" aria-label={i18n.t.signature.ink}>
				{#each INKS as color (color)}
					<button
						role="radio"
						aria-checked={ink === color}
						aria-label={color}
						class="ink"
						class:active={ink === color}
						style:--ink={color}
						onclick={() => (ink = color)}
					></button>
				{/each}
			</div>
		{/if}

		{#if tab === 'draw'}
			<p class="hint">{i18n.t.signature.drawHint}</p>
			<div class="pad-wrap">
				<canvas
					bind:this={pad}
					class="pad"
					onpointerdown={padDown}
					onpointermove={padMove}
					onpointerup={padUp}
					onpointercancel={padUp}
				></canvas>
				<span class="baseline" aria-hidden="true"></span>
				<button class="btn btn-ghost clear" onclick={() => (strokes = [])} disabled={!strokes.length}>
					{i18n.t.signature.clear}
				</button>
			</div>
		{:else if tab === 'type'}
			<label class="field">
				<span>{i18n.t.signature.typeLabel}</span>
				<input class="input" bind:value={name} placeholder={i18n.t.signature.typePlaceholder} autocomplete="name" />
			</label>
			<div class="fonts">
				{#each HAND_FONTS as family (family)}
					<button class="font-choice" class:active={handFont === family} onclick={() => (handFont = family)}>
						<span style:font-family={cssFontFamily(family)} style:color={ink}>{name.trim() || 'Jan Novák'}</span>
					</button>
				{/each}
			</div>
		{:else}
			<p class="hint">{i18n.t.signature.uploadHint}</p>
			<div class="upload">
				{#if upload}
					<img src={upload.url} alt="" />
				{/if}
				<button class="btn" onclick={chooseUpload}>
					<Icon name="image" size={18} />
					{i18n.t.signature.chooseImage}
				</button>
				<label class="check">
					<input type="checkbox" bind:checked={removeBg} onchange={() => processUpload()} />
					<span>{i18n.t.signature.removeBg}</span>
				</label>
			</div>
		{/if}

		{#if editor.signatures.length}
			<div class="recent">
				<p class="field-label">{i18n.t.signature.recent}</p>
				<div class="recent-list">
					{#each editor.signatures as spec (spec.id)}
						<button class="recent-item" onclick={() => reuse(spec)}>
							<img src={spec.preview} alt="" />
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<div class="actions">
			<button class="btn btn-ghost" onclick={() => (open = false)}>{i18n.t.common.cancel}</button>
			<button class="btn btn-primary" onclick={use} disabled={!canUse}>
				<Icon name="check" size={18} />
				{i18n.t.signature.use}
			</button>
		</div>
	</div>
</dialog>

<style>
	.dialog {
		width: min(560px, calc(100vw - 24px));
		max-height: calc(100dvh - 24px);
		padding: 0;
		border: none;
		border-radius: var(--radius-l);
		box-shadow: var(--shadow-pop);
		color: var(--ink);
	}

	.dialog::backdrop {
		background: rgb(22 33 58 / 0.5);
	}

	.body {
		display: grid;
		gap: 16px;
		padding: 22px;
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	h2 {
		font-size: 1.4rem;
	}

	.tabs {
		display: flex;
		gap: 4px;
		padding: 4px;
		border-radius: var(--radius-m);
		background: var(--desk);
	}

	.tabs button {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 8px;
		border: none;
		border-radius: var(--radius-s);
		background: transparent;
		font-weight: 650;
		color: var(--ink-2);
		cursor: pointer;
	}

	.tabs button.active {
		background: var(--paper);
		color: var(--ink);
		box-shadow: 0 1px 2px rgb(22 33 58 / 0.15);
	}

	.inks {
		display: flex;
		gap: 8px;
	}

	.ink {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 3px solid var(--paper);
		background: var(--ink);
		box-shadow: 0 0 0 1px var(--line-strong);
		cursor: pointer;
	}

	.ink.active {
		box-shadow: 0 0 0 2px var(--ink);
	}

	.hint {
		color: var(--ink-2);
		font-size: 0.95rem;
	}

	.pad-wrap {
		position: relative;
	}

	.pad {
		width: 100%;
		height: 200px;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-m);
		background: #fff;
		touch-action: none;
		cursor: crosshair;
	}

	.baseline {
		position: absolute;
		left: 24px;
		right: 24px;
		bottom: 48px;
		border-bottom: 1.5px dashed var(--line-strong);
		pointer-events: none;
	}

	.clear {
		position: absolute;
		top: 6px;
		right: 6px;
		min-height: 34px;
		padding: 4px 10px;
	}

	.fonts {
		display: grid;
		gap: 8px;
	}

	.font-choice {
		display: block;
		width: 100%;
		padding: 10px 14px;
		border: 1px solid var(--line);
		border-radius: var(--radius-m);
		background: #fff;
		text-align: left;
		cursor: pointer;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.font-choice span {
		font-size: 34px;
		line-height: 1.3;
	}

	.font-choice.active {
		border-color: var(--royal);
		box-shadow: 0 0 0 2px var(--royal-tint);
	}

	.upload {
		display: grid;
		gap: 12px;
		justify-items: start;
	}

	.upload img {
		max-height: 140px;
		max-width: 100%;
		padding: 8px;
		border: 1px dashed var(--line-strong);
		border-radius: var(--radius-m);
		background: repeating-conic-gradient(#f2f4f8 0 25%, #fff 0 50%) 0 0 / 16px 16px;
	}

	.recent-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 6px;
	}

	.recent-item {
		padding: 4px;
		border: 1px solid var(--line);
		border-radius: var(--radius-s);
		background: #fff;
		cursor: pointer;
	}

	.recent-item:hover {
		border-color: var(--royal);
	}

	.recent-item img {
		width: 120px;
		height: 40px;
		object-fit: contain;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
</style>
