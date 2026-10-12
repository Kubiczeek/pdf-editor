import type { PageServerLoad } from './$types';
import { privacy } from '#lib/server/content/index.ts';
import { STATIC_PAGES } from '#lib/i18n/index.ts';

export const load: PageServerLoad = () => ({
	content: privacy.en,
	alternates: STATIC_PAGES.privacy
});
