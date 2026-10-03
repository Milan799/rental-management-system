import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let gitCommit = '';
try {
  gitCommit = process.env.VERCEL_GIT_COMMIT_SHA 
    ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7) 
    : execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  gitCommit = 'v' + Date.now().toString().slice(-6);
}

const buildTimestamp = Date.now();

export default defineConfig({
  define: {
    __APP_BUILD_TIME__: JSON.stringify(buildTimestamp),
    __APP_GIT_COMMIT__: JSON.stringify(gitCommit)
  },
  plugins: [
    react(),
    {
      name: 'generate-version-json',
      buildStart() {
        const publicDir = path.resolve(__dirname, 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        fs.writeFileSync(
          path.resolve(publicDir, 'version.json'),
          JSON.stringify({
            version: '1.0.0',
            gitCommit,
            buildTime: buildTimestamp,
            builtAt: new Date(buildTimestamp).toISOString()
          }, null, 2)
        );
      },
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({
            version: '1.0.0',
            gitCommit,
            buildTime: buildTimestamp,
            builtAt: new Date(buildTimestamp).toISOString()
          }, null, 2)
        });
      }
    }
  ],
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_LOCAL_BACKEND ? 'http://localhost:5000' : 'https://rental-management-system-yjfg.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
