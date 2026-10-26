import { defineConfig } from 'astro/config';

// server.js serves the site at the domain root, so BASE defaults to /. A sub-path preview would set BASE (and SITE) in its workflow.
export default defineConfig({
  site: process.env.SITE ?? 'http://localhost:8080',
  base: process.env.BASE ?? '/',
  output: 'static',
  build: { inlineStylesheets: 'always' },
});
