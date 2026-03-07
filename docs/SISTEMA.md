# Sistema OPJ Engenharia

## Visao geral
Aplicacao web em React + TypeScript para gestao de projetos fotovoltaicos.

## Camada de servicos
Os servicos ficam em `src/services` e concentram chamadas HTTP.

- `apiClient.ts`: cliente HTTP base (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)
- `authService.ts`: autenticacao
- `usersService.ts`: usuarios
- `projectsService.ts`: projetos
- `servicosService.ts`: servicos legados

## Como o POST aparece no codigo
O `POST` e encapsulado no `apiClient`:

- `apiClient.post(...)` chama internamente `request('POST', ...)`.
- Em projetos, a criacao usa `apiClient.post(PROJECTS_ENDPOINT, projectData)` com `PROJECTS_ENDPOINT = '/projects'`.

Arquivo de referencia:
- `src/services/projectsService.ts`
- `src/services/apiClient.ts`

## Endpoint de projetos

### Criar projeto
- Metodo: `POST`
- Endpoint: `/projects`
- Service: `projectsService.create(projectData)`

Payload esperado:

```json
{
  "id": "019c8ce0-2afd-778e-ba71-2ab767294a42",
  "clienteId": "7d98686a-4876-4245-8b98-eadc1fc4cc56",
  "concessionaria": "CEMIG",
  "protocoloConcessionaria": "PROT-2024-030",
  "classe": "Residencial",
  "integrator": "Solar do pé",
  "modalidade": "Geração Distribuída",
  "enquadramento": "Microgeração",
  "protecaoCC": "Disjuntor CC 20A",
  "potenciaSistema": 10
}
```

Outros endpoints de projetos usados no frontend:
- `GET /projects`
- `GET /projects/{id}`
- `PUT /projects/{id}`
- `DELETE /projects/{id}`

## Configuracao de base URL
Definida em `src/services/apiClient.ts`.

- Em desenvolvimento (`Vite`): `/api` (via proxy)
- Em producao: `VITE_API_BASE_URL` ou fallback de ambiente
