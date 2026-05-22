import { ClipboardText, SolarPanel, Toolbox } from '@phosphor-icons/react';
import React from 'react';

const cards = [
  {
    icon: SolarPanel,
    title: 'Fotovoltaicos',
    description: 'Planeje, acompanhe e entregue projetos solares com precisao.',
  },
  {
    icon: ClipboardText,
    title: 'EMUCs',
    description: 'Controle e monitoramento de execucoes de obras e manutencoes.',
  },
  {
    icon: Toolbox,
    title: 'Servicos Gerais',
    description: 'Gestao integrada de demandas e servicos operacionais.',
  },
];

export const LoginHeroPanel: React.FC = () => (
  <div className="hidden md:col-span-7 md:flex md:flex-col md:space-y-8">
    <h1 className="max-w-[720px] text-[56px] font-extrabold leading-[1.12] tracking-[-0.02em] text-[#dce2f8] xl:text-[64px]">
      Gestao inteligente. Resultados que energizam <span className="text-[#a9c7ff]">o futuro.</span>
    </h1>

    <p className="max-w-[640px] text-[20px] leading-[1.7] text-[#c1c6d5]">
      Gerencie projetos fotovoltaicos, EMUCs e servicos gerais com eficiencia, seguranca e visao
      completa do portfolio da concessionaria.
    </p>

    <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="min-h-[220px] rounded-xl border border-white/10 bg-[rgba(22,31,48,0.72)] p-7 backdrop-blur-[20px] transition-colors hover:border-[#a9c7ff]"
        >
          <card.icon className="h-10 w-10 text-[#43dde6]" />
          <div className="mt-5">
            <h3 className="text-base font-semibold text-[#dce2f8]">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#c1c6d5]">{card.description}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);
