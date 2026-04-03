# Arquitetura do Frontend

## Objetivo

Este documento descreve como o frontend do sistema OPJ Engenharia esta organizado, quais sao os modulos centrais e como os dados circulam entre telas, servicos e backend.

## Visao geral

O projeto e uma SPA em React com TypeScript. A aplicacao usa:

- `React Router` para navegacao
- `Tailwind CSS` para estilos
- `services/` como camada de acesso a dados
- `types/` como contratos compartilhados do dominio
- `localStorage` para sessao, preferencias e parte dos dados legados

## Mapa de pastas

### `src/main.tsx`

Ponto de entrada da aplicacao. Monta a arvore React e injeta `App` no DOM.

### `src/App.tsx`

Roteador principal da aplicacao.

Responsabilidades:

- registrar todas as rotas
- validar autenticacao minima por token em `localStorage`
- aplicar `MainLayout` nas paginas autenticadas
- acionar `useAuthInterceptor` para reagir a `401`

### `src/layouts`

Contem a estrutura visual compartilhada.

- `MainLayout.tsx`: shell principal com sidebar, header, troca de tema e logout

### `src/components`

Componentes base reutilizaveis.

- `Button.tsx`
- `Card.tsx`
- `Input.tsx`

Esses componentes padronizam visual, estados e variacoes simples de interface.

### `src/pages`

Contem as telas de negocio. Em geral cada pagina:

- busca dados via `services`
- faz validacao basica de formulario
- controla o estado visual local
- transforma dados de UI em payloads de dominio

Paginas de maior relevancia:

- `LoginPage.tsx`
- `DashboardPage.tsx`
- `ClientesPage.tsx`
- `ProjetosPage.tsx`
- `ProjetoDetailPage.tsx`
- `NovoProjetoPage.tsx`
- `ServicosPage.tsx`
- `NovoServicoPage.tsx`
- `ServicoDetailPage.tsx`

### `src/services`

Camada de integracao e persistencia.

Ela concentra:

- comunicacao HTTP com backend
- normalizacao de payloads
- adaptacao entre formatos do backend e formato esperado pela UI
- persistencia local onde o backend ainda nao cobre integralmente o fluxo

Arquivos principais:

- `apiClient.ts`: cliente HTTP base
- `authService.ts`: login, logout e sessao
- `projectsService.ts`: ciclo de vida de projetos e normalizacao pesada do dominio
- `servicosService.ts`: persistencia local de servicos e estados do Kanban
- `filesService.ts`: upload e download de arquivos
- `customersService.ts`: clientes
- `addressService.ts`: enderecos
- `concessionariasService.ts`: concessionarias
- `index.ts`: barril de exportacao dos services

### `src/types`

Contratos centrais do dominio.

Principais entidades:

- `Projeto`
- `Servico`
- `Cliente`
- `Documento`
- `Endereco`
- `TimelineItem`

### `src/utils`

Helpers puros de apoio.

- `masks.ts`: mascaras e parsing de entradas
- `configuracoesSistema.ts`: tabelas e configuracoes de negocio usadas no frontend

## Fluxo de autenticacao

1. `LoginPage` autentica via `authService`.
2. O token e salvo em `localStorage`.
3. `App.tsx` verifica a existencia do token para liberar rotas protegidas.
4. `useAuthInterceptor.ts` registra um handler para respostas `401`.
5. Em caso de sessao invalida, o usuario e redirecionado ao login.

## Fluxo HTTP

### Cliente base

`apiClient.ts` e o ponto central para chamadas REST.

Ele e responsavel por:

- montar a URL final
- aplicar headers padrao
- anexar token de autenticacao
- serializar JSON
- interpretar respostas JSON ou texto
- encapsular erros em `ApiError`

### Base URL

Regra atual:

- desenvolvimento com proxy do Vite: `/api`
- outros ambientes: `VITE_API_BASE_URL` ou fallback configurado no projeto

## Fluxo de projetos

### Criacao

`NovoProjetoPage.tsx` executa um fluxo em etapas:

1. coleta dados do cliente
2. resolve ou cria endereco
3. monta payload tecnico e comercial
4. chama `projectsService.create`
5. se existirem anexos, envia arquivos via `filesService.uploadFiles`
6. salva os metadados retornados no projeto localmente com `projectsService.saveDocuments`

