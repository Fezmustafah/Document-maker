import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" so the static build also works from a subpath (GitHub Pages)
export default defineConfig({
  base: "./",
  plugins: [react()],
});
