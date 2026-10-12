<script lang="ts">
	import { onMount } from 'svelte';
	import type { ToolProps } from '#lib/tools/registry.ts';
	import { useI18n, fmt } from '#lib/i18n/index.ts';
	import { uid } from '#lib/pdf/files.ts';
	import { ensureFontFaces } from '#lib/pdf/fonts.ts';
	import { SinglePdfTool } from '#lib/tools-ui/single.svelte.ts';
	import { describeError, type LoadedPdf } from '#lib/tools-ui/shared.ts';
	import FileDrop from '#lib/components/FileDrop.svelte';
	import Notice from '#lib/components/Notice.svelte';
	import { EditorState } from './state.svelte.ts';
	import { loadFormFields } from './forms.ts';
	import type { PageModel } from './types.ts';
	import EditorShell from './EditorShell.svelte';

	let { toolId }: ToolProps = $props();
	const i18n = useI18n();
	const loader = new SinglePdfTool(() => i18n.t);

	let editor = $state<EditorState | null>(null);
	let initializing = $state(false);

	/** Builds the editor model (page sizes, form fields) for a freshly opened PDF. */
	async function start(pdf: LoadedPdf) {
		initializing = true;
		try {
			const state = new EditorState({ doc: pdf.doc, bytes: pdf.bytes, password: pdf.password, fileName: pdf.name });
			const pages: PageModel[] = await Promise.all(
				Array.from({ length: pdf.pageCount }, async (_, index) => {
					const page = await pdf.doc.getPage(index + 1);
					const viewport = page.getViewport({ scale: 1 });
					const [a, b, c, d] = page.view;
					return {
						key: uid('page'),
						kind: 'doc' as const,
						index,
						rotation: 0,
						width: viewport.width,
						height: viewport.height,
						view: [a, b, c, d] as [number, number, number, number],
						rotate: page.rotate
					};
				})
			);
			state.pages = pages;
			const { fields, values } = await loadFormFields(pdf.doc, pages);
			state.fields = fields;
			state.formValues = values;
			state.initialValues = { ...values };
			if (toolId === 'fill-form' && fields.length === 0) state.tool = 'text';
			editor = state;
		} catch (error) {
			loader.fail(describeError(i18n.t, error));
			await loader.reset();
		} finally {
			initializing = false;
		}
	}

	$effect(() => {
		const pdf = loader.pdf;
		if (pdf && !editor && !initializing) void start(pdf);
	});

	onMount(() => {
		ensureFontFaces();
		loader.pickupHandoff();
		return () => {
			void loader.close();
		};
	});

	async function close() {
		editor = null;
		const error = loader.error;
		await loader.reset();
		loader.error = error;
	}
</script>

{#if editor}
	<EditorShell state={editor} {toolId} onclose={close} />
{:else}
	<div class="stack">
		{#if loader.opening || initializing || loader.pdf}
			<div class="opening" role="status">
				<span class="spinner" aria-hidden="true"></span>
				{fmt(i18n.t.common.loadingFile, { name: loader.opening ?? loader.pdf?.name ?? '' })}
			</div>
		{:else}
			<FileDrop accepts="pdf" onfiles={(files) => loader.open(files)} />
		{/if}
		{#if loader.error}
			<Notice kind="error" ondismiss={() => (loader.error = null)}>{loader.error}</Notice>
		{/if}
	</div>
{/if}

<style>
	.stack {
		display: grid;
		gap: 16px;
	}

	.opening {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 14px;
		min-height: 300px;
		border-radius: var(--radius-l);
		background: var(--paper);
		box-shadow: var(--shadow-sheet);
		font-weight: 650;
		padding: 24px;
		text-align: center;
		overflow-wrap: anywhere;
	}

	.spinner {
		flex: none;
		width: 22px;
		height: 22px;
		border: 3px solid var(--royal-tint);
		border-top-color: var(--royal);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
