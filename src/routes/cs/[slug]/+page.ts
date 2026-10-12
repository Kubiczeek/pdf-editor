import type { PageLoad } from './$types';

/**
 * Loads only the interactive component of this tool. The extra dynamic hop
 * keeps every tool's CSS out of the eagerly linked stylesheets of other pages.
 */
export const load: PageLoad = async ({ data }) => {
	const { loadToolComponent } = await import('#lib/tools/loaders.ts');
	return { ...data, component: await loadToolComponent(data.toolId) };
};
