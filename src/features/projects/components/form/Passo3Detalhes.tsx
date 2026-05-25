import React from 'react';
import { UploadSimple } from '@phosphor-icons/react';
import { maskNumeric } from '@/core/utils/masks';
import type {
  DadosBasicosForm,
  DadosDetalhesForm,
  DocumentoCategoria,
  ItemEquipamentoForm,
  PadraoEntradaItemForm,
  Passo,
} from '@/features/projects/domain/types';
import { buildItemVazio, servicosDisponiveis } from '@/features/projects/hooks/useNovoProjeto';
import type { Customer } from '@/services';
import type { Documento } from '@/types';
import { Button } from '@/shared/components/Button';
import { formatCurrencyBRL } from '@/core/utils/masks';
import { EquipamentosTable } from './EquipamentosTable';
import { FormField } from './FormField';
import { inputCls, selectCls } from './fieldCls';

interface Passo3DetalhesProps {
  dadosBasicos: DadosBasicosForm;
  setDadosBasicos: React.Dispatch<React.SetStateAction<DadosBasicosForm>>;
  detalhesProjeto: DadosDetalhesForm;
  setDetalhesProjeto: React.Dispatch<React.SetStateAction<DadosDetalhesForm>>;
  integradores: string[];
  servicosSelecionados: string[];
  setServicosSelecionados: React.Dispatch<React.SetStateAction<string[]>>;
  modulos: ItemEquipamentoForm[];
  setModulos: React.Dispatch<React.SetStateAction<ItemEquipamentoForm[]>>;
  inversores: ItemEquipamentoForm[];
  setInversores: React.Dispatch<React.SetStateAction<ItemEquipamentoForm[]>>;
  padraoEntradaItens: PadraoEntradaItemForm[];
  tabelaPrecoPadraoEntradaMap: Record<string, number>;
  potenciaTotalModulosW: number;
  potenciaTotalInversoresW: number;
  potenciaTotalSistemaW: number;
  valorProjeto: string;
  setValorProjeto: (v: string) => void;
  valorProjetoEditado: boolean;
  setValorProjetoEditado: (v: boolean) => void;
  custoCalculadoProjeto: number;
  documentos: Record<string, File[]>;
  documentosTemplate: DocumentoCategoria[];
  clienteSelecionadoDetalhe: Customer | null;
  selectedCustomerDocumentIds: string[];
  setSelectedCustomerDocumentIds: React.Dispatch<React.SetStateAction<string[]>>;
  reusedCustomerDocuments: Documento[];
  handleModuloChange: (id: string, field: keyof ItemEquipamentoForm, value: string) => void;
  handleInversorChange: (id: string, field: keyof ItemEquipamentoForm, value: string) => void;
  handlePadraoEntradaChange: (id: string, field: 'quantidade' | 'disjuntor', value: string) => void;
  handleDocumentosChange: (key: string, files: FileList | null) => void;
  handleCriarProjeto: () => void;
  salvando: boolean;
  validarPasso3: () => boolean;
  setPassoAtual: (p: Passo) => void;
}

