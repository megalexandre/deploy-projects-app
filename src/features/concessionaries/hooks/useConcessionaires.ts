import { useCallback, useEffect, useMemo, useState } from 'react';
import { type Concessionaire, type ConcessionaireData } from '../domain/concessionaire';
import { concessionairesService } from '../services/concessionairesService';

type ConcessionaireForm = Omit<ConcessionaireData, 'id'>;

const createEmptyForm = (): ConcessionaireForm => ({
  name: '',
  acronym: '',
  code: '',
  region: '',
  phone: '',
  email: '',
  active: true,
  logo: null,
});

const createFormFromConcessionaire = (item: Concessionaire): ConcessionaireForm => ({
  name: item.name,
  acronym: item.acronym,
  code: item.code,
  region: item.region,
  phone: item.phone,
  email: item.email,
  active: item.active,
  logo: item.logo,
});

const isFormValid = (form: ConcessionaireForm) => form.name.trim().length >= 2;

export const useConcessionaires = () => {
  const [items, setItems] = useState<Concessionaire[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isConcessionaireModalOpen, setIsConcessionaireModalOpen] = useState(false);
  const [form, setForm] = useState<ConcessionaireForm>(createEmptyForm());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await concessionairesService.getAll());
    } catch (loadError) {
      console.error('Erro ao carregar concessionárias:', loadError);
      setError('Não foi possível carregar as concessionárias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    if (!query) return sorted;
    return sorted.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.acronym.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query),
    );
  }, [items, searchTerm]);

  const setField = <K extends keyof ConcessionaireForm>(key: K, value: ConcessionaireForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isFormValid(form)) {
      setError('Informe pelo menos o nome da concessionária.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const input: ConcessionaireForm = {
        ...form,
        name: form.name.trim(),
        logo: form.logo?.trim() || null,
      };

      if (editingId) {
        const updated = await concessionairesService.update(editingId, input);
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
      } else {
        const created = await concessionairesService.create(input);
        setItems((prev) => [...prev, created]);
      }

      setEditingId(null);
      setForm(createEmptyForm());
      setIsConcessionaireModalOpen(false);
    } catch (saveError) {
      console.error('Erro ao salvar concessionária:', saveError);
      setError('Não foi possível salvar a concessionária.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: Concessionaire) => {
    setEditingId(item.id);
    setForm(createFormFromConcessionaire(item));
    setError(null);
    setIsConcessionaireModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setForm(createEmptyForm());
    setError(null);
    setIsConcessionaireModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(createEmptyForm());
    setError(null);
    setIsConcessionaireModalOpen(false);
  };

  return {
    form,
    setField,
    filteredItems,
    searchTerm,
    setSearchTerm,
    error,
    loading,
    saving,
    editingId,
    isConcessionaireModalOpen,
    handleSubmit,
    handleEdit,
    handleOpenCreateModal,
    handleCancelEdit,
  };
};
