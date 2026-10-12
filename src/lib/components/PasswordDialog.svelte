<script lang="ts">
	import { passwordPrompt } from '#lib/stores/password.svelte.ts';
	import { useI18n, fmt } from '#lib/i18n/index.ts';
	import Icon from './Icon.svelte';

	const i18n = useI18n();
	let dialog = $state<HTMLDialogElement>();
	let value = $state('');
	let reveal = $state(false);
	let input = $state<HTMLInputElement>();

	const request = $derived(passwordPrompt.request);

	$effect(() => {
		if (!dialog) return;
		if (request && !dialog.open) {
			value = '';
			reveal = false;
			dialog.showModal();
			queueMicrotask(() => input?.focus());
		} else if (!request && dialog.open) {
			dialog.close();
		}
	});

	function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!value) return;
		passwordPrompt.answer(value);
	}

	function cancel() {
		passwordPrompt.answer(null);
	}
</script>

<dialog bind:this={dialog} class="dialog" oncancel={cancel} aria-labelledby="pw-title">
	{#if request}
		<form onsubmit={submit}>
			<div class="head">
				<span class="badge"><Icon name="lock" size={22} /></span>
				<h2 id="pw-title">{i18n.t.password.title}</h2>
			</div>
			<p>{fmt(i18n.t.password.body, { name: request.fileName })}</p>
			{#if request.incorrect}
				<p class="notice error" role="alert">
					<Icon name="alert" size={20} />
					{i18n.t.password.wrong}
				</p>
			{/if}
			<label class="field">
				<span>{i18n.t.password.label}</span>
				<input
					bind:this={input}
					bind:value
					class="input"
					type={reveal ? 'text' : 'password'}
					autocomplete="off"
					spellcheck="false"
				/>
			</label>
			<label class="check">
				<input type="checkbox" bind:checked={reveal} />
				<span>{i18n.t.password.show}</span>
			</label>
			<div class="actions">
				<button type="button" class="btn btn-ghost" onclick={cancel}>{i18n.t.common.cancel}</button>
				<button type="submit" class="btn btn-primary" disabled={!value}
					>{i18n.t.password.submit}</button
				>
			</div>
		</form>
	{/if}
</dialog>

<style>
	.dialog {
		width: min(440px, calc(100vw - 32px));
		padding: 0;
		border: none;
		border-radius: var(--radius-l);
		box-shadow: var(--shadow-pop);
		color: var(--ink);
	}

	.dialog::backdrop {
		background: rgb(22 33 58 / 0.45);
	}

	form {
		display: grid;
		gap: 16px;
		padding: 24px;
	}

	.head {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.badge {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: var(--royal-tint);
		color: var(--royal);
	}

	h2 {
		font-size: 1.35rem;
	}

	p {
		color: var(--ink-2);
		word-break: break-word;
	}

	.notice {
		margin: 0;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 4px;
	}
</style>
