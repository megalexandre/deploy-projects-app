/** Pagina 'NovoProjetoPage': renderizacao do formulario de criacao de projeto. */
import React from 'react';
import { ArrowLeft, Calendar, MagnifyingGlass, UploadSimple, Plus } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { formatCurrencyBRL, maskCep, maskCnpj, maskCpf, maskLatitude, maskLongitude, maskNumeric, maskPhoneBR } from '@/core/utils/masks';
import type { TipoDocumento, DadosDetalhesForm } from '@/features/projects/domain/types';
import {
  useNovoProjeto,
  buildItemVazio,
  tiposProjeto,
  servicosDisponiveis,
  formatDocumento,
  formatTelefone
} from '@/features/projects/hooks/useNovoProjeto';

export const NovoProjetoPage: React.FC = () => {
  const {
    navigate,
    currentUser,
    integradores,
    enderecoClienteProjeto,
    tabelaPrecoPadraoEntradaMap,
    valorProjetoEditado,
    validarPasso1,
    validarPasso2,
    validarPasso3,
    passoAtual,
    setPassoAtual,
    tipoDocumento,
    setTipoDocumento,
    modoCliente,
    setModoCliente,
    clientesLoading,
    concessionarias,
    concessionariasLoading,
    clienteSelecionadoId,
    setClienteSelecionadoId,
    clienteSelecionadoDetalhe,
    buscaCliente,
    setBuscaCliente,
    salvando,
    erro,
    setErro,
    dadosBasicos,
    setDadosBasicos,
    servicosSelecionados,
    setServicosSelecionados,
    modoEnderecoProjeto,
    setModoEnderecoProjeto,
    enderecoProjeto,
    setEnderecoProjeto,
    clienteForm,
    setClienteForm,
    detalhesProjeto,
    setDetalhesProjeto,
    modulos,
    setModulos,
    inversores,
    setInversores,
    padraoEntradaItens,
    documentos,
    selectedCustomerDocumentIds,
    setSelectedCustomerDocumentIds,
    valorProjeto,
    setValorProjeto,
    setValorProjetoEditado,
    potenciaTotalModulosW,
    potenciaTotalInversoresW,
    potenciaTotalSistemaW,
    custoCalculadoProjeto,
    documentosTemplate,
    clientesFiltrados,
    reusedCustomerDocuments,
    enderecoClienteDisponivel,
    fillAddressFromCep,
    handleModuloChange,
    handleInversorChange,
    handlePadraoEntradaChange,
    handleDocumentosChange,
    handleCriarProjeto
  } = useNovoProjeto();

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
                            onBlur={() =>
                              void fillAddressFromCep(clienteForm.endereco.cep, (endereco) =>
                                setClienteForm((prev) => ({
                                  ...prev,
                                  endereco: {
                                    ...prev.endereco,
                                    cep: maskCep(endereco.cep),
                                    logradouro: endereco.logradouro || prev.endereco.logradouro,
                                    complemento: prev.endereco.complemento || endereco.complemento,
                                    bairro: endereco.bairro || prev.endereco.bairro,
                                    cidade: endereco.cidade || prev.endereco.cidade,
                                    estado: endereco.estado || prev.endereco.estado
                                  }
                                }))
                              )
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
                          <p className="text-sm text-gray-300">{formatDocumento(cliente.cpfCnpj)}</p>
                          <p className="text-sm text-gray-300">{formatTelefone(cliente.telefone)}</p>
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
                    disabled={concessionariasLoading}
                    className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  >
                    <option value="">
                      {concessionariasLoading ? 'Carregando...' : 'Selecione...'}
                    </option>
                    {concessionarias.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-400">
                    <span>
                      {concessionarias.length > 0
                        ? `${concessionarias.length} concessionaria(s) disponivel(is) no cadastro local.`
                        : 'Nenhuma concessionaria ativa cadastrada.'}
                    </span>
                    {currentUser?.isAdmin && (
                      <Link to="/concessionarias" className="text-cyan-300 hover:text-cyan-200">
                        Gerenciar concessionarias
                      </Link>
                    )}
                  </div>
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
                  <label className="block text-sm text-gray-300 mb-2">Tipo de Projeto</label>
                  <div className="grid grid-cols-2 gap-3">
                    {tiposProjeto.map((tipo) => (
                      <button
                        key={tipo.value}
                        type="button"
                        onClick={() =>
                          setDadosBasicos((prev) => ({
                            ...prev,
                            tipoProjeto: tipo.value
                          }))
                        }
                        className={`rounded border px-4 py-3 text-left transition-colors ${
                          dadosBasicos.tipoProjeto === tipo.value
                            ? 'border-blue-500 bg-blue-900/25 text-blue-100'
                            : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500'
                        }`}
                      >
                        <p className="font-semibold">{tipo.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 rounded-lg border border-gray-700 p-4 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-100">Endereco do projeto</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setModoEnderecoProjeto('cliente')}
                      className={`rounded border px-4 py-4 text-left transition-colors ${
                        modoEnderecoProjeto === 'cliente'
                          ? 'border-blue-500 bg-blue-900/25 text-blue-100'
                          : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500'
                      }`}
                    >
                      <p className="text-base font-semibold">Usar endereco do cliente</p>
                      <p className="text-sm opacity-80">Reaproveita o endereco cadastrado no cliente.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoEnderecoProjeto('novo')}
                      className={`rounded border px-4 py-4 text-left transition-colors ${
                        modoEnderecoProjeto === 'novo'
                          ? 'border-blue-500 bg-blue-900/25 text-blue-100'
                          : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500'
                      }`}
                    >
                      <p className="text-base font-semibold">Cadastrar novo endereco</p>
                      <p className="text-sm opacity-80">Informar um endereco diferente para este projeto.</p>
                    </button>
                  </div>

                  {modoEnderecoProjeto === 'cliente' && (
                    <div className="space-y-3">
                      {!enderecoClienteDisponivel && (
                        <p className="rounded border border-yellow-700 bg-yellow-900/20 px-3 py-3 text-sm text-yellow-200">
                          O cliente selecionado nao possui endereco completo cadastrado. Escolha "Cadastrar novo endereco"
                          para continuar.
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">CEP</label>
                          <input
                            value={enderecoClienteProjeto.cep}
                            readOnly
                            className="w-full rounded border border-gray-600 bg-gray-900 text-gray-300 px-3 py-3 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Numero</label>
                          <input
                            value={enderecoClienteProjeto.numero}
                            readOnly
                            className="w-full rounded border border-gray-600 bg-gray-900 text-gray-300 px-3 py-3 focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-300 mb-2">Logradouro</label>
                          <input
                            value={enderecoClienteProjeto.logradouro}
                            readOnly
                            className="w-full rounded border border-gray-600 bg-gray-900 text-gray-300 px-3 py-3 focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-300 mb-2">Complemento</label>
                          <input
                            value={enderecoClienteProjeto.complemento}
                            readOnly
                            className="w-full rounded border border-gray-600 bg-gray-900 text-gray-300 px-3 py-3 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Bairro</label>
                          <input
                            value={enderecoClienteProjeto.bairro}
                            readOnly
                            className="w-full rounded border border-gray-600 bg-gray-900 text-gray-300 px-3 py-3 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Cidade</label>
                          <input
                            value={enderecoClienteProjeto.cidade}
                            readOnly
                            className="w-full rounded border border-gray-600 bg-gray-900 text-gray-300 px-3 py-3 focus:outline-none"
                          />
                        </div>

                        

                        <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-12">
                          <div className="md:col-span-2">
                            <label className="block text-sm text-gray-300 mb-2">UF</label>
                            <input
                              value={enderecoClienteProjeto.estado}
                              readOnly
                              className="w-full rounded border border-gray-600 bg-gray-900 text-center text-gray-300 px-3 py-3 focus:outline-none"
                            />
                          </div>

                          <div className="md:col-span-5">
                            <label className="block text-sm text-gray-300 mb-2">Latitude</label>
                            <input
                              value={detalhesProjeto.coordenadas.latitude}
                              onChange={(e) =>
                                setDetalhesProjeto((prev) => ({
                                  ...prev,
                                  coordenadas: {
                                    ...prev.coordenadas,
                                    latitude: maskLatitude(e.target.value)
                                  }
                                }))
                              }
                              inputMode="decimal"
                              placeholder="-27.123456"
                              className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                            />
                          </div>

                          <div className="md:col-span-5">
                            <label className="block text-sm text-gray-300 mb-2">Longitude</label>
                            <input
                              value={detalhesProjeto.coordenadas.longitude}
                              onChange={(e) =>
                                setDetalhesProjeto((prev) => ({
                                  ...prev,
                                  coordenadas: {
                                    ...prev.coordenadas,
                                    longitude: maskLongitude(e.target.value)
                                  }
                                }))
                              }
                              inputMode="decimal"
                              placeholder="-54.321987"
                              className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                            />
                          </div>

                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-300 mb-2">Link do Google Maps</label>
                          <input
                            value={detalhesProjeto.linkMapa}
                            onChange={(e) => setDetalhesProjeto((prev) => ({ ...prev, linkMapa: e.target.value }))}
                            placeholder="https://maps.google.com/..."
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {modoEnderecoProjeto === 'novo' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">CEP</label>
                        <input
                          value={enderecoProjeto.cep}
                          onChange={(e) =>
                            setEnderecoProjeto((prev) => ({ ...prev, cep: maskCep(e.target.value) }))
                          }
                          onBlur={() =>
                            void fillAddressFromCep(enderecoProjeto.cep, (endereco) =>
                              setEnderecoProjeto((prev) => ({
                                ...prev,
                                cep: maskCep(endereco.cep),
                                logradouro: endereco.logradouro || prev.logradouro,
                                complemento: prev.complemento || endereco.complemento,
                                bairro: endereco.bairro || prev.bairro,
                                cidade: endereco.cidade || prev.cidade,
                                estado: endereco.estado || prev.estado
                              }))
                            )
                          }
                          inputMode="numeric"
                          placeholder="00000-000"
                          className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Numero</label>
                        <input
                          value={enderecoProjeto.numero}
                          onChange={(e) => setEnderecoProjeto((prev) => ({ ...prev, numero: e.target.value }))}
                          className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-300 mb-2">Logradouro</label>
                        <input
                          value={enderecoProjeto.logradouro}
                          onChange={(e) => setEnderecoProjeto((prev) => ({ ...prev, logradouro: e.target.value }))}
                          className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-300 mb-2">Complemento</label>
                        <input
                          value={enderecoProjeto.complemento}
                          onChange={(e) => setEnderecoProjeto((prev) => ({ ...prev, complemento: e.target.value }))}
                          className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Bairro</label>
                        <input
                          value={enderecoProjeto.bairro}
                          onChange={(e) => setEnderecoProjeto((prev) => ({ ...prev, bairro: e.target.value }))}
                          className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Cidade</label>
                        <input
                          value={enderecoProjeto.cidade}
                          onChange={(e) => setEnderecoProjeto((prev) => ({ ...prev, cidade: e.target.value }))}
                          className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        />
                      </div>

                      <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-12">
                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-300 mb-2">UF</label>
                          <input
                            maxLength={2}
                            value={enderecoProjeto.estado}
                            onChange={(e) =>
                              setEnderecoProjeto((prev) => ({ ...prev, estado: e.target.value.toUpperCase() }))
                            }
                            className="w-full rounded border border-gray-600 bg-gray-800 text-center text-gray-100 px-2 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>

                        <div className="md:col-span-5">
                          <label className="block text-sm text-gray-300 mb-2">Latitude</label>
                          <input
                            value={detalhesProjeto.coordenadas.latitude}
                            onChange={(e) =>
                              setDetalhesProjeto((prev) => ({
                                ...prev,
                                coordenadas: {
                                  ...prev.coordenadas,
                                  latitude: maskLatitude(e.target.value)
                                }
                              }))
                            }
                            inputMode="decimal"
                            placeholder="-27.123456"
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>

                        <div className="md:col-span-5">
                          <label className="block text-sm text-gray-300 mb-2">Longitude</label>
                          <input
                            value={detalhesProjeto.coordenadas.longitude}
                            onChange={(e) =>
                              setDetalhesProjeto((prev) => ({
                                ...prev,
                                coordenadas: {
                                  ...prev.coordenadas,
                                  longitude: maskLongitude(e.target.value)
                                }
                              }))
                            }
                            inputMode="decimal"
                            placeholder="-54.321987"
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-300 mb-2">Link do Google Maps</label>
                        <input
                          value={detalhesProjeto.linkMapa}
                          onChange={(e) => setDetalhesProjeto((prev) => ({ ...prev, linkMapa: e.target.value }))}
                          placeholder="https://maps.google.com/..."
                          className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        />
                      </div>
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
          )}

          {passoAtual === 3 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-100">
                {dadosBasicos.tipoProjeto === 'fotovoltaico' ? 'Detalhes do Projeto Fotovoltaico' : 'Detalhes do Projeto'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Integrador</label>
                  <select
                    value={dadosBasicos.integrador}
                    onChange={(e) => setDadosBasicos((prev) => ({ ...prev, integrador: e.target.value }))}
                    className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  >
                    <option value="">Selecione...</option>
                    {integradores.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-300 mb-2">Servicos</label>
                  <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-4 space-y-3">
                    {servicosDisponiveis.map((servico) => {
                      const checked = servicosSelecionados.includes(servico);

                      return (
                        <label
                          key={servico}
                          className="flex items-center gap-3 rounded border border-gray-700 px-3 py-3 text-gray-200"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setServicosSelecionados((prev) =>
                                e.target.checked ? [...prev, servico] : prev.filter((item) => item !== servico)
                              )
                            }
                            className="h-4 w-4 rounded border-gray-500 bg-gray-900 text-blue-500 focus:ring-blue-500"
                          />
                          <span>{servico}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {dadosBasicos.tipoProjeto === 'fotovoltaico' && (
                <>
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
                        <option value="autoconsumo_local">AUTOCONSUMO LOCAL</option>
                        <option value="autoconsumo_remoto">AUTOCONSUMO REMOTO</option>
                        <option value="geracao_compartilhada">GERACAO COMPARTILHADA</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Projeto Novo</label>
                      <select
                        value={detalhesProjeto.projetoNovo}
                        onChange={(e) =>
                          setDetalhesProjeto((prev) => ({
                            ...prev,
                            projetoNovo: e.target.value as DadosDetalhesForm['projetoNovo']
                          }))
                        }
                        className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      >
                        <option value="sim">SIM</option>
                        <option value="nao_ampliacao">NAO, AMPLIACAO</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Projeto Zero-Grid ou com Controle de Exportacao
                      </label>
                      <select
                        value={detalhesProjeto.zeroGridControleExportacao}
                        onChange={(e) =>
                          setDetalhesProjeto((prev) => ({
                            ...prev,
                            zeroGridControleExportacao:
                              e.target.value as DadosDetalhesForm['zeroGridControleExportacao']
                          }))
                        }
                        className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      >
                        <option value="nao">NAO</option>
                        <option value="sim">SIM</option>
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
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-blue-300">Potencia total dos modulos</p>
                        <p className="text-blue-100 text-2xl mt-1">{potenciaTotalModulosW} W</p>
                      </div>
                      <div>
                        <p className="text-sm uppercase tracking-wide text-blue-300">Potencia total dos inversores</p>
                        <p className="text-blue-100 text-2xl mt-1">{potenciaTotalInversoresW} W</p>
                      </div>
                      <div>
                        <p className="text-sm uppercase tracking-wide text-blue-300">Potencia total do sistema</p>
                        <p className="text-blue-100 text-2xl mt-1">{potenciaTotalSistemaW} W</p>
                        <p className="mt-1 text-xs text-blue-200/80">Resultado considera a menor potencia entre modulos e inversores.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {dadosBasicos.tipoProjeto === 'padrao_entrada' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Projeto Novo</label>
                      <select
                        value={detalhesProjeto.projetoNovo}
                        onChange={(e) =>
                          setDetalhesProjeto((prev) => ({
                            ...prev,
                            projetoNovo: e.target.value as DadosDetalhesForm['projetoNovo']
                          }))
                        }
                        className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      >
                        <option value="sim">SIM</option>
                        <option value="nao_ampliacao">NAO, AMPLIACAO</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Tensao de Fornecimento</label>
                      <select
                        value={detalhesProjeto.tensaoFornecimento}
                        onChange={(e) =>
                          setDetalhesProjeto((prev) => ({
                            ...prev,
                            tensaoFornecimento: e.target.value as DadosDetalhesForm['tensaoFornecimento']
                          }))
                        }
                        className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      >
                        <option value="">Selecione...</option>
                        <option value="127/220V">127/220V</option>
                        <option value="380/220V">380/220V</option>
                      </select>
                    </div>

                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-100">Quadro de Padrao de Entrada</h3>
                      <p className="text-sm text-gray-400">Preencha quantidade e disjuntor nas linhas necessarias para o projeto EMUC.</p>
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
                          {padraoEntradaItens.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 text-sm text-gray-200">{item.tipoLigacao}</td>
                              <td className="px-4 py-3 text-sm text-gray-300">{item.classificacao}</td>
                              <td className="px-4 py-3 text-sm text-gray-300">
                                {formatCurrencyBRL(tabelaPrecoPadraoEntradaMap[`${item.classificacao}|${item.tipoLigacao}`] ?? 0)}
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  value={item.quantidade}
                                  onChange={(e) =>
                                    handlePadraoEntradaChange(item.id, 'quantidade', maskNumeric(e.target.value, 4))
                                  }
                                  inputMode="numeric"
                                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  value={item.disjuntor}
                                  onChange={(e) => handlePadraoEntradaChange(item.id, 'disjuntor', e.target.value)}
                                  placeholder="Ex: 63A"
                                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-300">
                                {formatCurrencyBRL(
                                  (Number(item.quantidade) || 0) *
                                    (tabelaPrecoPadraoEntradaMap[`${item.classificacao}|${item.tipoLigacao}`] ?? 0)
                                )}
                              </td>
                            </tr>
                          ))}
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
                      setValorProjeto(String(custoCalculadoProjeto));
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
                    setValorProjeto(e.target.value.replace(/[^0-9.,]/g, ''));
                  }}
                  className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
                <p className="mt-2 text-sm text-gray-400">
                  {dadosBasicos.tipoProjeto === 'fotovoltaico'
                    ? `Valor sugerido pela faixa de potencia: ${formatCurrencyBRL(custoCalculadoProjeto)}.`
                    : `Valor sugerido pela tabela do EMUC: ${formatCurrencyBRL(custoCalculadoProjeto)}.`}
                </p>
                {valorProjetoEditado && (
                  <p className="mt-1 text-xs text-amber-300">
                    Valor manual ativo. Alteracoes de potencia nao substituem o valor ate voce reaplicar o sugerido.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Observacoes / Comentarios</label>
                <textarea
                  value={detalhesProjeto.observacoes}
                  onChange={(e) =>
                    setDetalhesProjeto((prev) => ({ ...prev, observacoes: e.target.value }))
                  }
                  rows={4}
                  className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue resize-y"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-3xl font-semibold text-gray-100">Documentos</h3>
                {clienteSelecionadoDetalhe && clienteSelecionadoDetalhe.documentos.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-100">Reaproveitar documentos do cliente</h4>
                        <p className="mt-1 text-sm text-gray-400">
                          {clienteSelecionadoDetalhe.nome} ja possui {clienteSelecionadoDetalhe.documentos.length} documento(s) cadastrado(s).
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
                                  : current.filter((id) => id !== documento.id)
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
                <Button onClick={handleCriarProjeto} loading={salvando} disabled={!validarPasso3() && !salvando}>
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
