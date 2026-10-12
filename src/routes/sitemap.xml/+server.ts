import type { RequestHandler } from './$types';
import { SITE_URL } from '#lib/config.ts';
import { homePath, STATIC_PAGES, LANGS, BCP47, type Lang } from '#lib/i18n/index.ts';
import { toolList, toolPath } from '#lib/tools/registry.ts';

export const prerender = true;
export const trailingSlash = 'never';

export const GET: RequestHandler = () => {
	const groups: Array<{ urls: Record<Lang, string>; priority: string }> = [
		{ urls: { en: homePath('en'), cs: homePath('cs') }, priority: '1.0' },
		...toolList().map((tool) => ({
			urls: { en: toolPath('en', tool.id), cs: toolPath('cs', tool.id) },
			priority: tool.id === 'edit' || tool.id === 'merge' || tool.id === 'compress' ? '0.9' : '0.8'
		})),
		{ urls: STATIC_PAGES.privacy, priority: '0.3' }
	];
	const today = new Date().toISOString().slice(0, 10);
	const entries = groups.flatMap((group) =>
		LANGS.map((lang) => {
			const links = LANGS.map(
				(alt) =>
					`    <xhtml:link rel="alternate" hreflang="${BCP47[alt]}" href="${SITE_URL}${group.urls[alt]}"/>`
			).join('\n');
			return [
				'  <url>',
				`    <loc>${SITE_URL}${group.urls[lang]}</loc>`,
				links,
				`    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${group.urls.en}"/>`,
				`    <lastmod>${today}</lastmod>`,
				`    <priority>${group.priority}</priority>`,
				'  </url>'
			].join('\n');
		})
	);
	const xml = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		...entries,
		'</urlset>',
		''
	].join('\n');
	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' }
	});
};
