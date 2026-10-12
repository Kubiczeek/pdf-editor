import type { PageLoad } from './$types';
import { TOOLS } from '#lib/tools/registry.ts';

/** Loads only the interactive component of this tool (each tool is its own chunk). */
export const load: PageLoad = async ({ data }) => {
	const module = await TOOLS[data.toolId].load();
	return { ...data, component: module.default };
};
