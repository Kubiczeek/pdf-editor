import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Plain static output in ./build for every host (Cloudflare Pages, Vercel, …).
			// 404.html is an app shell that renders the error page for unknown URLs.
			adapter: adapter({ pages: 'build', assets: 'build', fallback: '404.html' })
		})
	],
	build: {
		// pdf.js and pdf-lib are large but only loaded on demand.
		chunkSizeWarningLimit: 700
	}
});
