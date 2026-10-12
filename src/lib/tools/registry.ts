import type { Component } from 'svelte';
import type { Lang } from '#lib/i18n/index.ts';

export const TOOL_IDS = [
	'edit',
	'sign',
	'fill-form',
	'merge',
	'split',
	'compress',
	'organize',
	'rotate',
	'delete-pages',
	'extract-pages',
	'pdf-to-jpg',
	'pdf-to-png',
	'jpg-to-pdf',
	'watermark',
	'page-numbers',
	'redact',
	'crop',
	'protect',
	'unlock',
	'flatten',
	'metadata',
	'pdf-to-text'
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export type ToolCategory = 'edit' | 'organize' | 'convert' | 'secure';

export const CATEGORY_ORDER: ToolCategory[] = ['edit', 'organize', 'convert', 'secure'];

export interface ToolProps {
	toolId: ToolId;
}

export interface ToolDef {
	id: ToolId;
	category: ToolCategory;
	slugs: Record<Lang, string>;
	/** What the drop zone accepts. */
	accepts: 'pdf' | 'image';
	/** Accent colour of the tool icon. */
	color: string;
	load: () => Promise<{ default: Component<ToolProps> }>;
}

const editor = () => import('#lib/editor/Editor.svelte');

export const TOOLS: Record<ToolId, ToolDef> = {
	edit: {
		id: 'edit',
		category: 'edit',
		slugs: { en: 'edit-pdf', cs: 'upravit-pdf' },
		accepts: 'pdf',
		color: '#1f35c4',
		load: editor
	},
	sign: {
		id: 'sign',
		category: 'edit',
		slugs: { en: 'sign-pdf', cs: 'podepsat-pdf' },
		accepts: 'pdf',
		color: '#0f7b6c',
		load: editor
	},
	'fill-form': {
		id: 'fill-form',
		category: 'edit',
		slugs: { en: 'fill-pdf-form', cs: 'vyplnit-pdf-formular' },
		accepts: 'pdf',
		color: '#7a4dd8',
		load: editor
	},
	watermark: {
		id: 'watermark',
		category: 'edit',
		slugs: { en: 'watermark-pdf', cs: 'vodoznak-pdf' },
		accepts: 'pdf',
		color: '#2a7ab8',
		load: () => import('#lib/tools-ui/WatermarkTool.svelte')
	},
	'page-numbers': {
		id: 'page-numbers',
		category: 'edit',
		slugs: { en: 'add-page-numbers-to-pdf', cs: 'cislovani-stranek-pdf' },
		accepts: 'pdf',
		color: '#b8590f',
		load: () => import('#lib/tools-ui/PageNumbersTool.svelte')
	},
	redact: {
		id: 'redact',
		category: 'edit',
		slugs: { en: 'redact-pdf', cs: 'zacernit-pdf' },
		accepts: 'pdf',
		color: '#26282e',
		load: () => import('#lib/tools-ui/RedactTool.svelte')
	},
	merge: {
		id: 'merge',
		category: 'organize',
		slugs: { en: 'merge-pdf', cs: 'spojit-pdf' },
		accepts: 'pdf',
		color: '#c2185b',
		load: () => import('#lib/tools-ui/MergeTool.svelte')
	},
	split: {
		id: 'split',
		category: 'organize',
		slugs: { en: 'split-pdf', cs: 'rozdelit-pdf' },
		accepts: 'pdf',
		color: '#d84315',
		load: () => import('#lib/tools-ui/SplitTool.svelte')
	},
	organize: {
		id: 'organize',
		category: 'organize',
		slugs: { en: 'organize-pdf', cs: 'usporadat-pdf' },
		accepts: 'pdf',
		color: '#6a5acd',
		load: () => import('#lib/tools-ui/OrganizeTool.svelte')
	},
	rotate: {
		id: 'rotate',
		category: 'organize',
		slugs: { en: 'rotate-pdf', cs: 'otocit-pdf' },
		accepts: 'pdf',
		color: '#00838f',
		load: () => import('#lib/tools-ui/PageSelectTool.svelte')
	},
	'delete-pages': {
		id: 'delete-pages',
		category: 'organize',
		slugs: { en: 'delete-pdf-pages', cs: 'odstranit-stranky-pdf' },
		accepts: 'pdf',
		color: '#c62828',
		load: () => import('#lib/tools-ui/PageSelectTool.svelte')
	},
	'extract-pages': {
		id: 'extract-pages',
		category: 'organize',
		slugs: { en: 'extract-pdf-pages', cs: 'extrahovat-stranky-pdf' },
		accepts: 'pdf',
		color: '#2e7d32',
		load: () => import('#lib/tools-ui/PageSelectTool.svelte')
	},
	crop: {
		id: 'crop',
		category: 'organize',
		slugs: { en: 'crop-pdf', cs: 'orezat-pdf' },
		accepts: 'pdf',
		color: '#5d6b00',
		load: () => import('#lib/tools-ui/CropTool.svelte')
	},
	'pdf-to-jpg': {
		id: 'pdf-to-jpg',
		category: 'convert',
		slugs: { en: 'pdf-to-jpg', cs: 'pdf-do-jpg' },
		accepts: 'pdf',
		color: '#e0a100',
		load: () => import('#lib/tools-ui/PdfToImageTool.svelte')
	},
	'pdf-to-png': {
		id: 'pdf-to-png',
		category: 'convert',
		slugs: { en: 'pdf-to-png', cs: 'pdf-do-png' },
		accepts: 'pdf',
		color: '#0277bd',
		load: () => import('#lib/tools-ui/PdfToImageTool.svelte')
	},
	'jpg-to-pdf': {
		id: 'jpg-to-pdf',
		category: 'convert',
		slugs: { en: 'jpg-to-pdf', cs: 'jpg-do-pdf' },
		accepts: 'image',
		color: '#ef6c00',
		load: () => import('#lib/tools-ui/ImagesToPdfTool.svelte')
	},
	'pdf-to-text': {
		id: 'pdf-to-text',
		category: 'convert',
		slugs: { en: 'pdf-to-text', cs: 'pdf-na-text' },
		accepts: 'pdf',
		color: '#455a64',
		load: () => import('#lib/tools-ui/PdfToTextTool.svelte')
	},
	compress: {
		id: 'compress',
		category: 'secure',
		slugs: { en: 'compress-pdf', cs: 'komprimovat-pdf' },
		accepts: 'pdf',
		color: '#388e3c',
		load: () => import('#lib/tools-ui/CompressTool.svelte')
	},
	protect: {
		id: 'protect',
		category: 'secure',
		slugs: { en: 'protect-pdf', cs: 'zaheslovat-pdf' },
		accepts: 'pdf',
		color: '#283593',
		load: () => import('#lib/tools-ui/ProtectTool.svelte')
	},
	unlock: {
		id: 'unlock',
		category: 'secure',
		slugs: { en: 'unlock-pdf', cs: 'odemknout-pdf' },
		accepts: 'pdf',
		color: '#8e24aa',
		load: () => import('#lib/tools-ui/UnlockTool.svelte')
	},
	flatten: {
		id: 'flatten',
		category: 'secure',
		slugs: { en: 'flatten-pdf', cs: 'zplostit-pdf' },
		accepts: 'pdf',
		color: '#546e7a',
		load: () => import('#lib/tools-ui/FlattenTool.svelte')
	},
	metadata: {
		id: 'metadata',
		category: 'secure',
		slugs: { en: 'edit-pdf-metadata', cs: 'upravit-metadata-pdf' },
		accepts: 'pdf',
		color: '#6d4c41',
		load: () => import('#lib/tools-ui/MetadataTool.svelte')
	}
};

export function toolList(): ToolDef[] {
	return TOOL_IDS.map((id) => TOOLS[id]);
}

export function toolBySlug(lang: Lang, slug: string): ToolDef | undefined {
	return toolList().find((tool) => tool.slugs[lang] === slug);
}

export function toolPath(lang: Lang, id: ToolId): string {
	const slug = TOOLS[id].slugs[lang];
	return lang === 'en' ? `/${slug}/` : `/${lang}/${slug}/`;
}

/** Tools suggested at the bottom of a tool page. */
export const RELATED: Record<ToolId, ToolId[]> = {
	edit: ['sign', 'fill-form', 'redact', 'watermark'],
	sign: ['edit', 'fill-form', 'protect', 'flatten'],
	'fill-form': ['sign', 'flatten', 'edit', 'protect'],
	merge: ['split', 'organize', 'compress', 'page-numbers'],
	split: ['merge', 'extract-pages', 'delete-pages', 'organize'],
	compress: ['merge', 'pdf-to-jpg', 'jpg-to-pdf', 'protect'],
	organize: ['merge', 'rotate', 'delete-pages', 'split'],
	rotate: ['organize', 'crop', 'merge', 'compress'],
	'delete-pages': ['extract-pages', 'organize', 'split', 'merge'],
	'extract-pages': ['split', 'delete-pages', 'organize', 'merge'],
	'pdf-to-jpg': ['pdf-to-png', 'jpg-to-pdf', 'pdf-to-text', 'compress'],
	'pdf-to-png': ['pdf-to-jpg', 'jpg-to-pdf', 'pdf-to-text', 'compress'],
	'jpg-to-pdf': ['pdf-to-jpg', 'merge', 'compress', 'organize'],
	watermark: ['page-numbers', 'protect', 'edit', 'flatten'],
	'page-numbers': ['watermark', 'merge', 'organize', 'edit'],
	redact: ['edit', 'protect', 'metadata', 'flatten'],
	crop: ['rotate', 'organize', 'compress', 'edit'],
	protect: ['unlock', 'watermark', 'redact', 'flatten'],
	unlock: ['protect', 'compress', 'edit', 'merge'],
	flatten: ['fill-form', 'protect', 'compress', 'sign'],
	metadata: ['protect', 'redact', 'compress', 'flatten'],
	'pdf-to-text': ['pdf-to-jpg', 'edit', 'split', 'compress']
};
