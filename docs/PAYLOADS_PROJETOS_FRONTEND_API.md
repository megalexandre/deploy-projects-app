# Payloads de projetos: frontend x API

Este documento descreve:

- o payload que a API de projetos aceita;
- o payload que o frontend envia atualmente;
- os campos enviados pelo frontend que sao ignorados pela API;
- os campos usados pelo frontend que nao sao enviados para a API de projetos;
- os endpoints auxiliares de status, comentarios e documentos.

Fontes analisadas:

- Frontend: `src/features/projects/services/projectsService.ts`
- Frontend: `src/features/projects/services/projectTypes.ts`
- Frontend: `src/features/projects/services/projectEnhancements.ts`
- API: `app/controllers/projects_controller.rb`
- API: `app/controllers/project_statuses_controller.rb`
- API: `app/controllers/project_status_comments_controller.rb`
- API: `app/controllers/uploads_controller.rb`

## Regras gerais

- A API aceita os nomes de campos em `snake_case`.
- Campos extras enviados no JSON sao removidos pelo `params.permit` do Rails.
- Campos com valor `undefined` nao aparecem no JSON final enviado pelo navegador.
- `created_by`, `updated_by`, `created_at` e `updated_at` sao definidos pela API.
- O `client_id` deve referenciar um cliente existente.
- O `address_id` pode ser omitido ou `null`.
- O campo `description` possui limite de 1024 caracteres no banco.
- O `sequence` e a combinacao `sequence` + `subsequence` possuem regras de unicidade.

## POST /projects

Cria um projeto.

### Payload completo aceito pela API

```json
{
  "client_id": "11111111-1111-1111-1111-111111111111",
  "address_id": "22222222-2222-2222-2222-222222222222",
  "utility_company": "CEMIG",
  "utility_protocol": "P-001",
  "customer_class": "Residencial",
  "integrator": "Integrador X",
  "modality": "AUTOCONSUMO LOCAL",
  "framework": "Microgeracao",
  "status": "em_analise_documentacao",
  "amount": 15000.5,
  "dc_protection": "Disjuntor CC 20A",
  "system_power": 10.5,
  "unit_control": "UC-123456",
  "description": "Observacoes do projeto",
  "project_type": "fotovoltaico",
  "fast_track": true,
  "coordinates": "POINT(-43.900000 -19.900000)",
  "sequence": 123,
  "subsequence": "A",
  "services_names": [
    "Projeto Fotovoltaico",
    "Solicitacao de Acesso"
  ]
}
```

Campos obrigatorios no banco:

```json
{
  "client_id": "UUID",
  "utility_company": "string",
  "utility_protocol": "string",
  "customer_class": "string",
  "integrator": "string",
  "modality": "string",
  "framework": "string",
  "unit_control": "string",
  "project_type": "string"
}
```

Caso `sequence` nao seja enviado, a API gera o proximo numero.

### Payload enviado atualmente pelo frontend

O metodo `createRaw()` envia campos aceitos e varios aliases no mesmo JSON:

```json
{
  "client_id": "11111111-1111-1111-1111-111111111111",
  "clientId": "11111111-1111-1111-1111-111111111111",
  "clienteId": "11111111-1111-1111-1111-111111111111",

  "address_id": "22222222-2222-2222-2222-222222222222",
  "addressId": "22222222-2222-2222-2222-222222222222",
  "enderecoId": "22222222-2222-2222-2222-222222222222",

  "utility_company": "CEMIG",
  "utilityCompany": "CEMIG",
  "concessionaria": "CEMIG",

  "utility_protocol": "P-001",
  "utilityProtocol": "P-001",
  "protocoloConcessionaria": "P-001",

  "customer_class": "Residencial",
  "customerClass": "Residencial",
  "classe": "Residencial",

  "integrator": "Integrador X",

  "modality": "AUTOCONSUMO LOCAL",
  "modalidade": "AUTOCONSUMO LOCAL",

  "framework": "Microgeracao",
  "enquadramento": "Microgeracao",

  "dc_protection": "Disjuntor CC 20A",
  "dcProtection": "Disjuntor CC 20A",
  "protecaoCC": "Disjuntor CC 20A",

  "system_power": 10.5,
  "systemPower": 10.5,
  "potenciaSistema": 10.5,

  "status": "em_analise_documentacao",

  "amount": "15000.5",
  "valor": "15000.5",

  "coordinates": "POINT(-43.9 -19.9)",

  "services_names": [
    "Projeto Fotovoltaico"
  ],
  "servicesNames": [
    "Projeto Fotovoltaico"
  ],
  "servicos": [
    "Projeto Fotovoltaico"
  ],

  "project_type": "fotovoltaico",
  "projectType": "fotovoltaico",
  "tipo_projeto": "fotovoltaico",

  "fast_track": true,
  "fastTrack": true,
  "projeto_fast_track": true,

  "unit_control": "UC-123456",
  "unitControl": "UC-123456",
  "unidade_controladora": "UC-123456",

  "description": "Observacoes do projeto",
  "descricao": "Observacoes do projeto"
}
```

