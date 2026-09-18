import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
  build: {
    // Enable minification with esbuild (built-in)
    minify: 'esbuild',
    // Enable tree shaking
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-slot'],
          'utils': ['date-fns', 'zod'],
          'charts': ['recharts'],
          'query': ['@tanstack/react-query'],
          'router': ['react-router-dom'],
          'motion': ['framer-motion'],
          'supabase': ['@supabase/supabase-js'],
        },
        // Chunk file naming for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Target modern browsers
    target: 'es2020',
    // Enable source maps for debugging
    sourcemap: false,
    // CSS code splitting
    cssCodeSplit: true,
    // Assets inline limit (10KB)
    assetsInlineLimit: 10240,
  },
  // Performance optimization
  optimizeDeps: {
    // Pre-bundle dependencies
    include: ['react', 'react-dom'],
  },
});
