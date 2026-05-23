import { ShieldCheck } from '@phosphor-icons/react';
import React from 'react';

const indicators = [
  'Acesso seguro e controlado',
  'Dados centralizados e confiaveis',
  'Insights para decisoes com mais assertividade',
];

export const LoginFooter: React.FC = () => (
  <footer className="relative z-10 border-t border-white/10 bg-[#070e1d] px-4 py-5 sm:px-6 lg:px-16">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 lg:flex-row">
      <div className="flex flex-wrap justify-center gap-6 lg:justify-start">
        {indicators.map((item) => (
          <div key={item} className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="h-4 w-4 text-[#43dde6]" weight="fill" />
            <span className="text-[11px] font-semibold leading-tight text-slate-100">{item}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center text-center lg:items-end lg:text-right">
        <p className="text-xs text-slate-400">
          Ambiente seguro e em conformidade com as politicas da concessionaria.
        </p>
        <span className="mt-1 text-xs text-slate-500">
          © 2024 Lumina Infrastructure Group. All rights reserved.
        </span>
      </div>
    </div>
  </footer>
);
