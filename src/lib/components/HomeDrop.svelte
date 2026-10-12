<script lang="ts">
	import { goto } from '$app/navigation';
	import { useI18n, fmt } from '#lib/i18n/index.ts';
	import { setHandoff } from '#lib/stores/handoff.ts';
	import { pickFiles, isPdfFile, isImageFile } from '#lib/pdf/files.ts';
	import { toolList, toolPath, type ToolId } from '#lib/tools/registry.ts';
	import { TOOL_ICONS } from '#lib/tools/icons.ts';
	import Icon from './Icon.svelte';

	const i18n = useI18n();
	let files = $state<File[]>([]);
	let over = $state(false);
	let depth = 0;

	const kind = $derived<'pdf' | 'image' | null>(
		files.length === 0
			? null
			: files.every((f) => isImageFile(f) && !isPdfFile(f))
				? 'image'
				: 'pdf'
	);

	/** Tools offered for the dropped files, most likely first. */
	const choices = $derived.by<ToolId[]>(() => {
		if (kind === 'image') return ['jpg-to-pdf'];
		const all = toolList()
			.filter((tool) => tool.accepts === 'pdf')
			.map((tool) => tool.id);
		if (files.length > 1) return ['merge', ...all.filter((id) => id !== 'merge')];
		return all;
	});

	function accept(list: File[]) {
		const usable = list.filter((f) => isPdfFile(f) || isImageFile(f));
		if (!usable.length) return;
		const pdfs = usable.filter((f) => isPdfFile(f));
		files = pdfs.length ? pdfs : usable;
		if (kind === 'image') open('jpg-to-pdf');
	}

	function open(id: ToolId) {
		setHandoff(id === 'merge' ? files : files.slice(0, id === 'jpg-to-pdf' ? undefined : 1));
		goto(toolPath(i18n.lang, id));
	}

	async function choose() {
		accept(await pickFiles('application/pdf,.pdf,image/*', true));
	}

	function hasFiles(event: DragEvent) {
		return Array.from(event.dataTransfer?.types ?? []).includes('Files');
	}
</script>

<svelte:window
	ondragenter={(e) => {
		if (hasFiles(e)) {
			depth++;
			over = true;
		}
	}}
	ondragleave={(e) => {
		if (hasFiles(e)) {
			depth = Math.max(0, depth - 1);
			if (!depth) over = false;
		}
	}}
	ondragover={(e) => hasFiles(e) && e.preventDefault()}
	ondrop={(e) => {
		if (!hasFiles(e)) return;
		e.preventDefault();
		over = false;
		depth = 0;
		accept(Array.from(e.dataTransfer?.files ?? []));
	}}
/>

