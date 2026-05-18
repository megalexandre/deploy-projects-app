/** Pagina 'ConfiguracoesPage': orquestra estado da tela, eventos do usuario e renderizacao dos componentes. */
import React, { useState } from 'react';
import {
  Bell,
  Buildings,
  CurrencyCircleDollar,
  EnvelopeSimple,
  FloppyDisk,
  Gear,
  Percent,
  Phone,
  Plus,
  Shield,
} from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Card, CardContent } from '@/shared/components/Card';
import type { ConfiguracoesSistema } from '@/types';
import { maskCnpj, maskPhoneBR } from '@/core/utils/masks';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { loadConfiguracoesSistema, saveConfiguracoesSistema } from '@/utils/configuracoesSistema';

type AbaConfiguracoes = 'geral' | 'precos' | 'cupons' | 'notificacoes' | 'sistema' | 'seguranca';

const tabs: Array<{
  id: AbaConfiguracoes;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'geral', label: 'Geral', icon: Buildings },
  { id: 'precos', label: 'Precos', icon: CurrencyCircleDollar },
  { id: 'cupons', label: 'Cupons', icon: Percent },
  { id: 'notificacoes', label: 'Notificacoes', icon: Bell },
  { id: 'sistema', label: 'Sistema', icon: Gear },
  { id: 'seguranca', label: 'Seguranca', icon: Shield },
];

