# OPJ Engenharia

Frontend interno da OPJ Engenharia para operacao de projetos fotovoltaicos, servicos tecnicos, clientes, financeiro e configuracoes.

## Stack

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
npm run test:e2e
```

## Variaveis de ambiente

Configure o arquivo `.env`:

```env
VITE_API_BASE_URL=https://project-deploy.shop
VITE_API_PROXY_TARGET=https://project-deploy.shop
VITE_AUTH_TOKEN_STORAGE_KEY=auth_token
VITE_VIACEP_BASE_URL=https://viacep.com.br/ws
```

### Runtime na imagem Docker

Voce pode sobrescrever `VITE_API_PROXY_TARGET` ao subir o container, sem rebuild da imagem:

```bash
docker run -p 8080:80 \
  -e VITE_API_PROXY_TARGET=https://api.seu-dominio.com \
  opj-engenharia
```

Quando `VITE_API_BASE_URL` nao for informado no container, o frontend passa a assumir automaticamente `${VITE_API_PROXY_TARGET}/api`.

## Estrutura principal

```text
src/
  components/   Componentes reutilizaveis de UI
  hooks/        Hooks de tema e autenticacao
  layouts/      Estrutura compartilhada da aplicacao
  pages/        Telas de negocio
  services/     Integracao HTTP e persistencia local
  types/        Contratos TypeScript do dominio
  utils/        Mascaras, configuracoes e helpers
docs/
  SISTEMA.md
  ARQUITETURA_FRONTEND.md
```

## Fluxos principais

- `App.tsx` concentra as rotas e protege o acesso autenticado.
- `MainLayout.tsx` define sidebar, cabecalho e shell visual.
- `projectsService.ts` normaliza payloads do backend e complementa dados locais do frontend.
- `servicosService.ts` persiste servicos em `localStorage` enquanto parte desse dominio ainda nao depende integralmente da API.
- `filesService.ts` faz upload e download de arquivos vinculados ao `id` do item.

## Upload de arquivos

O fluxo atual funciona assim:

1. O frontend cria o projeto ou servico.
2. O item retorna com `id`.
3. Os arquivos sao enviados para `POST /api/v1/file/upload` com esse `id`.
4. O backend devolve um `fileId` por arquivo.
5. O frontend salva esse `fileId` dentro de `documentos` para download posterior.

## Documentacao complementar

- Visao funcional: [docs/SISTEMA.md](/a:/workspace/projeto%20orley/opj-engenharia/docs/SISTEMA.md)
- Arquitetura tecnica: [docs/ARQUITETURA_FRONTEND.md](/a:/workspace/projeto%20orley/opj-engenharia/docs/ARQUITETURA_FRONTEND.md)
