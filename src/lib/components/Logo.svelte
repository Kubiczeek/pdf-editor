<script lang="ts">
	let { size = 32 }: { size?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
	<path
		d="M8.5 3.5h10.2l7.3 7.3v16.2a1.6 1.6 0 0 1-1.6 1.6H8.5a1.6 1.6 0 0 1-1.6-1.6V5.1a1.6 1.6 0 0 1 1.6-1.6z"
		fill="#fff"
		stroke="#1f35c4"
		stroke-width="2"
		stroke-linejoin="round"
	/>
	<path
		d="M18.7 3.5v7.3H26"
		fill="none"
		stroke="#1f35c4"
		stroke-width="2"
		stroke-linejoin="round"
	/>
	<path d="M9.6 15.2 22.6 14l.5 5.2-13 1.2z" fill="#ffe14d" />
	<path
		d="M10.5 17.6h11.6M10.5 23.6h7.4"
		stroke="#1f35c4"
		stroke-width="2"
		stroke-linecap="round"
	/>
</svg>