export const Passo3Detalhes: React.FC<Passo3DetalhesProps> = ({
  dadosBasicos,
  setDadosBasicos,
  detalhesProjeto,
  setDetalhesProjeto,
  integradores,
  servicosSelecionados,
  setServicosSelecionados,
  modulos,
  setModulos,
  inversores,
  setInversores,
  padraoEntradaItens,
  tabelaPrecoPadraoEntradaMap,
  potenciaTotalModulosW,
  potenciaTotalInversoresW,
  potenciaTotalSistemaW,
  valorProjeto,
  setValorProjeto,
  valorProjetoEditado,
  setValorProjetoEditado,
  custoCalculadoProjeto,
  documentos,
  documentosTemplate,
  clienteSelecionadoDetalhe,
  selectedCustomerDocumentIds,
  setSelectedCustomerDocumentIds,
  reusedCustomerDocuments,
  handleModuloChange,
  handleInversorChange,
  handlePadraoEntradaChange,
  handleDocumentosChange,
  handleCriarProjeto,
  salvando,
  setPassoAtual,
}) => {
  const isFotovoltaico = dadosBasicos.tipoProjeto === 'fotovoltaico';

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-100">
        {isFotovoltaico ? 'Detalhes do Projeto Fotovoltaico' : 'Detalhes do Projeto'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FormField label="Integrador">
            <select
              value={dadosBasicos.integrador}
              onChange={(e) => setDadosBasicos((prev) => ({ ...prev, integrador: e.target.value }))}
              className={selectCls}
            >
              <option value="">Selecione...</option>
              {integradores.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="md:col-span-2">
          <FormField label="Servicos">
            <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-4 space-y-3">
              {servicosDisponiveis.map((servico) => (
                <label
                  key={servico}
                  className="flex items-center gap-3 rounded border border-gray-700 px-3 py-3 text-gray-200"
                >
                  <input
                    type="checkbox"
                    checked={servicosSelecionados.includes(servico)}
                    onChange={(e) =>
                      setServicosSelecionados((prev) =>
                        e.target.checked
                          ? [...prev, servico]
                          : prev.filter((item) => item !== servico),
                      )
                    }
                    className="h-4 w-4 rounded border-gray-500 bg-gray-900 text-blue-500 focus:ring-blue-500"
                  />
                  <span>{servico}</span>
                </label>
              ))}
            </div>
          </FormField>
        </div>
      </div>

      {isFotovoltaico && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FormField label="Modalidade de Geracao">
                <select
                  value={detalhesProjeto.modalidadeGeracao}
                  onChange={(e) =>
                    setDetalhesProjeto((prev) => ({
                      ...prev,
                      modalidadeGeracao: e.target.value as DadosDetalhesForm['modalidadeGeracao'],
                    }))
                  }
                  className={selectCls}
                >
                  <option value="autoconsumo_local">AUTOCONSUMO LOCAL</option>
                  <option value="autoconsumo_remoto">AUTOCONSUMO REMOTO</option>
                  <option value="geracao_compartilhada">GERACAO COMPARTILHADA</option>
                </select>
              </FormField>
            </div>

            <div>
              <FormField label="Projeto Novo">
                <select
                  value={detalhesProjeto.projetoNovo}
                  onChange={(e) =>
                    setDetalhesProjeto((prev) => ({
                      ...prev,
                      projetoNovo: e.target.value as DadosDetalhesForm['projetoNovo'],
                    }))
                  }
                  className={selectCls}
                >
                  <option value="sim">SIM</option>
                  <option value="nao_ampliacao">NAO, AMPLIACAO</option>
                </select>
              </FormField>
            </div>

            <div>
              <FormField label="Projeto Zero-Grid ou com Controle de Exportacao">
                <select
                  value={detalhesProjeto.zeroGridControleExportacao}
                  onChange={(e) =>
                    setDetalhesProjeto((prev) => ({
                      ...prev,
                      zeroGridControleExportacao: e.target
                        .value as DadosDetalhesForm['zeroGridControleExportacao'],
                    }))
                  }
                  className={selectCls}
                >
                  <option value="nao">NAO</option>
                  <option value="sim">SIM</option>
                </select>
              </FormField>
            </div>

            <div>
              <FormField label="Projeto Fast Track">
                <select
                  value={detalhesProjeto.projetoFastTrack}
                  onChange={(e) =>
                    setDetalhesProjeto((prev) => ({
                      ...prev,
                      projetoFastTrack: e.target.value as DadosDetalhesForm['projetoFastTrack'],
                    }))
                  }
                  className={selectCls}
                >
                  <option value="nao">Nao</option>
                  <option value="sim">Sim</option>
                </select>
              </FormField>
            </div>
          </div>

          <EquipamentosTable
            title="Modulos Fotovoltaicos"
            items={modulos}
            onChange={handleModuloChange}
            onAdd={() => setModulos((prev) => [...prev, buildItemVazio()])}
          />

          <EquipamentosTable
            title="Inversores Fotovoltaicos"
            items={inversores}
            onChange={handleInversorChange}
            onAdd={() => setInversores((prev) => [...prev, buildItemVazio()])}
          />

          <div className="rounded bg-blue-900/20 border border-blue-800/40 px-4 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <p className="text-sm uppercase tracking-wide text-blue-300">
                  Potencia total dos modulos
                </p>
                <p className="text-blue-100 text-2xl mt-1">{potenciaTotalModulosW} W</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-blue-300">
                  Potencia total dos inversores
                </p>
                <p className="text-blue-100 text-2xl mt-1">{potenciaTotalInversoresW} W</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-blue-300">
                  Potencia total do sistema
                </p>
                <p className="text-blue-100 text-2xl mt-1">{potenciaTotalSistemaW} W</p>
                <p className="mt-1 text-xs text-blue-200/80">
                  Resultado considera a menor potencia entre modulos e inversores.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {dadosBasicos.tipoProjeto === 'padrao_entrada' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FormField label="Projeto Novo">
                <select
                  value={detalhesProjeto.projetoNovo}
                  onChange={(e) =>
                    setDetalhesProjeto((prev) => ({
                      ...prev,
                      projetoNovo: e.target.value as DadosDetalhesForm['projetoNovo'],
                    }))
                  }
                  className={selectCls}
                >
                  <option value="sim">SIM</option>
                  <option value="nao_ampliacao">NAO, AMPLIACAO</option>
                </select>
              </FormField>
            </div>

            <div>
              <FormField label="Tensao de Fornecimento">
                <select
                  value={detalhesProjeto.tensaoFornecimento}
                  onChange={(e) =>
                    setDetalhesProjeto((prev) => ({
                      ...prev,
                      tensaoFornecimento: e.target.value as DadosDetalhesForm['tensaoFornecimento'],
                    }))
                  }
                  className={selectCls}
                >
                  <option value="">Selecione...</option>
                  <option value="127/220V">127/220V</option>
                  <option value="380/220V">380/220V</option>
                </select>
              </FormField>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-semibold text-gray-100">Quadro de Padrao de Entrada</h3>
              <p className="text-sm text-gray-400">
                Preencha quantidade e disjuntor nas linhas necessarias para o projeto EMUC.
              </p>
            </div>

            <div className="overflow-x-auto rounded border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/60">
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-4 py-3">Tipo de Ligacao</th>
                    <th className="px-4 py-3">Classificacao</th>
                    <th className="px-4 py-3">Valor Unitario</th>
                    <th className="px-4 py-3">Quantidade</th>
                    <th className="px-4 py-3">Disjuntor</th>
                    <th className="px-4 py-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {padraoEntradaItens.map((item) => {
                    const precoUnitario =
                      tabelaPrecoPadraoEntradaMap[`${item.classificacao}|${item.tipoLigacao}`] ?? 0;
                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-200">{item.tipoLigacao}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{item.classificacao}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {formatCurrencyBRL(precoUnitario)}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={item.quantidade}
                            onChange={(e) =>
                              handlePadraoEntradaChange(
                                item.id,
                                'quantidade',
                                maskNumeric(e.target.value, 4),
                              )
                            }
                            inputMode="numeric"
                            className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={item.disjuntor}
                            onChange={(e) =>
                              handlePadraoEntradaChange(item.id, 'disjuntor', e.target.value)
                            }
                            placeholder="Ex: 63A"
                            className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {formatCurrencyBRL((Number(item.quantidade) || 0) * precoUnitario)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="block text-sm text-gray-300">Custo do Projeto (R$)</label>
          <button
            type="button"
            onClick={() => {
              setValorProjetoEditado(false);
              setValorProjeto(
                custoCalculadoProjeto.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
              );
            }}
            className="text-xs font-medium text-blue-300 transition hover:text-blue-200"
          >
            Usar valor sugerido
          </button>
        </div>
        <input
          value={valorProjeto}
          onChange={(e) => {
            setValorProjetoEditado(true);
            const digits = e.target.value.replace(/\D/g, '');
            if (!digits) {
              setValorProjeto('');
              return;
            }
            setValorProjeto(
              (Number(digits) / 100).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            );
          }}
          className={inputCls}
        />
        <p className="mt-2 text-sm text-gray-400">
          {isFotovoltaico
            ? `Valor sugerido pela faixa de potencia: ${formatCurrencyBRL(custoCalculadoProjeto)}.`
            : `Valor sugerido pela tabela do EMUC: ${formatCurrencyBRL(custoCalculadoProjeto)}.`}
        </p>
        {valorProjetoEditado && (
          <p className="mt-1 text-xs text-amber-300">
            Valor manual ativo. Alteracoes de potencia nao substituem o valor ate voce reaplicar o
            sugerido.
          </p>
        )}
      </div>

      <div>
        <FormField label="Observacoes / Comentarios">
          <textarea
            value={detalhesProjeto.observacoes}
            onChange={(e) =>
              setDetalhesProjeto((prev) => ({ ...prev, observacoes: e.target.value }))
            }
            rows={4}
            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue resize-y"
          />
        </FormField>
      </div>

      <div className="space-y-4">
        <h3 className="text-3xl font-semibold text-gray-100">Documentos</h3>

        {clienteSelecionadoDetalhe && clienteSelecionadoDetalhe.documentos.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-gray-100">
                  Reaproveitar documentos do cliente
                </h4>
                <p className="mt-1 text-sm text-gray-400">
                  {clienteSelecionadoDetalhe.nome} ja possui{' '}
                  {clienteSelecionadoDetalhe.documentos.length} documento(s) cadastrado(s).
                </p>
              </div>
              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                {reusedCustomerDocuments.length} selecionado(s)
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {clienteSelecionadoDetalhe.documentos.map((documento) => (
                <label
                  key={documento.id}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200"
                >
                  <input
                    type="checkbox"
                    checked={selectedCustomerDocumentIds.includes(documento.id)}
                    onChange={(event) =>
                      setSelectedCustomerDocumentIds((current) =>
                        event.target.checked
                          ? [...current, documento.id]
                          : current.filter((id) => id !== documento.id),
                      )
                    }
                    className="mt-1"
                  />
                  <span>
                    <strong className="block text-slate-100">{documento.nome}</strong>
                    <span className="block text-xs text-slate-400">{documento.tipo}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentosTemplate.map((item) => (
            <label
              key={item.key}
              className="border border-dashed border-gray-500 rounded px-4 py-6 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-opj-blue transition-colors"
            >
              <UploadSimple className="h-6 w-6 text-gray-400" />
              <span className="text-gray-200">{item.label}</span>
              <span className="text-xs text-gray-400 truncate max-w-full">
                {(documentos[item.key] ?? []).length > 0
                  ? `${(documentos[item.key] ?? []).length} arquivo(s) selecionado(s)`
                  : item.maxFiles
                    ? `Selecionar ate ${item.maxFiles} arquivos`
                    : 'Selecionar arquivo'}
              </span>
              <input
                type="file"
                className="hidden"
                multiple={Boolean(item.maxFiles && item.maxFiles > 1)}
                onChange={(e) => handleDocumentosChange(item.key, e.target.files)}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setPassoAtual(2)} disabled={salvando}>
          Voltar
        </Button>
        <Button onClick={handleCriarProjeto} loading={salvando} disabled={salvando}>
          Criar Projeto
        </Button>
      </div>
    </div>
  );
};
