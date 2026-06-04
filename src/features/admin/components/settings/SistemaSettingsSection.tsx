import type { ConfiguracoesSistema } from '@/types';

interface SistemaSettingsSectionProps {
  formData: ConfiguracoesSistema;
  onInputChange: <K extends keyof ConfiguracoesSistema>(
    field: K,
    value: ConfiguracoesSistema[K],
  ) => void;
}

const selectClassName =
  'w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-gray-100 focus:border-blue-500 focus:outline-none';

export const SistemaSettingsSection: React.FC<SistemaSettingsSectionProps> = ({
  formData,
  onInputChange,
}) => (
  <div className="space-y-6 page-enter">
    <h3 className="mb-4 text-lg font-medium text-gray-100">Configurações do Sistema</h3>

    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Tema</label>
        <select
          value={formData.tema}
          onChange={(event) =>
            onInputChange('tema', event.target.value as ConfiguracoesSistema['tema'])
          }
          className={selectClassName}
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
          onChange={(event) => onInputChange('idioma', event.target.value)}
          className={selectClassName}
        >
          <option value="pt-BR">Portugues (Brasil)</option>
          <option value="en-US">English</option>
          <option value="es-ES">Espanol</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Fuso Horario</label>
        <select
          value={formData.fusoHorario}
          onChange={(event) => onInputChange('fusoHorario', event.target.value)}
          className={selectClassName}
        >
          <option value="America/Sao_Paulo">Brasilia (GMT-3)</option>
          <option value="America/New_York">Nova York (GMT-5)</option>
          <option value="Europe/London">Londres (GMT+0)</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Formato de Data</label>
        <select
          value={formData.formatoData}
          onChange={(event) => onInputChange('formatoData', event.target.value)}
          className={selectClassName}
        >
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </div>
    </div>
  </div>
);
