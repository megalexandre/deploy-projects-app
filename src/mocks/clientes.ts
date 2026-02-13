import type { Cliente } from '../types';

export const clientesMock: Cliente[] = [
  {
    id: '1',
    nome: 'João Silva',
    cpfCnpj: '123.456.789-00',
    telefone: '(11) 98765-4321',
    email: 'joao.silva@email.com'
  },
  {
    id: '2',
    nome: 'Maria Santos',
    cpfCnpj: '987.654.321-00',
    telefone: '(11) 91234-5678',
    email: 'maria.santos@email.com'
  },
  {
    id: '3',
    nome: 'Empresa ABC Ltda',
    cpfCnpj: '12.345.678/0001-90',
    telefone: '(11) 3333-4444',
    email: 'contato@empresaabc.com'
  },
  {
    id: '4',
    nome: 'Pedro Oliveira',
    cpfCnpj: '456.789.123-00',
    telefone: '(11) 95555-6666',
    email: 'pedro.oliveira@email.com'
  },
  {
    id: '5',
    nome: 'Ana Costa',
    cpfCnpj: '789.123.456-00',
    telefone: '(11) 97777-8888',
    email: 'ana.costa@email.com'
  }
];
