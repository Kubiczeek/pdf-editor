<script lang="ts">
	import ToolPage from '#lib/components/ToolPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

{#key data.toolId}
	<ToolPage
		lang="cs"
		toolId={data.toolId}
		content={data.content}
		labels={data.labels}
		related={data.related}
		alternates={data.alternates}
		component={data.component}
	/>
{/key}
