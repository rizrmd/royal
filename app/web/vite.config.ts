import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: './build',
    emptyOutDir: true,
    target: 'es2015',
    manifest: true,
  },
  resolve: {
    alias: {
      http: '../../pkgs/boot/src/polyfills/http.cjs.js',
      assert: '../../pkgs/boot/src/polyfills/assert.cjs.js',
    },
  },
  plugins: [
    {
      name: 'find-my-way', // required, will show up in warnings and errors
      resolveId: (id) => {
        return null
      },
      load: (id) => {
        switch (true) {
          case id.indexOf('assert.cjs.js') >= 0:
            return `export default function (arg, msg) {}`
          case id.indexOf('http.cjs.js') >= 0:
            return `export default {METHODS: ['GET']}`
        }
        return null
      },
    },
    VitePWA({
      workbox: {
        cleanupOutdatedCaches: true,
      },
    }),
    react({
      jsxRuntime: 'classic',
      fastRefresh: true,
      babel: {
        presets: [
          [
            '@babel/preset-react',
            {
              pragma: 'jsx',
              pragmaFrag: 'Fragment',
              throwIfNamespace: false,
              runtime: 'classic',
            },
          ],
        ],
      },
    }),
  ],
})
