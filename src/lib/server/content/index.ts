import { error } from '@sveltejs/kit';
import type { Lang } from '#lib/i18n/index.ts';
import { RELATED, toolBySlug, toolPath, type ToolId } from '#lib/tools/registry.ts';
import { toolsEn, labelsEn } from './tools.en.ts';
import { toolsCs, labelsCs } from './tools.cs.ts';

const TOOL_CONTENT = { en: toolsEn, cs: toolsCs };
const LABELS = { en: labelsEn, cs: labelsCs };

export { home, privacy } from './pages.ts';

export function toolAlternates(id: ToolId): Record<Lang, string> {
	return { en: toolPath('en', id), cs: toolPath('cs', id) };
}

/** Data for a tool page; throws a 404 for unknown slugs. */
export function loadToolPage(lang: Lang, slug: string) {
	const tool = toolBySlug(lang, slug);
	if (!tool) error(404, 'Not found');
	return {
		toolId: tool.id,
		content: TOOL_CONTENT[lang][tool.id],
		labels: LABELS[lang],
		related: RELATED[tool.id],
		alternates: toolAlternates(tool.id)
	};
}
