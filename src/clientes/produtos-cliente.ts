import type { APIRequestContext } from '@playwright/test';
import { cabecalhoAutorizacao } from './autorizacao';
import type { NovoProduto } from './tipos';

/**
 * Rota protegida por JWT e exclusiva de administradores. Usada para validar a
 * autenticação (REQ-06) e para montar o cenário de usuário com carrinho (REQ-05).
 */
export class ProdutosCliente {
  constructor(private readonly request: APIRequestContext) {}

  cadastrar(produto: NovoProduto, token?: string) {
    return this.request.post('/produtos', { data: produto, headers: cabecalhoAutorizacao(token) });
  }

  excluir(id: string, token: string) {
    return this.request.delete(`/produtos/${id}`, { headers: cabecalhoAutorizacao(token) });
  }
}
