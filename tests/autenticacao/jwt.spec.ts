import {
  cabecalhoJwtSchema,
  cadastroComSucessoSchema,
  errosDeCamposSchema,
  loginComSucessoSchema,
  mensagemSchema,
  payloadJwtSchema,
} from '../../src/contratos/schemas';
import { validarResposta } from '../../src/contratos/validar-resposta';
import { novoProduto, novoUsuario } from '../../src/dados/fabricas';
import { expect, test } from '../../src/fixtures';

const MENSAGEM_TOKEN_INVALIDO = 'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais';

function decodificarParteJwt(parte: string): unknown {
  return JSON.parse(Buffer.from(parte, 'base64url').toString('utf-8'));
}

/**
 * REQ-06: autenticação via JWT.
 * No ServeRest o token é emitido por POST /login. As rotas de /usuarios não exigem token,
 * então a proteção é validada na rota administrativa POST /produtos (ver README).
 */
test.describe('Autenticação JWT', { tag: ['@regressao', '@REQ-06'] }, () => {
  test.describe('POST /login - emissão do token', () => {
    test('[CT-AUT-01] deve emitir um JWT válido para credenciais corretas', { tag: '@smoke' }, async ({ autenticacao, criarUsuario }) => {
      const usuario = await criarUsuario();

      const corpo = await validarResposta(
        await autenticacao.login({ email: usuario.email, password: usuario.password }),
        200,
        loginComSucessoSchema,
      );

      const [cabecalho, payload] = corpo.authorization.replace('Bearer ', '').split('.');
      expect(cabecalhoJwtSchema.parse(decodificarParteJwt(cabecalho))).toMatchObject({ typ: 'JWT' });
      const claims = payloadJwtSchema.parse(decodificarParteJwt(payload));
      expect(claims.email).toBe(usuario.email);
      expect(claims.exp).toBeGreaterThan(claims.iat);
    });

    test('[CT-AUT-02] deve rejeitar login com senha incorreta', async ({ autenticacao, criarUsuario }) => {
      const usuario = await criarUsuario();

      const corpo = await validarResposta(
        await autenticacao.login({ email: usuario.email, password: `${usuario.password}-errada` }),
        401,
        mensagemSchema,
      );

      expect(corpo.message).toBe('Email e/ou senha inválidos');
    });

    test('[CT-AUT-03] deve rejeitar login de e-mail não cadastrado', async ({ autenticacao }) => {
      const { email, password } = novoUsuario();

      const corpo = await validarResposta(await autenticacao.login({ email, password }), 401, mensagemSchema);

      expect(corpo.message).toBe('Email e/ou senha inválidos');
    });

    test('[CT-AUT-04] deve exigir e-mail e senha no login', async ({ autenticacao }) => {
      const corpo = await validarResposta(await autenticacao.login({}), 400, errosDeCamposSchema);

      expect(corpo).toEqual({ email: 'email é obrigatório', password: 'password é obrigatório' });
    });
  });

  test.describe('Rota protegida (POST /produtos) - uso do token', () => {
    test('[CT-AUT-05] deve permitir acesso com token válido de administrador', { tag: '@smoke' }, async ({ produtos, criarUsuario, obterToken, aoFinalizar }) => {
      const token = await obterToken(await criarUsuario({ administrador: 'true' }));

      const { _id } = await validarResposta(await produtos.cadastrar(novoProduto(), token), 201, cadastroComSucessoSchema);
      aoFinalizar(() => produtos.excluir(_id, token));
    });

    test('[CT-AUT-06] deve negar acesso sem token', async ({ produtos }) => {
      const corpo = await validarResposta(await produtos.cadastrar(novoProduto()), 401, mensagemSchema);

      expect(corpo.message).toBe(MENSAGEM_TOKEN_INVALIDO);
    });

    test('[CT-AUT-07] deve negar acesso com token adulterado', async ({ produtos, criarUsuario, obterToken }) => {
      const token = await obterToken(await criarUsuario({ administrador: 'true' }));
      const tokenAdulterado = `${token.slice(0, -4)}AAAA`;

      const corpo = await validarResposta(await produtos.cadastrar(novoProduto(), tokenAdulterado), 401, mensagemSchema);

      expect(corpo.message).toBe(MENSAGEM_TOKEN_INVALIDO);
    });

    test('[CT-AUT-08] deve negar acesso com token de usuário que não existe mais', async ({ usuarios, produtos, criarUsuario, obterToken }) => {
      const administrador = await criarUsuario({ administrador: 'true' });
      const token = await obterToken(administrador);
      await validarResposta(await usuarios.excluir(administrador._id), 200, mensagemSchema);

      const corpo = await validarResposta(await produtos.cadastrar(novoProduto(), token), 401, mensagemSchema);

      expect(corpo.message).toBe(MENSAGEM_TOKEN_INVALIDO);
    });

    test('[CT-AUT-09] deve negar acesso de usuário não administrador à rota administrativa', async ({ produtos, criarUsuario, obterToken }) => {
      const token = await obterToken(await criarUsuario({ administrador: 'false' }));

      const corpo = await validarResposta(await produtos.cadastrar(novoProduto(), token), 403, mensagemSchema);

      expect(corpo.message).toBe('Rota exclusiva para administradores');
    });
  });
});
