import type { APIRequestContext } from '@playwright/test';
import { cabecalhoAutorizacao } from './autorizacao';
import type { ItemCarrinho } from './tipos';

/** Usado apenas para preparar o cenário "não excluir usuário com carrinho" (REQ-05). */
export class CarrinhosCliente {
  constructor(private readonly request: APIRequestContext) {}

  cadastrar(produtos: ItemCarrinho[], token: string) {
    return this.request.post('/carrinhos', { data: { produtos }, headers: cabecalhoAutorizacao(token) });
  }

  cancelarCompra(token: string) {
    return this.request.delete('/carrinhos/cancelar-compra', { headers: cabecalhoAutorizacao(token) });
  }
}
