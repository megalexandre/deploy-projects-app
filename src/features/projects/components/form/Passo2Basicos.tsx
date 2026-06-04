import React from 'react';
import { Calendar } from '@phosphor-icons/react';
import { maskCep, maskNumeric } from '@/core/utils/masks';
import { ConcessionaireSelect } from '@/features/concessionaries/components/ConcessionaireSelect';
import type {
  DadosBasicosForm,
  DadosDetalhesForm,
  EnderecoForm,
  ModoEnderecoProjeto,
  Passo,
} from '@/features/projects/domain/types';
import { tiposProjeto } from '@/features/projects/hooks/useNovoProjeto';
import type { Concessionaire } from '@/services';
import { Button } from '@/shared/components/Button';
import type { User } from '@/types';
import { CoordenadasFields } from './CoordenadasFields';
import { EnderecoFields } from './EnderecoFields';
import { FormField } from './FormField';
import { inputCls, selectCls } from './fieldCls';
import { SelectionCard } from './SelectionCard';

interface Passo2BasicosProps {
  dadosBasicos: DadosBasicosForm;
  setDadosBasicos: React.Dispatch<React.SetStateAction<DadosBasicosForm>>;
  concessionarias: Concessionaire[];
  concessionariasLoading: boolean;
  currentUser: User | null | undefined;
  modoEnderecoProjeto: ModoEnderecoProjeto;
  setModoEnderecoProjeto: (v: ModoEnderecoProjeto) => void;
  enderecoClienteProjeto: EnderecoForm;
  enderecoClienteDisponivel: boolean;
  enderecoProjeto: EnderecoForm;
  setEnderecoProjeto: React.Dispatch<React.SetStateAction<EnderecoForm>>;
  detalhesProjeto: DadosDetalhesForm;
  setDetalhesProjeto: React.Dispatch<React.SetStateAction<DadosDetalhesForm>>;
  fillAddressFromCep: (
    cep: string,
    callback: (endereco: Omit<EnderecoForm, 'numero'>) => void,
  ) => Promise<void>;
  validarPasso2: () => boolean;
  setPassoAtual: (p: Passo) => void;
  setErro: (e: string | null) => void;
}

export const Passo2Basicos: React.FC<Passo2BasicosProps> = ({
  dadosBasicos,
  setDadosBasicos,
  concessionarias,
  concessionariasLoading,
  currentUser,
  modoEnderecoProjeto,
  setModoEnderecoProjeto,
  enderecoClienteProjeto,
  enderecoClienteDisponivel,
  enderecoProjeto,
  setEnderecoProjeto,
  detalhesProjeto,
  setDetalhesProjeto,
  fillAddressFromCep,
  validarPasso2,
  setPassoAtual,
  setErro,
}) => {
  const setEnderecoProjetoField = (field: keyof EnderecoForm, value: string) =>
    setEnderecoProjeto((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6 page-enter">
      <h2 className="text-2xl font-bold text-gray-100">Informações Básicas do Projeto</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FormField label="Data de Abertura">
            <div className="relative">
              <input
                type="date"
                value={dadosBasicos.dataAbertura}
                onChange={(e) =>
                  setDadosBasicos((prev) => ({ ...prev, dataAbertura: e.target.value }))
                }
                className={`${inputCls} pr-10`}
              />
              <Calendar className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </FormField>
        </div>

        <div>
          <FormField label="Concessionária">
            <ConcessionaireSelect
              value={dadosBasicos.concessionaria}
              onChange={(value) => setDadosBasicos((prev) => ({ ...prev, concessionaria: value }))}
              concessionarias={concessionarias}
              loading={concessionariasLoading}
              isAdmin={currentUser?.isAdmin}
              className={selectCls}
            />
          </FormField>
        </div>

        <div>
          <FormField label="Numero da UC">
            <input
              value={dadosBasicos.numeroUc}
              onChange={(e) =>
                setDadosBasicos((prev) => ({ ...prev, numeroUc: maskNumeric(e.target.value, 20) }))
              }
              inputMode="numeric"
              className={inputCls}
            />
          </FormField>
        </div>

        <div>
          <FormField label="Tipo de Projeto">
            <div className="grid grid-cols-2 gap-3">
              {tiposProjeto.map((tipo) => (
                <SelectionCard
                  key={tipo.value}
                  active={dadosBasicos.tipoProjeto === tipo.value}
                  onClick={() => setDadosBasicos((prev) => ({ ...prev, tipoProjeto: tipo.value }))}
                  title={tipo.label}
                />
              ))}
            </div>
          </FormField>
        </div>

        <div className="md:col-span-2 rounded-lg border border-gray-700 p-4 space-y-4">
          <h3 className="text-lg font-semibold text-gray-100">Endereço do projeto</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SelectionCard
              active={modoEnderecoProjeto === 'cliente'}
              onClick={() => setModoEnderecoProjeto('cliente')}
              title="Usar endereco do cliente"
              description="Reaproveita o endereco cadastrado no cliente."
            />
            <SelectionCard
              active={modoEnderecoProjeto === 'novo'}
              onClick={() => setModoEnderecoProjeto('novo')}
              title="Cadastrar novo endereço"
              description="Informar um endereço diferente para este projeto."
            />
          </div>

          {modoEnderecoProjeto === 'cliente' && (
            <div className="space-y-3">
              {!enderecoClienteDisponivel && (
                <p className="rounded border border-yellow-700 bg-yellow-900/20 px-3 py-3 text-sm text-yellow-200">
                  O cliente selecionado nao possui endereço completo cadastrado. Escolha
                  &quot;Cadastrar novo endereço&quot; para continuar.
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EnderecoFields endereco={enderecoClienteProjeto} onChange={() => {}} readOnly />
                <CoordenadasFields
                  coordenadas={detalhesProjeto.coordenadas}
                  linkMapa={detalhesProjeto.linkMapa}
                  setDetalhesProjeto={setDetalhesProjeto}
                />
              </div>
            </div>
          )}

          {modoEnderecoProjeto === 'novo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EnderecoFields
                endereco={enderecoProjeto}
                onChange={setEnderecoProjetoField}
                onCepBlur={() =>
                  void fillAddressFromCep(enderecoProjeto.cep, (endereco) =>
                    setEnderecoProjeto((prev) => ({
                      ...prev,
                      cep: maskCep(endereco.cep),
                      logradouro: endereco.logradouro || prev.logradouro,
                      complemento: prev.complemento || endereco.complemento,
                      bairro: endereco.bairro || prev.bairro,
                      cidade: endereco.cidade || prev.cidade,
                      estado: endereco.estado || prev.estado,
                    })),
                  )
                }
              />
              <CoordenadasFields
                coordenadas={detalhesProjeto.coordenadas}
                linkMapa={detalhesProjeto.linkMapa}
                setDetalhesProjeto={setDetalhesProjeto}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setPassoAtual(1)}>
          Voltar
        </Button>
        <Button
          onClick={() => {
            if (!validarPasso2()) {
              setErro('Preencha os campos obrigatorios para avancar ao Passo 3.');
              return;
            }
            setErro(null);
            setPassoAtual(3);
          }}
        >
          Proximo Passo
        </Button>
      </div>
    </div>
  );
};
