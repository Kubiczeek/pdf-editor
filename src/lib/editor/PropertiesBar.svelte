<script lang="ts">
	import { useI18n } from '#lib/i18n/index.ts';
	import { FONT_FAMILIES, supportsStyle, type FontFamilyId } from '#lib/pdf/fonts.ts';
	import { useEditor } from './context.ts';
	import type { EditorObject, StyleDefaults } from './types.ts';
	import ColorPick from './ColorPick.svelte';
	import Icon from '#lib/components/Icon.svelte';

	const editor = useEditor();
	const i18n = useI18n();
	const t = $derived(i18n.t.editor.props);
	const sel = $derived(editor.selected);

	const ALIGNS = [
		['left', 'alignLeft'],
		['center', 'alignCenter'],
		['right', 'alignRight']
	] as const;

	type Kind =
		| 'text'
		| 'draw'
		| 'highlight'
		| 'shape'
		| 'line'
		| 'whiteout'
		| 'image'
		| 'symbol'
		| 'note'
		| null;

	const kind = $derived.by<Kind>(() => {
		if (sel) {
			switch (sel.type) {
				case 'text':
					return 'text';
				case 'ink':
					return 'draw';
				case 'image':
					return 'image';
				case 'note':
					return 'note';
				case 'check':
				case 'cross':
					return 'symbol';
				case 'line':
				case 'arrow':
					return 'line';
				default:
					return sel.blend === 'multiply'
						? 'highlight'
						: !sel.stroke && sel.fill
							? 'whiteout'
							: 'shape';
			}
		}
		switch (editor.tool) {
			case 'text':
				return 'text';
			case 'draw':
				return 'draw';
			case 'highlight':
				return 'highlight';
			case 'rect':
			case 'ellipse':
				return 'shape';
			case 'line':
			case 'arrow':
				return 'line';
			case 'whiteout':
				return 'whiteout';
			case 'check':
			case 'cross':
				return 'symbol';
			case 'note':
				return 'note';
			default:
				return null;
		}
	});

	function apply(changes: Partial<EditorObject> | null, style: Partial<StyleDefaults>) {
		if (sel && changes) editor.update(sel.id, changes);
		Object.assign(editor.style, style);
	}

	const textFamily = $derived(sel?.type === 'text' ? sel.family : editor.style.textFamily);
	const textSize = $derived(sel?.type === 'text' ? sel.size : editor.style.textSize);
	const textBold = $derived(sel?.type === 'text' ? sel.bold : editor.style.textBold);
	const textItalic = $derived(sel?.type === 'text' ? sel.italic : editor.style.textItalic);
	const textColor = $derived(sel?.type === 'text' ? sel.color : editor.style.textColor);

	function setFamily(family: FontFamilyId) {
		const bold = textBold && supportsStyle(family, 'bold');
		const italic = textItalic && supportsStyle(family, 'italic');
		apply({ family, bold, italic } as Partial<EditorObject>, {
			textFamily: family,
			textBold: bold,
			textItalic: italic
		});
	}

	function setSize(value: number) {
		if (!Number.isFinite(value)) return;
		const size = Math.min(300, Math.max(4, value));
		apply({ size } as Partial<EditorObject>, { textSize: size });
	}
</script>

