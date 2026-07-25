import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite Configuration — Finora Frontend
 *
 * Dev Server Proxy:
 *   All requests starting with /api are transparently forwarded to the
 *   Express backend running on port 7777. This means:
 *   - No CORS errors in development (same origin from browser's perspective)
 *   - httpOnly cookies are sent automatically (no credentials: 'include' needed locally)
 *   - No hardcoded backend URLs in frontend code
 *
 * Production:
 *   The proxy only applies during `npm run dev`.
 *   In production, set VITE_API_URL to your deployed backend URL.
 */
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      // Forward all /api/* requests to the Express backend
      '/api': {
        target: 'http://localhost:7777',
        changeOrigin: true,   // Rewrite the Host header to match the target
        secure: false,        // Allow self-signed certs in local dev if needed
      },
    },
  },
});