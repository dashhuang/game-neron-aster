import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',  // 允许局域网访问
    port: 3000,
    open: true
  },
  build: {
    target: 'es2020'
  }
});

