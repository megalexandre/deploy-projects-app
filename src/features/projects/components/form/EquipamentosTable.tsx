import React from 'react';
import { Plus } from '@phosphor-icons/react';
import { maskNumeric } from '@/core/utils/masks';
import type { ItemEquipamentoForm } from '@/features/projects/domain/types';
import { Button } from '@/shared/components/Button';

interface EquipamentosTableProps {
  title: string;
  items: ItemEquipamentoForm[];
  onChange: (id: string, field: keyof ItemEquipamentoForm, value: string) => void;
  onAdd: () => void;
}

export const EquipamentosTable: React.FC<EquipamentosTableProps> = ({
  title,
  items,
  onChange,
  onAdd,
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-3xl font-semibold text-gray-100">{title}</h3>
      <Button variant="secondary" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1" />
        Adicionar
      </Button>
    </div>
    <div className="border border-gray-700 rounded p-4 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-300">
        <span>Qtd</span>
        <span>Potência (W)</span>
        <span>Marca</span>
        <span>Modelo</span>
      </div>
      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input
            value={item.quantidade}
            onChange={(e) => onChange(item.id, 'quantidade', maskNumeric(e.target.value, 5))}
            inputMode="numeric"
            className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
          />
          <input
            value={item.potencia}
            onChange={(e) => onChange(item.id, 'potencia', maskNumeric(e.target.value, 6))}
            inputMode="numeric"
            className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
          />
          <input
            value={item.marca}
            onChange={(e) => onChange(item.id, 'marca', e.target.value)}
            className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
          />
          <input
            value={item.modelo}
            onChange={(e) => onChange(item.id, 'modelo', e.target.value)}
            className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
          />
        </div>
      ))}
    </div>
  </div>
);
