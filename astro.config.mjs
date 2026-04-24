import { defineConfig } from 'astro/config';

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: 'https://managerladger.com',
  trailingSlash: 'never',
  server: { port: 4321, host: true },
  devToolbar: { enabled: false },

  vite: {
    resolve: {
      alias: { '~': '/src' },
    },
  },

  adapter: cloudflare()
});