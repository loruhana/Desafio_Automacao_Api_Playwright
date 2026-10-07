import type { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * Recurso de usuários. No PDF os endpoints aparecem como /users;
 * na API sugerida (ServeRest) o recurso equivalente é /usuarios.
 */
const RECURSO = '/usuarios';

export class UsuariosCliente {
  /**
   * @param aoCriarUsuario chamado com o _id sempre que a API responder 201 (POST ou PUT),
   * permitindo que a fixture remova ao final do teste todo usuário criado — inclusive
   * os criados indevidamente em cenários negativos.
   */
  constructor(
    private readonly request: APIRequestContext,
    private readonly aoCriarUsuario: (id: string) => void = () => {},
  ) {}

  listar(filtros: Record<string, string> = {}) {
    return this.request.get(RECURSO, { params: filtros });
  }

  /** Recebe `object` para permitir também corpos inválidos nos testes negativos. */
  async cadastrar(dados: object) {
    return this.registrarCriacao(await this.request.post(RECURSO, { data: dados }));
  }

  buscarPorId(id: string) {
    return this.request.get(`${RECURSO}/${id}`);
  }

  /** No ServeRest, PUT com ID inexistente cadastra um novo usuário (201). */
  async atualizar(id: string, dados: object) {
    return this.registrarCriacao(await this.request.put(`${RECURSO}/${id}`, { data: dados }));
  }

  excluir(id: string) {
    return this.request.delete(`${RECURSO}/${id}`);
  }

  private async registrarCriacao(resposta: APIResponse) {
    if (resposta.status() === 201) {
      const { _id } = await resposta.json();
      this.aoCriarUsuario(_id);
    }
    return resposta;
  }
}
