import React from 'react';
import { Link } from 'react-router-dom';
import type { Concessionaire } from '@/services';

interface ConcessionaireSelectProps {
  value: string;
  onChange: (value: string) => void;
  concessionarias: Concessionaire[];
  loading?: boolean;
  isAdmin?: boolean;
  className?: string;
}

const defaultCls =
  'w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue disabled:opacity-60';

export const ConcessionaireSelect: React.FC<ConcessionaireSelectProps> = ({
  value,
  onChange,
  concessionarias,
  loading = false,
  isAdmin = false,
  className,
}) => (
  <div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      className={className ?? defaultCls}
    >
      <option value="">{loading ? 'Carregando...' : 'Selecione...'}</option>
      {concessionarias.map((item) => (
        <option key={item.id} value={item.name}>
          {item.name}
        </option>
      ))}
    </select>

    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-400">
      <span>
        {concessionarias.length > 0
          ? `${concessionarias.length} concessionária(s) disponível(is) no cadastro local.`
          : 'Nenhuma concessionária ativa cadastrada.'}
      </span>
      {isAdmin && (
        <Link to="/concessionarias" className="text-cyan-300 hover:text-cyan-200">
          Gerenciar concessionárias
        </Link>
      )}
    </div>
  </div>
);
