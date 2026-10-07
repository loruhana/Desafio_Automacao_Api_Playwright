import { ambiente } from '../../src/config/ambiente';
import { idInexistente } from '../../src/dados/fabricas';
import { expect, test } from '../../src/fixtures';

/**
 * REQ-07: "A API possui limitações de taxas: 100 requisições por minuto."
 * Executado apenas via `npm run test:limite-taxa` (configuração própria), porque dispara
 * mais de 100 requisições e não deve rodar junto da suíte funcional.
 */
test.describe('Limite de taxa', { tag: ['@limite-taxa', '@REQ-07'] }, () => {
  test(`[CT-LIM-01] deve aceitar ${ambiente.limiteRequisicoesPorMinuto} requisições no minuto e bloquear a seguinte com 429`, async ({ usuarios }) => {
    const limite = ambiente.limiteRequisicoesPorMinuto;
    const inicio = Date.now();

    // Consulta leve (filtro sem resultado) para não gerar carga de dados na API.
    const respostas = await Promise.all(
      Array.from({ length: limite }, () => usuarios.listar({ _id: idInexistente() })),
    );
    const excedente = await usuarios.listar({ _id: idInexistente() });
    const duracaoMs = Date.now() - inicio;

    expect(duracaoMs, 'As requisições precisam caber na mesma janela de 1 minuto').toBeLessThan(60_000);
    expect(respostas.filter((resposta) => resposta.status() === 429), 'Nenhuma requisição dentro do limite deve ser bloqueada').toHaveLength(0);
    expect(excedente.status(), `A requisição ${limite + 1} deve ser bloqueada por limite de taxa`).toBe(429);
  });
});
