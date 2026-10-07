import { defineConfig } from '@playwright/test';
import { ambiente } from './src/config/ambiente';

/**
 * Configuração principal: suíte funcional completa da API de usuários.
 * O teste de limite de taxa tem configuração própria (playwright.limite-taxa.config.ts),
 * pois dispara mais de 100 requisições e não deve rodar a cada execução.
 */
export default defineConfig({
  testDir: './tests',
  testIgnore: '**/limite-taxa/**',

  // Cada teste cria e remove a própria massa de dados, então todos podem rodar em paralelo.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    // No GitHub Actions, as falhas também aparecem como anotações no resumo da execução.
    ...(process.env.CI ? [['github'] as ['github']] : []),
  ],

  use: {
    baseURL: ambiente.baseURL,
    extraHTTPHeaders: { Accept: 'application/json' },
  },
});
