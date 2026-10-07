import 'dotenv/config';

/**
 * Único ponto de leitura das variáveis de ambiente.
 * Valores padrão permitem rodar o projeto sem .env (ex.: máquina limpa ou CI).
 */
export const ambiente = {
  baseURL: process.env.BASE_URL || 'https://serverest.dev',
  limiteRequisicoesPorMinuto: Number(process.env.LIMITE_REQUISICOES_POR_MINUTO || 100),
};
