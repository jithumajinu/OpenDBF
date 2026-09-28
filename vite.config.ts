import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,   // listen on 0.0.0.0 so other devices on the WiFi can connect
    port: 5173,
  },
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  resolve: {
    extensions: [".ts", ".tsx"],
    alias: [
      {
        find: "@components",
        replacement: path.resolve(__dirname, "src/components"),
      },
      {
        find: "@appAssets",
        replacement: path.resolve(__dirname, "src"),
      },
      {
        find: "@pages",
        replacement: path.resolve(__dirname, "src/pages"),
      },
      {
        find: "@context",
        replacement: path.resolve(__dirname, "src/context"),
      },
      {
        find: "@apiServices",
        replacement: path.resolve(__dirname, "src/apiServices"),
      },
      {
        find: "@store",
        replacement: path.resolve(__dirname, "src/store"),
      },
      {
        find: "@hooks",
        replacement: path.resolve(__dirname, "src/hooks"),
      },
    ],
  },
});
