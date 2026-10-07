import type { APIRequestContext } from '@playwright/test';

export class AutenticacaoCliente {
  constructor(private readonly request: APIRequestContext) {}

  login(credenciais: object) {
    return this.request.post('/login', { data: credenciais });
  }
}
