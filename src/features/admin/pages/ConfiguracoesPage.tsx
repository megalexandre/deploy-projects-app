import React, { useState } from 'react';
import {
  Bell,
  Buildings,
  CurrencyCircleDollar,
  FloppyDisk,
  Gear,
  Percent,
  Shield,
} from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Card, CardContent } from '@/shared/components/Card';
import { ConcessionairesSection } from '@/features/concessionaries/components/ConcessionairesSection';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useConfiguracoes } from '@/features/admin/hooks/useConfiguracoes';
import { CuponsSettingsSection } from '@/features/admin/components/settings/CuponsSettingsSection';
import { GeralSettingsSection } from '@/features/admin/components/settings/GeralSettingsSection';
import { NotificationsSettingsSection } from '@/features/admin/components/settings/NotificationsSettingsSection';
import { PrecosSettingsSection } from '@/features/admin/components/settings/PrecosSettingsSection';
import { SegurancaSettingsSection } from '@/features/admin/components/settings/SegurancaSettingsSection';
import { SistemaSettingsSection } from '@/features/admin/components/settings/SistemaSettingsSection';
import { UserProfileReadonlySection } from '@/features/admin/components/settings/UserProfileReadonlySection';

type AbaConfiguracoes =
  | 'geral'
  | 'precos'
  | 'cupons'
  | 'concessionarias'
  | 'notificacoes'
  | 'sistema'
  | 'segurança';

const tabs: Array<{
  id: AbaConfiguracoes;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'geral', label: 'Geral', icon: Buildings },
  { id: 'precos', label: 'Precos', icon: CurrencyCircleDollar },
  { id: 'cupons', label: 'Cupons', icon: Percent },
  { id: 'concessionarias', label: 'Concessionarias', icon: Buildings },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'sistema', label: 'Sistema', icon: Gear },
  { id: 'segurança', label: 'Segurança', icon: Shield },
];

export const ConfiguracoesPage: React.FC = () => {
  const currentUser = useCurrentUser();
  const [activeTab, setActiveTab] = useState<AbaConfiguracoes>('geral');
  const configuracoes = useConfiguracoes();
  const isAdmin = currentUser?.isAdmin === true;

  if (!isAdmin) {
    return <UserProfileReadonlySection currentUser={currentUser} />;
  }

  const renderActiveTab = () => {
    if (activeTab === 'geral') {
      return (
        <GeralSettingsSection
          formData={configuracoes.formData}
          onInputChange={configuracoes.handleInputChange}
        />
      );
    }

    if (activeTab === 'precos') {
      return (
        <PrecosSettingsSection
          formData={configuracoes.formData}
          onPrecoFotovoltaicoChange={configuracoes.handlePrecoFotovoltaicoChange}
          onAdicionarFaixaFotovoltaica={configuracoes.handleAdicionarFaixaFotovoltaica}
          onRemoverFaixaFotovoltaica={configuracoes.handleRemoverFaixaFotovoltaica}
          onPrecoPadraoEntradaChange={configuracoes.handlePrecoPadraoEntradaChange}
          onAdicionarPrecoPadraoEntrada={configuracoes.handleAdicionarPrecoPadraoEntrada}
          onRemoverPrecoPadraoEntrada={configuracoes.handleRemoverPrecoPadraoEntrada}
        />
      );
    }

    if (activeTab === 'cupons') {
      return (
        <CuponsSettingsSection
          formData={configuracoes.formData}
          usuarios={configuracoes.usuarios}
          onCupomChange={configuracoes.handleCupomChange}
          onAdicionarCupom={configuracoes.handleAdicionarCupom}
        />
      );
    }

    if (activeTab === 'concessionarias') {
      return <ConcessionairesSection compactHeader />;
    }

    if (activeTab === 'notificacoes') {
      return (
        <NotificationsSettingsSection
          formData={configuracoes.formData}
          onInputChange={configuracoes.handleInputChange}
        />
      );
    }

    if (activeTab === 'sistema') {
      return (
        <SistemaSettingsSection
          formData={configuracoes.formData}
          onInputChange={configuracoes.handleInputChange}
        />
      );
    }

    return <SegurancaSettingsSection />;
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Configurações</h1>
          <p className="mt-1 text-gray-400">
            Defina preferências do sistema e as tabelas de valores.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {configuracoes.saveMessage && (
            <p className="text-sm text-emerald-300">{configuracoes.saveMessage}</p>
          )}
          <Button onClick={configuracoes.handleSalvar}>
            <FloppyDisk className="mr-2 h-4 w-4" />
            Salvar Alterações
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
        <CardContent className="p-6">{renderActiveTab()}</CardContent>
      </Card>
    </div>
  );
};
