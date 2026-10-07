import { z } from 'zod';

/** O ServeRest gera IDs com exatamente 16 caracteres alfanuméricos. */
const idServeRest = z.string().regex(/^[A-Za-z0-9]{16}$/, 'ID deve ter 16 caracteres alfanuméricos');

/**
 * Fiel ao contrato publicado no Swagger do ServeRest: e-mail é apenas `string`.
 * A regra de formato do e-mail é testada no cadastro (CT-CAD-07), não no contrato,
 * pois a base pública contém e-mails internacionalizados (ex.: com emoji) aceitos pela API.
 */
export const usuarioSchema = z.strictObject({
  nome: z.string(),
  email: z.string(),
  password: z.string(),
  administrador: z.enum(['true', 'false']),
  _id: idServeRest,
});

export const listaUsuariosSchema = z.strictObject({
  quantidade: z.number().int().nonnegative(),
  usuarios: z.array(usuarioSchema),
});

export const cadastroComSucessoSchema = z.strictObject({
  message: z.literal('Cadastro realizado com sucesso'),
  _id: idServeRest,
});

export const mensagemSchema = z.strictObject({
  message: z.string(),
});

/** Erros de validação de campos: cada chave é o campo e o valor é a mensagem. */
export const errosDeCamposSchema = z.record(z.string(), z.string());

export const loginComSucessoSchema = z.strictObject({
  message: z.literal('Login realizado com sucesso'),
  authorization: z.string().regex(/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/, 'deve ser "Bearer <JWT>"'),
});

export const cabecalhoJwtSchema = z.object({
  alg: z.string(),
  typ: z.literal('JWT'),
});

export const payloadJwtSchema = z.object({
  email: z.string(),
  iat: z.number().int(),
  exp: z.number().int(),
});

export const exclusaoBloqueadaPorCarrinhoSchema = z.strictObject({
  message: z.literal('Não é permitido excluir usuário com carrinho cadastrado'),
  idCarrinho: idServeRest,
});
