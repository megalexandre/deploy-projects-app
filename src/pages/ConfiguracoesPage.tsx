import React, { useState } from 'react';
import { Gear, FloppyDisk, Bell, Shield, Database, EnvelopeSimple, Phone, Buildings } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardContent } from '../components/Card';
import { maskCnpj, maskNumeric, maskPhoneBR } from '../utils/masks';

export const ConfiguracoesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('geral');
  const [formData, setFormData] = useState({
    // Geral
    nomeEmpresa: 'OPJ Engenharia',
    cnpj: '12.345.678/0001-99',
    telefone: '(11) 3456-7890',
    email: 'contato@opjengenharia.com.br',
    endereco: 'Rua das Indústrias, 1234 - São Paulo/SP',
    
    // Notificações
    emailNotificacoes: true,
    smsNotificacoes: false,
    notificacoesProjetos: true,
    notificacoesFinanceiro: true,
    notificacoesServicos: false,
    
    // Sistema
    tema: 'dark',
    idioma: 'pt-BR',
    fusoHorario: 'America/Sao_Paulo',
    formatoData: 'DD/MM/YYYY',
    
    // Backup
    backupAutomatico: true,
    frequenciaBackup: 'diario',
    retencaoBackup: '30'
  });

  const tabs = [
    { id: 'geral', label: 'Geral', icon: Buildings },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'sistema', label: 'Sistema', icon: Gear },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'backup', label: 'Backup', icon: Database }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFloppyDisk = () => {
    console.log('Salvando configurações:', formData);
    // Aqui você implementaria a lógica de salvar
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Configurações</h1>
          <p className="text-gray-400 mt-1">Configure as preferências do sistema</p>
        </div>
        <Button className="mt-4 sm:mt-0" onClick={handleFloppyDisk}>
          <FloppyDisk className="h-4 w-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }
            `}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <Card>
        <CardContent className="p-6">
          {/* Geral */}
          {activeTab === 'geral' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-100 mb-4">Informações da Empresa</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nome da Empresa"
                  value={formData.nomeEmpresa}
                  onChange={(e) => handleInputChange('nomeEmpresa', e.target.value)}
                  icon={<Buildings />}
                />
                
                <Input
                  label="CNPJ"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange('cnpj', maskCnpj(e.target.value))}
                />
                
                <Input
                  label="Telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', maskPhoneBR(e.target.value))}
                  icon={<Phone />}
                />
                
                <Input
                  label="E-mail"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  icon={<EnvelopeSimple />}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Endereço
                </label>
                <textarea
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Notificações */}
          {activeTab === 'notificacoes' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-100 mb-4">Preferências de Notificação</h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-100">Notificações por E-mail</div>
                    <div className="text-sm text-gray-400">Receba notificações importantes por e-mail</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.emailNotificacoes}
                    onChange={(e) => handleInputChange('emailNotificacoes', e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-100">Notificações por SMS</div>
                    <div className="text-sm text-gray-400">Receba alertas críticos por SMS</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.smsNotificacoes}
                    onChange={(e) => handleInputChange('smsNotificacoes', e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-100">Projetos</div>
                    <div className="text-sm text-gray-400">Atualizações sobre projetos</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notificacoesProjetos}
                    onChange={(e) => handleInputChange('notificacoesProjetos', e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-100">Financeiro</div>
                    <div className="text-sm text-gray-400">Alertas financeiros e pagamentos</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notificacoesFinanceiro}
                    onChange={(e) => handleInputChange('notificacoesFinanceiro', e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-100">Serviços</div>
                    <div className="text-sm text-gray-400">Novos serviços e atualizações</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notificacoesServicos}
                    onChange={(e) => handleInputChange('notificacoesServicos', e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Sistema */}
          {activeTab === 'sistema' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-100 mb-4">Configurações do Sistema</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tema</label>
                  <select
                    value={formData.tema}
                    onChange={(e) => handleInputChange('tema', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="dark">Escuro</option>
                    <option value="light">Claro</option>
                    <option value="auto">Automático</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Idioma</label>
                  <select
                    value={formData.idioma}
                    onChange={(e) => handleInputChange('idioma', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Fuso Horário</label>
                  <select
                    value={formData.fusoHorario}
                    onChange={(e) => handleInputChange('fusoHorario', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                    <option value="America/New_York">Nova York (GMT-5)</option>
                    <option value="Europe/London">Londres (GMT+0)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Formato de Data</label>
                  <select
                    value={formData.formatoData}
                    onChange={(e) => handleInputChange('formatoData', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Segurança */}
          {activeTab === 'seguranca' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-100 mb-4">Configurações de Segurança</h3>
              
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-100 mb-2">Autenticação de Dois Fatores</h4>
                    <p className="text-sm text-gray-400 mb-4">Adicione uma camada extra de segurança à sua conta</p>
                    <Button variant="outline">Configurar 2FA</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-100 mb-2">Senha</h4>
                    <p className="text-sm text-gray-400 mb-4">Altere sua senha regularmente para manter a segurança</p>
                    <Button variant="outline">Alterar Senha</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-100 mb-2">Sessões Ativas</h4>
                    <p className="text-sm text-gray-400 mb-4">Gerencie as sessões ativas da sua conta</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <div>
                          <div className="text-sm text-gray-100">Chrome - Windows</div>
                          <div className="text-xs text-gray-400">Último acesso: 2 horas atrás</div>
                        </div>
                        <Button variant="outline" size="sm">Encerrar</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Backup */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-100 mb-4">Configurações de Backup</h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-100">Backup Automático</div>
                    <div className="text-sm text-gray-400">Faça backups automáticos dos dados</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.backupAutomatico}
                    onChange={(e) => handleInputChange('backupAutomatico', e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Frequência do Backup</label>
                  <select
                    value={formData.frequenciaBackup}
                    onChange={(e) => handleInputChange('frequenciaBackup', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="diario">Diário</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Retenção (dias)</label>
                  <Input
                    type="number"
                    value={formData.retencaoBackup}
                    onChange={(e) => handleInputChange('retencaoBackup', maskNumeric(e.target.value, 4))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button>Fazer Backup Agora</Button>
                  <Button variant="outline">Restaurar Backup</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

