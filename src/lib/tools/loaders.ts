import type { Component } from 'svelte';
import type { ToolId, ToolProps } from './registry.ts';

/**
 * Lazy loaders for the interactive part of each tool. Kept out of the
 * registry on purpose: SvelteKit eagerly links the CSS of modules that a page
 * imports dynamically, so the registry (used by the layout on every page) must
 * not reference tool components. Tool routes import this module dynamically,
 * which keeps each tool's CSS out of other pages.
 */
const LOADERS: Record<ToolId, () => Promise<{ default: Component<ToolProps> }>> = {
	edit: () => import('#lib/editor/Editor.svelte'),
	sign: () => import('#lib/editor/Editor.svelte'),
	'fill-form': () => import('#lib/editor/Editor.svelte'),
	watermark: () => import('#lib/tools-ui/WatermarkTool.svelte'),
	'page-numbers': () => import('#lib/tools-ui/PageNumbersTool.svelte'),
	redact: () => import('#lib/tools-ui/RedactTool.svelte'),
	merge: () => import('#lib/tools-ui/MergeTool.svelte'),
	split: () => import('#lib/tools-ui/SplitTool.svelte'),
	organize: () => import('#lib/tools-ui/OrganizeTool.svelte'),
	rotate: () => import('#lib/tools-ui/PageSelectTool.svelte'),
	'delete-pages': () => import('#lib/tools-ui/PageSelectTool.svelte'),
	'extract-pages': () => import('#lib/tools-ui/PageSelectTool.svelte'),
	crop: () => import('#lib/tools-ui/CropTool.svelte'),
	'pdf-to-jpg': () => import('#lib/tools-ui/PdfToImageTool.svelte'),
	'pdf-to-png': () => import('#lib/tools-ui/PdfToImageTool.svelte'),
	'jpg-to-pdf': () => import('#lib/tools-ui/ImagesToPdfTool.svelte'),
	'pdf-to-text': () => import('#lib/tools-ui/PdfToTextTool.svelte'),
	compress: () => import('#lib/tools-ui/CompressTool.svelte'),
	protect: () => import('#lib/tools-ui/ProtectTool.svelte'),
	unlock: () => import('#lib/tools-ui/UnlockTool.svelte'),
	flatten: () => import('#lib/tools-ui/FlattenTool.svelte'),
	metadata: () => import('#lib/tools-ui/MetadataTool.svelte')
};

export async function loadToolComponent(id: ToolId): Promise<Component<ToolProps>> {
	return (await LOADERS[id]()).default;
}
