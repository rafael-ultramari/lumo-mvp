import { defineConfig } from 'astro/config';

export default defineConfig({
    site: 'https://fascinating-baklava-07addb.netlify.app',
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