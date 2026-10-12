import type { IconName } from '#lib/components/Icon.svelte';
import type { ToolId } from './registry.ts';

export const TOOL_ICONS: Record<ToolId, IconName> = {
	edit: 'edit',
	sign: 'signature',
	'fill-form': 'form',
	watermark: 'droplet',
	'page-numbers': 'hash',
	redact: 'redact',
	merge: 'merge',
	split: 'scissors',
	organize: 'grid',
	rotate: 'rotateRight',
	'delete-pages': 'pagesDel',
	'extract-pages': 'pagesOut',
	crop: 'crop',
	'pdf-to-jpg': 'fileImage',
	'pdf-to-png': 'image',
	'jpg-to-pdf': 'files',
	'pdf-to-text': 'fileText',
	compress: 'compress',
	protect: 'lock',
	unlock: 'unlock',
	flatten: 'layers',
	metadata: 'tag'
};
