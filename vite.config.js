import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // Serve index.html for all routes — required for client-side routing
  // Without this, refreshing /product/123 or /admin returns 404 in preview/prod
  server: {
    port: 3000,
    historyApiFallback: true,
  },

  preview: {
    port: 4173,
    historyApiFallback: true,
  },

  build: {
    // Warn if a single chunk exceeds 600 kB
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split vendor chunk to improve cache hit rate
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "vendor";
          }
          if (id.includes("node_modules/@supabase")) {
            return "supabase";
          }
        },
      },
    },
  },
});
