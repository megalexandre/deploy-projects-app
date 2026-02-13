import React, { useMemo, useState } from 'react';
import { ArrowLeft, Calendar, UploadSimple, Plus } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { projetoService } from '../services/projetoService';
import { StatusProjeto } from '../types';
import { maskCnpj, maskCpf, maskCurrencyBRL, maskNumeric, maskPhoneBR, onlyDigits } from '../utils/masks';

type Passo = 1 | 2;
type TipoDocumento = 'cpf' | 'cnpj';

interface DadosBasicosForm {
  dataAbertura: string;
  nomeCliente: string;
  concessionaria: string;
  numeroUc: string;
  cpfCnpj: string;
  enderecoCompleto: string;
  email: string;
  telefone: string;
  tipoServico: string;
  integrador: string;
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

export const NovoProjetoPage: React.FC = () => {
  const navigate = useNavigate();
  const [passoAtual, setPassoAtual] = useState<Passo>(1);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('cpf');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [dadosBasicos, setDadosBasicos] = useState<DadosBasicosForm>({
    dataAbertura: dataAtualIso,
    nomeCliente: '',
    concessionaria: '',
    numeroUc: '',
    cpfCnpj: '',
    enderecoCompleto: '',
    email: '',
    telefone: '',
    tipoServico: 'projetos_solares',
    integrador: ''
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
    const documentoLimpo = onlyDigits(dadosBasicos.cpfCnpj);
    const tamanhoDocumentoValido = tipoDocumento === 'cpf' ? 11 : 14;
    const telefoneValido = onlyDigits(dadosBasicos.telefone).length >= 10;

    const camposObrigatorios = [
      dadosBasicos.dataAbertura,
      dadosBasicos.nomeCliente,
      dadosBasicos.concessionaria,
      dadosBasicos.numeroUc,
      dadosBasicos.cpfCnpj,
      dadosBasicos.enderecoCompleto,
      dadosBasicos.email,
      dadosBasicos.telefone,
      dadosBasicos.integrador
    ];

    return (
      camposObrigatorios.every((campo) => campo.trim() !== '') &&
      documentoLimpo.length === tamanhoDocumentoValido &&
      telefoneValido
    );
  };

  const gerarProtocolo = () => {
    const ano = new Date().getFullYear();
    const sufixo = String(Date.now()).slice(-4);
    return `PROJ-${ano}-${sufixo}`;
  };

  const handleCriarProjeto = async () => {
    if (!validarPasso1()) {
      setErro('Preencha todos os campos obrigatorios do Passo 1 antes de criar o projeto.');
      setPassoAtual(1);
      return;
    }

    setErro(null);
    setSalvando(true);

    try {
      const modulosValidos = modulos
        .filter((item) => item.quantidade || item.potencia || item.marca || item.modelo)
        .map((item) => {
          const quantidade = Number(item.quantidade) || 0;
          const potencia = Number(item.potencia) || 0;
          return {
            id: item.id,
            fabricante: item.marca || 'Nao informado',
            modelo: item.modelo || 'Nao informado',
            potencia,
            quantidade,
            potenciaPico: Number(((quantidade * potencia) / 1000).toFixed(2))
          };
        });

      const inversoresValidos = inversores
        .filter((item) => item.quantidade || item.potencia || item.marca || item.modelo)
        .map((item) => {
          const quantidade = Number(item.quantidade) || 0;
          const potencia = Number(item.potencia) || 0;
          return {
            id: item.id,
            fabricante: item.marca || 'Nao informado',
            modelo: item.modelo || 'Nao informado',
            potencia,
            quantidade,
            potenciaTotal: Number(((quantidade * potencia) / 1000).toFixed(2))
          };
        });

      const documentosUpload = Object.entries(documentos)
        .filter(([, file]) => Boolean(file))
        .map(([key, file]) => ({
          id: key,
          nome: file?.name ?? key,
          tipo: key,
          dataUpload: new Date().toISOString(),
          tamanho: file?.size ?? 0
        }));

      await projetoService.createProjeto({
        protocolo: gerarProtocolo(),
        cliente: {
          id: crypto.randomUUID(),
          nome: dadosBasicos.nomeCliente,
          cpfCnpj: dadosBasicos.cpfCnpj,
          telefone: dadosBasicos.telefone,
          email: dadosBasicos.email
        },
        endereco: {
          cep: '00000-000',
          logradouro: dadosBasicos.enderecoCompleto,
          numero: 'S/N',
          complemento: '',
          bairro: 'Nao informado',
          cidade: 'Nao informado',
          estado: 'NA'
        },
        dadosProjeto: {
          concessionaria: dadosBasicos.concessionaria,
          classe: dadosBasicos.tipoServico === 'projetos_solares' ? 'Projeto Solar' : 'Nao informado',
          integrador: dadosBasicos.integrador,
          modalidade:
            detalhesProjeto.modalidadeGeracao === 'geracao_compartilhada'
              ? 'geracao_compartilhada'
              : 'autoconsumo',
          enquadramento: detalhesProjeto.projetoFastTrack === 'sim' ? 'Fast Track' : 'Padrao',
          potenciaSistema: Number((potenciaTotalSistemaW / 1000).toFixed(2)),
          protecaoCC: detalhesProjeto.coordenadas || 'Nao informado'
        },
        dadosTecnicos: {
          tensao: 0,
          numeroFases: 0,
          ramal: 'Nao informado',
          disjuntor: 'Nao informado',
          cargaInstalada: potenciaTotalSistemaW
        },
        modulos: modulosValidos,
        inversores: inversoresValidos,
        divisaoCreditos: [
          {
            percentual: 100,
            uc: dadosBasicos.numeroUc,
            classe: dadosBasicos.tipoServico,
            endereco: dadosBasicos.enderecoCompleto
          }
        ],
        timeline: [
          {
            id: crypto.randomUUID(),
            etapa: 'Cadastro inicial',
            data: dadosBasicos.dataAbertura,
            status: 'concluido',
            descricao: 'Projeto criado via formulario de novo projeto'
          }
        ],
        documentos: documentosUpload,
        status: StatusProjeto.PENDENTE
      });

      navigate('/projetos');
    } catch (creationError) {
      console.error('Erro ao criar projeto:', creationError);
      setErro('Nao foi possivel criar o projeto agora. Tente novamente.');
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
              <p className="text-gray-400 text-xl">Passo {passoAtual} de 2</p>
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
          </div>
        </div>

        <div className="p-6 space-y-8">
          {erro && (
            <div className="rounded-md border border-red-700 bg-red-900/20 px-4 py-3 text-red-300">
              {erro}
            </div>
          )}

          {passoAtual === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-100">Informacoes Basicas</h2>

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
                  <label className="block text-sm text-gray-300 mb-2">Nome Completo do Cliente</label>
                  <input
                    value={dadosBasicos.nomeCliente}
                    onChange={(e) =>
                      setDadosBasicos((prev) => ({ ...prev, nomeCliente: e.target.value }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
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
                  <label className="block text-sm text-gray-300 mb-2">Documento</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={tipoDocumento}
                      onChange={(e) => {
                        const novoTipo = e.target.value as TipoDocumento;
                        setTipoDocumento(novoTipo);
                        setDadosBasicos((prev) => ({ ...prev, cpfCnpj: '' }));
                      }}
                      className="col-span-1 rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                    >
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                    </select>
                    <input
                      value={dadosBasicos.cpfCnpj}
                      onChange={(e) =>
                        setDadosBasicos((prev) => ({
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

                <div>
                  <label className="block text-sm text-gray-300 mb-2">E-mail</label>
                  <input
                    type="email"
                    value={dadosBasicos.email}
                    onChange={(e) => setDadosBasicos((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Telefone</label>
                  <input
                    value={dadosBasicos.telefone}
                    onChange={(e) =>
                      setDadosBasicos((prev) => ({ ...prev, telefone: maskPhoneBR(e.target.value) }))
                    }
                    inputMode="numeric"
                    placeholder="(00) 00000-0000"
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

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (!validarPasso1()) {
                      setErro('Preencha todos os campos obrigatorios para avancar ao Passo 2.');
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
                <Button variant="outline" onClick={() => setPassoAtual(1)} disabled={salvando}>
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

