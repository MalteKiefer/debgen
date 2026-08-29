import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  publicDir: 'public',
  plugins: [
    vue({ template: { transformAssetUrls } }),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    assetsDir: 'assets',
    chunkSizeWarningLimit: 500,
    manifest: true,
  },
  test: {
    exclude: [...configDefaults.exclude, '**/.worktrees/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
  },
})
