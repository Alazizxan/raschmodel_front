import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Backend localhost:8000 ga proxy
      "/tests": "http://localhost:8000",
      "/students": "http://localhost:8000",
    },
  },
});
