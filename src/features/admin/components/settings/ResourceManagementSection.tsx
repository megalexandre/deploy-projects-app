import { useEffect, useMemo, useState } from 'react';
import { addressService, type Address } from '@/shared/api/addressService';
import { customersService } from '@/features/clientes/services/customersService';
import { projectsService } from '@/features/projects/services/projectsService';
import { getAllPages } from '@/shared/api/pagination';
import { priceTablesService, type PriceTableResponse } from '../../services/priceTablesService';
import { loadConfiguracoesSistema, saveConfiguracoesSistema } from '@/utils/configuracoesSistema';
import { ConfirmActionButton } from '@/shared/components/ConfirmActionButton';
import { Pagination } from '@/shared/components/Pagination';
import { Input } from '@/shared/components/Input';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { Button } from '@/shared/components/Button';

export function ResourceManagementSection({
  onTablesChanged,
}: {
  onTablesChanged: () => Promise<unknown>;
}) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [tables, setTables] = useState<PriceTableResponse[]>([]);
  const [linked, setLinked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [addressPage, setAddressPage] = useState(1);
  const [tablePage, setTablePage] = useState(1);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    void Promise.all([
      addressService.list(),
      priceTablesService.getAll(),
      customersService.getAll(),
      projectsService.getAll({ includeProjectAddresses: false }),
      getAllPages<{ construction_address_id?: string; generating_address_id?: string }>(
        '/services',
      ),
    ])
      .then(([addressData, tableData, customers, projects, services]) => {
        if (!active) return;
        setAddresses(addressData);
        setTables(tableData);
        setLinked(
          new Set(
            [
              ...customers.map((item) => item.addressId),
              ...projects.map((item) => item.addressId),
              ...services.flatMap((item) => [
                item.construction_address_id,
                item.generating_address_id,
              ]),
            ].filter((id): id is string => !!id),
          ),
        );
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : 'Não foi possível carregar os cadastros.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [version]);
  const filtered = useMemo(
    () =>
      addresses.filter((item) =>
        `${item.address} ${item.number} ${item.city} ${item.state} ${item.cep}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [addresses, search],
  );
  const page = Math.min(addressPage, Math.max(1, Math.ceil(filtered.length / 20)));
  const currentTablePage = Math.min(tablePage, Math.max(1, Math.ceil(tables.length / 20)));
  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <div role="alert" className="space-y-3 text-red-300">
        <p>{error}</p>
        <Button
          onClick={() => {
            setLoading(true);
            setError(null);
            setVersion((value) => value + 1);
          }}
        >
          Tentar novamente
        </Button>
      </div>
    );
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">
          Tabelas de preço cadastradas ({tables.length})
        </h2>
        <p className="text-sm text-slate-400">
          Exclui a tabela inteira, incluindo suas faixas ou cupons. A edição continua nas abas
          Preços e Cupons.
        </p>
        {tables.length === 0 && (
          <p className="text-sm text-slate-400">Nenhuma tabela cadastrada.</p>
        )}
        {tables.slice((currentTablePage - 1) * 20, currentTablePage * 20).map((table) => (
          <div
            key={table.id}
            className="flex items-center justify-between gap-3 rounded border border-white/10 p-3 text-slate-300"
          >
            <span>
              {table.name} · {table.values.length} itens
            </span>
            <ConfirmActionButton
              label="Excluir tabela"
              description={`Excluir definitivamente a tabela "${table.name}" e todos os seus itens?`}
              onConfirm={async () => {
                await priceTablesService.remove(table.id);
                const config = loadConfiguracoesSistema();
                const key = {
                  fotovoltaico: 'tabelaPrecoFotovoltaico',
                  padrao_entrada: 'tabelaPrecoPadraoEntrada',
                  cupom_projeto: 'cuponsDescontoProjetos',
                  cupom_servico: 'cuponsDescontoServicos',
                } as const;
                if (!tables.some((item) => item.id !== table.id && item.kind === table.kind)) {
                  saveConfiguracoesSistema({ ...config, [key[table.kind]]: [] });
                }
                setTables((items) => items.filter((item) => item.id !== table.id));
                await onTablesChanged();
              }}
            />
          </div>
        ))}
        <Pagination
          page={currentTablePage}
          pageSize={20}
          total={tables.length}
          onChange={setTablePage}
        />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">Endereços ({addresses.length})</h2>
        <p className="text-sm text-slate-400">
          A exclusão está disponível para endereços sem vínculo com clientes, projetos ou serviços.
        </p>
        <Input
          aria-label="Buscar endereços"
          placeholder="Buscar endereço, cidade ou CEP..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setAddressPage(1);
          }}
        />
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400">Nenhum endereço encontrado.</p>
        )}
        {filtered.slice((page - 1) * 20, page * 20).map((address) => (
          <div
            key={address.id}
            className="flex items-center justify-between gap-3 rounded border border-white/10 p-3 text-slate-300"
          >
            <span>
              {address.address || address.place}, {address.number} · {address.city}/{address.state}{' '}
              · {address.cep}
            </span>
            {linked.has(address.id) ? (
              <span className="text-xs text-slate-400">Vinculado</span>
            ) : (
              <ConfirmActionButton
                label="Excluir endereço"
                description="Excluir definitivamente este endereço? Endereços vinculados a outros cadastros não podem ser excluídos."
                onConfirm={async () => {
                  await addressService.remove(address.id);
                  setAddresses((items) => items.filter((item) => item.id !== address.id));
                }}
              />
            )}
          </div>
        ))}
        <Pagination page={page} pageSize={20} total={filtered.length} onChange={setAddressPage} />
      </section>
    </div>
  );
}
