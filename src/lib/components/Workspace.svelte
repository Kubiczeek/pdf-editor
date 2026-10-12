<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useI18n, fmt } from '#lib/i18n/index.ts';

	let {
		main,
		side,
		action,
		toolbar,
		busy = false,
		progress = null,
		busyLabel
	}: {
		main: Snippet;
		side?: Snippet;
		action?: Snippet;
		toolbar?: Snippet;
		busy?: boolean;
		/** 0–1, or null for an indeterminate bar. */
		progress?: number | null;
		busyLabel?: string;
	} = $props();

	const i18n = useI18n();
	const percent = $derived(
		progress === null ? null : Math.round(Math.min(1, Math.max(0, progress)) * 100)
	);
</script>

<div class="workspace" class:has-side={Boolean(side || action)} aria-busy={busy}>
	<div class="main">
		{#if toolbar}
			<div class="toolbar">{@render toolbar()}</div>
		{/if}
		<div class="main-body">{@render main()}</div>
	</div>
	{#if side || action}
		<aside class="side">
			{#if side}<div class="side-body">{@render side()}</div>{/if}
			{#if action}<div class="action">{@render action()}</div>{/if}
		</aside>
	{/if}
	{#if busy}
		<div class="busy" role="status" aria-live="polite">
			<div class="busy-card">
				<p>
					{busyLabel ??
						(percent === null
							? i18n.t.common.working
							: fmt(i18n.t.common.workingPct, { p: percent }))}
				</p>
				<div class="bar" class:indeterminate={percent === null}>
					<span style:width={percent === null ? undefined : `${percent}%`}></span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.workspace {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		background: var(--paper);
		border-radius: var(--radius-l);
		box-shadow: var(--shadow-sheet);
		min-height: 360px;
	}

	.workspace.has-side {
		grid-template-columns: minmax(0, 1fr) 340px;
	}

	.main {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		border-bottom: 1px solid var(--line);
	}

	.main-body {
		flex: 1;
		padding: 20px;
		background: var(--paper-dim);
		border-radius: 0 0 0 var(--radius-l);
		min-height: 320px;
	}

	.workspace:not(.has-side) .main-body {
		border-radius: 0 0 var(--radius-l) var(--radius-l);
	}

	.side {
		display: flex;
		flex-direction: column;
		border-left: 1px solid var(--line);
	}

	.side-body {
		display: grid;
		align-content: start;
		gap: 20px;
		padding: 20px;
		flex: 1;
	}

	.action {
		position: sticky;
		bottom: 0;
		display: grid;
		gap: 10px;
		padding: 16px 20px 20px;
		background: var(--paper);
		border-top: 1px solid var(--line);
		border-radius: 0 0 var(--radius-l) 0;
	}

	.busy {
		position: absolute;
		inset: 0;
		z-index: 5;
		display: grid;
		place-items: center;
		background: rgb(255 255 255 / 0.78);
		border-radius: var(--radius-l);
		backdrop-filter: blur(2px);
	}

	.busy-card {
		display: grid;
		gap: 12px;
		width: min(320px, 80%);
		text-align: center;
		font-weight: 650;
	}

	.bar {
		position: relative;
		height: 8px;
		border-radius: 99px;
		background: var(--desk-deep);
		overflow: hidden;
	}

	.bar span {
		position: absolute;
		inset: 0 auto 0 0;
		background: var(--royal);
		border-radius: inherit;
		transition: width 200ms ease;
	}

	.bar.indeterminate span {
		width: 35%;
		animation: slide 1.1s ease-in-out infinite;
	}

	@keyframes slide {
		from {
			left: -35%;
		}
		to {
			left: 100%;
		}
	}

	@media (max-width: 860px) {
		.workspace.has-side {
			grid-template-columns: minmax(0, 1fr);
		}

		.main-body {
			border-radius: 0;
			padding: 14px;
		}

		.side {
			border-left: none;
			border-top: 1px solid var(--line);
		}

		.action {
			border-radius: 0 0 var(--radius-l) var(--radius-l);
			box-shadow: 0 -8px 20px -16px rgb(22 33 58 / 0.4);
		}
	}
</style>
