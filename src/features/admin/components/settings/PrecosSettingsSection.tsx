import { Button } from '@/shared/components/Button';
import type { ConfiguracoesSistema } from '@/types';
import { Plus, Trash } from '@phosphor-icons/react';

interface PrecosSettingsSectionProps {
  formData: ConfiguracoesSistema;
  onPrecoFotovoltaicoChange: (id: string, field: 'min' | 'max' | 'valor', value: string) => void;
  onAdicionarFaixaFotovoltaica: () => void;
  onRemoverFaixaFotovoltaica: (id: string) => void;
  onPrecoPadraoEntradaChange: (
    id: string,
    field: 'classificacao' | 'tipoLigacao' | 'valor',
    value: string,
  ) => void;
  onAdicionarPrecoPadraoEntrada: () => void;
  onRemoverPrecoPadraoEntrada: (id: string) => void;
}

const inputClassName =
  'w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue';

export const PrecosSettingsSection: React.FC<PrecosSettingsSectionProps> = ({
  formData,
  onPrecoFotovoltaicoChange,
  onAdicionarFaixaFotovoltaica,
  onRemoverFaixaFotovoltaica,
  onPrecoPadraoEntradaChange,
  onAdicionarPrecoPadraoEntrada,
  onRemoverPrecoPadraoEntrada,
}) => (
  <div className="space-y-8 page-enter">
    <div>
      <h3 className="mb-2 text-lg font-medium text-gray-100">Tabelas de Valores</h3>
      <p className="text-sm text-gray-400">
        Edite aqui os valores usados no calculo automatico dos novos projetos.
      </p>
    </div>

    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-base font-semibold text-gray-100">Projeto Fotovoltaico</h4>
          <p className="text-sm text-gray-400">
            Faixas de potência em kW e valor cobrado por faixa.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onAdicionarFaixaFotovoltaica}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Faixa
        </Button>
      </div>

      <div className="overflow-x-auto rounded border border-gray-700">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900/60">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">Potência Mínima</th>
              <th className="px-4 py-3">Potência Máxima</th>
              <th className="px-4 py-3">Valor</th>
              <th className="w-20 px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {formData.tabelaPrecoFotovoltaico.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">
                  Nenhuma faixa cadastrada.
                </td>
              </tr>
            )}
            {formData.tabelaPrecoFotovoltaico.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.1"
                    value={item.min}
                    onChange={(event) =>
                      onPrecoFotovoltaicoChange(item.id, 'min', event.target.value)
                    }
                    className={inputClassName}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.1"
                    value={item.max}
                    onChange={(event) =>
                      onPrecoFotovoltaicoChange(item.id, 'max', event.target.value)
                    }
                    className={inputClassName}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    value={item.valor}
                    onChange={(event) =>
                      onPrecoFotovoltaicoChange(item.id, 'valor', event.target.value)
                    }
                    className={inputClassName}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onRemoverFaixaFotovoltaica(item.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded border border-red-500/40 text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                    aria-label="Remover faixa"
                    title="Remover faixa"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-base font-semibold text-gray-100">Padrao de Entrada / EMUC</h4>
          <p className="text-sm text-gray-400">
            Valor unitario usado em cada combinacao de classificação e ligacao.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onAdicionarPrecoPadraoEntrada}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Linha
        </Button>
      </div>

      <div className="overflow-x-auto rounded border border-gray-700">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900/60">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">Classificação</th>
              <th className="px-4 py-3">Tipo de Ligação</th>
              <th className="px-4 py-3">Valor Unitário</th>
              <th className="w-20 px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {formData.tabelaPrecoPadraoEntrada.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">
                  Nenhuma linha cadastrada.
                </td>
              </tr>
            )}
            {formData.tabelaPrecoPadraoEntrada.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <input
                    value={item.classificacao}
                    onChange={(event) =>
                      onPrecoPadraoEntradaChange(item.id, 'classificacao', event.target.value)
                    }
                    placeholder="Ex: Residencial"
                    className={inputClassName}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    value={item.tipoLigacao}
                    onChange={(event) =>
                      onPrecoPadraoEntradaChange(item.id, 'tipoLigacao', event.target.value)
                    }
                    placeholder="Ex: Monofasico"
                    className={inputClassName}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    value={item.valor}
                    onChange={(event) =>
                      onPrecoPadraoEntradaChange(item.id, 'valor', event.target.value)
                    }
                    className={inputClassName}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onRemoverPrecoPadraoEntrada(item.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded border border-red-500/40 text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                    aria-label="Remover linha"
                    title="Remover linha"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
