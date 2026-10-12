<script lang="ts">
	import PrivacyPage from '#lib/components/PrivacyPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PrivacyPage lang="en" content={data.content} />
