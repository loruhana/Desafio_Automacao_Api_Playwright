/** Corpo de criação/atualização de usuário: todos os campos são strings obrigatórias (REQ-08). */
export interface NovoUsuario {
  nome: string;
  email: string;
  password: string;
  administrador: 'true' | 'false';
}

export interface Credenciais {
  email: string;
  password: string;
}

export interface NovoProduto {
  nome: string;
  preco: number;
  descricao: string;
  quantidade: number;
}

export interface ItemCarrinho {
  idProduto: string;
  quantidade: number;
}
