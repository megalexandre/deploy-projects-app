import type { Projeto } from '../types';
import { StatusProjeto } from '../types';
import { clientesMock } from './clientes';

export const projetosMock: Projeto[] = [
  {
    id: '1',
    protocolo: 'PROJ-2024-001',
    cliente: clientesMock[0],
    endereco: {
      cep: '01234-567',
      logradouro: 'Rua das Flores',
      numero: '123',
      complemento: 'Apto 45',
      bairro: 'Jardins',
      cidade: 'São Paulo',
      estado: 'SP'
    },
    dadosProjeto: {
      concessionaria: 'AES Eletropaulo',
      classe: 'Residencial',
      integrador: 'OPJ Engenharia',
      modalidade: 'geracao_compartilhada',
      enquadramento: 'Microgeração Distribuída',
      potenciaSistema: 5.5,
      protecaoCC: 'Dissipador de Surto'
    },
    dadosTecnicos: {
      tensao: 220,
      numeroFases: 2,
      ramal: 'Aéreo',
      disjuntor: '50A',
      cargaInstalada: 12000
    },
    modulos: [
      {
        id: '1',
        fabricante: 'Canadian Solar',
        modelo: 'CS6L-MS',
        potencia: 550,
        quantidade: 10,
        potenciaPico: 5.5
      }
    ],
    inversores: [
      {
        id: '1',
        fabricante: 'Growatt',
        modelo: 'MIC 600 TL-X',
        potencia: 600,
        quantidade: 10,
        potenciaTotal: 6.0
      }
    ],
    divisaoCreditos: [
      {
        percentual: 100,
        uc: '123456789',
        classe: 'Residencial',
        endereco: 'Rua das Flores, 123 - Jardins, São Paulo/SP'
      }
    ],
    timeline: [
      {
        id: '1',
        etapa: 'Cadastro do Cliente',
        data: '2024-01-15',
        status: 'concluido',
        descricao: 'Dados do cliente cadastrados no sistema'
      },
      {
        id: '2',
        etapa: 'Análise Técnica',
        data: '2024-01-20',
        status: 'concluido',
        descricao: 'Viabilidade técnica aprovada'
      },
      {
        id: '3',
        etapa: 'Submissão Concessionária',
        data: '2024-01-25',
        status: 'em_andamento',
        descricao: 'Aguardando aprovação da concessionária'
      }
    ],
    documentos: [
      {
        id: '1',
        nome: 'ART.pdf',
        tipo: 'ART',
        dataUpload: '2024-01-15',
        tamanho: 1024000
      },
      {
        id: '2',
        nome: 'Memorial_Descritivo.pdf',
        tipo: 'Memorial',
        dataUpload: '2024-01-18',
        tamanho: 2048000
      }
    ],
    status: StatusProjeto.EM_ANDAMENTO,
    dataCriacao: '2024-01-15',
    dataAtualizacao: '2024-01-25'
  },
  {
    id: '2',
    protocolo: 'PROJ-2024-002',
    cliente: clientesMock[1],
    endereco: {
      cep: '04567-890',
      logradouro: 'Avenida Paulista',
      numero: '1000',
      complemento: '',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP'
    },
    dadosProjeto: {
      concessionaria: 'Eletropaulo',
      classe: 'Comercial',
      integrador: 'OPJ Engenharia',
      modalidade: 'autoconsumo',
      enquadramento: 'Minigeração Distribuída',
      potenciaSistema: 15.0,
      protecaoCC: 'Fusível CC'
    },
    dadosTecnicos: {
      tensao: 380,
      numeroFases: 3,
      ramal: 'Subterrâneo',
      disjuntor: '100A',
      cargaInstalada: 45000
    },
    modulos: [
      {
        id: '2',
        fabricante: 'Trina Solar',
        modelo: 'TSM-DE15',
        potencia: 550,
        quantidade: 28,
        potenciaPico: 15.4
      }
    ],
    inversores: [
      {
        id: '2',
        fabricante: 'Sungrow',
        modelo: 'SG15RT',
        potencia: 15000,
        quantidade: 1,
        potenciaTotal: 15.0
      }
    ],
    divisaoCreditos: [
      {
        percentual: 100,
        uc: '987654321',
        classe: 'Comercial',
        endereco: 'Avenida Paulista, 1000 - Bela Vista, São Paulo/SP'
      }
    ],
    timeline: [
      {
        id: '4',
        etapa: 'Cadastro do Cliente',
        data: '2024-02-01',
        status: 'concluido'
      },
      {
        id: '5',
        etapa: 'Análise Técnica',
        data: '2024-02-05',
        status: 'concluido'
      },
      {
        id: '6',
        etapa: 'Instalação',
        data: '2024-02-10',
        status: 'pendente'
      }
    ],
    documentos: [
      {
        id: '3',
        nome: 'Projeto_Eletrico.dwg',
        tipo: 'Projeto',
        dataUpload: '2024-02-03',
        tamanho: 5120000
      }
    ],
    status: StatusProjeto.APROVADO,
    dataCriacao: '2024-02-01',
    dataAtualizacao: '2024-02-05'
  },
  {
    id: '3',
    protocolo: 'PROJ-2024-003',
    cliente: clientesMock[2],
    endereco: {
      cep: '07890-123',
      logradouro: 'Rua Industrial',
      numero: '500',
      complemento: 'Galpão 3',
      bairro: 'Centro',
      cidade: 'Guarulhos',
      estado: 'SP'
    },
    dadosProjeto: {
      concessionaria: 'ENEL',
      classe: 'Industrial',
      integrador: 'OPJ Engenharia',
      modalidade: 'autoconsumo',
      enquadramento: 'Minigeração Distribuída',
      potenciaSistema: 50.0,
      protecaoCC: 'Disjuntor CC'
    },
    dadosTecnicos: {
      tensao: 13800,
      numeroFases: 3,
      ramal: 'Aéreo',
      disjuntor: '200A',
      cargaInstalada: 150000
    },
    modulos: [
      {
        id: '3',
        fabricante: 'Jinko Solar',
        modelo: 'JKM550M-72HL',
        potencia: 550,
        quantidade: 92,
        potenciaPico: 50.6
      }
    ],
    inversores: [
      {
        id: '3',
        fabricante: 'Fronius',
        modelo: 'Symo 20.0-3-M',
        potencia: 20000,
        quantidade: 3,
        potenciaTotal: 60.0
      }
    ],
    divisaoCreditos: [
      {
        percentual: 100,
        uc: '456789012',
        classe: 'Industrial',
        endereco: 'Rua Industrial, 500 - Centro, Guarulhos/SP'
      }
    ],
    timeline: [
      {
        id: '7',
        etapa: 'Cadastro do Cliente',
        data: '2024-02-15',
        status: 'concluido'
      },
      {
        id: '8',
        etapa: 'Análise Técnica',
        data: '2024-02-20',
        status: 'em_andamento'
      }
    ],
    documentos: [
      {
        id: '4',
        nome: 'Laudo_Tecnico.pdf',
        tipo: 'Laudo',
        dataUpload: '2024-02-18',
        tamanho: 3072000
      }
    ],
    status: StatusProjeto.EM_ANDAMENTO,
    dataCriacao: '2024-02-15',
    dataAtualizacao: '2024-02-20'
  }
];