export const ConfiguracoesPage: React.FC = () => {
  const currentUser = useCurrentUser();
  const [activeTab, setActiveTab] = useState<AbaConfiguracoes>('geral');
  const [formData, setFormData] = useState<ConfiguracoesSistema>(loadConfiguracoesSistema());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const isAdmin = currentUser?.isAdmin === true;

  const handleInputChange = <K extends keyof ConfiguracoesSistema>(
    field: K,
    value: ConfiguracoesSistema[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrecoFotovoltaicoChange = (
    id: string,
    field: 'min' | 'max' | 'valor',
    value: string,
  ) => {
    const nextValue = value === '' ? 0 : Number(value);

    setFormData((prev) => ({
      ...prev,
      tabelaPrecoFotovoltaico: prev.tabelaPrecoFotovoltaico.map((item) =>
        item.id === id ? { ...item, [field]: Number.isFinite(nextValue) ? nextValue : 0 } : item,
      ),
    }));
  };

  const handlePrecoPadraoEntradaChange = (id: string, value: string) => {
    const nextValue = value === '' ? 0 : Number(value);

    setFormData((prev) => ({
      ...prev,
      tabelaPrecoPadraoEntrada: prev.tabelaPrecoPadraoEntrada.map((item) =>
        item.id === id ? { ...item, valor: Number.isFinite(nextValue) ? nextValue : 0 } : item,
      ),
    }));
  };

  const handleCupomChange = (
    id: string,
    field: 'nome' | 'percentual' | 'ativo',
    value: string | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      cuponsDesconto: prev.cuponsDesconto.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === 'percentual'
                  ? Number.isFinite(Number(value))
                    ? Number(value)
                    : 0
                  : value,
            }
          : item,
      ),
    }));
  };

  const handleAdicionarCupom = () => {
    setFormData((prev) => ({
      ...prev,
      cuponsDesconto: [
        ...prev.cuponsDesconto,
        {
          id: crypto.randomUUID(),
          nome: '',
          percentual: 0,
          ativo: true,
        },
      ],
    }));
  };

  const handleSalvar = () => {
    saveConfiguracoesSistema(formData);
    setSaveMessage('Configuracoes salvas. Novos projetos passam a usar esses valores.');
    window.setTimeout(() => setSaveMessage(null), 3000);
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Meu Perfil</h1>
          <p className="mt-1 text-gray-400">Visualizacao do proprio usuario autenticado.</p>
        </div>

        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
              A API atual nao possui endpoint para editar o proprio perfil. Por isso, os dados
              abaixo estao disponiveis apenas para consulta no frontend.
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input label="Nome" value={currentUser?.name ?? ''} readOnly />
              <Input label="E-mail" value={currentUser?.email ?? ''} readOnly />
              <Input label="Perfil" value={currentUser?.role ?? 'user'} readOnly />
              <Input
                label="Acesso"
                value={currentUser?.isAdmin ? 'Administrador do sistema' : 'Usuario'}
                readOnly
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Configuracoes</h1>
          <p className="mt-1 text-gray-400">
            Defina preferencias do sistema e as tabelas de valores.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && <p className="text-sm text-emerald-300">{saveMessage}</p>}
          <Button onClick={handleSalvar}>
            <FloppyDisk className="mr-2 h-4 w-4" />
            Salvar Alteracoes
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-lg bg-gray-800 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {activeTab === 'geral' && (
            <div className="space-y-6 page-enter">
              <h3 className="mb-4 text-lg font-medium text-gray-100">Informacoes da Empresa</h3>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                <label className="mb-2 block text-sm font-medium text-gray-300">Endereco</label>
                <textarea
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  className="w-full resize-none rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          {activeTab === 'precos' && (
            <div className="space-y-8 page-enter">
              <div>
                <h3 className="mb-2 text-lg font-medium text-gray-100">Tabelas de Valores</h3>
                <p className="text-sm text-gray-400">
                  Edite aqui os valores usados no calculo automatico dos novos projetos.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-gray-100">Projeto Fotovoltaico</h4>
                  <p className="text-sm text-gray-400">
                    Faixas de potencia em kW e valor cobrado por faixa.
                  </p>
                </div>

                <div className="overflow-x-auto rounded border border-gray-700">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900/60">
                      <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                        <th className="px-4 py-3">Potencia Minima</th>
                        <th className="px-4 py-3">Potencia Maxima</th>
                        <th className="px-4 py-3">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {formData.tabelaPrecoFotovoltaico.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.1"
                              value={item.min}
                              onChange={(e) =>
                                handlePrecoFotovoltaicoChange(item.id, 'min', e.target.value)
                              }
                              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.1"
                              value={item.max}
                              onChange={(e) =>
                                handlePrecoFotovoltaicoChange(item.id, 'max', e.target.value)
                              }
                              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              value={item.valor}
                              onChange={(e) =>
                                handlePrecoFotovoltaicoChange(item.id, 'valor', e.target.value)
                              }
                              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-gray-100">
                    Padrao de Entrada / EMUC
                  </h4>
                  <p className="text-sm text-gray-400">
                    Valor unitario usado em cada combinacao de classificacao e ligacao.
                  </p>
                </div>

                <div className="overflow-x-auto rounded border border-gray-700">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900/60">
                      <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                        <th className="px-4 py-3">Classificacao</th>
                        <th className="px-4 py-3">Tipo de Ligacao</th>
                        <th className="px-4 py-3">Valor Unitario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {formData.tabelaPrecoPadraoEntrada.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm text-gray-300">{item.classificacao}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">{item.tipoLigacao}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              value={item.valor}
                              onChange={(e) =>
                                handlePrecoPadraoEntradaChange(item.id, e.target.value)
                              }
                              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cupons' && (
            <div className="space-y-6 page-enter">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="mb-2 text-lg font-medium text-gray-100">Cupons de Desconto</h3>
                  <p className="text-sm text-gray-400">
                    Cadastre os cupons usados no fluxo de servicos. Cupons inativos deixam de
                    aparecer na selecao.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={handleAdicionarCupom}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Cupom
                </Button>
              </div>

              <div className="overflow-x-auto rounded border border-gray-700">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900/60">
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Percentual</th>
                      <th className="px-4 py-3">Ativo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {formData.cuponsDesconto.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <input
                            value={item.nome}
                            onChange={(e) => handleCupomChange(item.id, 'nome', e.target.value)}
                            placeholder="Ex: Cupom 10%"
                            className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.percentual}
                            onChange={(e) =>
                              handleCupomChange(item.id, 'percentual', e.target.value)
                            }
                            className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <label className="flex items-center gap-3 text-sm text-gray-300">
                            <input
                              type="checkbox"
                              checked={item.ativo}
                              onChange={(e) =>
                                handleCupomChange(item.id, 'ativo', e.target.checked)
                              }
                              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                            />
                            Exibir no sistema
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'notificacoes' && (
            <div className="space-y-6 page-enter">
              <h3 className="mb-4 text-lg font-medium text-gray-100">
                Preferencias de Notificacao
              </h3>

              <div className="space-y-4">
                <label className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
                  <div>
                    <div className="font-medium text-gray-100">Notificacoes por E-mail</div>
                    <div className="text-sm text-gray-400">
                      Receba avisos importantes por e-mail
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.emailNotificacoes}
                    onChange={(e) => handleInputChange('emailNotificacoes', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
                  <div>
                    <div className="font-medium text-gray-100">Notificacoes por SMS</div>
                    <div className="text-sm text-gray-400">Receba alertas criticos por SMS</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.smsNotificacoes}
                    onChange={(e) => handleInputChange('smsNotificacoes', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
                  <div>
                    <div className="font-medium text-gray-100">Projetos</div>
                    <div className="text-sm text-gray-400">Atualizacoes sobre projetos</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notificacoesProjetos}
                    onChange={(e) => handleInputChange('notificacoesProjetos', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
                  <div>
                    <div className="font-medium text-gray-100">Financeiro</div>
                    <div className="text-sm text-gray-400">Alertas financeiros e pagamentos</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notificacoesFinanceiro}
                    onChange={(e) => handleInputChange('notificacoesFinanceiro', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
                  <div>
                    <div className="font-medium text-gray-100">Servicos</div>
                    <div className="text-sm text-gray-400">Avisos relacionados a servicos</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notificacoesServicos}
                    onChange={(e) => handleInputChange('notificacoesServicos', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'sistema' && (
            <div className="space-y-6 page-enter">
              <h3 className="mb-4 text-lg font-medium text-gray-100">Configuracoes do Sistema</h3>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Tema</label>
                  <select
                    value={formData.tema}
                    onChange={(e) =>
                      handleInputChange('tema', e.target.value as ConfiguracoesSistema['tema'])
                    }
                    className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="dark">Escuro</option>
                    <option value="light">Claro</option>
                    <option value="auto">Automatico</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Idioma</label>
                  <select
                    value={formData.idioma}
                    onChange={(e) => handleInputChange('idioma', e.target.value)}
                    className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="pt-BR">Portugues (Brasil)</option>
                    <option value="en-US">English</option>
                    <option value="es-ES">Espanol</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Fuso Horario
                  </label>
                  <select
                    value={formData.fusoHorario}
                    onChange={(e) => handleInputChange('fusoHorario', e.target.value)}
                    className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="America/Sao_Paulo">Brasilia (GMT-3)</option>
                    <option value="America/New_York">Nova York (GMT-5)</option>
                    <option value="Europe/London">Londres (GMT+0)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Formato de Data
                  </label>
                  <select
                    value={formData.formatoData}
                    onChange={(e) => handleInputChange('formatoData', e.target.value)}
                    className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div className="space-y-6 page-enter">
              <h3 className="mb-4 text-lg font-medium text-gray-100">Configuracoes de Seguranca</h3>

              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="mb-2 font-medium text-gray-100">Autenticacao de Dois Fatores</h4>
                    <p className="mb-4 text-sm text-gray-400">
                      Adicione uma camada extra de seguranca a sua conta.
                    </p>
                    <Button variant="outline">Configurar 2FA</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="mb-2 font-medium text-gray-100">Senha</h4>
                    <p className="mb-4 text-sm text-gray-400">
                      Altere sua senha regularmente para manter a seguranca.
                    </p>
                    <Button variant="outline">Alterar Senha</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
