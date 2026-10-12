<script lang="ts">
	import HomePage from '#lib/components/HomePage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<HomePage lang="en" content={data.content} />
