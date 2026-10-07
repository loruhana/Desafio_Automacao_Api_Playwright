# Matriz de rastreabilidade

Fonte dos requisitos: PDF "Desafio de Automação de Testes de API", versão 1.0 (12/09/2024).
Cada teste também carrega a tag do requisito (`@REQ-xx`), então é possível executar e filtrar o relatório por requisito:
`npx playwright test --grep @REQ-03`.

## Requisitos × entrega

| Requisito | Descrição (PDF) | Onde foi atendido | Status | Observação |
|---|---|---|---|---|
| REQ-01 | `GET /users` retorna a lista de todos os usuários | `tests/usuarios/listar.spec.ts`: CT-LST-01 a 07 (8 testes) | Atendido | Recurso `/usuarios` no ServeRest |
| REQ-02 | `POST /users` cria um novo usuário | `tests/usuarios/cadastrar.spec.ts`: CT-CAD-01 a 09 (19 testes) | Atendido | Inclui e-mail duplicado e campo não previsto |
| REQ-03 | `GET /users/{id}` retorna os detalhes de um usuário | `tests/usuarios/buscar-por-id.spec.ts`: CT-BUS-01 a 03 (5 testes) | Atendido | Inclui ID inexistente e ID fora do formato |
| REQ-04 | `PUT /users/{id}` atualiza um usuário | `tests/usuarios/atualizar.spec.ts`: CT-ATU-01 a 07 (10 testes) | Atendido | PUT com ID inexistente cria o usuário (documentado no Swagger) |
| REQ-05 | `DELETE /users/{id}` exclui um usuário | `tests/usuarios/excluir.spec.ts`: CT-EXC-01 a 04 (4 testes) | Atendido | Inclui a regra de usuário com carrinho |
| REQ-06 | Autenticação via token JWT | `tests/autenticacao/jwt.spec.ts`: CT-AUT-01 a 09 (9 testes); `atualizar.spec.ts`: CT-ATU-03 | Atendido | No ServeRest, `/usuarios` não exige token: o uso do JWT é validado em rota protegida (`POST /produtos`) |
| REQ-07 | Limite de 100 requisições por minuto | `tests/limite-taxa/limite-requisicoes.spec.ts`: CT-LIM-01; `playwright.limite-taxa.config.ts`; job `limite-taxa` no CI | Atendido (teste implementado) | O teste **falha** no ServeRest público: a 101ª requisição retorna 200. Divergência da API registrada abaixo (A-01) |
| REQ-08 | Campos obrigatórios `nome`, `email`, `password`, `administrador` (string) | `cadastrar.spec.ts`: CT-CAD-03 a 06 e 08; `atualizar.spec.ts`: CT-ATU-06 e 07 | Atendido | Cada campo testado ausente, vazio e com tipo inválido |
| REQ-09 | 100% de cobertura da API | README, seção 9 | Atendido | 100% dos endpoints, métodos e códigos de resposta documentados |
| REQ-10 | Ferramenta de testes de API à escolha | Playwright (`@playwright/test`), `package.json` | Atendido | |
| REQ-11 | Integração com pipeline de CI | `.github/workflows/testes-api.yml` (GitHub Actions) | Atendido | Gatilhos: push, PR e manual |
| REQ-12 | Relatórios disponibilizados como artefato na pipeline | Artefatos `relatorio-html` e `resultado-junit` (e `relatorio-limite-taxa`) | Atendido | Publicados mesmo quando há falha |
| REQ-13 | Documentação dos testes, de como executá-los e dos casos cobertos | `README.md` (seções 4 e 8), este documento | Atendido | |
| REQ-14 | Código-fonte completo no GitHub/GitLab | https://github.com/loruhana/Desafio_Automacao_Api_Playwright | Atendido | |
| REQ-15 | README com configuração do ambiente e execução | `README.md` (seções 2 a 6) | Atendido | |
| REQ-16 | API sugerida: ServeRest | `src/config/ambiente.ts` (`BASE_URL`) | Atendido | URL configurável por variável de ambiente |

## Achados sobre a API (para reportar ao time responsável)

| ID | Tipo | Achado | Evidência | Severidade sugerida |
|---|---|---|---|---|
| A-01 | Divergência de requisito | O limite de 100 requisições por minuto não é aplicado | CT-LIM-01: a requisição 101 retorna 200; sondagem com 120 requisições em 5 s, todas com 200 e sem headers de rate limit | Alta (se o limite for requisito do produto) |
| A-02 | Divergência de requisito | As rotas de `/usuarios` não exigem autenticação JWT: qualquer pessoa lista, cria, altera e exclui usuários | Swagger: `security` vazio nas rotas de usuários; todos os testes de usuários rodam sem token | Alta |
| A-03 | Segurança | O payload do JWT contém a **senha do usuário em texto puro** (claim `password`) | Decodificação do token emitido por `POST /login` | Alta |
| A-04 | Segurança | `GET /usuarios` e `GET /usuarios/{_id}` devolvem o campo `password` em texto puro | Contrato do Swagger e respostas validadas nos CTs de listagem e busca | Alta |
| A-05 | Comportamento questionável | `PUT /usuarios/{id}` com ID em formato inválido (ex.: `abc`) cria um usuário com **outro ID**, gerado pela API. O ID informado é ignorado | Sondagem manual; ATU-04 cobre o caso documentado (ID válido inexistente → 201) | Média |
| A-06 | Inconsistência | `GET /usuarios/{id}` responde **400** para usuário inexistente, quando o semântico seria 404 | CT-BUS-02 (segue o contrato documentado) | Baixa |
| A-07 | Observação | A API aceita e-mails internacionalizados, como `😊@test.com`, que já existem na base pública | Listagem da base; por isso o contrato valida `email` como string, igual ao Swagger | Baixa |

Os achados A-02 a A-06 seguem o contrato publicado no Swagger. Por isso os testes validam o comportamento documentado e os
achados ficam registrados como recomendação. Não se trata de alterar asserções para esconder falhas.
