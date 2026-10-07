import { test as base, expect } from '@playwright/test';
import { AutenticacaoCliente } from '../clientes/autenticacao-cliente';
import { CarrinhosCliente } from '../clientes/carrinhos-cliente';
import { ProdutosCliente } from '../clientes/produtos-cliente';
import type { Credenciais, NovoUsuario } from '../clientes/tipos';
import { UsuariosCliente } from '../clientes/usuarios-cliente';
import { novoUsuario } from '../dados/fabricas';

export type UsuarioCriado = NovoUsuario & { _id: string };

type Fixtures = {
  usuarios: UsuariosCliente;
  autenticacao: AutenticacaoCliente;
  produtos: ProdutosCliente;
  carrinhos: CarrinhosCliente;
  /** Registra uma ação de limpeza; as ações rodam ao fim do teste, da última para a primeira. */
  aoFinalizar: (acao: () => Promise<unknown>) => void;
  /** Cadastra um usuário via API (com limpeza automática) para servir de pré-condição. */
  criarUsuario: (dados?: Partial<NovoUsuario>) => Promise<UsuarioCriado>;
  /** Faz login e devolve o valor do header Authorization ("Bearer <jwt>"). */
  obterToken: (credenciais: Credenciais) => Promise<string>;
};

export const test = base.extend<Fixtures>({
  // Depende de `request` para que o contexto HTTP continue ativo durante a limpeza.
  aoFinalizar: async ({ request }, use) => {
    const acoes: Array<() => Promise<unknown>> = [];
    await use((acao) => acoes.push(acao));
    for (const acao of acoes.reverse()) {
      await acao();
    }
  },

  // Todo usuário criado pela API durante o teste (status 201) é excluído ao final.
  usuarios: async ({ request, aoFinalizar }, use) => {
    const cliente: UsuariosCliente = new UsuariosCliente(request, (id) => aoFinalizar(() => cliente.excluir(id)));
    await use(cliente);
  },
  autenticacao: async ({ request }, use) => use(new AutenticacaoCliente(request)),
  produtos: async ({ request }, use) => use(new ProdutosCliente(request)),
  carrinhos: async ({ request }, use) => use(new CarrinhosCliente(request)),

  criarUsuario: async ({ usuarios }, use) => {
    await use(async (dados = {}) => {
      const usuario = novoUsuario(dados);
      const resposta = await usuarios.cadastrar(usuario);
      expect(resposta.status(), 'Pré-condição: cadastro do usuário').toBe(201);
      const { _id } = await resposta.json();
      return { ...usuario, _id };
    });
  },

  obterToken: async ({ autenticacao }, use) => {
    await use(async (credenciais) => {
      const resposta = await autenticacao.login({ email: credenciais.email, password: credenciais.password });
      expect(resposta.status(), 'Pré-condição: login').toBe(200);
      const { authorization } = await resposta.json();
      return authorization as string;
    });
  },
});

export { expect };
