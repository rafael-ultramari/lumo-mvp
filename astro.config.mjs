import { defineConfig } from 'astro/config';

export default defineConfig({
    site: 'https://lumoplatform.netlify.app/',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt'],
    routing: {
      prefixDefaultLocale: false,
    }
  },
  image: {
    remotePatterns: [],
  }
});