import { cadastroComSucessoSchema, exclusaoBloqueadaPorCarrinhoSchema, mensagemSchema, usuarioSchema } from '../../src/contratos/schemas';
import { validarResposta } from '../../src/contratos/validar-resposta';
import { idInexistente, novoProduto } from '../../src/dados/fabricas';
import { expect, test } from '../../src/fixtures';

test.describe('DELETE /usuarios/{id} - excluir usuário', { tag: ['@regressao', '@REQ-05'] }, () => {
  test('[CT-EXC-01] deve excluir o usuário e ele deixar de ser encontrado', { tag: '@smoke' }, async ({ usuarios, criarUsuario }) => {
    const usuario = await criarUsuario();

    const corpo = await validarResposta(await usuarios.excluir(usuario._id), 200, mensagemSchema);
    expect(corpo.message).toBe('Registro excluído com sucesso');

    const busca = await validarResposta(await usuarios.buscarPorId(usuario._id), 400, mensagemSchema);
    expect(busca.message).toBe('Usuário não encontrado');
  });

  test('[CT-EXC-02] deve informar que nenhum registro foi excluído para um ID inexistente', async ({ usuarios }) => {
    const corpo = await validarResposta(await usuarios.excluir(idInexistente()), 200, mensagemSchema);

    expect(corpo.message).toBe('Nenhum registro excluído');
  });

  test('[CT-EXC-03] deve informar que nenhum registro foi excluído ao repetir a exclusão', async ({ usuarios, criarUsuario }) => {
    const usuario = await criarUsuario();
    await validarResposta(await usuarios.excluir(usuario._id), 200, mensagemSchema);

    const corpo = await validarResposta(await usuarios.excluir(usuario._id), 200, mensagemSchema);

    expect(corpo.message).toBe('Nenhum registro excluído');
  });

  test('[CT-EXC-04] deve impedir a exclusão de usuário com carrinho cadastrado', async ({
    usuarios,
    produtos,
    carrinhos,
    criarUsuario,
    obterToken,
    aoFinalizar,
  }) => {
    // Pré-condição: um administrador cadastra um produto e o usuário o coloca no carrinho.
    const administrador = await criarUsuario({ administrador: 'true' });
    const tokenAdministrador = await obterToken(administrador);
    const cliente = await criarUsuario();
    const tokenCliente = await obterToken(cliente);

    const produto = await validarResposta(
      await produtos.cadastrar(novoProduto(), tokenAdministrador),
      201,
      cadastroComSucessoSchema,
    );
    aoFinalizar(() => produtos.excluir(produto._id, tokenAdministrador));

    const carrinho = await validarResposta(
      await carrinhos.cadastrar([{ idProduto: produto._id, quantidade: 1 }], tokenCliente),
      201,
      cadastroComSucessoSchema,
    );
    aoFinalizar(() => carrinhos.cancelarCompra(tokenCliente));

    const corpo = await validarResposta(await usuarios.excluir(cliente._id), 400, exclusaoBloqueadaPorCarrinhoSchema);
    expect(corpo.idCarrinho).toBe(carrinho._id);

    await validarResposta(await usuarios.buscarPorId(cliente._id), 200, usuarioSchema);
  });
});
