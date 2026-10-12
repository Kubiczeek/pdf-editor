<script lang="ts">
	let {
		value,
		onchange,
		label,
		allowNone = false,
		noneLabel = '',
		swatches = ['#000000', '#16213a', '#1f35c4', '#c42b3d', '#16794a', '#e0a100', '#ffffff']
	}: {
		value: string | null;
		onchange: (value: string | null) => void;
		label: string;
		allowNone?: boolean;
		noneLabel?: string;
		swatches?: string[];
	} = $props();

	let open = $state(false);
	let root = $state<HTMLDivElement>();
</script>

<svelte:window
	onpointerdown={(e) => {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}}
/>

<div class="color-pick" bind:this={root}>
	<button
		type="button"
		class="trigger"
		aria-label={label}
		title={label}
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<span class="chip" class:none={!value} style:background={value ?? 'transparent'}></span>
	</button>
	{#if open}
		<div class="pop" role="dialog" aria-label={label}>
			<div class="swatches">
				{#if allowNone}
					<button type="button" class="sw none" class:active={!value} title={noneLabel} aria-label={noneLabel} onclick={() => { onchange(null); open = false; }}></button>
				{/if}
				{#each swatches as color (color)}
					<button
						type="button"
						class="sw"
						class:active={value?.toLowerCase() === color}
						style:background={color}
						aria-label={color}
						onclick={() => {
							onchange(color);
							open = false;
						}}
					></button>
				{/each}
			</div>
			<input type="color" value={value ?? '#000000'} oninput={(e) => onchange(e.currentTarget.value)} aria-label={label} />
		</div>
	{/if}
</div>

<style>
	.color-pick {
		position: relative;
	}

	.trigger {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		padding: 0;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-s);
		background: var(--paper);
		cursor: pointer;
	}

	.chip {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.15);
	}

	.chip.none,
	.sw.none {
		background: linear-gradient(135deg, transparent 45%, var(--stamp) 45% 55%, transparent 55%), #fff !important;
	}

	.pop {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		z-index: 30;
		display: grid;
		gap: 10px;
		padding: 10px;
		border-radius: var(--radius-m);
		background: var(--paper);
		box-shadow: var(--shadow-pop);
	}

	.swatches {
		display: grid;
		grid-template-columns: repeat(4, 28px);
		gap: 6px;
	}

	.sw {
		width: 28px;
		height: 28px;
		padding: 0;
		border: none;
		border-radius: 50%;
		box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.2);
		cursor: pointer;
	}

	.sw.active {
		box-shadow:
			0 0 0 2px var(--paper),
			0 0 0 4px var(--royal);
	}

	input[type='color'] {
		width: 100%;
	}
</style>
