import { useEffect, useState } from 'react';
import type { ConfiguracoesSistema } from '@/types';
import { loadConfiguracoesSistema, saveConfiguracoesSistema } from '@/utils/configuracoesSistema';
import { usersService, type User } from '@/features/admin/services/usersService';

export const useConfiguracoes = () => {
  const [formData, setFormData] = useState<ConfiguracoesSistema>(loadConfiguracoesSistema());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<User[]>([]);

  useEffect(() => {
    const loadUsuarios = async () => {
      try {
        setUsuarios(await usersService.getAll());
      } catch (error) {
        console.error('Erro ao carregar usuarios para cupons:', error);
      }
    };

    void loadUsuarios();
  }, []);

  const handleInputChange = <K extends keyof ConfiguracoesSistema>(
    field: K,
    value: ConfiguracoesSistema[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrecoFotovoltaicoChange = (
    id: string,
    field: 'min' | 'max' | 'valor',
    value: string,
  ) => {
    const nextValue = value === '' ? 0 : Number(value.replace(',', '.'));

    setFormData((prev) => ({
      ...prev,
      tabelaPrecoFotovoltaico: prev.tabelaPrecoFotovoltaico.map((item) =>
        item.id === id ? { ...item, [field]: Number.isFinite(nextValue) ? nextValue : 0 } : item,
      ),
    }));
  };

  const handleAdicionarFaixaFotovoltaica = () => {
    setFormData((prev) => {
      const last = prev.tabelaPrecoFotovoltaico.at(-1);

      return {
        ...prev,
        tabelaPrecoFotovoltaico: [
          ...prev.tabelaPrecoFotovoltaico,
          {
            id: crypto.randomUUID(),
            min: last ? Number((last.max + 0.1).toFixed(1)) : 0,
            max: last ? Number((last.max + 10).toFixed(1)) : 10,
            valor: 0,
          },
        ],
      };
    });
  };

  const handleRemoverFaixaFotovoltaica = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      tabelaPrecoFotovoltaico: prev.tabelaPrecoFotovoltaico.filter((item) => item.id !== id),
    }));
  };

  const handlePrecoPadraoEntradaChange = (
    id: string,
    field: 'classificacao' | 'tipoLigacao' | 'valor',
    value: string,
  ) => {
    const nextValue = value === '' ? 0 : Number(value.replace(',', '.'));

    setFormData((prev) => ({
      ...prev,
      tabelaPrecoPadraoEntrada: prev.tabelaPrecoPadraoEntrada.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === 'valor' ? (Number.isFinite(nextValue) ? nextValue : 0) : value,
            }
          : item,
      ),
    }));
  };

  const handleAdicionarPrecoPadraoEntrada = () => {
    setFormData((prev) => ({
      ...prev,
      tabelaPrecoPadraoEntrada: [
        ...prev.tabelaPrecoPadraoEntrada,
        {
          id: crypto.randomUUID(),
          classificacao: '',
          tipoLigacao: '',
          valor: 0,
        },
      ],
    }));
  };

  const handleRemoverPrecoPadraoEntrada = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      tabelaPrecoPadraoEntrada: prev.tabelaPrecoPadraoEntrada.filter((item) => item.id !== id),
    }));
  };

  const handleCupomChange = (
    listKey: 'cuponsDescontoProjetos' | 'cuponsDescontoServicos',
    id: string,
    field: 'nome' | 'percentual' | 'ativo' | 'usuariosAutorizados',
    value: string | boolean | string[],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === 'percentual'
                  ? Number.isFinite(Number(value))
                    ? Number(value)
                    : 0
                  : value,
            }
          : item,
      ),
    }));
  };

  const handleAdicionarCupom = (listKey: 'cuponsDescontoProjetos' | 'cuponsDescontoServicos') => {
    setFormData((prev) => ({
      ...prev,
      [listKey]: [
        ...prev[listKey],
        {
          id: crypto.randomUUID(),
          nome: '',
          percentual: 0,
          ativo: true,
          usuariosAutorizados: [],
        },
      ],
    }));
  };

  const handleSalvar = () => {
    saveConfiguracoesSistema(formData);
    setSaveMessage('Configurações salvas. Novos projetos passam a usar esses valores.');
    window.setTimeout(() => setSaveMessage(null), 3000);
  };

  return {
    formData,
    usuarios,
    saveMessage,
    handleInputChange,
    handlePrecoFotovoltaicoChange,
    handleAdicionarFaixaFotovoltaica,
    handleRemoverFaixaFotovoltaica,
    handlePrecoPadraoEntradaChange,
    handleAdicionarPrecoPadraoEntrada,
    handleRemoverPrecoPadraoEntrada,
    handleCupomChange,
    handleAdicionarCupom,
    handleSalvar,
  };
};
