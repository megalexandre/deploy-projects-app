import { Button } from '@/shared/components/Button';
import type { ConfiguracoesSistema } from '@/types';
import { Plus } from '@phosphor-icons/react';

interface CuponsSettingsSectionProps {
  formData: ConfiguracoesSistema;
  onCupomChange: (
    id: string,
    field: 'nome' | 'percentual' | 'ativo',
    value: string | boolean,
  ) => void;
  onAdicionarCupom: () => void;
}

const inputClassName =
  'w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue';

export const CuponsSettingsSection: React.FC<CuponsSettingsSectionProps> = ({
  formData,
  onCupomChange,
  onAdicionarCupom,
}) => (
  <div className="space-y-6 page-enter">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="mb-2 text-lg font-medium text-gray-100">Cupons de Desconto</h3>
        <p className="text-sm text-gray-400">
          Cadastre os cupons usados no fluxo de servicos. Cupons inativos deixam de aparecer na
          selecao.
        </p>
      </div>
      <Button type="button" variant="outline" onClick={onAdicionarCupom}>
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
                  onChange={(event) => onCupomChange(item.id, 'nome', event.target.value)}
                  placeholder="Ex: Cupom 10%"
                  className={inputClassName}
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.percentual}
                  onChange={(event) => onCupomChange(item.id, 'percentual', event.target.value)}
                  className={inputClassName}
                />
              </td>
              <td className="px-4 py-3">
                <label className="flex items-center gap-3 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={item.ativo}
                    onChange={(event) => onCupomChange(item.id, 'ativo', event.target.checked)}
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
);
