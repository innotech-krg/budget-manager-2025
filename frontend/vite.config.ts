import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
      '@stores': resolve(__dirname, './src/stores'),
      '@assets': resolve(__dirname, './src/assets')
    }
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        timeout: 10000
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@headlessui/react', '@heroicons/react'],
          charts: ['chart.js', 'react-chartjs-2'],
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        }
      }
    }
  },
  define: {
    // Deutsche Lokalisierung als Build-Zeit-Konstanten
    __CURRENCY__: JSON.stringify('EUR'),
    __LOCALE__: JSON.stringify('de-DE'),
    __BUSINESS_COUNTRY__: JSON.stringify('Deutschland')
  }
})