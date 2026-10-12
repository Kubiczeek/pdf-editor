<script lang="ts">
	import type { ToolProps } from '#lib/tools/registry.ts';
	import { useI18n, plural } from '#lib/i18n/index.ts';
	import { outputName, toBlob } from '#lib/pdf/files.ts';
	import { protectPdf } from '#lib/pdf/ops/document.ts';
	import { SinglePdfTool } from './single.svelte.ts';
	import { toInput } from './shared.ts';
	import ToolShell from '#lib/components/ToolShell.svelte';
	import Workspace from '#lib/components/Workspace.svelte';
	import PageThumb from '#lib/components/PageThumb.svelte';
	import Notice from '#lib/components/Notice.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let _props: ToolProps = $props();
	const i18n = useI18n();
	const tool = new SinglePdfTool(() => i18n.t);

	let password = $state('');
	let confirm = $state('');
	let owner = $state('');
	let reveal = $state(false);
	let allowPrinting = $state(true);
	let allowCopying = $state(true);
	let allowModifying = $state(true);
	let allowAnnotating = $state(true);
	let touched = $state(false);

	const problem = $derived(
		!password ? i18n.t.protect.empty : password !== confirm ? i18n.t.protect.mismatch : null
	);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		touched = true;
		if (problem) return;
		const options = {
			userPassword: password,
			ownerPassword: owner || undefined,
			allowPrinting,
			allowCopying,
			allowModifying,
			allowAnnotating
		};
		await tool.run(async (pdf) => {
			const bytes = await protectPdf(toInput(pdf), options);
			return [{ name: outputName(pdf.name, 'protected'), blob: toBlob(bytes) }];
		});
	}
</script>

<ToolShell {tool}>
	{#if tool.pdf}
		<form onsubmit={submit} novalidate>
			<Workspace busy={tool.busy} progress={tool.progress}>
				{#snippet main()}
					<div class="doc">
						<div class="cover">
							<PageThumb doc={tool.pdf!.doc} pageNumber={1} width={200} />
							<span class="lock"><Icon name="lock" size={30} /></span>
						</div>
						<div>
							<p class="name">{tool.pdf!.name}</p>
							<p class="muted">{plural(i18n.lang, tool.pdf!.pageCount, i18n.t.common.pages)}</p>
						</div>
					</div>
					<Notice>{i18n.t.protect.note}</Notice>
				{/snippet}
				{#snippet side()}
					<label class="field">
						<span>{i18n.t.protect.password}</span>
						<input
							class="input"
							type={reveal ? 'text' : 'password'}
							bind:value={password}
							autocomplete="new-password"
						/>
					</label>
					<label class="field">
						<span>{i18n.t.protect.confirm}</span>
						<input
							class="input"
							type={reveal ? 'text' : 'password'}
							bind:value={confirm}
							autocomplete="new-password"
							aria-invalid={touched && Boolean(problem)}
						/>
						{#if touched && problem}<small class="error">{problem}</small>{/if}
					</label>
					<label class="check">
						<input type="checkbox" bind:checked={reveal} />
						<span>{i18n.t.password.show}</span>
					</label>
					<fieldset class="perms">
						<legend class="field-label">{i18n.t.protect.permissions}</legend>
						<label class="check"
							><input type="checkbox" bind:checked={allowPrinting} /><span
								>{i18n.t.protect.printing}</span
							></label
						>
						<label class="check"
							><input type="checkbox" bind:checked={allowCopying} /><span
								>{i18n.t.protect.copying}</span
							></label
						>
						<label class="check"
							><input type="checkbox" bind:checked={allowModifying} /><span
								>{i18n.t.protect.modifying}</span
							></label
						>
						<label class="check"
							><input type="checkbox" bind:checked={allowAnnotating} /><span
								>{i18n.t.protect.annotating}</span
							></label
						>
					</fieldset>
					<label class="field">
						<span>{i18n.t.protect.owner}</span>
						<input
							class="input"
							type={reveal ? 'text' : 'password'}
							bind:value={owner}
							autocomplete="new-password"
						/>
						<small class="muted">{i18n.t.protect.ownerHint}</small>
					</label>
				{/snippet}
				{#snippet action()}
					<button type="submit" class="btn btn-primary btn-lg" disabled={tool.busy}>
						<Icon name="lock" size={20} />
						{i18n.t.protect.action}
					</button>
					<button type="button" class="btn btn-ghost" onclick={() => tool.reset()}
						>{i18n.t.common.startOver}</button
					>
				{/snippet}
			</Workspace>
		</form>
	{/if}
</ToolShell>

<style>
	.doc {
		display: flex;
		gap: 24px;
		align-items: flex-start;
		flex-wrap: wrap;
		margin-bottom: 20px;
	}

	.cover {
		position: relative;
		width: 180px;
		box-shadow: var(--shadow-sheet);
	}

	.lock {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		background: rgb(22 33 58 / 0.35);
		color: #fff;
	}

	.name {
		font-weight: 700;
		font-size: 1.1rem;
		overflow-wrap: anywhere;
	}

	.muted {
		color: var(--ink-3);
	}

	.error {
		color: var(--stamp);
	}

	.perms {
		display: grid;
		gap: 10px;
		border: none;
		margin: 0;
		padding: 0;
	}

	.perms legend {
		margin-bottom: 10px;
	}
</style>
