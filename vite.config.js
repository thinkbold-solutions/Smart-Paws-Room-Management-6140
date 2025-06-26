import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', 'react-hot-toast'],
          icons: ['react-icons'],
          forms: ['react-hook-form'],
          charts: ['recharts', 'echarts', 'echarts-for-react'],
          quest: ['@questlabs/react-sdk'],
          supabase: ['@supabase/supabase-js'],
          store: ['zustand'],
          utils: ['clsx', 'date-fns', 'lucide-react']
        }
      }
    }
  }
});