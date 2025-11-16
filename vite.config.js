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
          // React core libraries - must load first
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          
          // React Router (depends on React) - check before generic react-* pattern
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor';
          }
          
          // React-dependent libraries - must load with React
          // Check for react-error-boundary and any other react-* packages
          if (id.includes('node_modules/react-error-boundary') || 
              id.includes('node_modules/react-') ||
              (id.includes('node_modules') && id.includes('/react'))) {
            return 'react-vendor';
          }
          
          // Radix UI components (depends on React)
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-vendor';
          }
          
          // Charts library (recharts is large, depends on React)
          if (id.includes('node_modules/recharts')) {
            return 'charts-vendor';
          }
          
          // Icons library (lucide-react can be large, depends on React)
          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor';
          }
          
          // Analytics (depends on React)
          if (id.includes('node_modules/@vercel/analytics')) {
            return 'analytics-vendor';
          }
          
          // Utility libraries (small, can be grouped) - non-React dependencies only
          if (
            id.includes('node_modules/clsx') ||
            id.includes('node_modules/tailwind-merge') ||
            id.includes('node_modules/class-variance-authority') ||
            id.includes('node_modules/tailwindcss-animate')
          ) {
            return 'utils-vendor';
          }
          
          // All other node_modules (should not contain React dependencies)
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

