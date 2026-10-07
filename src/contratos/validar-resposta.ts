import { APIResponse, expect } from '@playwright/test';
import { z } from 'zod';

/**
 * Valida status, cabeçalho Content-Type e contrato (schema zod) de uma resposta.
 * Retorna o corpo já tipado, para que o teste siga com as asserções de negócio.
 */
export async function validarResposta<T extends z.ZodType>(
  resposta: APIResponse,
  statusEsperado: number,
  schema: T,
): Promise<z.infer<T>> {
  const corpo = await resposta.json();

  expect(resposta.status(), `Status inesperado. Corpo: ${JSON.stringify(corpo)}`).toBe(statusEsperado);
  expect(resposta.headers()['content-type']).toContain('application/json');

  const resultado = schema.safeParse(corpo);
  expect(
    resultado.success,
    `Resposta fora do contrato:\n${resultado.error ? z.prettifyError(resultado.error) : ''}\nCorpo: ${JSON.stringify(corpo)}`,
  ).toBe(true);

  return resultado.data as z.infer<T>;
}
