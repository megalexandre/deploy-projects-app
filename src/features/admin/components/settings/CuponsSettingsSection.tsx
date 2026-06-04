import { Button } from '@/shared/components/Button';
import type { User } from '@/features/admin/services/usersService';
import type { ConfiguracoesSistema, CupomDesconto } from '@/types';
import { Plus } from '@phosphor-icons/react';

type CupomListKey = 'cuponsDescontoProjetos' | 'cuponsDescontoServicos';

interface CuponsSettingsSectionProps {
  formData: ConfiguracoesSistema;
  onCupomChange: (
    listKey: CupomListKey,
    id: string,
    field: 'nome' | 'percentual' | 'ativo' | 'usuariosAutorizados',
    value: string | boolean | string[],
  ) => void;
  onAdicionarCupom: (listKey: CupomListKey) => void;
  usuarios: User[];
}

interface CouponListProps {
  title: string;
  description: string;
  listKey: CupomListKey;
  cupons: CupomDesconto[];
  usuarios: User[];
  onCupomChange: CuponsSettingsSectionProps['onCupomChange'];
  onAdicionarCupom: CuponsSettingsSectionProps['onAdicionarCupom'];
}

const inputClassName =
  'w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30';

const labelClassName = 'mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400';

const CouponList: React.FC<CouponListProps> = ({
  title,
  description,
  listKey,
  cupons,
  usuarios,
  onCupomChange,
  onAdicionarCupom,
}) => (
  <section className="space-y-4 rounded-lg border border-slate-700 bg-slate-950/20 p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h4 className="text-base font-semibold text-slate-100">{title}</h4>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">{description}</p>
      </div>
      <Button type="button" variant="outline" onClick={() => onAdicionarCupom(listKey)}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Cupom
      </Button>
    </div>

    <div className="space-y-4">
      {cupons.map((item) => {
        const selecionados = item.usuariosAutorizados ?? [];

        return (
          <section key={item.id} className="rounded-lg border border-slate-700 bg-slate-900/45 p-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(220px,1.2fr)_160px_minmax(320px,2fr)_180px]">
              <div>
                <label className={labelClassName}>Nome</label>
                <input
                  value={item.nome}
                  onChange={(event) => onCupomChange(listKey, item.id, 'nome', event.target.value)}
                  placeholder="Ex: Cupom 10%"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Percentual</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.percentual}
                    onChange={(event) =>
                      onCupomChange(listKey, item.id, 'percentual', event.target.value)
                    }
                    className={`${inputClassName} pr-9`}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
                    %
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className={labelClassName.replace('mb-2 ', '')}>Usuarios autorizados</span>
                  <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">
                    {selecionados.length} selecionado(s)
                  </span>
                </div>

                <div className="rounded-md border border-slate-700 bg-slate-950/35 p-3">
                  {usuarios.length === 0 ? (
                    <p className="text-sm text-slate-400">Nenhum usuario carregado.</p>
                  ) : (
                    <div className="grid max-h-32 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                      {usuarios.map((usuario) => {
                        const checked = selecionados.includes(usuario.id);
                        return (
                          <label
                            key={usuario.id}
                            className="flex min-h-8 items-center gap-2 rounded-md px-2 text-sm text-slate-300 transition hover:bg-slate-800/70"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => {
                                const next = event.target.checked
                                  ? [...selecionados, usuario.id]
                                  : selecionados.filter((id) => id !== usuario.id);
                                onCupomChange(listKey, item.id, 'usuariosAutorizados', next);
                              }}
                              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="truncate">{usuario.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={labelClassName}>Ativo</label>
                <label className="flex h-10 items-center justify-between gap-3 rounded-md border border-slate-700 bg-slate-950/35 px-3 text-sm text-slate-300">
                  <span>{item.ativo ? 'Exibindo' : 'Oculto'}</span>
                  <input
                    type="checkbox"
                    checked={item.ativo}
                    onChange={(event) =>
                      onCupomChange(listKey, item.id, 'ativo', event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  </section>
);

export const CuponsSettingsSection: React.FC<CuponsSettingsSectionProps> = ({
  formData,
  onCupomChange,
  onAdicionarCupom,
  usuarios,
}) => (
  <div className="space-y-5 page-enter">
    <div>
      <h3 className="text-lg font-semibold text-slate-100">Cupons de Desconto</h3>
      <p className="mt-1 max-w-2xl text-sm text-slate-400">
        Separe descontos por fluxo e marque exatamente quais usuarios podem usa-los.
      </p>
    </div>

    <CouponList
      title="Projetos"
      description="Disponiveis no passo de custo da criacao de projeto."
      listKey="cuponsDescontoProjetos"
      cupons={formData.cuponsDescontoProjetos}
      usuarios={usuarios}
      onCupomChange={onCupomChange}
      onAdicionarCupom={onAdicionarCupom}
    />

    <CouponList
      title="Servicos"
      description="Disponiveis na criacao e edicao de servicos."
      listKey="cuponsDescontoServicos"
      cupons={formData.cuponsDescontoServicos}
      usuarios={usuarios}
      onCupomChange={onCupomChange}
      onAdicionarCupom={onAdicionarCupom}
    />
  </div>
);