{#if kind || sel}
	<div class="props" role="toolbar" aria-label={i18n.t.editor.toolsLabel}>
		{#if kind === 'text'}
			<select
				class="select compact"
				value={textFamily}
				onchange={(e) => setFamily(e.currentTarget.value as FontFamilyId)}
				aria-label={t.font}
			>
				{#each FONT_FAMILIES as family (family.id)}
					<option value={family.id}>{family.label}</option>
				{/each}
			</select>
			<input
				class="input compact size"
				type="number"
				min="4"
				max="300"
				step="0.5"
				value={textSize}
				onchange={(e) => setSize(Number(e.currentTarget.value))}
				aria-label={t.size}
				title={t.size}
			/>
			<button
				class="icon-btn"
				class:on={textBold}
				aria-pressed={textBold}
				disabled={!supportsStyle(textFamily, 'bold')}
				onclick={() => apply({ bold: !textBold } as Partial<EditorObject>, { textBold: !textBold })}
				aria-label={t.bold}
				title={t.bold}
			>
				<Icon name="bold" size={18} />
			</button>
			<button
				class="icon-btn"
				class:on={textItalic}
				aria-pressed={textItalic}
				disabled={!supportsStyle(textFamily, 'italic')}
				onclick={() =>
					apply({ italic: !textItalic } as Partial<EditorObject>, { textItalic: !textItalic })}
				aria-label={t.italic}
				title={t.italic}
			>
				<Icon name="italic" size={18} />
			</button>
			<ColorPick
				value={textColor}
				label={t.color}
				onchange={(c) => c && apply({ color: c } as Partial<EditorObject>, { textColor: c })}
			/>
			{#if sel?.type === 'text'}
				<span class="sep"></span>
				{#each ALIGNS as [align, key] (align)}
					<button
						class="icon-btn"
						class:on={sel.align === align}
						aria-pressed={sel.align === align}
						onclick={() => apply({ align } as Partial<EditorObject>, {})}
						aria-label={t[key]}
						title={t[key]}
					>
						<Icon name={key} size={18} />
					</button>
				{/each}
			{/if}
		{:else if kind === 'draw'}
			<ColorPick
				value={sel?.type === 'ink' ? sel.color : editor.style.drawColor}
				label={t.color}
				onchange={(c) => c && apply({ color: c } as Partial<EditorObject>, { drawColor: c })}
			/>
			<label class="range">
				<span>{t.width}</span>
				<input
					type="range"
					min="0.5"
					max="12"
					step="0.5"
					value={sel?.type === 'ink' ? sel.width : editor.style.drawWidth}
					onchange={(e) =>
						apply({ width: Number(e.currentTarget.value) } as Partial<EditorObject>, {
							drawWidth: Number(e.currentTarget.value)
						})}
				/>
			</label>
		{:else if kind === 'highlight'}
			<ColorPick
				value={sel && (sel.type === 'rect' || sel.type === 'ellipse')
					? sel.fill
					: editor.style.highlightColor}
				label={t.color}
				swatches={['#ffe14d', '#9cf27a', '#7fd8ff', '#ff9ccf', '#ffb36b']}
				onchange={(c) => c && apply({ fill: c } as Partial<EditorObject>, { highlightColor: c })}
			/>
		{:else if kind === 'whiteout'}
			<ColorPick
				value={sel && (sel.type === 'rect' || sel.type === 'ellipse')
					? sel.fill
					: editor.style.whiteoutColor}
				label={t.fill}
				onchange={(c) => c && apply({ fill: c } as Partial<EditorObject>, { whiteoutColor: c })}
			/>
		{:else if kind === 'shape' || kind === 'line'}
			<ColorPick
				value={sel && 'stroke' in sel ? sel.stroke : editor.style.strokeColor}
				label={t.stroke}
				allowNone={kind === 'shape'}
				noneLabel={t.noFill}
				onchange={(c) => apply({ stroke: c } as Partial<EditorObject>, c ? { strokeColor: c } : {})}
			/>
			{#if kind === 'shape'}
				<ColorPick
					value={sel && 'fill' in sel ? sel.fill : editor.style.fillColor}
					label={t.fill}
					allowNone
					noneLabel={t.noFill}
					onchange={(c) => apply({ fill: c } as Partial<EditorObject>, { fillColor: c })}
				/>
			{/if}
			<label class="range">
				<span>{t.width}</span>
				<input
					type="range"
					min="0.5"
					max="16"
					step="0.5"
					value={sel && 'strokeWidth' in sel ? sel.strokeWidth : editor.style.strokeWidth}
					onchange={(e) =>
						apply({ strokeWidth: Number(e.currentTarget.value) } as Partial<EditorObject>, {
							strokeWidth: Number(e.currentTarget.value)
						})}
				/>
			</label>
		{:else if kind === 'symbol'}
			<ColorPick
				value={sel && (sel.type === 'check' || sel.type === 'cross')
					? sel.color
					: editor.style.symbolColor}
				label={t.color}
				onchange={(c) => c && apply({ color: c } as Partial<EditorObject>, { symbolColor: c })}
			/>
		{:else if kind === 'note'}
			<ColorPick
				value={sel?.type === 'note' ? sel.color : editor.style.noteColor}
				label={t.color}
				swatches={['#ffd23f', '#9cf27a', '#7fd8ff', '#ff9ccf', '#ffb36b']}
				onchange={(c) => c && apply({ color: c } as Partial<EditorObject>, { noteColor: c })}
			/>
		{/if}

		{#if sel}
			<label class="range">
				<span>{t.opacity}</span>
				<input
					type="range"
					min="0.1"
					max="1"
					step="0.05"
					value={sel.opacity}
					onchange={(e) => apply({ opacity: Number(e.currentTarget.value) }, {})}
				/>
			</label>
			<span class="sep"></span>
			<button
				class="icon-btn"
				onclick={() => editor.bringToFront(sel.id)}
				aria-label={t.bringFront}
				title={t.bringFront}
			>
				<Icon name="front" size={18} />
			</button>
			<button
				class="icon-btn"
				onclick={() => editor.duplicate(sel.id)}
				aria-label={t.duplicate}
				title={t.duplicate}
			>
				<Icon name="copy" size={18} />
			</button>
			<button
				class="icon-btn danger"
				onclick={() => editor.remove(sel.id)}
				aria-label={t.delete}
				title={t.delete}
			>
				<Icon name="trash" size={18} />
			</button>
		{/if}
	</div>
{/if}

<style>
	.props {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		border-radius: var(--radius-m);
		background: var(--paper);
		box-shadow: var(--shadow-pop);
		flex-wrap: wrap;
	}

	.compact {
		min-height: 36px;
		width: auto;
		padding-block: 0.3em;
		font-size: 0.92rem;
	}

	.size {
		width: 72px;
	}

	.icon-btn.on {
		background: var(--highlight);
		color: var(--ink);
	}

	.icon-btn.danger:hover {
		color: var(--stamp);
		background: var(--stamp-tint);
	}

	.sep {
		width: 1px;
		height: 24px;
		background: var(--line);
		margin-inline: 2px;
	}

	.range {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--ink-2);
	}

	.range input {
		width: 90px;
	}
</style>
