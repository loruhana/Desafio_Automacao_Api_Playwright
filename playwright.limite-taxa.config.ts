import { defineConfig } from '@playwright/test';
import configPrincipal from './playwright.config';

/**
 * Executa somente o teste do limite de 100 requisições por minuto (REQ-07).
 * Separado da suíte principal para não sobrecarregar a API a cada execução
 * e para não interferir nos demais testes.
 */
export default defineConfig({
  ...configPrincipal,
  testIgnore: undefined,
  testMatch: '**/limite-taxa/**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-limite-taxa', open: 'never' }],
    ['junit', { outputFile: 'test-results-limite-taxa/junit.xml' }],
  ],
  outputDir: 'test-results-limite-taxa',
});
