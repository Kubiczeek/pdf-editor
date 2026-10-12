import type { Handle } from '@sveltejs/kit';
import { langFromPath } from '#lib/i18n/index.ts';

/** Sets <html lang> per page, since app.html is shared by both languages. */
export const handle: Handle = async ({ event, resolve }) => {
	const lang = langFromPath(event.url.pathname);
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});
};
