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
  security: {
    // Auth.js maneja su propia protección CSRF (token double-submit).
    checkOrigin: false,
    // Confía en el x-forwarded-host de Vercel para estos dominios, para que
    // request.url.origin sea el dominio real y no "localhost". Sin esto,
    // el redirect_uri de OAuth apunta a localhost y Google lo rechaza.
    allowedDomains: [
      { hostname: "www.hostalmonchito.cl" },
      { hostname: "hostalmonchito.cl" },
    ],
  },
});
