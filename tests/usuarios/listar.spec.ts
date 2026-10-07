import { validarResposta } from '../../src/contratos/validar-resposta';
import { errosDeCamposSchema, listaUsuariosSchema } from '../../src/contratos/schemas';
import { idInexistente } from '../../src/dados/fabricas';
import { expect, test } from '../../src/fixtures';

test.describe('GET /usuarios - listar usuários', { tag: ['@regressao', '@REQ-01'] }, () => {
  test('[CT-LST-01] deve retornar 200 com a lista de usuários no contrato esperado', { tag: '@smoke' }, async ({ usuarios }) => {
    const corpo = await validarResposta(await usuarios.listar(), 200, listaUsuariosSchema);

    expect(corpo.quantidade).toBe(corpo.usuarios.length);
  });

  test('[CT-LST-02] deve incluir na lista um usuário recém-cadastrado', async ({ usuarios, criarUsuario }) => {
    const usuario = await criarUsuario();

    const corpo = await validarResposta(await usuarios.listar(), 200, listaUsuariosSchema);

    expect(corpo.usuarios).toContainEqual(usuario);
  });

  test('[CT-LST-03] deve retornar somente o usuário correspondente ao filtrar por _id', async ({ usuarios, criarUsuario }) => {
    const usuario = await criarUsuario();

    const corpo = await validarResposta(await usuarios.listar({ _id: usuario._id }), 200, listaUsuariosSchema);

    expect(corpo).toEqual({ quantidade: 1, usuarios: [usuario] });
  });

  test('[CT-LST-04] deve retornar somente o usuário correspondente ao filtrar por e-mail', async ({ usuarios, criarUsuario }) => {
    const usuario = await criarUsuario();

    const corpo = await validarResposta(await usuarios.listar({ email: usuario.email }), 200, listaUsuariosSchema);

    expect(corpo).toEqual({ quantidade: 1, usuarios: [usuario] });
  });

  for (const perfil of ['true', 'false'] as const) {
    test(`[CT-LST-05] deve retornar apenas usuários com administrador=${perfil} ao filtrar pelo perfil`, async ({ usuarios, criarUsuario }) => {
      const usuario = await criarUsuario({ administrador: perfil });

      const corpo = await validarResposta(await usuarios.listar({ administrador: perfil }), 200, listaUsuariosSchema);

      expect(corpo.usuarios.every((item) => item.administrador === perfil)).toBe(true);
      expect(corpo.usuarios).toContainEqual(usuario);
    });
  }

  test('[CT-LST-06] deve retornar lista vazia quando nenhum usuário corresponde ao filtro', async ({ usuarios }) => {
    const corpo = await validarResposta(await usuarios.listar({ _id: idInexistente() }), 200, listaUsuariosSchema);

    expect(corpo).toEqual({ quantidade: 0, usuarios: [] });
  });

  test('[CT-LST-07] deve retornar 400 ao filtrar por um valor de administrador inválido', async ({ usuarios }) => {
    const corpo = await validarResposta(await usuarios.listar({ administrador: 'talvez' }), 400, errosDeCamposSchema);

    expect(corpo).toEqual({ administrador: "administrador deve ser 'true' ou 'false'" });
  });
});
