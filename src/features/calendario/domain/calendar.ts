import type { Projeto, Servico } from '@/types';

export type TipoEventoManual = 'instalacao' | 'manutencao' | 'reuniao' | 'vistoria';
export type OrigemAgenda = 'evento' | 'projeto' | 'servico';
export type FiltroAgenda = 'todos' | OrigemAgenda;

export interface EventoManual {
  id: string;
  titulo: string;
  data: string;
  hora: string;
  tipo: TipoEventoManual;
  local: string;
  participantes: string[];
  descricao: string;
}

export interface AgendaItem {
  id: string;
  origem: OrigemAgenda;
  subtipo?: TipoEventoManual;
  titulo: string;
  data: string;
  hora: string;
  local: string;
  descricao: string;
  participantes: string[];
}

const now = new Date();
export const CURRENT_YEAR = now.getFullYear();
export const CURRENT_MONTH = now.getMonth() + 1;

export const dayToDate = (day: number) =>
  `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export const createEmptyEventoForm = () => ({
  titulo: '',
  tipo: 'instalacao' as TipoEventoManual,
  data: dayToDate(now.getDate()),
  hora: '09:00',
  local: '',
  participantes: '',
  descricao: '',
});

export const extractDateAndTime = (value: string): { data: string; hora: string } | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const data = parsed.toISOString().slice(0, 10);
  const hasTime = value.includes('T');
  const hora = hasTime ? parsed.toISOString().slice(11, 16) : '09:00';
  return { data, hora };
};

export const getLocalProjeto = (projeto: Projeto) => {
  const cidadeEstado = [projeto.endereco.cidade, projeto.endereco.estado]
    .filter(Boolean)
    .join(' - ');
  if (cidadeEstado) {
    return cidadeEstado;
  }

  if (projeto.endereco.logradouro) {
    return projeto.endereco.logradouro;
  }

  return 'Local nao informado';
};

export const getLocalServico = (servico: Servico) => {
  const endereco = servico.enderecoObra ?? servico.enderecoGeradora;
  const cidadeEstado = [endereco?.cidade, endereco?.estado].filter(Boolean).join(' - ');
  if (cidadeEstado) {
    return cidadeEstado;
  }

  if (endereco?.logradouro) {
    return endereco.logradouro;
  }

  return servico.concessionaria || 'Local nao informado';
};

export const buildAgendaItems = (
  eventosManuais: EventoManual[],
  projetos: Projeto[],
  servicos: Servico[],
): AgendaItem[] => {
  const eventos = eventosManuais.map((item) => ({
    id: item.id,
    origem: 'evento' as const,
    subtipo: item.tipo,
    titulo: item.titulo,
    data: item.data,
    hora: item.hora,
    local: item.local,
    descricao: item.descricao,
    participantes: item.participantes,
  }));

  const projetosAgenda = projetos.flatMap((projeto) => {
    const baseTitulo = `Projeto ${projeto.protocolo} - ${projeto.cliente.nome}`;
    const local = getLocalProjeto(projeto);
    const timeline = Array.isArray(projeto.timeline) ? projeto.timeline : [];

    const itensTimeline: AgendaItem[] = timeline
      .map<AgendaItem | null>((item) => {
        const parsed = extractDateAndTime(item.data);
        if (!parsed) {
          return null;
        }

        return {
          id: `projeto-${projeto.id}-timeline-${item.id}`,
          origem: 'projeto' as const,
          titulo: `${baseTitulo} - ${item.etapa}`,
          data: parsed.data,
          hora: parsed.hora,
          local,
          descricao: item.descricao || `Etapa ${item.etapa} (${item.status})`,
          participantes: ['Equipe de Projetos'],
        };
      })
      .filter((item): item is AgendaItem => item !== null);

    if (itensTimeline.length > 0) {
      return itensTimeline;
    }

    const parsedCriacao = extractDateAndTime(projeto.dataCriacao);
    if (!parsedCriacao) {
      return [];
    }

    return [
      {
        id: `projeto-${projeto.id}-criacao`,
        origem: 'projeto' as const,
        titulo: `${baseTitulo} - Cadastro do projeto`,
        data: parsedCriacao.data,
        hora: parsedCriacao.hora,
        local,
        descricao: 'Projeto cadastrado no sistema.',
        participantes: ['Equipe de Projetos'],
      },
    ];
  });

  const servicosAgenda = servicos.flatMap((servico) => {
    const baseTitulo = `${servico.nome} - ${servico.cliente}`;
    const local = getLocalServico(servico);
    const timeline = Array.isArray(servico.timeline) ? servico.timeline : [];

    const itensTimeline: AgendaItem[] = timeline
      .map<AgendaItem | null>((item) => {
        const parsed = extractDateAndTime(item.data);
        if (!parsed) {
          return null;
        }

        return {
          id: `servico-${servico.id}-timeline-${item.id}`,
          origem: 'servico' as const,
          titulo: `${baseTitulo} - ${item.etapa}`,
          data: parsed.data,
          hora: parsed.hora,
          local,
          descricao: item.descricao || `Etapa ${item.etapa} (${item.status})`,
          participantes: ['Equipe de Servicos'],
        };
      })
      .filter((item): item is AgendaItem => item !== null);

    if (itensTimeline.length > 0) {
      return itensTimeline;
    }

    const parsedAbertura = extractDateAndTime(servico.dataAbertura || servico.dataCriacao);
    if (!parsedAbertura) {
      return [];
    }

    return [
      {
        id: `servico-${servico.id}-abertura`,
        origem: 'servico' as const,
        titulo: `${baseTitulo} - Abertura do servico`,
        data: parsedAbertura.data,
        hora: parsedAbertura.hora,
        local,
        descricao: servico.observacoes || 'Servico cadastrado no sistema.',
        participantes: ['Equipe de Servicos'],
      },
    ];
  });

  return [...eventos, ...projetosAgenda, ...servicosAgenda];
};

export const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];
  for (let index = 0; index < startingDayOfWeek; index += 1) days.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) days.push(day);
  return days;
};

export const formatMonthYear = (date: Date) =>
  date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export const formatDateBR = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');

export const getTipoColor = (item: AgendaItem) => {
  if (item.origem === 'projeto') return 'bg-blue-900/50 text-blue-300 border-blue-700';
  if (item.origem === 'servico') return 'bg-green-900/50 text-green-300 border-green-700';
  if (item.subtipo === 'manutencao') return 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
  if (item.subtipo === 'reuniao') return 'bg-purple-900/50 text-purple-300 border-purple-700';
  if (item.subtipo === 'vistoria') return 'bg-cyan-900/50 text-cyan-300 border-cyan-700';
  return 'bg-orange-900/50 text-orange-300 border-orange-700';
};

export const getTipoIcon = (item: AgendaItem) => {
  if (item.origem === 'projeto') return 'PR';
  if (item.origem === 'servico') return 'SV';
  if (item.subtipo === 'manutencao') return 'MN';
  if (item.subtipo === 'reuniao') return 'RE';
  if (item.subtipo === 'vistoria') return 'VS';
  return 'IN';
};

export const getOrigemLabel = (origem: OrigemAgenda) => {
  if (origem === 'projeto') return 'Projeto';
  if (origem === 'servico') return 'Servico';
  return 'Evento';
};
