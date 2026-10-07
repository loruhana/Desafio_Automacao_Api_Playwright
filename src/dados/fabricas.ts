import { randomUUID } from 'node:crypto';
import { fakerPT_BR as faker } from '@faker-js/faker';
import type { NovoProduto, NovoUsuario } from '../clientes/tipos';

/**
 * Massa de dados gerada a cada execução: nenhum dado fixo, nenhuma senha real no código.
 * O UUID no e-mail garante unicidade mesmo com testes em paralelo.
 */
export function novoUsuario(sobrescrever: Partial<NovoUsuario> = {}): NovoUsuario {
  return {
    nome: faker.person.fullName(),
    email: `qa.${randomUUID()}@example.com`,
    password: faker.internet.password({ length: 12 }),
    administrador: 'false',
    ...sobrescrever,
  };
}

export function novoProduto(): NovoProduto {
  return {
    nome: `${faker.commerce.productName()} ${randomUUID()}`,
    preco: faker.number.int({ min: 1, max: 1000 }),
    descricao: faker.commerce.productDescription(),
    quantidade: faker.number.int({ min: 1, max: 50 }),
  };
}

/** ID com formato válido (16 alfanuméricos) que não pertence a nenhum usuário. */
export function idInexistente(): string {
  return faker.string.alphanumeric(16);
}
