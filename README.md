# OPJ Engenharia - Sistema de Gestão de Projetos Fotovoltaicos

Sistema interno da empresa OPJ Engenharia para gestão de projetos fotovoltaicos desenvolvido com React + TypeScript + Vite.

## 🚀 Tecnologias Utilizadas

- **React 19** com TypeScript
- **Vite** como bundler
- **TailwindCSS** com tema escuro
- **React Router** para navegação
- **Lucide React** para ícones

## 🎨 Identidade Visual

- **Azul institucional**: `#1A355D`
- **Laranja de destaque**: `#EE8408`
- **Tema escuro** como padrão
- Layout responsivo e corporativo

## 📁 Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── layouts/        # Layouts da aplicação
├── pages/          # Páginas da aplicação
├── services/       # Serviços de API
├── hooks/          # Hooks customizados
├── mocks/          # Dados fictícios
├── types/          # Tipos TypeScript
└── App.tsx         # Componente principal
```

## 🔐 Acesso Demo

- **E-mail**: `admin@opjengenharia.com.br`
- **Senha**: `admin123`

## 📋 Funcionalidades Implementadas

### ✅ Login
- Autenticação simulada com mock
- Interface centralizada e profissional
- Validação de credenciais

### ✅ Dashboard
- Cards de resumo com estatísticas
- Lista de projetos recentes
- Navegação rápida para outras seções

### ✅ Listagem de Projetos
- Tabela com todos os projetos
- Busca e filtros
- Status visual diferenciado
- Ações de visualização

### ✅ Detalhe do Projeto
- **7 abas organizadas**:
  1. Dados do Projeto
  2. Dados Técnicos
  3. Divisão de Créditos
  4. Módulos
  5. Inversores
  6. Linha do Tempo
  7. Documentos
- Informações completas e organizadas

### ✅ Layout Principal
- Sidebar responsiva
- Header com informações
- Menu de navegação
- Logout funcional

## 🛠️ Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
npm run dev
```

### Build para Produção
```bash
npm run build
```

### Preview
```bash
npm run preview
```

## 📊 Arquitetura

### Serviços
Os serviços em `src/services/` simulam chamadas assíncronas ao backend e podem ser facilmente substituídos por chamadas reais à API Kotlin quando disponível.

### Mocks
Dados fictícios em `src/mocks/` para simular:
- Projetos completos
- Clientes
- Timeline de etapas
- Documentos

### Componentes
Componentes reutilizáveis em `src/components/`:
- `Button` - Botões com variantes
- `Input` - Campos de entrada
- `Card` - Cards para conteúdo

## 🔄 Próximos Passos

- [ ] Implementar cadastro de projeto com stepper
- [ ] Integração com API real Kotlin
- [ ] Validações de formulários
- [ ] Upload de arquivos
- [ ] Relatórios e exportações

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- Desktop (1920px+)
- Tablet (768px+)
- Mobile (320px+)

## 🎯 Foco Corporativo

Interface profissional e focada em produtividade, com:
- Cores institucionais OPJ Engenharia
- Tipografia clara e legível
- Hierarquia visual bem definida
- Transições suaves
- Feedback visual claro
