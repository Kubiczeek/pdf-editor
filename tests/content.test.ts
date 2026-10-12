import { describe, it, expect } from 'vitest';
import { toolsEn } from '#lib/server/content/tools.en.ts';
import { toolsCs } from '#lib/server/content/tools.cs.ts';
import { home, privacy } from '#lib/server/content/pages.ts';
import { TOOL_IDS, TOOLS, RELATED, toolPath } from '#lib/tools/registry.ts';
import { ui } from '#lib/i18n/ui.ts';
import { SITE_NAME } from '#lib/config.ts';

const brand = ` | ${SITE_NAME}`;
const length = (s: string) => [...s].length;

describe('SEO content', () => {
	const pages = [
		...TOOL_IDS.flatMap((id) => [
			{ name: `en/${id}`, title: toolsEn[id].title, description: toolsEn[id].description },
			{ name: `cs/${id}`, title: toolsCs[id].title, description: toolsCs[id].description }
		]),
		{ name: 'en/home', title: home.en.title, description: home.en.description },
		{ name: 'cs/home', title: home.cs.title, description: home.cs.description }
	];

	it.each(pages)('$name has a title that fits search results', ({ title }) => {
		expect(length(title + brand)).toBeLessThanOrEqual(60);
	});

	it.each(pages)('$name has a 110–160 character description', ({ description }) => {
		expect(length(description)).toBeGreaterThanOrEqual(110);
		expect(length(description)).toBeLessThanOrEqual(160);
	});

	it('has unique titles and descriptions', () => {
		expect(new Set(pages.map((p) => p.title)).size).toBe(pages.length);
		expect(new Set(pages.map((p) => p.description)).size).toBe(pages.length);
	});

	it('has complete copy for every tool in both languages', () => {
		for (const id of TOOL_IDS) {
			for (const content of [toolsEn[id], toolsCs[id]]) {
				expect(content.h1.length).toBeGreaterThan(3);
				expect(content.lead.length).toBeGreaterThan(20);
				expect(content.steps.length).toBeGreaterThanOrEqual(3);
				expect(content.features).toHaveLength(3);
				expect(content.faq.length).toBeGreaterThanOrEqual(3);
			}
			expect(ui.en.tools[id].name).toBeTruthy();
			expect(ui.cs.tools[id].name).toBeTruthy();
		}
		expect(privacy.en.sections.length).toBe(privacy.cs.sections.length);
	});

	it('uses unique, URL-safe slugs and valid related tools', () => {
		for (const lang of ['en', 'cs'] as const) {
			const slugs = TOOL_IDS.map((id) => TOOLS[id].slugs[lang]);
			expect(new Set(slugs).size).toBe(slugs.length);
			for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
		}
		for (const id of TOOL_IDS) {
			expect(RELATED[id].length).toBeGreaterThan(0);
			for (const related of RELATED[id]) {
				expect(TOOL_IDS).toContain(related);
				expect(related).not.toBe(id);
			}
		}
		expect(toolPath('cs', 'merge')).toBe('/cs/spojit-pdf/');
		expect(toolPath('en', 'merge')).toBe('/merge-pdf/');
	});
});
