import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";
import type { Plugin } from "vite";
import viteCompression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["MISLogo.svg", "favicon.ico"],
      manifest: {
        name: "VBoS MIS",
        short_name: "VBoS MIS",
        description: "Vanuatu Bureau of Statistics Management Information System",
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
            urlPattern: /^https:\/\/tiles\.openfreemap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
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
            if (id.includes("maplibre-gl") || id.includes("react-map-gl") || id.includes("pmtiles")) {
              return "map";
            }
            if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler")) {
              return "react";
            }
            if (id.includes("@chakra-ui") || id.includes("@emotion") || id.includes("framer-motion")) {
              return "chakra";
            }
            if (id.includes("recharts") || id.includes("d3-")) {
              return "charts";
            }
            return "vendor";
          }
        },
      },
    },
  },
});
