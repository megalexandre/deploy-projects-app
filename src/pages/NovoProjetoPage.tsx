/** Pagina 'NovoProjetoPage': orquestra estado da tela, eventos do usuario e renderizacao dos componentes. */
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, MagnifyingGlass, UploadSimple, Plus } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ApiError, customersService, projectsService, type CreateProjectData } from '../services';
import { maskCep, maskCnpj, maskCpf, maskCurrencyBRL, maskNumeric, maskPhoneBR, onlyDigits } from '../utils/masks';

type Passo = 1 | 2 | 3;
type TipoDocumento = 'cpf' | 'cnpj';
type ModoCliente = 'novo' | 'existente';

interface DadosBasicosForm {
  dataAbertura: string;
  concessionaria: string;
  numeroUc: string;
  enderecoCompleto: string;
  tipoServico: string;
  integrador: string;
}

interface ClienteForm {
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
}

interface ClienteResumo {
  id: string;
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
}

interface DadosDetalhesForm {
  modalidadeGeracao: 'autoconsumo' | 'geracao_compartilhada';
  projetoFastTrack: 'sim' | 'nao';
  coordenadas: string;
  custoProjeto: string;
}

interface ItemEquipamentoForm {
  id: string;
  quantidade: string;
  potencia: string;
  marca: string;
  modelo: string;
}

const concessionarias = ['Selecione...', 'Enel', 'CPFL', 'Energisa', 'Neoenergia'];
const integradores = ['Selecione...', 'OPJ Engenharia', 'Parceiro Externo'];

const documentosTemplate = [
  { key: 'fatura_energia', label: 'Fatura de Energia' },
  { key: 'procuracao', label: 'Procuracao' },
  { key: 'documento_titular', label: 'Documento Titular' },
  { key: 'foto_padrao', label: 'Foto Padrao' },
  { key: 'foto_disjuntor', label: 'Foto Disjuntor' },
  { key: 'foto_interconexao', label: 'Foto Interconexao' },
  { key: 'outros_1', label: 'Outros 1' },
  { key: 'outros_2', label: 'Outros 2' },
  { key: 'outros_3', label: 'Outros 3' }
];

const buildItemVazio = (): ItemEquipamentoForm => ({
  id: crypto.randomUUID(),
  quantidade: '',
  potencia: '',
  marca: '',
  modelo: ''
});

