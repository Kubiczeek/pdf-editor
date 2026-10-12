import type { EntryGenerator, PageServerLoad } from './$types';
import { toolList } from '#lib/tools/registry.ts';
import { loadToolPage } from '#lib/server/content/index.ts';

export const entries: EntryGenerator = () => toolList().map((tool) => ({ slug: tool.slugs.en }));

export const load: PageServerLoad = ({ params }) => loadToolPage('en', params.slug);
