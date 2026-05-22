import { Button } from '@/shared/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { LogoUpload } from '@/shared/components/LogoUpload';
import { CheckCircle, PlusCircle, X } from '@phosphor-icons/react';
import React, { useEffect, useRef } from 'react';
import { type ConcessionaireData } from '../domain/concessionaire';

type ConcessionaireForm = Omit<ConcessionaireData, 'id'>;

interface ConcessionaireFormModalProps {
  form: ConcessionaireForm;
  setField: <K extends keyof ConcessionaireForm>(key: K, value: ConcessionaireForm[K]) => void;
  editingId: string | null;
  saving: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
}

export const ConcessionaireFormModal: React.FC<ConcessionaireFormModalProps> = ({
  form,
  setField,
  editingId,
  saving,
  onSubmit,
  onClose,
}) => {
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => {
      firstFieldRef.current?.focus();
      firstFieldRef.current?.scrollIntoView({ block: 'center', inline: 'nearest' });
    });

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4 py-8">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>{editingId ? 'Editar Concessionaria' : 'Nova Concessionaria'}</CardTitle>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Nome *"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  required
                  inputRef={firstFieldRef}
                />
                <Input
                  label="Sigla"
                  value={form.acronym}
                  onChange={(e) => setField('acronym', e.target.value)}
                />
                <Input
                  label="Codigo"
                  value={form.code}
                  onChange={(e) => setField('code', e.target.value)}
                />
                <Input
                  label="Regiao"
                  value={form.region}
                  onChange={(e) => setField('region', e.target.value)}
                />
                <Input
                  label="Telefone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                />
                <Input
                  label="E-mail"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                />
                <div className="flex items-center gap-3 pt-6">
                  <input
                    id="active"
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setField('active', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                  />
                  <label htmlFor="active" className="text-sm text-slate-300">
                    Concessionaria ativa
                  </label>
                </div>
              </div>

              <LogoUpload value={form.logo} onChange={(base64) => setField('logo', base64)} />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" loading={saving}>
                  {editingId ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Salvar Alteracoes
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Cadastrar Concessionaria
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
