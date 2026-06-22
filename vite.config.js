import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/test_pg_infrastructure/',
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          'ui-libs': ['framer-motion', 'lucide-react'],
          'data-libs': ['@tanstack/react-query', 'zustand', 'axios'],
          'chart-libs': ['recharts'],
          'table-libs': ['@tanstack/react-table', 'react-window', '@tanstack/react-virtual'],
          'form-libs': ['react-hook-form', 'zod', '@hookform/resolvers'],
          'export-libs': ['xlsx'],
          'date-libs': ['date-fns'],
          'upload-libs': ['react-dropzone', 'react-intersection-observer'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'recharts', '@tanstack/react-query'],
  },
});
