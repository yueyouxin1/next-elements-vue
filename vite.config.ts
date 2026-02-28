import path from 'node:path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  envPrefix: ['APP_', 'VITE_'],
  publicDir: path.resolve(__dirname, './apps/studio-web/public'),
  resolve: {
    alias: [
      {
        find: '@repo/ui-ai-elements',
        replacement: path.resolve(__dirname, './packages/ui-ai-elements/src'),
      },
      {
        find: '@repo/ui-shadcn',
        replacement: path.resolve(__dirname, './packages/ui-shadcn/src'),
      },
      {
        find: '@repo/ui-reka',
        replacement: path.resolve(__dirname, './packages/ui-reka/src'),
      },
      {
        find: '@repo/editor',
        replacement: path.resolve(__dirname, './packages/editor/src'),
      },
      {
        find: '@repo/common',
        replacement: path.resolve(__dirname, './packages/common/src'),
      },
      {
        find: '@repo/generator',
        replacement: path.resolve(__dirname, './packages/generator/src'),
      },
      {
        find: '@repo/workflow',
        replacement: path.resolve(__dirname, './packages/workflow'),
      },
      {
        find: '@app',
        replacement: path.resolve(__dirname, './apps/studio-web/src'),
      },
    ],
  },
})
