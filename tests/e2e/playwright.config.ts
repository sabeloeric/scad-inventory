import { defineConfig } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const e2eDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(e2eDirectory, '../..')

export default defineConfig({
  testDir: e2eDirectory,
  testMatch: '*.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'docker compose -p scad-inventory-e2e up --build',
      cwd: repositoryRoot,
      env: {
        POSTGRES_DB: 'scad_inventory_e2e',
        POSTGRES_USER: 'scad_inventory',
        POSTGRES_PASSWORD: 'scad_inventory_e2e_password',
        POSTGRES_PORT: '55432',
        API_PORT: '5098',
        JWT_ISSUER: 'scad-inventory-api',
        JWT_AUDIENCE: 'scad-inventory-ui',
        JWT_SIGNING_KEY: 'e2e-only-signing-key-with-at-least-32-characters',
        JWT_EXPIRATION_MINUTES: '10',
      },
      url: 'http://127.0.0.1:5098/products',
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5174',
      cwd: path.join(repositoryRoot, 'src/scad-inventory-ui'),
      env: {
        VITE_API_PROXY_TARGET: 'http://127.0.0.1:5098',
      },
      url: 'http://127.0.0.1:5174/login',
      reuseExistingServer: false,
      timeout: 30_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
})
