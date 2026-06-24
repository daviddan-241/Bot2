import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_ROUTES = [
  '/health', '/login', '/register', '/dashboard', '/leads',
  '/ai', '/campaigns', '/whatsapp', '/email', '/connections', '/mvp',
];

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: Object.fromEntries(
      API_ROUTES.map((route) => [
        route,
        { target: 'http://localhost:3001', changeOrigin: true },
      ])
    ),
  },
});
