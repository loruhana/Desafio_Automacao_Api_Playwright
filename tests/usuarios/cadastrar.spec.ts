import type { NovoUsuario } from '../../src/clientes/tipos';
import { cadastroComSucessoSchema, errosDeCamposSchema, mensagemSchema, usuarioSchema } from '../../src/contratos/schemas';
import { validarResposta } from '../../src/contratos/validar-resposta';
import { novoUsuario } from '../../src/dados/fabricas';
import { expect, test } from '../../src/fixtures';

const CAMPOS_OBRIGATORIOS: Array<keyof NovoUsuario> = ['nome', 'email', 'password', 'administrador'];

test.describe('POST /usuarios - cadastrar usuário', { tag: ['@regressao', '@REQ-02', '@REQ-08'] }, () => {
  for (const administrador of ['true', 'false'] as const) {
    test(`[CT-CAD-01] deve cadastrar usuário com administrador=${administrador} e persistir os dados`, { tag: '@smoke' }, async ({ usuarios }) => {
      const usuario = novoUsuario({ administrador });

      const { _id } = await validarResposta(await usuarios.cadastrar(usuario), 201, cadastroComSucessoSchema);

      const salvo = await validarResposta(await usuarios.buscarPorId(_id), 200, usuarioSchema);
      expect(salvo).toEqual({ ...usuario, _id });
    });
  }

  test('[CT-CAD-02] deve rejeitar cadastro com e-mail já utilizado', async ({ usuarios, criarUsuario }) => {
    const existente = await criarUsuario();

    const corpo = await validarResposta(
      await usuarios.cadastrar(novoUsuario({ email: existente.email })),
      400,
      mensagemSchema,
    );

    expect(corpo.message).toBe('Este email já está sendo usado');
  });

  for (const campo of CAMPOS_OBRIGATORIOS) {
    test(`[CT-CAD-03] deve rejeitar cadastro sem o campo obrigatório "${campo}"`, async ({ usuarios }) => {
      const { [campo]: _removido, ...semCampo } = novoUsuario();

      const corpo = await validarResposta(await usuarios.cadastrar(semCampo), 400, errosDeCamposSchema);

      expect(corpo).toEqual({ [campo]: `${campo} é obrigatório` });
    });
  }

  test('[CT-CAD-04] deve listar todos os campos obrigatórios ao enviar corpo vazio', async ({ usuarios }) => {
    const corpo = await validarResposta(await usuarios.cadastrar({}), 400, errosDeCamposSchema);

    expect(corpo).toEqual({
      nome: 'nome é obrigatório',
      email: 'email é obrigatório',
      password: 'password é obrigatório',
      administrador: 'administrador é obrigatório',
    });
  });

  const MENSAGEM_CAMPO_VAZIO: Record<keyof NovoUsuario, string> = {
    nome: 'nome não pode ficar em branco',
    email: 'email não pode ficar em branco',
    password: 'password não pode ficar em branco',
    administrador: "administrador deve ser 'true' ou 'false'",
  };

  for (const campo of CAMPOS_OBRIGATORIOS) {
    test(`[CT-CAD-05] deve rejeitar cadastro com o campo "${campo}" vazio`, async ({ usuarios }) => {
      const corpo = await validarResposta(
        await usuarios.cadastrar({ ...novoUsuario(), [campo]: '' }),
        400,
        errosDeCamposSchema,
      );

      expect(corpo).toEqual({ [campo]: MENSAGEM_CAMPO_VAZIO[campo] });
    });
  }

  for (const campo of CAMPOS_OBRIGATORIOS.filter((nome) => nome !== 'administrador')) {
    test(`[CT-CAD-06] deve rejeitar cadastro com o campo "${campo}" em tipo diferente de string`, async ({ usuarios }) => {
      const corpo = await validarResposta(
        await usuarios.cadastrar({ ...novoUsuario(), [campo]: 12345 }),
        400,
        errosDeCamposSchema,
      );

      expect(corpo).toEqual({ [campo]: `${campo} deve ser uma string` });
    });
  }

  test('[CT-CAD-07] deve rejeitar cadastro com e-mail em formato inválido', async ({ usuarios }) => {
    const corpo = await validarResposta(
      await usuarios.cadastrar(novoUsuario({ email: 'email-sem-arroba.com' })),
      400,
      errosDeCamposSchema,
    );

    expect(corpo).toEqual({ email: 'email deve ser um email válido' });
  });

  for (const valor of ['sim', true]) {
    test(`[CT-CAD-08] deve rejeitar administrador diferente das strings "true"/"false" (valor: ${JSON.stringify(valor)})`, async ({ usuarios }) => {
      const corpo = await validarResposta(
        await usuarios.cadastrar({ ...novoUsuario(), administrador: valor }),
        400,
        errosDeCamposSchema,
      );

      expect(corpo).toEqual({ administrador: "administrador deve ser 'true' ou 'false'" });
    });
  }

  test('[CT-CAD-09] deve rejeitar cadastro com campo não previsto no contrato', async ({ usuarios }) => {
    const corpo = await validarResposta(
      await usuarios.cadastrar({ ...novoUsuario(), perfil: 'gerente' }),
      400,
      errosDeCamposSchema,
    );

    expect(corpo).toEqual({ perfil: 'perfil não é permitido' });
  });
});
