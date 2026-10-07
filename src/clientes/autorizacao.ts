/**
 * `token` é o valor completo devolvido pelo login ("Bearer <jwt>").
 * Sem token, nenhum header é enviado (cenário de requisição não autenticada).
 */
export function cabecalhoAutorizacao(token?: string): Record<string, string> {
  return token ? { Authorization: token } : {};
}
