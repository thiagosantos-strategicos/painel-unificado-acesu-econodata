export type HierarchicalLevel =
  | 'C-Level / Presidência'
  | 'Diretoria'
  | 'Gerência'
  | 'Coordenação / Supervisão'
  | 'Especialista / Consultor'
  | 'Analista'
  | 'Operacional / Assistente'
  | 'Outro / Não Definido';

export type FunctionalSector =
  | 'Prevenção de Perdas & Riscos'
  | 'Segurança Patrimonial & Cibernética'
  | 'Operações & Logística'
  | 'Auditoria & Compliance'
  | 'Tecnologia & Inovação'
  | 'Comercial & Vendas'
  | 'Financeiro & Administrativo'
  | 'Recursos Humanos'
  | 'Geral / Executivo';

export type EnrichmentStatus =
  | 'CONSULTADO'
  | 'CNPJ_IDENTIFICADO'
  | 'NAO_ENCONTRADO'
  | 'CHAVE_AUSENTE'
  | 'SEM_SALDO'
  | 'SEM_PERMISSAO'
  | 'LIMITE_ATINGIDO'
  | 'ERRO_TEMPORARIO';

export interface ParticipantRecord {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  ddd?: string;
  ufOrigemDDD?: string;
  cargo: string;
  cargoNormalizado: string;
  nivelHierarquico: HierarchicalLevel;
  setorFuncional: FunctionalSector;
  empresa: string;
  empresaNormalizada: string;
  cidade: string;
  uf: string;
  cnpj: string;
  isMatriz?: boolean;
  razaoSocial?: string;
  nomeFantasia?: string;
  situacaoCadastral?: string;
  regimeTributario?: string;
  porteEmpresa?: string;
  faturamento?: string;
  faturamentoValor?: number | null;
  faturamentoOrigem?: string;
  cnae?: string;
  naturezaJuridica?: string;
  statusEnriquecimento: EnrichmentStatus;
  origemIdentificacao?: string;
  observacoes?: string;
  dataHoraConfirmacao?: string;
  [key: string]: any;
}

export interface EnrichedCompany {
  id: string;
  chaveNormalizada: string;
  nomeEmpresa: string;
  nomePadronizado: string;
  totalParticipantes: number;
  participantesIds: string[];
  cidade: string;
  uf: string;
  ddd?: string;
  telefone?: string;
  cnpj: string;
  isMatriz: boolean;
  razaoSocial: string;
  nomeFantasia: string;
  situacaoCadastral: string;
  regimeTributario: string;
  porteEmpresa: string;
  faturamento: string;
  faturamentoValor: number | null;
  faturamentoOrigem: string;
  cnae: string;
  naturezaJuridica: string;
  statusEnriquecimento: EnrichmentStatus;
  origemIdentificacao: string;
  observacoes: string;
  logradouro?: string;
  bairro?: string;
  cep?: string;
}

export interface PipelineSummary {
  totalParticipantes: number;
  totalEmpresasUnicas: number;
  cnpjsIdentificados: number;
  cnpjsMatriz: number;
  econodataConsultadas: number;
  faturamentoIdentificado: number;
  naoEncontrados: number;
  errosOuPendentes: number;
  tokensEstimados: number;
  tokensConsumidos: number;
  econodataConfigurada: boolean;
}

export interface EconodataStatus {
  configured: boolean;
  status: string;
  balance?: number;
  error?: string;
}
