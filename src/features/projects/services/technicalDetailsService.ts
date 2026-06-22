import { asString, isRecord } from '@/core/utils/normalize';
import { apiClient } from '@/shared/api/apiClient';
import type { Projeto } from '@/types';
import type { CreateProjectData, UpdateProjectData } from './projectTypes';
import { applyDerivedDadosTecnicos } from './projectNormalizer';

export interface TechnicalDetailResponse {
  id: string;
  project_id: string;
  opening_date?: string | null;
  supply_voltage?: string | null;
  new_project: boolean;
  zero_grid_control: boolean;
  modules: string[];
  inverters: string[];
  entry_standard_items: string[];
  credit_divisions: string[];
  created_at: string;
  updated_at: string;
}

type TechnicalProjectData = Partial<
  Pick<
    CreateProjectData,
    | 'dataAbertura'
    | 'tensaoFornecimento'
    | 'projetoNovo'
    | 'zeroGridControleExportacao'
    | 'modulos'
    | 'inversores'
    | 'padraoEntradaItens'
    | 'divisaoCreditos'
  >
>;

const TECHNICAL_FIELDS: Array<keyof TechnicalProjectData> = [
  'dataAbertura',
  'tensaoFornecimento',
  'projetoNovo',
  'zeroGridControleExportacao',
  'modulos',
  'inversores',
  'padraoEntradaItens',
  'divisaoCreditos',
];

const serializeItems = (items: unknown[] | undefined): string[] =>
  (items ?? []).map((item) => JSON.stringify(item));

const deserializeItems = <T>(items: unknown): T[] =>
  (Array.isArray(items) ? items : []).flatMap((item) => {
    if (typeof item !== 'string') return [];

    try {
      const parsed: unknown = JSON.parse(item);
      return isRecord(parsed) ? [parsed as T] : [];
    } catch {
      return [];
    }
  });

const buildPayload = (projectData: TechnicalProjectData, current?: TechnicalDetailResponse) => ({
  opening_date: projectData.dataAbertura ?? current?.opening_date,
  supply_voltage: projectData.tensaoFornecimento ?? current?.supply_voltage,
  new_project:
    projectData.projetoNovo !== undefined
      ? projectData.projetoNovo === 'sim'
      : (current?.new_project ?? false),
  zero_grid_control:
    projectData.zeroGridControleExportacao !== undefined
      ? projectData.zeroGridControleExportacao === 'sim'
      : (current?.zero_grid_control ?? false),
  modules:
    projectData.modulos !== undefined ? serializeItems(projectData.modulos) : current?.modules,
  inverters:
    projectData.inversores !== undefined
      ? serializeItems(projectData.inversores)
      : current?.inverters,
  entry_standard_items:
    projectData.padraoEntradaItens !== undefined
      ? serializeItems(projectData.padraoEntradaItens)
      : current?.entry_standard_items,
  credit_divisions:
    projectData.divisaoCreditos !== undefined
      ? serializeItems(projectData.divisaoCreditos)
      : current?.credit_divisions,
});

const applyTechnicalDetail = (project: Projeto, detail?: TechnicalDetailResponse): Projeto => {
  if (!detail) return project;

  const modulos = deserializeItems<Projeto['modulos'][number]>(detail.modules);
  const inversores = deserializeItems<Projeto['inversores'][number]>(detail.inverters);
  const padraoEntradaItens = deserializeItems<NonNullable<Projeto['padraoEntradaItens']>[number]>(
    detail.entry_standard_items,
  );
  const divisaoCreditos = deserializeItems<Projeto['divisaoCreditos'][number]>(
    detail.credit_divisions,
  );

  return applyDerivedDadosTecnicos({
    ...project,
    dataAbertura: asString(detail.opening_date) || project.dataAbertura,
    tensaoFornecimento: asString(detail.supply_voltage) || undefined,
    projetoNovo: detail.new_project ? 'sim' : 'nao_ampliacao',
    zeroGridControleExportacao: detail.zero_grid_control ? 'sim' : 'nao',
    modulos,
    inversores,
    padraoEntradaItens,
    divisaoCreditos,
    dadosTecnicos: {
      ...project.dadosTecnicos,
      modulos,
      inversores,
      divisaoCreditos,
    },
  });
};

const endpoint = (projectId: string) => `/projects/${projectId}/technical_details`;

export const technicalDetailsService = {
  hasData(projectData: UpdateProjectData | Record<string, unknown>): boolean {
    return TECHNICAL_FIELDS.some((field) =>
      Object.prototype.hasOwnProperty.call(projectData, field),
    );
  },

  async list(projectId: string): Promise<TechnicalDetailResponse[]> {
    const response = await apiClient.get<TechnicalDetailResponse[]>(endpoint(projectId));
    return Array.isArray(response) ? response : [];
  },

  async save(
    projectId: string,
    projectData: TechnicalProjectData | UpdateProjectData,
  ): Promise<TechnicalDetailResponse> {
    const details = await technicalDetailsService.list(projectId);
    const current = details.at(-1);
    const payload = buildPayload(projectData, current);

    if (current) {
      return apiClient.patch<TechnicalDetailResponse>(
        `${endpoint(projectId)}/${current.id}`,
        payload,
      );
    }

    return apiClient.post<TechnicalDetailResponse>(endpoint(projectId), payload);
  },

  async attach(project: Projeto): Promise<Projeto> {
    const details = await technicalDetailsService.list(project.id);
    return applyTechnicalDetail(project, details.at(-1));
  },

  apply: applyTechnicalDetail,
};