### Normalizacao

`projectsService.ts` existe porque o backend retorna formatos diferentes ao longo do sistema.

Ele faz:

- traducao de nomes de campos (`customer`, `cliente`, `clientId`, etc.)
- normalizacao de `status`
- composicao de timeline padrao quando o backend nao devolve historico completo
- enriquecimento com dados de cliente
- merge com dados auxiliares persistidos no frontend

### Persistencia complementar

Alguns dados de UX ou campos ainda nao plenamente suportados pela API sao mantidos em `localStorage`.

Chave atual:

- `opj_frontend_project_enhancements`

Esse armazenamento guarda dados complementares como:

- documentos
- modulos
- inversores
- observacoes
- timeline complementar

## Fluxo de servicos

`servicosService.ts` hoje funciona como uma camada local. O dominio de servicos ainda nao esta totalmente remoto como projetos.

Responsabilidades:

- criar servicos em `localStorage`
- editar servicos
- atualizar status do fluxo
- manter timeline padrao
- normalizar anexos e estruturas de formulario

Paginas que usam esse dominio:

- `ServicosPage.tsx`
- `NovoServicoPage.tsx`
- `ServicoDetailPage.tsx`

## Fluxo de arquivos

### Upload

Servico responsavel:

- `filesService.uploadFiles(itemId, files)`

Endpoint usado:

- `POST /api/v1/file/upload`

Contrato esperado:

- campo multipart `id`: identificador do item dono dos arquivos
- campo multipart `files`: lista de arquivos

Resposta esperada:

- lista de arquivos com `id`, `fileName`, `urlS3`, `size` e `createdAt`

### Download

Servico responsavel:

- `filesService.downloadFile(fileId)`

Endpoint usado:

- `GET /api/v1/file/download/{fileId}`

O frontend usa o `fileId` persistido em `Documento.fileId` para disparar o download.

## Decisoes importantes de arquitetura

### 1. Adaptacao de payload no frontend

O frontend aceita que o backend ainda tenha respostas heterogeneas. Por isso a adaptacao fica concentrada em `services`, em vez de espalhada nas paginas.

### 2. Persistencia local controlada

Enquanto partes do backend ainda nao cobrem todos os fluxos, o frontend usa `localStorage` para manter consistencia operacional sem bloquear o usuario.

### 3. Comentarios no codigo

Os comentarios do projeto foram adicionados com foco em:

- orquestracao de fluxo
- pontos de integracao
- decisoes de arquitetura

Nao foi adotada a estrategia de comentar cada linha ou cada atribuicao.

## Como extender o projeto

### Adicionar uma nova tela

1. criar a pagina em `src/pages`
2. integrar a rota em `src/App.tsx`
3. se a tela consumir dados, criar ou reaproveitar um service em `src/services`
4. declarar ou reutilizar tipos em `src/types`

### Integrar novo endpoint

1. criar metodo no service adequado
2. normalizar payload de entrada e saida no service
3. expor o service em `src/services/index.ts`
4. consumir o metodo pela pagina

### Substituir persistencia local por API

Quando um dominio migrar para backend:

1. manter o contrato de `types`
2. mover a fonte de verdade para o service remoto
3. reduzir o uso de `localStorage` para cache ou fallback, se ainda fizer sentido

## Riscos e pontos de atencao

- `projectsService.ts` concentra bastante regra de adaptacao e merece manutencao cuidadosa.
- `servicosService.ts` mistura dominio de negocio com persistencia local; se o backend de servicos evoluir, esse arquivo deve ser fatiado.
- O build atual gera um chunk grande do Vite; isso nao quebra o projeto, mas merece revisao futura de code splitting.

## Arquivos recomendados para leitura inicial

Se alguem novo entrar no projeto, a ordem sugerida e:

1. `src/App.tsx`
2. `src/layouts/MainLayout.tsx`
3. `src/services/apiClient.ts`
4. `src/services/projectsService.ts`
5. `src/services/servicosService.ts`
6. `src/pages/NovoProjetoPage.tsx`
7. `src/pages/NovoServicoPage.tsx`
