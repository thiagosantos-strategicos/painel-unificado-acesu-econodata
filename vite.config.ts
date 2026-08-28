import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { app } from './server';

function acesuApiBackend(): Plugin {
  return {
    name: 'acesu-api-backend',
    configureServer(server) {
      server.middlewares.use(app);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), acesuApiBackend()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: false,
      watch: null,
    },
  };
});
