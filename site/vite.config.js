import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" so the static build also works from any host/subpath
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: { port: 5180, strictPort: false },
});
