import React from 'react';
import { FloppyDisk, PlusCircle, X } from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import type { Endereco, TipoServico, CupomDesconto } from '@/types';
import {
  formatCurrencyBRL,
  maskCep,
  maskLatitude,
  maskLongitude,
  maskNumeric,
} from '@/core/utils/masks';
import type { Concessionaire, Customer } from '@/services';
import {
  canUseRateioType,
  classificacaoOptions,
  isTechnicalType,
  tipoLigacaoOptions,
  tipoServicoOptions,
} from '../domain/servicosOptions';

type AddressForm = {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

type PadraoEntradaItemForm = {
  id: string;
  tipoLigacao: string;
  classificacao: string;
  quantidade: string;
  disjuntor: string;
};

type RateioForm = {
  id: string;
  uc: string;
  endereco: string;
  classe: string;
  percentual: string;
};

type ServicoForm = {
  tipo: TipoServico;
  clienteId: string;
  clienteNomeManual: string;
  concessionaria: string;
  dataAbertura: string;
  valor: string;
  cupomDescontoPct: string;
  observacoes: string;
  enderecoObra: AddressForm;
  tensaoFornecimento: '' | '127/220V' | '380/220V';
  latitude: string;
  longitude: string;
  padraoMaisDe30m: 'nao' | 'sim';
  pontoReferencia: string;
  padraoEntradaItens: PadraoEntradaItemForm[];
  ucGeradora: string;
  enderecoGeradora: AddressForm;
  rateios: RateioForm[];
};

type DocumentoCategoria = {
  key: string;
  label: string;
  maxFiles?: number;
};

type ViaCepAddress = Pick<
  Endereco,
  'cep' | 'logradouro' | 'complemento' | 'bairro' | 'cidade' | 'estado'
>;

type ServicoFormCardProps = {
  editingId: string | null;
  form: ServicoForm;
  setForm: React.Dispatch<React.SetStateAction<ServicoForm>>;
  selectedCustomer: Customer | null;
  clientes: Customer[];
  concessionarias: Concessionaire[];
  cupons: CupomDesconto[];
  valorFinal: number;
  documentCategories: DocumentoCategoria[];
  uploadedFiles: Record<string, File[]>;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onFilesChange: (key: string, files: FileList | null) => void;
  fillAddressFromCep: (cep: string, updater: (address: ViaCepAddress) => void) => Promise<void>;
};

const buildPadraoItem = (): PadraoEntradaItemForm => ({
  id: crypto.randomUUID(),
  tipoLigacao: 'Monofasico',
  classificacao: 'Residencial',
  quantidade: '',
  disjuntor: '',
});

const buildRateio = (): RateioForm => ({
  id: crypto.randomUUID(),
  uc: '',
  endereco: '',
  classe: 'Residencial',
  percentual: '',
});

const emptyAddress = (): AddressForm => ({
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
});

const normalizeAddressFromCustomer = (customer?: Customer | null): AddressForm =>
  customer?.endereco
    ? {
        cep: customer.endereco.cep ?? '',
        logradouro: customer.endereco.logradouro ?? '',
        numero: customer.endereco.numero ?? '',
        complemento: customer.endereco.complemento ?? '',
        bairro: customer.endereco.bairro ?? '',
        cidade: customer.endereco.cidade ?? '',
        estado: customer.endereco.estado ?? '',
      }
    : emptyAddress();

export const ServicoFormCard: React.FC<ServicoFormCardProps> = ({
  editingId,
  form,
  setForm,
  selectedCustomer,
  clientes,
  concessionarias,
  cupons,
  valorFinal,
  documentCategories,
  uploadedFiles,
  saving,
  onClose,
  onSubmit,
  onFilesChange,
  fillAddressFromCep,
}) => (
  <Card className="border-cyan-300/20">
    <CardHeader>
      <div className="flex items-center justify-between gap-4">
        <div>
          <CardTitle>{editingId ? 'Editar Servico' : 'Novo Servico'}</CardTitle>
          <p className="mt-1 text-sm text-slate-400">
            Formulario estruturado conforme o documento funcional.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onClose}>
          <X className="mr-2 h-4 w-4" />
          Fechar
        </Button>
      </div>
    </CardHeader>
    <CardContent className="space-y-6 p-6">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Tipo de Servico</label>
            <select
              value={form.tipo}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, tipo: event.target.value as TipoServico }))
              }
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
            >
              {tipoServicoOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-400">
              {tipoServicoOptions.find((item) => item.value === form.tipo)?.description}
            </p>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Cliente cadastrado</label>
            <select
              value={form.clienteId}
              onChange={(event) => setForm((prev) => ({ ...prev, clienteId: event.target.value }))}
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
            >
              <option value="">Selecionar depois / nome manual</option>
              {clientes.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Nome do cliente</label>
            <input
              value={form.clienteId ? (selectedCustomer?.nome ?? '') : form.clienteNomeManual}
              disabled={form.clienteId !== ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, clienteNomeManual: event.target.value }))
              }
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue disabled:opacity-60"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Concessionaria</label>
            <select
              value={form.concessionaria}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, concessionaria: event.target.value }))
              }
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
            >
              <option value="">Selecione...</option>
              {concessionarias.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Data de Abertura</label>
            <input
              type="date"
              value={form.dataAbertura}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, dataAbertura: event.target.value }))
              }
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Custo do Servico (R$)</label>
            <input
              value={form.valor}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  valor: event.target.value.replace(/[^0-9.,]/g, ''),
                }))
              }
              placeholder="Ex: 1200,00"
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Cupom de desconto</label>
            <select
              value={form.cupomDescontoPct}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, cupomDescontoPct: event.target.value }))
              }
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
            >
              <option value="0">Sem desconto</option>
              {cupons.map((item) => (
                <option key={item.id} value={String(item.percentual)}>
                  {item.nome} ({item.percentual}%)
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-emerald-200/80">Valor final</div>
            <div className="mt-1 text-xl font-semibold text-emerald-100">
              {formatCurrencyBRL(valorFinal)}
            </div>
          </div>
        </div>

        {isTechnicalType(form.tipo) && (
          <Card className="border-white/10 bg-slate-950/30">
            <CardHeader>
              <CardTitle>Dados Tecnicos do Servico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                  Endereco da Obra
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      enderecoObra: normalizeAddressFromCustomer(selectedCustomer),
                    }))
                  }
                >
                  Usar endereco do cliente
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  value={form.enderecoObra.cep}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      enderecoObra: {
                        ...prev.enderecoObra,
                        cep: maskCep(event.target.value),
                      },
                    }))
                  }
                  onBlur={() =>
                    void fillAddressFromCep(form.enderecoObra.cep, (endereco) =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoObra: {
                          ...prev.enderecoObra,
                          cep: maskCep(endereco.cep),
                          logradouro: endereco.logradouro || prev.enderecoObra.logradouro,
                          complemento: prev.enderecoObra.complemento || endereco.complemento,
                          bairro: endereco.bairro || prev.enderecoObra.bairro,
                          cidade: endereco.cidade || prev.enderecoObra.cidade,
                          estado: endereco.estado || prev.enderecoObra.estado,
                        },
                      })),
                    )
                  }
                  placeholder="CEP"
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
                <input
                  value={form.enderecoObra.numero}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      enderecoObra: { ...prev.enderecoObra, numero: event.target.value },
                    }))
                  }
                  placeholder="Numero"
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
                <input
                  value={form.enderecoObra.logradouro}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      enderecoObra: { ...prev.enderecoObra, logradouro: event.target.value },
                    }))
                  }
                  placeholder="Logradouro"
                  className="md:col-span-2 w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
                <input
                  value={form.enderecoObra.complemento}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      enderecoObra: { ...prev.enderecoObra, complemento: event.target.value },
                    }))
                  }
                  placeholder="Complemento"
                  className="md:col-span-2 w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
                <input
                  value={form.enderecoObra.bairro}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      enderecoObra: { ...prev.enderecoObra, bairro: event.target.value },
                    }))
                  }
                  placeholder="Bairro"
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
                <input
                  value={form.enderecoObra.cidade}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      enderecoObra: { ...prev.enderecoObra, cidade: event.target.value },
                    }))
                  }
                  placeholder="Cidade"
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
                <input
                  maxLength={2}
                  value={form.enderecoObra.estado}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      enderecoObra: {
                        ...prev.enderecoObra,
                        estado: event.target.value.toUpperCase(),
                      },
                    }))
                  }
                  placeholder="UF"
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Tensao de Fornecimento
                  </label>
                  <select
                    value={form.tensaoFornecimento}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        tensaoFornecimento: event.target.value as ServicoForm['tensaoFornecimento'],
                      }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  >
                    <option value="">Selecione...</option>
                    <option value="127/220V">127/220V</option>
                    <option value="380/220V">380/220V</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Latitude</label>
                  <input
                    value={form.latitude}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        latitude: maskLatitude(event.target.value),
                      }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Longitude</label>
                  <input
                    value={form.longitude}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        longitude: maskLongitude(event.target.value),
                      }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Padrao a mais de 30m</label>
                  <select
                    value={form.padraoMaisDe30m}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        padraoMaisDe30m: event.target.value as 'nao' | 'sim',
                      }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  >
                    <option value="nao">Nao</option>
                    <option value="sim">Sim</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Ponto de Referencia</label>
                  <input
                    value={form.pontoReferencia}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, pontoReferencia: event.target.value }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                    Quantitativos / Disjuntores
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        padraoEntradaItens: [...prev.padraoEntradaItens, buildPadraoItem()],
                      }))
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar linha
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-slate-950/50">
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-4 py-3">Tipo de Ligacao</th>
                        <th className="px-4 py-3">Classificacao</th>
                        <th className="px-4 py-3">Quantidade</th>
                        <th className="px-4 py-3">Disjuntor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {form.padraoEntradaItens.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <select
                              value={item.tipoLigacao}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  padraoEntradaItens: prev.padraoEntradaItens.map((line) =>
                                    line.id === item.id
                                      ? { ...line, tipoLigacao: event.target.value }
                                      : line,
                                  ),
                                }))
                              }
                              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                            >
                              {tipoLigacaoOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.classificacao}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  padraoEntradaItens: prev.padraoEntradaItens.map((line) =>
                                    line.id === item.id
                                      ? { ...line, classificacao: event.target.value }
                                      : line,
                                  ),
                                }))
                              }
                              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                            >
                              {classificacaoOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={item.quantidade}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  padraoEntradaItens: prev.padraoEntradaItens.map((line) =>
                                    line.id === item.id
                                      ? {
                                          ...line,
                                          quantidade: maskNumeric(event.target.value, 4),
                                        }
                                      : line,
                                  ),
                                }))
                              }
                              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={item.disjuntor}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  padraoEntradaItens: prev.padraoEntradaItens.map((line) =>
                                    line.id === item.id
                                      ? { ...line, disjuntor: event.target.value }
                                      : line,
                                  ),
                                }))
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
            </CardContent>
          </Card>
        )}

        {canUseRateioType(form.tipo) && (
          <Card className="border-white/10 bg-slate-950/30">
            <CardHeader>
              <CardTitle>Compartilhamento de Credito</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">UC Geradora</label>
                  <input
                    value={form.ucGeradora}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        ucGeradora: maskNumeric(event.target.value, 20),
                      }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoGeradora: normalizeAddressFromCustomer(selectedCustomer),
                      }))
                    }
                  >
                    Usar endereco do cliente
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  value={form.enderecoGeradora.cep}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      enderecoGeradora: {
                        ...prev.enderecoGeradora,
                        cep: maskCep(event.target.value),
                      },
                    }))
                  }
                  onBlur={() =>
                    void fillAddressFromCep(form.enderecoGeradora.cep, (endereco) =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoGeradora: {
                          ...prev.enderecoGeradora,
                          cep: maskCep(endereco.cep),
                          logradouro: endereco.logradouro || prev.enderecoGeradora.logradouro,
                          complemento: prev.enderecoGeradora.complemento || endereco.complemento,
                          bairro: endereco.bairro || prev.enderecoGeradora.bairro,
                          cidade: endereco.cidade || prev.enderecoGeradora.cidade,
                          estado: endereco.estado || prev.enderecoGeradora.estado,
                        },
                      })),
                    )
                  }
                  placeholder="CEP"
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
                <input
                  value={form.enderecoGeradora.numero}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      enderecoGeradora: {
                        ...prev.enderecoGeradora,
                        numero: event.target.value,
                      },
                    }))
                  }
                  placeholder="Numero"
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
                <input
                  value={form.enderecoGeradora.logradouro}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      enderecoGeradora: {
                        ...prev.enderecoGeradora,
                        logradouro: event.target.value,
                      },
                    }))
                  }
                  placeholder="Logradouro"
                  className="md:col-span-2 w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
                <input
                  value={form.enderecoGeradora.bairro}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      enderecoGeradora: {
                        ...prev.enderecoGeradora,
                        bairro: event.target.value,
                      },
                    }))
                  }
                  placeholder="Bairro"
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
                <input
                  value={form.enderecoGeradora.cidade}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      enderecoGeradora: {
                        ...prev.enderecoGeradora,
                        cidade: event.target.value,
                      },
                    }))
                  }
                  placeholder="Cidade"
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
                <input
                  maxLength={2}
                  value={form.enderecoGeradora.estado}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      enderecoGeradora: {
                        ...prev.enderecoGeradora,
                        estado: event.target.value.toUpperCase(),
                      },
                    }))
                  }
                  placeholder="UF"
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                    Rateio das Beneficiarias
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        rateios: [...prev.rateios, buildRateio()],
                      }))
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar beneficiaria
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-slate-950/50">
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-4 py-3">UC</th>
                        <th className="px-4 py-3">Endereco</th>
                        <th className="px-4 py-3">Classificacao</th>
                        <th className="px-4 py-3">Porcentagem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {form.rateios.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <input
                              value={item.uc}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  rateios: prev.rateios.map((row) =>
                                    row.id === item.id
                                      ? { ...row, uc: maskNumeric(event.target.value, 20) }
                                      : row,
                                  ),
                                }))
                              }
                              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={item.endereco}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  rateios: prev.rateios.map((row) =>
                                    row.id === item.id
                                      ? { ...row, endereco: event.target.value }
                                      : row,
                                  ),
                                }))
                              }
                              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.classe}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  rateios: prev.rateios.map((row) =>
                                    row.id === item.id
                                      ? { ...row, classe: event.target.value }
                                      : row,
                                  ),
                                }))
                              }
                              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                            >
                              {classificacaoOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={item.percentual}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  rateios: prev.rateios.map((row) =>
                                    row.id === item.id
                                      ? {
                                          ...row,
                                          percentual: maskNumeric(event.target.value, 3),
                                        }
                                      : row,
                                  ),
                                }))
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
            </CardContent>
          </Card>
        )}

        <div>
          <label className="mb-2 block text-sm text-slate-300">Observacoes / Comentarios</label>
          <textarea
            value={form.observacoes}
            rows={4}
            onChange={(event) => setForm((prev) => ({ ...prev, observacoes: event.target.value }))}
            className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
          />
        </div>
        <Card className="border-white/10 bg-slate-950/30">
          <CardHeader>
            <CardTitle>Uploads</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {documentCategories.map((item) => (
              <label
                key={item.key}
                className="cursor-pointer rounded-xl border border-dashed border-white/20 bg-slate-900/40 px-4 py-5 text-center hover:border-cyan-300/50"
              >
                <div className="text-sm font-medium text-slate-100">{item.label}</div>
                <div className="mt-2 text-xs text-slate-400">
                  {(uploadedFiles[item.key] ?? []).length > 0
                    ? `${(uploadedFiles[item.key] ?? []).length} arquivo(s) selecionado(s)`
                    : item.maxFiles
                      ? `Selecionar ate ${item.maxFiles} arquivos`
                      : 'Selecionar arquivo'}
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple={Boolean(item.maxFiles && item.maxFiles > 1)}
                  onChange={(event) => onFilesChange(item.key, event.target.files)}
                />
              </label>
            ))}
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            <FloppyDisk className="mr-2 h-4 w-4" />
            {editingId ? 'Salvar servico' : 'Criar servico'}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
);
