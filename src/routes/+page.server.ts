import type { PageServerLoad } from './$types';
import { home } from '#lib/server/content/index.ts';

export const load: PageServerLoad = () => ({
	content: home.en,
	alternates: { en: '/', cs: '/cs/' }
});
