import { Button } from '@/shared/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { LogoUpload } from '@/shared/components/LogoUpload';
import { CheckCircle, PlusCircle } from '@phosphor-icons/react';
import React from 'react';
import { type ConcessionaireData } from '../domain/concessionaire';

type ConcessionaireForm = Omit<ConcessionaireData, 'id'>;

interface ConcessionaireFormCardProps {
  form: ConcessionaireForm;
  setField: <K extends keyof ConcessionaireForm>(key: K, value: ConcessionaireForm[K]) => void;
  editingId: string | null;
  saving: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}

export const ConcessionaireFormCard: React.FC<ConcessionaireFormCardProps> = ({
  form,
  setField,
  editingId,
  saving,
  onSubmit,
  onCancel,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>{editingId ? 'Editar Concessionária' : 'Nova Concessionária'}</CardTitle>
          {editingId && (
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancelar edição
            </Button>
          )}
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
            />
            <Input
              label="Sigla"
              value={form.acronym}
              onChange={(e) => setField('acronym', e.target.value)}
            />
            <Input
              label="Código"
              value={form.code}
              onChange={(e) => setField('code', e.target.value)}
            />
            <Input
              label="Região"
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
                Concessionária ativa
              </label>
            </div>
          </div>

          <LogoUpload value={form.logo} onChange={(base64) => setField('logo', base64)} />

          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              {editingId ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Cadastrar Concessionária
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