Observacao: no codigo real, a ultima chave acima e enviada com o nome Unicode `descricao` com cedilha e til. Ela foi representada sem acentos neste documento para manter o arquivo em ASCII.

### Campos enviados na criacao e ignorados pela API

| Campo enviado pelo frontend | Campo aceito equivalente |
| --- | --- |
| `clientId` | `client_id` |
| `clienteId` | `client_id` |
| `addressId` | `address_id` |
| `enderecoId` | `address_id` |
| `utilityCompany` | `utility_company` |
| `concessionaria` | `utility_company` |
| `utilityProtocol` | `utility_protocol` |
| `protocoloConcessionaria` | `utility_protocol` |
| `customerClass` | `customer_class` |
| `classe` | `customer_class` |
| `modalidade` | `modality` |
| `enquadramento` | `framework` |
| `dcProtection` | `dc_protection` |
| `protecaoCC` | `dc_protection` |
| `systemPower` | `system_power` |
| `potenciaSistema` | `system_power` |
| `valor` | `amount` |
| `servicesNames` | `services_names` |
| `servicos` | `services_names` |
| `projectType` | `project_type` |
| `tipo_projeto` | `project_type` |
| `fastTrack` | `fast_track` |
| `projeto_fast_track` | `fast_track` |
| `unitControl` | `unit_control` |
| `unidade_controladora` | `unit_control` |
| `descricao` com acentos | `description` |

### Formato de coordinates

A API declara `coordinates` como parametro escalar:

```ruby
params.permit(:coordinates)
```

O frontend converte latitude e longitude para WKT antes do envio:

```json
{
  "coordinates": "POINT(-43.9 -19.9)"
}
```

O WKT usa a ordem `POINT(longitude latitude)`.

## PUT/PATCH /projects/:id

Atualiza um projeto existente. Todos os campos sao opcionais e o endpoint e exclusivo para usuarios
com perfil administrativo `main`.

### Payload completo aceito pela API

```json
{
  "client_id": "11111111-1111-1111-1111-111111111111",
  "address_id": "22222222-2222-2222-2222-222222222222",
  "utility_company": "CEMIG",
  "utility_protocol": "P-001-ALTERADO",
  "customer_class": "Comercial",
  "integrator": "Integrador Atualizado",
  "modality": "GERACAO COMPARTILHADA",
  "framework": "Minigeracao",
  "amount": 18000,
  "dc_protection": "Disjuntor CC 32A",
  "system_power": 15.8,
  "unit_control": "UC-654321",
  "description": "Observacoes atualizadas",
  "project_type": "fotovoltaico",
  "fast_track": false,
  "coordinates": "POINT(-43.910000 -19.910000)",
  "sequence": 123,
  "subsequence": "B",
  "services_names": [
    "Projeto Fotovoltaico",
    "Vistoria"
  ]
}
```

O campo `status` nao e aceito nesse endpoint.

### Campos adicionais enviados na atualizacao e ignorados

O frontend envia o objeto original de atualizacao, adiciona `id` e tambem envia aliases.

```json
{
  "id": "UUID-DO-PROJETO",
  "clientId": "UUID-DO-CLIENTE",
  "clienteId": "UUID-DO-CLIENTE",
  "addressId": "UUID-DO-ENDERECO",
  "enderecoId": "UUID-DO-ENDERECO",
  "utilityCompany": "CEMIG",
  "concessionaria": "CEMIG",
  "utilityProtocol": "P-001",
  "protocoloConcessionaria": "P-001",
  "customerClass": "Residencial",
  "classe": "Residencial",
  "modalidade": "AUTOCONSUMO LOCAL",
  "enquadramento": "Microgeracao",
  "dcProtection": "Disjuntor CC 20A",
  "protecaoCC": "Disjuntor CC 20A",
  "systemPower": 10.5,
  "potenciaSistema": 10.5,
  "valor": "15000.5",
  "coordinates": "POINT(-43.9 -19.9)",
  "servicesNames": [
    "Projeto Fotovoltaico"
  ],
  "servicos": [
    "Projeto Fotovoltaico"
  ],
  "projectType": "fotovoltaico",
  "tipo_projeto": "fotovoltaico",
  "fastTrack": true,
  "projeto_fast_track": true,
  "unitControl": "UC-123456",
  "unidade_controladora": "UC-123456",
  "descricao": "Observacoes atualizadas",
  "status": "projeto_aprovado"
}
```

