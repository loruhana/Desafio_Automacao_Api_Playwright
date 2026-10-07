import { errosDeCamposSchema, mensagemSchema, usuarioSchema } from '../../src/contratos/schemas';
import { validarResposta } from '../../src/contratos/validar-resposta';
import { idInexistente } from '../../src/dados/fabricas';
import { expect, test } from '../../src/fixtures';

test.describe('GET /usuarios/{id} - buscar usuário por ID', { tag: ['@regressao', '@REQ-03'] }, () => {
  test('[CT-BUS-01] deve retornar 200 com os dados do usuário consultado', { tag: '@smoke' }, async ({ usuarios, criarUsuario }) => {
    const usuario = await criarUsuario();

    const corpo = await validarResposta(await usuarios.buscarPorId(usuario._id), 200, usuarioSchema);

    expect(corpo).toEqual(usuario);
  });

  test('[CT-BUS-02] deve retornar 400 para um ID válido que não pertence a nenhum usuário', async ({ usuarios }) => {
    const corpo = await validarResposta(await usuarios.buscarPorId(idInexistente()), 400, mensagemSchema);

    expect(corpo.message).toBe('Usuário não encontrado');
  });

  const IDS_FORA_DO_FORMATO = {
    'com 15 caracteres': 'a'.repeat(15),
    'com 17 caracteres': 'a'.repeat(17),
    'com caracteres especiais': 'abcdefghijklmn@!',
  };

  for (const [descricao, id] of Object.entries(IDS_FORA_DO_FORMATO)) {
    test(`[CT-BUS-03] deve retornar 400 para um ID ${descricao}`, async ({ usuarios }) => {
      const corpo = await validarResposta(
        await usuarios.buscarPorId(encodeURIComponent(id)),
        400,
        errosDeCamposSchema,
      );

      expect(corpo).toEqual({ id: 'id deve ter exatamente 16 caracteres alfanuméricos' });
    });
  }
});
