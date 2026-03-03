import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";
import type { Plugin } from "vite";
import viteCompression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:8000",
      "/api-token-auth": "http://localhost:8000",
      "/admin": "http://localhost:8000",
      "/media": "http://localhost:8000",
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["MISLogo.svg", "favicon.ico"],
      manifest: {
        name: "Disaster Risk Management Information system",
        short_name: "DRMIS",
        description: "Disaster Risk Management Information system",
        theme_color: "#2563EB",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/MISLogo.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
        workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[a-z0-9-]+\.basemaps\.cartocdn\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "basemap-tiles",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/[^/]+\/.*\.pmtiles$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "pmtiles-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      filter: (file) => !file.endsWith("stats.html"),
    }),
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      filter: (file) => !file.endsWith("stats.html"),
    }),
    visualizer({
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
      open: false,
    }) as Plugin,
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            // maplibre-gl + pmtiles only (no react-map-gl - it must share React with the app)
            if (id.includes("maplibre-gl") || id.includes("pmtiles")) {
              return "map";
            }
            // react-map-gl must share the same React instance
            if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler") || id.includes("react-map-gl")) {
              return "react";
            }
            if (id.includes("highcharts")) {
              return "charts";
            }
            return "vendor";
          }
        },
      },
    },
  },
});