Todos os campos acima sao ignorados pela API quando nao possuem tambem sua versao aceita em `snake_case`.

Casos importantes:

- `id` e ignorado; o ID usado e o da URL.
- `status` e ignorado na atualizacao comum.
- `nomeCliente` e ignorado; deve ser alterado no endpoint de clientes.
- `coordinates` e convertido para WKT antes do envio.

## Campos usados pelo frontend, mas nao enviados para POST /projects

Os campos abaixo fazem parte do objeto `CreateProjectData`, mas `createRaw()` nao os inclui no JSON enviado para `/projects`:

```json
{
  "id": "UUID gerado no frontend",
  "nomeCliente": "Nome do cliente",
  "enderecoCompleto": "Endereco em texto",
  "dataAbertura": "2026-06-09",
  "latitude": "-19.900000",
  "longitude": "-43.900000",
  "tensaoFornecimento": "127/220V",
  "padraoEntradaItens": [],
  "modulos": [],
  "inversores": [],
  "documentos": [],
  "projetoNovo": "sim",
  "zeroGridControleExportacao": "nao",
  "divisaoCreditos": []
}
```

Destino atual desses dados:

| Campo | Comportamento atual |
| --- | --- |
| `id` | Ignorado na criacao; a API gera o UUID |
| `nomeCliente` | O projeto salva somente `client_id` |
| `enderecoCompleto` | O projeto salva somente `address_id` |
| `dataAbertura` | Salvo apenas no `localStorage` do frontend |
| `latitude` | Salvo apenas no `localStorage`; deveria compor `coordinates` |
| `longitude` | Salvo apenas no `localStorage`; deveria compor `coordinates` |
| `tensaoFornecimento` | Salvo apenas no `localStorage` |
| `padraoEntradaItens` | Salvo apenas no `localStorage` |
| `modulos` | Salvo apenas no `localStorage` |
| `inversores` | Salvo apenas no `localStorage` |
| `documentos` | Nao enviado no projeto; arquivos usam `/uploads` |
| `projetoNovo` | Salvo apenas no `localStorage` |
| `zeroGridControleExportacao` | Salvo apenas no `localStorage` |
| `divisaoCreditos` | Salvo apenas no `localStorage` |

A chave usada para esses complementos locais e:

```text
opj_frontend_project_enhancements
```

Esses dados nao ficam centralizados na API e podem variar entre navegadores ou computadores.

## POST /projects/:project_id/statuses

Cria um registro de status e sincroniza o status atual do projeto.

```json
{
  "name": "projeto_aprovado",
  "comment": "Projeto aprovado apos revisao tecnica."
}
```

Campos aceitos:

- `name`
- `comment` opcional

## POST/PATCH /projects/:project_id/statuses/:status_id/comments

Cria ou atualiza um comentario de status.

```json
{
  "body": "Texto do comentario."
}
```

## POST /uploads

Documentos nao sao enviados como JSON nem como parte de `/projects`.

O endpoint recebe `multipart/form-data`:

```text
item_id=<UUID do projeto>
files[]=<arquivo 1>
files[]=<arquivo 2>
```

O metodo `projectsService.saveDocuments()` existente no frontend atualmente nao envia dados para a API. Os arquivos persistidos sao aqueles enviados diretamente pelo servico de uploads.

## Resumo de compatibilidade

### Persistidos corretamente pela API de projetos

```text
client_id
address_id
utility_company
utility_protocol
customer_class
integrator
modality
framework
status (somente na criacao ou pelo endpoint de statuses)
amount
dc_protection
system_power
unit_control
description
project_type
fast_track
sequence
subsequence
services_names
```

### Mantidos somente no frontend/localStorage

```text
dataAbertura
latitude
longitude
tensaoFornecimento
padraoEntradaItens
modulos
inversores
projetoNovo
zeroGridControleExportacao
divisaoCreditos
```

### Ignorados por serem aliases ou campos nao permitidos

```text
id
clientId
clienteId
addressId
enderecoId
utilityCompany
concessionaria
utilityProtocol
protocoloConcessionaria
customerClass
classe
modalidade
enquadramento
dcProtection
protecaoCC
systemPower
potenciaSistema
valor
servicesNames
servicos
projectType
tipo_projeto
fastTrack
projeto_fast_track
unitControl
unidade_controladora
descricao com acentos
nomeCliente
status em PUT/PATCH /projects/:id
```
