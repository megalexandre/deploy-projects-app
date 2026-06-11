import React from 'react';
import { PlusCircle } from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import type { ClienteForm, TipoDocumento } from '../hooks/useClientes';
import { maskCep, maskCnpj, maskCpf, maskPhoneBR } from '@/core/utils/masks';

type Props = {
  form: ClienteForm;
  tipoDocumento: TipoDocumento;
  editingCustomerId: string | null;
  saving: boolean;
  onTipoDocumentoChange: (value: TipoDocumento) => void;
  onFormChange: (updater: (prev: ClienteForm) => ClienteForm) => void;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
  onCepBlur: () => void;
};

export const CustomerFormModal: React.FC<Props> = ({
  form,
  tipoDocumento,
  editingCustomerId,
  saving,
  onTipoDocumentoChange,
  onFormChange,
  onSubmit,
  onClose,
  onCepBlur,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
    <Card className="w-full max-w-[860px]">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>{editingCustomerId ? 'Editar Cliente' : 'Novo Cliente'}</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={onSubmit} className="space-y-2.5">
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm text-slate-300">Nome Completo</label>
              <input
                value={form.nome}
                onChange={(event) =>
                  onFormChange((prev) => ({ ...prev, nome: event.target.value }))
                }
                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Documento</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={tipoDocumento}
                  onChange={(event) => {
                    const novoTipo = event.target.value as TipoDocumento;
                    onTipoDocumentoChange(novoTipo);
                    onFormChange((prev) => ({ ...prev, cpfCnpj: '' }));
                  }}
                  className="rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                </select>
                <input
                  value={form.cpfCnpj}
                  onChange={(event) =>
                    onFormChange((prev) => ({
                      ...prev,
                      cpfCnpj:
                        tipoDocumento === 'cpf'
                          ? maskCpf(event.target.value)
                          : maskCnpj(event.target.value),
                    }))
                  }
                  className="col-span-2 rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Telefone</label>
              <input
                value={form.telefone}
                onChange={(event) =>
                  onFormChange((prev) => ({
                    ...prev,
                    telefone: maskPhoneBR(event.target.value),
                  }))
                }
                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm text-slate-300">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  onFormChange((prev) => ({ ...prev, email: event.target.value }))
                }
                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
              />
            </div>
          </div>

          <div className="border-t border-white/10 pt-2.5">
            <h3 className="mb-1.5 text-base font-semibold text-slate-100">Endereço</h3>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-slate-300">CEP</label>
                <input
                  value={form.endereco.cep}
                  onChange={(event) =>
                    onFormChange((prev) => ({
                      ...prev,
                      endereco: { ...prev.endereco, cep: maskCep(event.target.value) },
                    }))
                  }
                  onBlur={onCepBlur}
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Número</label>
                <input
                  value={form.endereco.numero}
                  onChange={(event) =>
                    onFormChange((prev) => ({
                      ...prev,
                      endereco: { ...prev.endereco, numero: event.target.value },
                    }))
                  }
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-slate-300">Logradouro</label>
                <input
                  value={form.endereco.logradouro}
                  onChange={(event) =>
                    onFormChange((prev) => ({
                      ...prev,
                      endereco: { ...prev.endereco, logradouro: event.target.value },
                    }))
                  }
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-slate-300">Complemento</label>
                <input
                  value={form.endereco.complemento}
                  onChange={(event) =>
                    onFormChange((prev) => ({
                      ...prev,
                      endereco: { ...prev.endereco, complemento: event.target.value },
                    }))
                  }
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Bairro</label>
                <input
                  value={form.endereco.bairro}
                  onChange={(event) =>
                    onFormChange((prev) => ({
                      ...prev,
                      endereco: { ...prev.endereco, bairro: event.target.value },
                    }))
                  }
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Cidade</label>
                <input
                  value={form.endereco.cidade}
                  onChange={(event) =>
                    onFormChange((prev) => ({
                      ...prev,
                      endereco: { ...prev.endereco, cidade: event.target.value },
                    }))
                  }
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">UF</label>
                <input
                  maxLength={2}
                  value={form.endereco.estado}
                  onChange={(event) =>
                    onFormChange((prev) => ({
                      ...prev,
                      endereco: { ...prev.endereco, estado: event.target.value.toUpperCase() },
                    }))
                  }
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {editingCustomerId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
);
