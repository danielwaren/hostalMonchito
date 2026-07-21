// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel/serverless';
import auth from 'auth-astro';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), react(), auth()],
  output: 'server',
  adapter: vercel(),
  // Auth.js maneja su propia protección CSRF (token double-submit).
  // La verificación de origen de Astro rompe el POST de login detrás
  // del proxy de Vercel (url.origin del Host interno != Origin del navegador).
  security: { checkOrigin: false },
});
