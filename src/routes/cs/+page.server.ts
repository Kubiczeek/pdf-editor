import type { PageServerLoad } from './$types';
import { home } from '#lib/server/content/index.ts';

export const load: PageServerLoad = () => ({
	content: home.cs,
	alternates: { en: '/', cs: '/cs/' }
});
