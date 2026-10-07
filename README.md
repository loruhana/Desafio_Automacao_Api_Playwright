# Desafio de Automação de Testes de API

[![Testes de API](https://github.com/loruhana/Desafio_Automacao_Api_Playwright/actions/workflows/testes-api.yml/badge.svg)](https://github.com/loruhana/Desafio_Automacao_Api_Playwright/actions/workflows/testes-api.yml)

Testes automatizados da API RESTful de gerenciamento de usuários (criação, leitura, atualização e exclusão),
usando a API sugerida no desafio: [ServeRest](https://serverest.dev).

- **Stack:** Node.js · TypeScript · Playwright (testes de API) · Zod (contrato) · Faker (massa de dados) · GitHub Actions
- **Resultado:** 55 testes na suíte funcional + 1 teste de limite de taxa (execução separada)
- **Rastreabilidade requisito → teste:** [docs/matriz-rastreabilidade.md](docs/matriz-rastreabilidade.md)

---

## 1. Endpoints do desafio × ServeRest

O PDF descreve o recurso como `/users`. Na API sugerida, o recurso equivalente é `/usuarios`:

| Desafio (PDF) | ServeRest | Operação |
|---|---|---|
| `GET /users` | `GET /usuarios` | Lista todos os usuários |
| `POST /users` | `POST /usuarios` | Cria um usuário |
| `GET /users/{id}` | `GET /usuarios/{_id}` | Detalha um usuário |
| `PUT /users/{id}` | `PUT /usuarios/{_id}` | Atualiza um usuário |
| `DELETE /users/{id}` | `DELETE /usuarios/{_id}` | Exclui um usuário |
| Autenticação JWT | `POST /login` (emite o token) + rota protegida `POST /produtos` | Ver [seção 7](#7-divergências-entre-o-pdf-e-a-api-serverest) |

## 2. Pré-requisitos

- [Node.js](https://nodejs.org) **22.13 ou superior** (recomendado: 24 LTS) e npm
- Git
- Acesso à internet (os testes chamam `https://serverest.dev`)

Não é necessário instalar navegadores: são testes de API, só usam o cliente HTTP do Playwright.

## 3. Instalação e configuração

```bash
git clone https://github.com/loruhana/Desafio_Automacao_Api_Playwright.git
cd Desafio_Automacao_Api_Playwright
npm ci
```

Configuração opcional: copie `.env.example` para `.env` para apontar para outro ambiente.
Sem `.env`, os testes usam `https://serverest.dev`.

| Variável | Padrão | Uso |
|---|---|---|
| `BASE_URL` | `https://serverest.dev` | URL da API sob teste (ex.: ServeRest local em `http://localhost:3000`) |
| `LIMITE_REQUISICOES_POR_MINUTO` | `100` | Limite do REQ-07, usado só pelo teste de limite de taxa |

Não há credenciais no projeto: cada teste cria os próprios usuários, com e-mail e senha aleatórios.

## 4. Execução

| Comando | O que faz |
|---|---|
| `npm test` | Suíte funcional completa (55 testes) |
| `npm run test:smoke` | Apenas os caminhos críticos (`@smoke`) |
| `npm run test:limite-taxa` | Teste de limite de 100 requisições/minuto (REQ-07), separado da suíte |
| `npm run typecheck` | Verificação de tipos do TypeScript |
| `npm run report` | Abre o último relatório HTML |

Filtros úteis do Playwright: `npx playwright test --grep @REQ-04` (por requisito) ou
`npx playwright test tests/usuarios/cadastrar.spec.ts` (por arquivo).

## 5. Relatórios

| Relatório | Local | Uso |
|---|---|---|
| HTML | `playwright-report/index.html` | Leitura humana: passos, requisições, erros e filtros por tag |
| JUnit XML | `test-results/junit.xml` | Integração com ferramentas de CI/gestão de testes |

## 6. Pipeline de CI (GitHub Actions)

Arquivo: [.github/workflows/testes-api.yml](.github/workflows/testes-api.yml)

- **Gatilhos:** `push` e `pull_request` na `main`, além de execução manual (*Run workflow*).
- **Job `suite-funcional`:** instala dependências, verifica tipos e executa a suíte.
  As falhas aparecem como anotações na própria execução.
- **Artefatos publicados em toda execução (inclusive com falha):** `relatorio-html` e `resultado-junit`.
  Para consultar: Actions → execução → seção *Artifacts*.
- **Job `limite-taxa`:** só roda manualmente, marcando a opção *executar_limite_taxa*. Publica o artefato `relatorio-limite-taxa`.

## 7. Divergências entre o PDF e a API ServeRest

| Requisito do PDF | Comportamento observado no ServeRest | Como foi tratado |
|---|---|---|
| Recurso `/users` | O recurso se chama `/usuarios` | Mapeamento na seção 1 e em `src/clientes/usuarios-cliente.ts` |
| Autenticação via JWT | O token é emitido por `POST /login`, mas as rotas de `/usuarios` **não exigem** token | Emissão e validação do JWT testadas em `/login`; uso do token testado em rota protegida (`POST /produtos`): token válido, ausente, adulterado, de usuário excluído e sem permissão |
| Limite de 100 requisições/minuto | O ServeRest público **não aplica** o limite: 120 requisições em 5 segundos retornaram 200, sem headers de rate limit | Teste CT-LIM-01 implementado conforme o requisito (a 101ª deve retornar 429). Executado à parte, ele **falha** no ServeRest público, evidenciando a divergência. Não houve alteração da asserção para fazê-lo passar |

Os possíveis bugs e riscos encontrados na API (por exemplo, a senha exposta dentro do JWT) estão em
[docs/matriz-rastreabilidade.md › Achados](docs/matriz-rastreabilidade.md#achados-sobre-a-api-para-reportar-ao-time-responsável).

## 8. Casos de teste cobertos

Convenção: `[CT-<área>-<nº>] deve <comportamento esperado>`. Casos com variações (por exemplo, um por campo obrigatório)
compartilham o mesmo CT e aparecem como testes separados no relatório.

Todos os testes validam **status code**, **`Content-Type: application/json`** e o **contrato da resposta** (schemas Zod em
`src/contratos/schemas.ts`, fiéis ao Swagger do ServeRest), além das regras de negócio de cada caso.

### GET /usuarios — listar (REQ-01) · `tests/usuarios/listar.spec.ts`
| CT | Cenário | Esperado |
|---|---|---|
| LST-01 | Listar usuários | 200; contrato válido; `quantidade` = tamanho da lista |
| LST-02 | Usuário recém-cadastrado aparece na lista | 200; usuário presente com todos os dados |
| LST-03 | Filtrar por `_id` | 200; somente o usuário filtrado |
| LST-04 | Filtrar por `email` | 200; somente o usuário filtrado |
| LST-05 | Filtrar por `administrador=true` / `false` (2 testes) | 200; todos os itens com o perfil filtrado |
| LST-06 | Filtro sem correspondência | 200; `quantidade: 0` e lista vazia |
| LST-07 | Filtro `administrador` inválido | 400; mensagem de validação |

### POST /usuarios — cadastrar (REQ-02, REQ-08) · `tests/usuarios/cadastrar.spec.ts`
| CT | Cenário | Esperado |
|---|---|---|
| CAD-01 | Cadastrar administrador e não administrador (2 testes) | 201; `_id` retornado; dados persistidos (confirmado via GET) |
| CAD-02 | E-mail já utilizado | 400 "Este email já está sendo usado" |
| CAD-03 | Sem cada campo obrigatório: nome, email, password, administrador (4 testes) | 400 "`<campo>` é obrigatório" |
| CAD-04 | Corpo vazio | 400 listando os 4 campos obrigatórios |
| CAD-05 | Cada campo obrigatório vazio (4 testes) | 400 "não pode ficar em branco" (administrador: "deve ser 'true' ou 'false'") |
| CAD-06 | nome, email ou password com tipo diferente de string (3 testes) | 400 "`<campo>` deve ser uma string" |
| CAD-07 | E-mail em formato inválido | 400 "email deve ser um email válido" |
| CAD-08 | administrador `"sim"` ou booleano `true` (2 testes) | 400 "administrador deve ser 'true' ou 'false'" |
| CAD-09 | Campo não previsto no contrato | 400 "`<campo>` não é permitido" |

### GET /usuarios/{id} — buscar (REQ-03) · `tests/usuarios/buscar-por-id.spec.ts`
| CT | Cenário | Esperado |
|---|---|---|
| BUS-01 | Buscar usuário existente | 200; dados idênticos aos cadastrados |
| BUS-02 | ID válido inexistente | 400 "Usuário não encontrado" |
| BUS-03 | ID com 15 caracteres, 17 caracteres ou caracteres especiais (3 testes) | 400 "id deve ter exatamente 16 caracteres alfanuméricos" |

### PUT /usuarios/{id} — atualizar (REQ-04) · `tests/usuarios/atualizar.spec.ts`
| CT | Cenário | Esperado |
|---|---|---|
| ATU-01 | Atualizar todos os campos | 200 "Registro alterado com sucesso"; alteração persistida |
| ATU-02 | Manter o próprio e-mail | 200 (não é tratado como duplicado) |
| ATU-03 | Alterar a senha | Login com a nova senha: 200; com a antiga: 401 |
| ATU-04 | ID inexistente | 201: cria o usuário (comportamento documentado no Swagger) |
| ATU-05 | E-mail de outro usuário | 400 "Este email já está sendo usado"; dado original preservado |
| ATU-06 | Sem cada campo obrigatório (4 testes) | 400 "`<campo>` é obrigatório" |
| ATU-07 | administrador inválido | 400 "administrador deve ser 'true' ou 'false'" |

### DELETE /usuarios/{id} — excluir (REQ-05) · `tests/usuarios/excluir.spec.ts`
| CT | Cenário | Esperado |
|---|---|---|
| EXC-01 | Excluir usuário | 200 "Registro excluído com sucesso"; GET seguinte retorna 400 |
| EXC-02 | ID inexistente | 200 "Nenhum registro excluído" |
| EXC-03 | Excluir duas vezes o mesmo usuário | 200 "Nenhum registro excluído" na segunda exclusão |
| EXC-04 | Usuário com carrinho cadastrado | 400 "Não é permitido excluir usuário com carrinho cadastrado" + `idCarrinho`; usuário mantido |

### Autenticação JWT (REQ-06) · `tests/autenticacao/jwt.spec.ts`
| CT | Cenário | Esperado |
|---|---|---|
| AUT-01 | Login com credenciais corretas | 200; `authorization: Bearer <JWT>`; header `typ: JWT`; claims `email`, `iat` e `exp` (com `exp > iat`) |
| AUT-02 | Senha incorreta | 401 "Email e/ou senha inválidos" |
| AUT-03 | E-mail não cadastrado | 401 "Email e/ou senha inválidos" |
| AUT-04 | Login sem e-mail e senha | 400 com os campos obrigatórios |
| AUT-05 | Rota protegida com token de administrador | 201 |
| AUT-06 | Rota protegida sem token | 401 |
| AUT-07 | Rota protegida com token adulterado | 401 |
| AUT-08 | Rota protegida com token de usuário já excluído | 401 |
| AUT-09 | Rota administrativa com token de não administrador | 403 "Rota exclusiva para administradores" |

### Limite de taxa (REQ-07) · `tests/limite-taxa/limite-requisicoes.spec.ts`
| CT | Cenário | Esperado |
|---|---|---|
| LIM-01 | 100 requisições dentro de 1 minuto e mais uma em seguida | As 100 primeiras não são bloqueadas; a 101ª retorna 429 |

## 9. Cobertura

A cobertura é medida sobre o **contrato da API**. Não temos acesso ao código do backend, então não é possível medir cobertura de código.

| Endpoint | Códigos de resposta documentados | Cobertos |
|---|---|---|
| `GET /usuarios` | 200 (+ 400 observado em filtro inválido) | 200, 400 |
| `POST /usuarios` | 201, 400 | 201, 400 |
| `GET /usuarios/{_id}` | 200, 400 | 200, 400 |
| `PUT /usuarios/{_id}` | 200, 201, 400 | 200, 201, 400 |
| `DELETE /usuarios/{_id}` | 200 (excluído / nenhum excluído), 400 | 200 (ambas as mensagens), 400 |
| `POST /login` | 200, 401 (+ 400 observado) | 200, 400, 401 |
| `POST /produtos` (rota protegida) | 201, 401, 403 | 201, 401, 403 |

São 100% dos endpoints, métodos e códigos de resposta documentados, e 100% dos campos obrigatórios do REQ-08 (ausente, vazio e tipo inválido).

## 10. Estrutura do projeto

```
├─ .github/workflows/testes-api.yml   Pipeline de CI e publicação dos relatórios
├─ src/
│  ├─ config/ambiente.ts              Leitura das variáveis de ambiente
│  ├─ clientes/                       Um cliente por recurso da API (encapsula rotas e headers)
│  ├─ contratos/                      Schemas Zod + validação padrão de status, headers e contrato
│  ├─ dados/fabricas.ts               Geração da massa de dados (única por teste)
│  └─ fixtures/index.ts               Fixtures do Playwright: clientes, pré-condições e limpeza automática
├─ tests/
│  ├─ usuarios/                       listar · cadastrar · buscar-por-id · atualizar · excluir
│  ├─ autenticacao/jwt.spec.ts
│  └─ limite-taxa/limite-requisicoes.spec.ts
├─ docs/matriz-rastreabilidade.md     Requisito do PDF → casos de teste → status
├─ playwright.config.ts               Suíte funcional (paralela, relatórios HTML e JUnit)
└─ playwright.limite-taxa.config.ts   Configuração isolada do teste de limite de taxa
```

### Princípios adotados
- **Testes independentes:** cada teste cria os próprios dados e a fixture `aoFinalizar` remove tudo ao final,
  inclusive usuários criados indevidamente em cenários negativos. Por isso a suíte roda 100% em paralelo.
- **Sem esperas fixas e sem dados fixos:** massa de dados gerada a cada execução, com e-mails no domínio reservado `example.com`.
- **Um ponto de verdade para o contrato:** `validarResposta()` valida status, `Content-Type` e schema em todos os testes.
- **Tags:** `@smoke`, `@regressao`, `@limite-taxa` e `@REQ-xx`, para filtrar por criticidade ou por requisito.
