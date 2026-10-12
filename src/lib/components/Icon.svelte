<script lang="ts" module>
	export { ICONS, type IconName } from './icons.ts';
</script>

<script lang="ts">
	import { ICONS, type IconName } from './icons.ts';
	let {
		name,
		size = 24,
		label,
		class: className = '',
		strokeWidth = 1.8
	}: {
		name: IconName;
		size?: number;
		label?: string;
		class?: string;
		strokeWidth?: number;
	} = $props();
</script>

<svg
	class={className}
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
	focusable="false">{@html ICONS[name]}</svg
>
