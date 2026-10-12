import type { LayoutLoad } from './$types';
import { langFromPath } from '#lib/i18n/index.ts';

// Every page is rendered to static HTML at build time.
export const prerender = true;
export const trailingSlash = 'always';

export const load: LayoutLoad = ({ url }) => ({
	lang: langFromPath(url.pathname)
});
