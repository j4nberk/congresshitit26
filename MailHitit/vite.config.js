import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    base: './',
    plugins: [
        react(),
        tailwindcss(),
    ],
    esbuild: {
        drop: ['console', 'debugger']
    },
    build: {
        minify: 'esbuild',
        target: 'esnext',
        cssMinify: true,
        rollupOptions: {
            output: {
                inlineDynamicImports: true
            }
        }
    }
})
