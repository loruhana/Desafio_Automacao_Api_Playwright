import type { NovoUsuario } from '../../src/clientes/tipos';
import {
  cadastroComSucessoSchema,
  errosDeCamposSchema,
  mensagemSchema,
  usuarioSchema,
} from '../../src/contratos/schemas';
import { validarResposta } from '../../src/contratos/validar-resposta';
import { idInexistente, novoUsuario } from '../../src/dados/fabricas';
import { expect, test } from '../../src/fixtures';

test.describe('PUT /usuarios/{id} - atualizar usuário', { tag: ['@regressao', '@REQ-04'] }, () => {
  test('[CT-ATU-01] deve atualizar todos os dados do usuário e persistir a alteração', { tag: '@smoke' }, async ({ usuarios, criarUsuario }) => {
    const usuario = await criarUsuario({ administrador: 'false' });
    const novosDados = novoUsuario({ administrador: 'true' });

    const corpo = await validarResposta(await usuarios.atualizar(usuario._id, novosDados), 200, mensagemSchema);
    expect(corpo.message).toBe('Registro alterado com sucesso');

    const salvo = await validarResposta(await usuarios.buscarPorId(usuario._id), 200, usuarioSchema);
    expect(salvo).toEqual({ ...novosDados, _id: usuario._id });
  });

  test('[CT-ATU-02] deve permitir manter o próprio e-mail ao atualizar os demais campos', async ({ usuarios, criarUsuario }) => {
    const usuario = await criarUsuario();
    const novosDados = novoUsuario({ email: usuario.email });

    const corpo = await validarResposta(await usuarios.atualizar(usuario._id, novosDados), 200, mensagemSchema);

    expect(corpo.message).toBe('Registro alterado com sucesso');
  });

  test('[CT-ATU-03] deve passar a autenticar com a nova senha após a atualização', { tag: '@REQ-06' }, async ({ usuarios, autenticacao, criarUsuario }) => {
    const usuario = await criarUsuario();
    const novaSenha = novoUsuario().password;
    const { _id, ...dadosAtuais } = usuario;

    await validarResposta(await usuarios.atualizar(_id, { ...dadosAtuais, password: novaSenha }), 200, mensagemSchema);

    expect((await autenticacao.login({ email: usuario.email, password: novaSenha })).status()).toBe(200);
    expect((await autenticacao.login({ email: usuario.email, password: usuario.password })).status()).toBe(401);
  });

  test('[CT-ATU-04] deve cadastrar um novo usuário quando o ID informado não existe', async ({ usuarios }) => {
    // Comportamento documentado no Swagger do ServeRest: PUT sem registro correspondente cria o usuário.
    const dados = novoUsuario();

    const { _id } = await validarResposta(
      await usuarios.atualizar(idInexistente(), dados),
      201,
      cadastroComSucessoSchema,
    );

    const salvo = await validarResposta(await usuarios.buscarPorId(_id), 200, usuarioSchema);
    expect(salvo).toEqual({ ...dados, _id });
  });

  test('[CT-ATU-05] deve rejeitar atualização para um e-mail já usado por outro usuário', async ({ usuarios, criarUsuario }) => {
    const outroUsuario = await criarUsuario();
    const usuario = await criarUsuario();

    const corpo = await validarResposta(
      await usuarios.atualizar(usuario._id, novoUsuario({ email: outroUsuario.email })),
      400,
      mensagemSchema,
    );
    expect(corpo.message).toBe('Este email já está sendo usado');

    const salvo = await validarResposta(await usuarios.buscarPorId(usuario._id), 200, usuarioSchema);
    expect(salvo.email).toBe(usuario.email);
  });

  for (const campo of ['nome', 'email', 'password', 'administrador'] as Array<keyof NovoUsuario>) {
    test(`[CT-ATU-06] deve rejeitar atualização sem o campo obrigatório "${campo}"`, async ({ usuarios, criarUsuario }) => {
      const usuario = await criarUsuario();
      const { [campo]: _removido, ...semCampo } = novoUsuario();

      const corpo = await validarResposta(await usuarios.atualizar(usuario._id, semCampo), 400, errosDeCamposSchema);

      expect(corpo).toEqual({ [campo]: `${campo} é obrigatório` });
    });
  }

  test('[CT-ATU-07] deve rejeitar atualização com administrador fora de "true"/"false"', async ({ usuarios, criarUsuario }) => {
    const usuario = await criarUsuario();

    const corpo = await validarResposta(
      await usuarios.atualizar(usuario._id, { ...novoUsuario(), administrador: 'admin' }),
      400,
      errosDeCamposSchema,
    );

    expect(corpo).toEqual({ administrador: "administrador deve ser 'true' ou 'false'" });
  });
});
