import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    '__APP_VERSION__': JSON.stringify(process.env.npm_package_version)
  },
  server: {
    port: 9966
  }
});