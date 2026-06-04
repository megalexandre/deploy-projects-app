import type { ConfiguracoesSistema } from '@/types';

interface NotificationsSettingsSectionProps {
  formData: ConfiguracoesSistema;
  onInputChange: <K extends keyof ConfiguracoesSistema>(
    field: K,
    value: ConfiguracoesSistema[K],
  ) => void;
}

const toggleClassName =
  'h-5 w-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500';

export const NotificationsSettingsSection: React.FC<NotificationsSettingsSectionProps> = ({
  formData,
  onInputChange,
}) => (
  <div className="space-y-6 page-enter">
    <h3 className="mb-4 text-lg font-medium text-gray-100">Preferências de Notificação</h3>

    <div className="space-y-4">
      <label className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
        <div>
          <div className="font-medium text-gray-100">Notificações por E-mail</div>
          <div className="text-sm text-gray-400">Receba avisos importantes por e-mail</div>
        </div>
        <input
          type="checkbox"
          checked={formData.emailNotificacoes}
          onChange={(event) => onInputChange('emailNotificacoes', event.target.checked)}
          className={toggleClassName}
        />
      </label>

      <label className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
        <div>
          <div className="font-medium text-gray-100">Notificações por SMS</div>
          <div className="text-sm text-gray-400">Receba alertas criticos por SMS</div>
        </div>
        <input
          type="checkbox"
          checked={formData.smsNotificacoes}
          onChange={(event) => onInputChange('smsNotificacoes', event.target.checked)}
          className={toggleClassName}
        />
      </label>

      <label className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
        <div>
          <div className="font-medium text-gray-100">Projetos</div>
          <div className="text-sm text-gray-400">Atualizações sobre projetos</div>
        </div>
        <input
          type="checkbox"
          checked={formData.notificacoesProjetos}
          onChange={(event) => onInputChange('notificacoesProjetos', event.target.checked)}
          className={toggleClassName}
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
          onChange={(event) => onInputChange('notificacoesFinanceiro', event.target.checked)}
          className={toggleClassName}
        />
      </label>

      <label className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
        <div>
          <div className="font-medium text-gray-100">Serviços</div>
          <div className="text-sm text-gray-400">Avisos relacionados a serviços</div>
        </div>
        <input
          type="checkbox"
          checked={formData.notificacoesServicos}
          onChange={(event) => onInputChange('notificacoesServicos', event.target.checked)}
          className={toggleClassName}
        />
      </label>
    </div>
  </div>
);
