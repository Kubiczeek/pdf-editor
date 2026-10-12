<script lang="ts">
	import { useEditor } from './context.ts';
	import type { FormFieldWidget } from './types.ts';

	let { field }: { field: FormFieldWidget } = $props();
	const editor = useEditor();
	const z = $derived(editor.zoom);
	const value = $derived(editor.formValues[field.name]);
	const active = $derived(editor.tool === 'select');
	const fontSize = $derived(
		(field.fontSize > 0 ? field.fontSize : Math.max(6, Math.min(field.multiline ? 11 : field.h * 0.62, 14))) * z
	);

	let textDraft = $state<string | null>(null);

	function commitText(next: string) {
		textDraft = null;
		editor.setField(field.name, next);
	}
</script>

<div
	class="field"
	class:active
	class:readonly={field.readOnly}
	style:left={`${field.x * z}px`}
	style:top={`${field.y * z}px`}
	style:width={`${field.w * z}px`}
	style:height={`${field.h * z}px`}
>
	{#if field.kind === 'text'}
		{#if field.multiline}
			<textarea
				value={textDraft ?? (typeof value === 'string' ? value : '')}
				readonly={field.readOnly}
				maxlength={field.maxLen > 0 ? field.maxLen : undefined}
				style:font-size={`${fontSize}px`}
				style:text-align={field.align}
				oninput={(e) => (textDraft = e.currentTarget.value)}
				onchange={(e) => commitText(e.currentTarget.value)}
				aria-label={field.name}
			></textarea>
		{:else}
			<input
				type="text"
				value={textDraft ?? (typeof value === 'string' ? value : '')}
				readonly={field.readOnly}
				maxlength={field.maxLen > 0 ? field.maxLen : undefined}
				class:comb={field.comb && field.maxLen > 0}
				style:font-size={`${fontSize}px`}
				style:text-align={field.align}
				style:letter-spacing={field.comb && field.maxLen > 0 ? `${(field.w * z) / field.maxLen - fontSize * 0.6}px` : undefined}
				oninput={(e) => (textDraft = e.currentTarget.value)}
				onchange={(e) => commitText(e.currentTarget.value)}
				aria-label={field.name}
			/>
		{/if}
	{:else if field.kind === 'checkbox'}
		<button
			type="button"
			class="tick"
			role="checkbox"
			aria-checked={value === true}
			aria-label={field.name}
			disabled={field.readOnly}
			onclick={() => editor.setField(field.name, value !== true)}
		>
			{#if value === true}
				<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5 8.2 14.5 16 5.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
			{/if}
		</button>
	{:else if field.kind === 'radio'}
		<button
			type="button"
			class="tick radio"
			role="radio"
			aria-checked={value === field.exportValue}
			aria-label={`${field.name}: ${field.exportValue}`}
			disabled={field.readOnly}
			onclick={() => editor.setField(field.name, field.exportValue)}
		>
			{#if value === field.exportValue}<span class="dot"></span>{/if}
		</button>
	{:else}
		<select
			value={typeof value === 'string' ? value : ''}
			disabled={field.readOnly}
			size={field.kind === 'list' ? Math.max(2, Math.floor(field.h / 14)) : undefined}
			style:font-size={`${fontSize}px`}
			onchange={(e) => editor.setField(field.name, e.currentTarget.value)}
			aria-label={field.name}
		>
			{#if field.kind === 'select'}<option value=""></option>{/if}
			{#each field.options as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	{/if}
</div>

<style>
	.field {
		position: absolute;
		pointer-events: none;
	}

	.field.active {
		pointer-events: auto;
	}

	input,
	textarea,
	select {
		width: 100%;
		height: 100%;
		padding: 0 2px;
		border: 1px solid rgb(31 53 196 / 0.35);
		border-radius: 2px;
		background: rgb(221 228 255 / 0.55);
		color: #000;
		font-family: 'KP Noto Sans', Arial, sans-serif;
		line-height: 1.15;
		outline: none;
	}

	textarea {
		resize: none;
		padding-top: 1px;
	}

	input:focus,
	textarea:focus,
	select:focus {
		border-color: var(--royal);
		background: rgb(255 255 255 / 0.9);
		box-shadow: 0 0 0 2px var(--highlight);
	}

	.comb {
		font-family: 'KP Noto Sans Mono', monospace;
	}

	.readonly input,
	.readonly textarea {
		background: transparent;
		border-color: transparent;
	}

	.tick {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 1px solid rgb(31 53 196 / 0.45);
		border-radius: 2px;
		background: rgb(221 228 255 / 0.55);
		color: #000;
		cursor: pointer;
	}

	.tick svg {
		width: 90%;
		height: 90%;
	}

	.radio {
		border-radius: 50%;
	}

	.dot {
		width: 50%;
		height: 50%;
		border-radius: 50%;
		background: #000;
	}

	.tick:focus-visible {
		box-shadow: 0 0 0 2px var(--highlight);
	}
</style>