const dataAtualIso = new Date().toISOString().split('T')[0];
const parseCurrencyToNumber = (value: string): number => {
  if (!value.trim()) {
    return 0;
  }

  const normalized = value.replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const NovoProjetoPage: React.FC = () => {
  const navigate = useNavigate();
  const [passoAtual, setPassoAtual] = useState<Passo>(1);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('cpf');
  const [modoCliente, setModoCliente] = useState<ModoCliente | null>(null);
  const [clientes, setClientes] = useState<ClienteResumo[]>([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string | null>(null);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [dadosBasicos, setDadosBasicos] = useState<DadosBasicosForm>({
    dataAbertura: dataAtualIso,
    concessionaria: '',
    numeroUc: '',
    enderecoCompleto: '',
    tipoServico: 'projetos_solares',
    integrador: ''
  });

  const [clienteForm, setClienteForm] = useState<ClienteForm>({
    nome: '',
    cpfCnpj: '',
    telefone: '',
    email: '',
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: ''
    }
  });

  const [detalhesProjeto, setDetalhesProjeto] = useState<DadosDetalhesForm>({
    modalidadeGeracao: 'autoconsumo',
    projetoFastTrack: 'nao',
    coordenadas: '',
    custoProjeto: ''
  });

  const [modulos, setModulos] = useState<ItemEquipamentoForm[]>([buildItemVazio()]);
  const [inversores, setInversores] = useState<ItemEquipamentoForm[]>([buildItemVazio()]);
  const [documentos, setDocumentos] = useState<Record<string, File | null>>(
    documentosTemplate.reduce<Record<string, File | null>>((acc, item) => {
      acc[item.key] = null;
      return acc;
    }, {})
  );

  const potenciaTotalSistemaW = useMemo(
    () =>
      modulos.reduce((total, modulo) => {
        const quantidade = Number(modulo.quantidade) || 0;
        const potencia = Number(modulo.potencia) || 0;
        return total + quantidade * potencia;
      }, 0),
    [modulos]
  );

  const clientesFiltrados = useMemo(() => {
    const query = buscaCliente.trim().toLowerCase();
    if (!query) {
      return clientes;
    }

    return clientes.filter((cliente) => {
      return (
        cliente.nome.toLowerCase().includes(query) ||
        onlyDigits(cliente.cpfCnpj).includes(onlyDigits(query)) ||
        cliente.email.toLowerCase().includes(query) ||
        onlyDigits(cliente.telefone).includes(onlyDigits(query))
      );
    });
  }, [buscaCliente, clientes]);

  const clienteSelecionado = useMemo(
    () => clientes.find((cliente) => cliente.id === clienteSelecionadoId) ?? null,
    [clienteSelecionadoId, clientes]
  );

  useEffect(() => {
    if (modoCliente !== 'existente') {
      return;
    }

    const loadClientes = async () => {
      setClientesLoading(true);
      try {
        const response = await customersService.getAll();
        setClientes(response);
      } catch (loadError) {
        console.error('Erro ao carregar clientes:', loadError);
        setErro('Nao foi possivel carregar os clientes cadastrados.');
      } finally {
        setClientesLoading(false);
      }
    };

    void loadClientes();
  }, [modoCliente]);

  const handleModuloChange = (id: string, field: keyof ItemEquipamentoForm, value: string) => {
    setModulos((prev) =>
      prev.map((modulo) => (modulo.id === id ? { ...modulo, [field]: value } : modulo))
    );
  };

  const handleInversorChange = (id: string, field: keyof ItemEquipamentoForm, value: string) => {
    setInversores((prev) =>
      prev.map((inversor) => (inversor.id === id ? { ...inversor, [field]: value } : inversor))
    );
  };

  const validarPasso1 = () => {
    if (!modoCliente) {
      return false;
    }

    if (modoCliente === 'existente') {
      return Boolean(clienteSelecionadoId);
    }

    const documentoLimpo = onlyDigits(clienteForm.cpfCnpj);
    const tamanhoDocumentoValido = tipoDocumento === 'cpf' ? 11 : 14;
    const telefoneValido = onlyDigits(clienteForm.telefone).length >= 10;
    const nomeValido = clienteForm.nome.trim().length >= 2;
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteForm.email.trim());
    const enderecoValido =
      onlyDigits(clienteForm.endereco.cep).length === 8 &&
      clienteForm.endereco.logradouro.trim().length >= 3 &&
      clienteForm.endereco.numero.trim().length >= 1 &&
      clienteForm.endereco.bairro.trim().length >= 2 &&
      clienteForm.endereco.cidade.trim().length >= 2 &&
      clienteForm.endereco.estado.trim().length === 2;

    return nomeValido && emailValido && documentoLimpo.length === tamanhoDocumentoValido && telefoneValido && enderecoValido;
  };

  const validarPasso2 = () => {
    const camposObrigatorios = [
      dadosBasicos.dataAbertura,
      dadosBasicos.concessionaria,
      dadosBasicos.numeroUc,
      dadosBasicos.enderecoCompleto,
      dadosBasicos.integrador
    ];

    return camposObrigatorios.every((campo) => campo.trim() !== '');
  };

  const gerarProtocolo = () => {
    const ano = new Date().getFullYear();
    const sufixo = String(Date.now()).slice(-4);
    return `PROT-${ano}-${sufixo}`;
  };

  const handleCriarProjeto = async () => {
    if (!validarPasso1()) {
      setErro('Preencha todos os campos obrigatorios do Passo 1 antes de criar o projeto.');
      setPassoAtual(1);
      return;
    }

    if (!validarPasso2()) {
      setErro('Preencha os campos obrigatorios do Passo 2 antes de criar o projeto.');
      setPassoAtual(2);
      return;
    }

    if (!modoCliente) {
      setErro('Selecione se o cliente e novo ou ja cadastrado no Passo 1.');
      setPassoAtual(1);
      return;
    }

    const potenciaSistemaKw = Number((potenciaTotalSistemaW / 1000).toFixed(2));
    if (potenciaSistemaKw <= 0) {
      setErro('Informe ao menos um modulo com quantidade e potencia para calcular a potencia do sistema.');
      setPassoAtual(3);
      return;
    }

    setErro(null);
    setSalvando(true);

    try {
      let clienteId = clienteSelecionadoId;
      if (modoCliente === 'novo') {
        const novoCliente = await customersService.create({
          nome: clienteForm.nome.trim(),
          cpfCnpj: onlyDigits(clienteForm.cpfCnpj),
          telefone: onlyDigits(clienteForm.telefone),
          email: clienteForm.email.trim(),
          endereco: {
            cep: onlyDigits(clienteForm.endereco.cep),
            logradouro: clienteForm.endereco.logradouro.trim(),
            numero: clienteForm.endereco.numero.trim(),
            complemento: clienteForm.endereco.complemento.trim(),
            bairro: clienteForm.endereco.bairro.trim(),
            cidade: clienteForm.endereco.cidade.trim(),
            estado: clienteForm.endereco.estado.trim().toUpperCase()
          }
        });
        clienteId = novoCliente.id;
      }

      if (!clienteId) {
        setErro('Selecione um cliente cadastrado para continuar.');
        setPassoAtual(1);
        return;
      }

      const documentoCliente =
        modoCliente === 'novo' ? onlyDigits(clienteForm.cpfCnpj) : onlyDigits(clienteSelecionado?.cpfCnpj ?? '');
      const classe = documentoCliente.length === 14 ? 'Comercial' : 'Residencial';
      const modalidade =
        detalhesProjeto.modalidadeGeracao === 'autoconsumo'
          ? 'Geração Distribuída'
          : 'Geração Compartilhada';
      const enquadramento = potenciaSistemaKw <= 75 ? 'Microgeração' : 'Minigeração';

      const projectData: CreateProjectData = {
        id: crypto.randomUUID(),
        clienteId,
        nomeCliente: modoCliente === 'novo' ? clienteForm.nome.trim() : (clienteSelecionado?.nome ?? ''),
        concessionaria: dadosBasicos.concessionaria,
        protocoloConcessionaria: gerarProtocolo(),
        classe,
        integrator: dadosBasicos.integrador,
        modalidade,
        enquadramento,
        protecaoCC: 'Disjuntor CC 20A',
        potenciaSistema: potenciaSistemaKw,
        status: 'Em Análise',
        valor: parseCurrencyToNumber(detalhesProjeto.custoProjeto)
      };

      console.log('Dados do formulario:', {
        modoCliente,
        concessionaria: dadosBasicos.concessionaria,
        integrador: dadosBasicos.integrador,
        clienteId,
        nomeCliente: modoCliente === 'novo' ? clienteForm.nome : clienteSelecionado?.nome,
        numeroUc: dadosBasicos.numeroUc,
        modalidadeGeracao: detalhesProjeto.modalidadeGeracao,
        projetoFastTrack: detalhesProjeto.projetoFastTrack,
        potenciaSistemaKw
      });
      console.log('Enviando dados para API:', projectData);
      await projectsService.create(projectData);

      navigate('/projetos');
    } catch (creationError) {
      console.error('Erro ao criar projeto:', creationError);
      if (creationError instanceof ApiError) {
        console.error('Detalhes do erro:', creationError.payload);
        if (creationError.status === 401 || creationError.status === 403) {
          setErro('Sua sessao nao esta autorizada para criar projetos. Faca login novamente e tente de novo.');
        } else if (typeof creationError.payload === 'string' && creationError.payload.trim()) {
          setErro(creationError.payload);
        } else {
          setErro(creationError.message || 'Nao foi possivel criar o projeto agora. Tente novamente.');
        }
      } else {
        setErro('Nao foi possivel criar o projeto agora. Tente novamente.');
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card padding="none">
        <div className="border-b border-gray-700 px-6 py-5 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate('/projetos')}
              className="mt-1 text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Voltar para projetos"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-100">Novo Projeto</h1>
              <p className="text-gray-400 text-xl">Passo {passoAtual} de 3</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                passoAtual >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              1
            </div>
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                passoAtual >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              2
            </div>
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                passoAtual >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              3
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {erro && (
            <div className="rounded-md border border-red-700 bg-red-900/20 px-4 py-3 text-red-300">
              {erro}
            </div>
          )}

          {passoAtual === 1 && (
            <div className="space-y-6 page-enter">
              <h2 className="text-2xl font-bold text-gray-100">Cliente do Projeto</h2>

              <div className="rounded-lg border border-gray-700 p-4 space-y-4">
                <h3 className="text-lg font-semibold text-gray-100">Tipo de cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModoCliente('novo');
                      setClienteSelecionadoId(null);
                      setBuscaCliente('');
                      setErro(null);
                    }}
                    className={`rounded border px-4 py-4 text-left transition-colors ${
                      modoCliente === 'novo'
                        ? 'border-blue-500 bg-blue-900/25 text-blue-100'
                        : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500'
                    }`}
                  >
                    <p className="text-base font-semibold">Novo cliente</p>
                    <p className="text-sm opacity-80">Cadastrar cliente e criar projeto em seguida.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModoCliente('existente');
                      setErro(null);
                    }}
                    className={`rounded border px-4 py-4 text-left transition-colors ${
                      modoCliente === 'existente'
                        ? 'border-blue-500 bg-blue-900/25 text-blue-100'
                        : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500'
                    }`}
                  >
                    <p className="text-base font-semibold">Cliente ja cadastrado</p>
                    <p className="text-sm opacity-80">Selecionar um cliente existente da base.</p>
                  </button>
                </div>
              </div>

              {modoCliente === 'novo' && (
                <div className="rounded-lg border border-gray-700 p-4 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-100">Dados do novo cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-300 mb-2">Nome Completo</label>
                      <input
                        value={clienteForm.nome}
                        onChange={(e) => setClienteForm((prev) => ({ ...prev, nome: e.target.value }))}
                        className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Documento</label>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={tipoDocumento}
                          onChange={(e) => {
                            const novoTipo = e.target.value as TipoDocumento;
                            setTipoDocumento(novoTipo);
                            setClienteForm((prev) => ({ ...prev, cpfCnpj: '' }));
                          }}
                          className="col-span-1 rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        >
                          <option value="cpf">CPF</option>
                          <option value="cnpj">CNPJ</option>
                        </select>
                        <input
                          value={clienteForm.cpfCnpj}
                          onChange={(e) =>
                            setClienteForm((prev) => ({
                              ...prev,
                              cpfCnpj: tipoDocumento === 'cpf' ? maskCpf(e.target.value) : maskCnpj(e.target.value)
                            }))
                          }
                          placeholder={tipoDocumento === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                          inputMode="numeric"
                          className="col-span-2 rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Telefone</label>
                      <input
                        value={clienteForm.telefone}
                        onChange={(e) =>
                          setClienteForm((prev) => ({ ...prev, telefone: maskPhoneBR(e.target.value) }))
                        }
                        inputMode="numeric"
                        placeholder="(00) 00000-0000"
                        className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-300 mb-2">E-mail</label>
                      <input
                        type="email"
                        value={clienteForm.email}
                        onChange={(e) => setClienteForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      />
                    </div>


                    <div className="md:col-span-2 border-t border-gray-700 pt-4">
                      <h4 className="mb-3 text-base font-semibold text-gray-100">Endereco do cliente</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">CEP</label>
                          <input
                            value={clienteForm.endereco.cep}
                            onChange={(e) =>
                              setClienteForm((prev) => ({
                                ...prev,
                                endereco: { ...prev.endereco, cep: maskCep(e.target.value) }
                              }))
                            }
                            inputMode="numeric"
                            placeholder="00000-000"
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Numero</label>
                          <input
                            value={clienteForm.endereco.numero}
                            onChange={(e) =>
                              setClienteForm((prev) => ({
                                ...prev,
                                endereco: { ...prev.endereco, numero: e.target.value }
                              }))
                            }
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-300 mb-2">Logradouro</label>
                          <input
                            value={clienteForm.endereco.logradouro}
                            onChange={(e) =>
                              setClienteForm((prev) => ({
                                ...prev,
                                endereco: { ...prev.endereco, logradouro: e.target.value }
                              }))
                            }
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-300 mb-2">Complemento</label>
                          <input
                            value={clienteForm.endereco.complemento}
                            onChange={(e) =>
                              setClienteForm((prev) => ({
                                ...prev,
                                endereco: { ...prev.endereco, complemento: e.target.value }
                              }))
                            }
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Bairro</label>
                          <input
                            value={clienteForm.endereco.bairro}
                            onChange={(e) =>
                              setClienteForm((prev) => ({
                                ...prev,
                                endereco: { ...prev.endereco, bairro: e.target.value }
                              }))
                            }
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Cidade</label>
                          <input
                            value={clienteForm.endereco.cidade}
                            onChange={(e) =>
                              setClienteForm((prev) => ({
                                ...prev,
                                endereco: { ...prev.endereco, cidade: e.target.value }
                              }))
                            }
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-300 mb-2">UF</label>
                          <input
                            maxLength={2}
                            value={clienteForm.endereco.estado}
                            onChange={(e) =>
                              setClienteForm((prev) => ({
                                ...prev,
                                endereco: { ...prev.endereco, estado: e.target.value.toUpperCase() }
                              }))
                            }
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modoCliente === 'existente' && (
                <div className="rounded-lg border border-gray-700 p-4 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-100">Selecionar cliente cadastrado</h3>

                  <div className="relative">
                    <input
                      value={buscaCliente}
                      onChange={(e) => setBuscaCliente(e.target.value)}
                      placeholder="Pesquisar por nome, CPF/CNPJ, telefone ou email"
                      className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-10 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                    />
                    <MagnifyingGlass className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {clientesLoading && (
                    <p className="text-sm text-gray-300">Carregando clientes...</p>
                  )}

                  {!clientesLoading && (
                    <div className="max-h-64 overflow-auto space-y-2">
                      {clientesFiltrados.map((cliente) => (
                        <button
                          type="button"
                          key={cliente.id}
                          onClick={() => setClienteSelecionadoId(cliente.id)}
                          className={`w-full rounded border px-3 py-3 text-left transition-colors ${
                            clienteSelecionadoId === cliente.id
                              ? 'border-blue-500 bg-blue-900/25 text-blue-100'
                              : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-gray-500'
                          }`}
                        >
                          <p className="font-semibold">{cliente.nome}</p>
                          <p className="text-sm text-gray-300">{cliente.cpfCnpj}</p>
                          <p className="text-sm text-gray-300">{cliente.telefone}</p>
                          <p className="text-sm text-gray-300">{cliente.email}</p>
                        </button>
                      ))}
                      {clientesFiltrados.length === 0 && (
                        <p className="text-sm text-gray-300">Nenhum cliente encontrado para o filtro informado.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (!validarPasso1()) {
                      setErro('Preencha os campos obrigatorios do cliente para avancar ao Passo 2.');
                      return;
                    }
                    setErro(null);
                    setPassoAtual(2);
                  }}
                >
                  Proximo Passo
                </Button>
              </div>
            </div>
          )}

          {passoAtual === 2 && (
            <div className="space-y-6 page-enter">
              <h2 className="text-2xl font-bold text-gray-100">Informacoes Basicas do Projeto</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Data de Abertura</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dadosBasicos.dataAbertura}
                      onChange={(e) =>
                        setDadosBasicos((prev) => ({ ...prev, dataAbertura: e.target.value }))
                      }
                      className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                    />
                    <Calendar className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Concessionaria</label>
                  <select
                    value={dadosBasicos.concessionaria}
                    onChange={(e) =>
                      setDadosBasicos((prev) => ({ ...prev, concessionaria: e.target.value }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  >
                    {concessionarias.map((item, index) => (
                      <option key={item} value={index === 0 ? '' : item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Numero da UC</label>
                  <input
                    value={dadosBasicos.numeroUc}
                    onChange={(e) =>
                      setDadosBasicos((prev) => ({ ...prev, numeroUc: maskNumeric(e.target.value, 20) }))
                    }
                    inputMode="numeric"
                    className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Tipo de Servico</label>
                  <select
                    value={dadosBasicos.tipoServico}
                    onChange={(e) =>
                      setDadosBasicos((prev) => ({ ...prev, tipoServico: e.target.value }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  >
                    <option value="projetos_solares">Projetos Solares</option>
                  </select>
                </div>


                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-300 mb-2">Endereco Completo</label>
                  <input
                    value={dadosBasicos.enderecoCompleto}
                    onChange={(e) =>
                      setDadosBasicos((prev) => ({ ...prev, enderecoCompleto: e.target.value }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
                </div>


                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-300 mb-2">Coordenadas Geograficas</label>
                  <input
                    value={detalhesProjeto.coordenadas}
                    onChange={(e) =>
                      setDetalhesProjeto((prev) => ({ ...prev, coordenadas: e.target.value }))
                    }
                    placeholder="Link do Google Maps ou coordenadas"
                    className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Integrador</label>
                  <select
                    value={dadosBasicos.integrador}
                    onChange={(e) => setDadosBasicos((prev) => ({ ...prev, integrador: e.target.value }))}
                    className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  >
                    {integradores.map((item, index) => (
                      <option key={item} value={index === 0 ? '' : item}>
                        {item}
                      </option>
                    ))}
                  </select>
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
          )}

          {passoAtual === 3 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-100">Detalhes do Projeto Solar</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Modalidade de Geracao</label>
                  <select
                    value={detalhesProjeto.modalidadeGeracao}
                    onChange={(e) =>
                      setDetalhesProjeto((prev) => ({
                        ...prev,
                        modalidadeGeracao: e.target.value as DadosDetalhesForm['modalidadeGeracao']
                      }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  >
                    <option value="autoconsumo">Auto Consumo Local</option>
                    <option value="geracao_compartilhada">Geracao Compartilhada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Projeto Fast Track</label>
                  <select
                    value={detalhesProjeto.projetoFastTrack}
                    onChange={(e) =>
                      setDetalhesProjeto((prev) => ({
                        ...prev,
                        projetoFastTrack: e.target.value as DadosDetalhesForm['projetoFastTrack']
                      }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  >
                    <option value="nao">Nao</option>
                    <option value="sim">Sim</option>
                  </select>
                </div>

              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-semibold text-gray-100">Modulos Fotovoltaicos</h3>
                  <Button variant="secondary" size="sm" onClick={() => setModulos((prev) => [...prev, buildItemVazio()])}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <div className="border border-gray-700 rounded p-4 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-300">
                    <span>Qtd</span>
                    <span>Potencia (W)</span>
                    <span>Marca</span>
                    <span>Modelo</span>
                  </div>
                  {modulos.map((item) => (
                    <div key={item.id} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <input
                        value={item.quantidade}
                        onChange={(e) => handleModuloChange(item.id, 'quantidade', maskNumeric(e.target.value, 5))}
                        inputMode="numeric"
                        className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      />
                      <input
                        value={item.potencia}
                        onChange={(e) => handleModuloChange(item.id, 'potencia', maskNumeric(e.target.value, 6))}
                        inputMode="numeric"
                        className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      />
                      <input
                        value={item.marca}
                        onChange={(e) => handleModuloChange(item.id, 'marca', e.target.value)}
                        className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      />
                      <input
                        value={item.modelo}
                        onChange={(e) => handleModuloChange(item.id, 'modelo', e.target.value)}
                        className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-semibold text-gray-100">Inversores Fotovoltaicos</h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setInversores((prev) => [...prev, buildItemVazio()])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <div className="border border-gray-700 rounded p-4 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-300">
                    <span>Qtd</span>
                    <span>Potencia (W)</span>
                    <span>Marca</span>
                    <span>Modelo</span>
                  </div>
                  {inversores.map((item) => (
                    <div key={item.id} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <input
                        value={item.quantidade}
                        onChange={(e) => handleInversorChange(item.id, 'quantidade', maskNumeric(e.target.value, 5))}
                        inputMode="numeric"
                        className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      />
                      <input
                        value={item.potencia}
                        onChange={(e) => handleInversorChange(item.id, 'potencia', maskNumeric(e.target.value, 6))}
                        inputMode="numeric"
                        className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      />
                      <input
                        value={item.marca}
                        onChange={(e) => handleInversorChange(item.id, 'marca', e.target.value)}
                        className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      />
                      <input
                        value={item.modelo}
                        onChange={(e) => handleInversorChange(item.id, 'modelo', e.target.value)}
                        className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded bg-blue-900/20 border border-blue-800/40 px-4 py-4">
                <p className="text-blue-200 text-2xl">Potencia Total do Sistema</p>
                <p className="text-blue-100 text-3xl mt-1">{potenciaTotalSistemaW} W</p>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Custo do Projeto (R$)</label>
                <input
                  value={detalhesProjeto.custoProjeto}
                  onChange={(e) =>
                    setDetalhesProjeto((prev) => ({ ...prev, custoProjeto: maskCurrencyBRL(e.target.value) }))
                  }
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-3xl font-semibold text-gray-100">Documentos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documentosTemplate.map((item) => (
                    <label
                      key={item.key}
                      className="border border-dashed border-gray-500 rounded px-4 py-6 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-opj-blue transition-colors"
                    >
                      <UploadSimple className="h-6 w-6 text-gray-400" />
                      <span className="text-gray-200">{item.label}</span>
                      <span className="text-xs text-gray-400 truncate max-w-full">
                        {documentos[item.key]?.name ?? 'Selecionar arquivo'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          setDocumentos((prev) => ({
                            ...prev,
                            [item.key]: e.target.files?.[0] ?? null
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setPassoAtual(2)} disabled={salvando}>
                  Voltar
                </Button>
                <Button onClick={handleCriarProjeto} loading={salvando}>
                  Criar Projeto
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};





