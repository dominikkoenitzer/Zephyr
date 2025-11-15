import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 1000,
    host: true,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    // Report compressed sizes
    reportCompressedSize: true,
    // Reduce chunk size warnings
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core libraries
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          
          // React Router
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor';
          }
          
          // Radix UI components (split into one chunk as they're often used together)
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-vendor';
          }
          
          // Charts library (recharts is large)
          if (id.includes('node_modules/recharts')) {
            return 'charts-vendor';
          }
          
          // Icons library (lucide-react can be large)
          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor';
          }
          
          // Analytics
          if (id.includes('node_modules/@vercel/analytics')) {
            return 'analytics-vendor';
          }
          
          // Utility libraries (small, can be grouped)
          if (
            id.includes('node_modules/clsx') ||
            id.includes('node_modules/tailwind-merge') ||
            id.includes('node_modules/class-variance-authority') ||
            id.includes('node_modules/tailwindcss-animate')
          ) {
            return 'utils-vendor';
          }
          
          // Error boundary
          if (id.includes('node_modules/react-error-boundary')) {
            return 'utils-vendor';
          }
          
          // All other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 500,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    // Enable tree-shaking
    treeshake: {
      moduleSideEffects: 'no-external',
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-error-boundary',
    ],
    exclude: ['@vercel/analytics'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
})

