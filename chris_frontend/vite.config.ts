import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function normalizeBase(raw: string | undefined): string {
  if (!raw) return "/";
  // Ensure leading slash and trailing slash for Vite base.
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = normalizeBase(env.REACT_APP_PUBLIC_URL);

  const port = Number(env.REACT_APP_PORT || 3000);

  return {
    base,
    plugins: [react()],
    // IMPORTANT: Expose REACT_APP_* to client code (we keep your existing .env as-is).
    envPrefix: ["VITE_", "REACT_APP_"],
    server: {
      // Bind to all interfaces so the Kavia preview reverse proxy can reach the dev server.
      host: true,
      port,
      strictPort: true
    },
    preview: {
      // Also bind preview server to all interfaces for `vite preview`.
      host: true,
      port,
      strictPort: true
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      css: true
    }
  };
});