{#if !files.length || kind === 'image'}
	<div class="sheet-stack" class:over>
		<div class="sheet back" aria-hidden="true"></div>
		<div class="sheet front">
			<div class="lines" aria-hidden="true">
				<span style:width="62%"></span>
				<span style:width="88%"></span>
				<span class="marked" style:width="74%"></span>
				<span style:width="81%"></span>
				<span style:width="45%"></span>
			</div>
			<div class="cta">
				<p class="drop-title">{i18n.t.home.dropTitle}</p>
				<button class="btn btn-primary btn-lg" onclick={choose}>
					<Icon name="upload" size={20} />
					{i18n.t.common.choosePdf}
				</button>
				<p class="drop-sub">{i18n.t.home.dropSub}</p>
			</div>
			<svg class="scribble" viewBox="0 0 160 48" aria-hidden="true">
				<path
					d="M6 34c10-4 16-20 14-26-2-5-8 2-7 12 1 12 9 16 15 8 4-6 5-12 7-10s-1 12 3 12 6-8 9-8 1 7 5 7 7-6 10-6 2 5 6 5h20"
					fill="none"
					stroke="#1f35c4"
					stroke-width="2.2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path d="M4 44h92" stroke="#aeb8c8" stroke-width="1.4" stroke-dasharray="3 4" />
			</svg>
		</div>
	</div>
{:else}
	<div class="picker sheet-card">
		<div class="picked">
			<Icon name={files.length > 1 ? 'files' : 'file'} size={22} />
			<p>
				{files.length > 1
					? fmt(i18n.t.home.pickToolMany, { n: files.length })
					: fmt(i18n.t.home.pickTool, { name: files[0].name })}
			</p>
		</div>
		<ul>
			{#each choices as id (id)}
				<li>
					<button onclick={() => open(id)}>
						<Icon name={TOOL_ICONS[id]} size={20} />
						{i18n.t.tools[id].name}
					</button>
				</li>
			{/each}
		</ul>
		<button class="btn btn-ghost other" onclick={() => (files = [])}>
			<Icon name="x" size={18} />
			{i18n.t.home.other}
		</button>
	</div>
{/if}

<style>
	.sheet-stack {
		position: relative;
		padding: 14px 14px 22px 0;
	}

	.sheet {
		background: var(--paper);
		border-radius: 6px;
		box-shadow: var(--shadow-sheet);
	}

	.back {
		position: absolute;
		inset: 0 0 8px 14px;
		transform: rotate(3deg);
		background: #f7f8fb;
	}

	.front {
		position: relative;
		min-height: 400px;
		padding: 36px 36px 28px;
		clip-path: polygon(0 0, calc(100% - 44px) 0, 100% 44px, 100% 100%, 0 100%);
		display: flex;
		flex-direction: column;
		transition: background-color 160ms ease;
	}

	.front::after {
		/* Folded corner */
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		width: 44px;
		height: 44px;
		background: linear-gradient(225deg, transparent 50%, #dfe4ec 50%);
	}

	.over .front {
		background: var(--highlight-soft);
	}

	.lines {
		display: grid;
		gap: 12px;
		margin-bottom: 28px;
	}

	.lines span {
		display: block;
		height: 9px;
		border-radius: 4px;
		background: #e7ebf2;
	}

	.lines .marked {
		background: linear-gradient(90deg, var(--highlight) 0 100%);
		transform: skewX(-8deg);
		height: 14px;
		margin-block: -2px;
		border-radius: 2px;
	}

	.cta {
		display: grid;
		justify-items: start;
		gap: 14px;
	}

	.drop-title {
		font-family: var(--font-display);
		font-size: 1.6rem;
		font-weight: 700;
		letter-spacing: -0.015em;
	}

	.drop-sub {
		color: var(--ink-2);
		max-width: 34ch;
	}

	.scribble {
		width: 160px;
		height: 48px;
		margin-top: auto;
		align-self: flex-end;
	}

	.sheet-card {
		background: var(--paper);
		border-radius: var(--radius-l);
		box-shadow: var(--shadow-sheet);
		padding: 24px;
	}

	.picked {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		font-weight: 700;
		font-size: 1.1rem;
		margin-bottom: 16px;
		overflow-wrap: anywhere;
	}

	.picked :global(svg) {
		flex: none;
		color: var(--royal);
		margin-top: 2px;
	}

	.picker ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px;
		max-height: 360px;
		overflow-y: auto;
	}

	.picker li button {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 10px 12px;
		border: 1px solid var(--line);
		border-radius: var(--radius-m);
		background: var(--paper);
		text-align: left;
		font-weight: 600;
		cursor: pointer;
	}

	.picker li button:hover {
		background: var(--highlight-soft);
		border-color: #e3c52f;
	}

	.picker li button :global(svg) {
		flex: none;
		color: var(--royal);
	}

	.other {
		margin-top: 12px;
	}

	@media (max-width: 520px) {
		.front {
			padding: 28px 22px 22px;
			min-height: 340px;
		}

		.picker ul {
			grid-template-columns: 1fr;
		}
	}
</style>
