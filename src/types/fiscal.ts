export type RegimeTributario = 'MEI' | 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';

export interface AtividadeEconomica {
  cnae: string;
  descricao: string;
}

export type ProvedorCNPJ = 'auto' | 'receitaws' | 'cnpja' | 'brasilapi' | 'opencnpj';

export interface InfoProvedorCNPJ {
  id: ProvedorCNPJ;
  nome: string;
  descricao: string;
  url: string;
  tipo: 'comercial_token' | 'chave_api' | 'publica';
  ativo: boolean;
}

export interface OrcamentoInput {
  id: string;
  cnpj: string;
  razaoSocial: string;
  regimeTributario: RegimeTributario;
  valor: number;
  cnaePrincipal?: string;
  descricaoCnaePrincipal?: string;
  cnaesSecundarios?: string[];
  atividadesSecundarias?: AtividadeEconomica[];
  observacao?: string;
  provedorOrigem?: string;
}

export interface ServicoInput {
  descricao: string;
  cnae: string;
  solicitante?: string;
  departamento?: string;
  numeroAdiantamento?: string;
}

export type CompatibilidadeCNAE = 'compativel' | 'parcial' | 'incompativel';
export type OrigemCompatibilidadeCNAE = 'principal' | 'secundario' | 'subclasse' | 'divisao' | 'nenhuma';
export type StatusClassificacao = 'recomendado' | 'viavel' | 'desfavoravel' | 'incompativel';

export interface ResultadoOrcamento {
  id: string;
  cnpj: string;
  razaoSocial: string;
  regimeTributario: RegimeTributario;
  valorNominal: number;
  // Artigo 18-B da LC 123/2006
  incideCPP18B: boolean;
  aliquotaCPP: number; // Ex: 0.20 (20%)
  valorCPP: number;
  baseCalculoCPP: number;
  
  // CNAE Principal e Secundários
  compatibilidadeCNAE: CompatibilidadeCNAE;
  origemCompatibilidade?: OrigemCompatibilidadeCNAE;
  cnaeCompativelEncontrado?: string;
  descricaoCnaeCompativel?: string;
  cnaePrestador: string;
  descricaoCnaePrestador: string;
  cnaesSecundarios?: string[];
  atividadesSecundarias?: AtividadeEconomica[];
  justificativaCnae: string;

  // Custo Efetivo
  custoEfetivoTotal: number;
  posicaoRanking: number;
  diferencaParaMelhor: number; // R$
  diferencaPercentual: number; // %

  // Informações adicionais de retenções estimadas (para tomador)
  retencoesEstimadas?: {
    irrf: number;
    pisCofinsCsll: number;
    iss: number;
    inssRetencao: number;
  };

  alertasFiscais: string[];
  status: StatusClassificacao;
}

export interface AnaliseFiscalResponse {
  idAnalise: string;
  dataAnalise: string;
  servico: ServicoInput;
  descricaoCnaeServico: string;
  resultados: ResultadoOrcamento[];
  melhorOrcamento: ResultadoOrcamento;
  economiaEmRelacaoAoMaior: number;
  alertasGerais: string[];
  parecerConclusivo: string;
  fundamentacaoLegal: {
    artigo: string;
    titulo: string;
    resumo: string;
  }[];
}

export interface CnaeItem {
  codigo: string;
  descricao: string;
  sujeitoArt18B?: boolean;
  categoria: string;
}
