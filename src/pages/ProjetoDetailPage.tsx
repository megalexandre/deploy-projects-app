import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Clock, CheckCircle } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { projetoService } from '../services/projetoService';
import type { Projeto } from '../types';

export const ProjetoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dados');

  useEffect(() => {
    if (id) {
      loadProjeto(id);
    }
  }, [id]);

  const loadProjeto = async (projetoId: string) => {
    try {
      const data = await projetoService.getProjetoById(projetoId);
      setProjeto(data);
    } catch (error) {
      console.error('Erro ao carregar projeto:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'text-green-400 bg-green-900/20';
      case 'em_andamento':
        return 'text-accent-500 bg-accent-900/20';
      case 'pendente':
        return 'text-yellow-400 bg-yellow-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'Concluído';
      case 'em_andamento':
        return 'Em Andamento';
      case 'pendente':
        return 'Pendente';
      default:
        return status;
    }
  };

  const getTimelineIcon = (status: string) => {
    switch (status) {
      case 'concluido':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'em_andamento':
        return <Clock className="h-5 w-5 text-accent-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Projeto não encontrado.</div>
      </div>
    );
  }

  const tabs = [
    { id: 'dados', label: 'Dados do Projeto' },
    { id: 'tecnicos', label: 'Dados Técnicos' },
    { id: 'creditos', label: 'Divisão de Créditos' },
    { id: 'modulos', label: 'Módulos' },
    { id: 'inversores', label: 'Inversores' },
    { id: 'timeline', label: 'Linha do Tempo' },
    { id: 'documentos', label: 'Documentos' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/projetos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-100">{projeto.protocolo}</h1>
            <p className="text-gray-400 mt-1">{projeto.cliente.nome}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(projeto.status)}`}>
            {getStatusText(projeto.status)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'dados' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Nome</label>
                  <p className="text-gray-100">{projeto.cliente.nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">CPF/CNPJ</label>
                  <p className="text-gray-100">{projeto.cliente.cpfCnpj}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Telefone</label>
                  <p className="text-gray-100">{projeto.cliente.telefone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">E-mail</label>
                  <p className="text-gray-100">{projeto.cliente.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Endereço</label>
                  <p className="text-gray-100">
                    {projeto.endereco.logradouro}, {projeto.endereco.numero}
                    {projeto.endereco.complemento && ` - ${projeto.endereco.complemento}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Bairro</label>
                  <p className="text-gray-100">{projeto.endereco.bairro}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Cidade/UF</label>
                  <p className="text-gray-100">{projeto.endereco.cidade}/{projeto.endereco.estado}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">CEP</label>
                  <p className="text-gray-100">{projeto.endereco.cep}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dados do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Concessionária</label>
                  <p className="text-gray-100">{projeto.dadosProjeto.concessionaria}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Classe</label>
                  <p className="text-gray-100">{projeto.dadosProjeto.classe}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Integrador</label>
                  <p className="text-gray-100">{projeto.dadosProjeto.integrador}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Modalidade</label>
                  <p className="text-gray-100">
                    {projeto.dadosProjeto.modalidade === 'geracao_compartilhada' 
                      ? 'Geração Compartilhada' 
                      : 'Autoconsumo'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Potência do Sistema</label>
                  <p className="text-gray-100">{projeto.dadosProjeto.potenciaSistema} kWp</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Enquadramento</label>
                  <p className="text-gray-100">{projeto.dadosProjeto.enquadramento}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Proteção CC</label>
                  <p className="text-gray-100">{projeto.dadosProjeto.protecaoCC}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Data de Criação</label>
                  <p className="text-gray-100">{new Date(projeto.dataCriacao).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Última Atualização</label>
                  <p className="text-gray-100">{new Date(projeto.dataAtualizacao).toLocaleDateString('pt-BR')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'tecnicos' && (
          <Card>
            <CardHeader>
              <CardTitle>Dados Técnicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-400">Tensão (V)</label>
                  <p className="text-gray-100">{projeto.dadosTecnicos.tensao}V</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Número de Fases</label>
                  <p className="text-gray-100">{projeto.dadosTecnicos.numeroFases}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Tipo de Ramal</label>
                  <p className="text-gray-100">{projeto.dadosTecnicos.ramal}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Disjuntor</label>
                  <p className="text-gray-100">{projeto.dadosTecnicos.disjuntor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Carga Instalada</label>
                  <p className="text-gray-100">{projeto.dadosTecnicos.cargaInstalada.toLocaleString('pt-BR')} W</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'creditos' && (
          <Card>
            <CardHeader>
              <CardTitle>Divisão de Créditos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Percentual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        UC
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Classe
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Endereço
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {projeto.divisaoCreditos.map((credito, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                          {credito.percentual}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {credito.uc}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {credito.classe}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {credito.endereco}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'modulos' && (
          <Card>
            <CardHeader>
              <CardTitle>Módulos Fotovoltaicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Fabricante
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Modelo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Potência (W)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Quantidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Potência Total (kWp)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {projeto.modulos.map((modulo) => (
                      <tr key={modulo.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {modulo.fabricante}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {modulo.modelo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {modulo.potencia}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {modulo.quantidade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {modulo.potenciaPico}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'inversores' && (
          <Card>
            <CardHeader>
              <CardTitle>Inversores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Fabricante
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Modelo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Potência (W)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Quantidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Potência Total (kW)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {projeto.inversores.map((inversor) => (
                      <tr key={inversor.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {inversor.fabricante}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {inversor.modelo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {inversor.potencia}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {inversor.quantidade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {inversor.potenciaTotal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'timeline' && (
          <Card>
            <CardHeader>
              <CardTitle>Linha do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {projeto.timeline.map((item) => (
                  <div key={item.id} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getTimelineIcon(item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-gray-100">{item.etapa}</h4>
                        <span className="text-sm text-gray-400">
                          {new Date(item.data).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {item.descricao && (
                        <p className="mt-1 text-sm text-gray-300">{item.descricao}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'documentos' && (
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Data de Upload
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Tamanho
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {projeto.documentos.map((documento) => (
                      <tr key={documento.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-gray-400" />
                            {documento.nome}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {documento.tipo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(documento.dataUpload).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {(documento.tamanho / 1024 / 1024).toFixed(2)} MB
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

