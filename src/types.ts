export type PorteEmpresa = "MEI" | "ME" | "EPP" | "DEMAIS";

export type AppTheme = 'INSTITUCIONAL' | 'FINTECH_PRO' | 'DARK_AUDITOR' | 'GOV_CLASSIC';

export type TipoAdquirente = "PRIVADO" | "ORGAO_PUBLICO_ESTADUAL";

export type RegimeTributarioProduto =
  | "Substituição Tributária"
  | "Estimativa Simplificada"
  | "Isento"
  | "TRIBUTAÇÃO NORMAL"
  | "Isento (Órgão Público Estadual)"
  | "Simples Nacional (Sem Isenção - OT 03/2026)"
  | "Substituição Tributária (Sem Isenção - Art. 65 § 3º Anexo IV)"
  | string;

export type FinalidadeCompra =
  | "REVENDA"
  | "USO_CONSUMO"
  | "ATIVO_IMOBILIZADO"
  | "INDUSTRIALIZACAO"
  | "ORGAO_PUBLICO_CONSUMO";

export interface ResumoFornecedor {
  cnpj: string;
  razao_social?: string;
  nome_fantasia?: string;
  uf?: string;
  porte: PorteEmpresa;
  optante_simples: boolean;
  optante_simei?: boolean;
  impacto_tributario_porte: string;
}

export interface CstInfo {
  codigo: string;
  tipo: 'CST' | 'CSOSN';
  descricao: string;
  descricaoCompleta: string;
  badgeClass: string;
}

export interface EnquadramentoProduto {
  ncm: string;
  descricao: string;
  regime_tributario_aplicavel: RegimeTributarioProduto;
  cst_sugerido?: string;
  cst_codigo?: string;
}

export interface Aliquotas {
  aliquota_origem: string;
  aliquota_interna_mt: string;
  mva_ou_pauta: string;
}

export interface FundamentacaoLegal {
  artigo_anexo: string;
  dispositivo: string;
  resumo_regra: string;
}

export interface AnaliseTributariaJSON {
  status_analise: "SUCESSO" | "INFORMAÇÃO_INCOMPLETA";
  resumo_fornecedor: ResumoFornecedor;
  enquadramento_produto: EnquadramentoProduto;
  aliquotas: Aliquotas;
  fundamentacao_legal: FundamentacaoLegal[];
  orientacao_fiscal: string;
}

export interface SimulacaoMemoriaCalculo {
  base_calculo_origem: number;
  icms_origem_destacado: number;
  mva_percentual?: number;
  base_calculo_st?: number;
  icms_st_devido?: number;
  carga_media_percentual?: number;
  icms_estimativa_simplificada_devido?: number;
  difal_devido?: number;
  
  // Descontos e Benefícios Fiscais
  valor_desconto_comercial?: number;
  desconto_isencao_orgao_publico?: number;
  desconto_reducao_bc_anexo_v?: number;
  economia_tributaria_total?: number;
  valor_liquido_com_desconto?: number;

  // Retenção do Imposto de Renda na Fonte (IRRF - IN RFB nº 1.234/2012 e STF Tema 1130)
  aplica_irrf_in1234?: boolean;
  aliquota_irrf_in1234?: number;
  codigo_retencao_irrf?: string;
  categoria_irrf_in1234?: string;
  valor_irrf_retido?: number;
  justificativa_irrf_in1234?: string;
  valor_liquido_pagamento_fornecedor?: number;

  total_recolher_mt: number;
}

export interface ItemNotaFiscal {
  id: string;
  ncm: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  valor_desconto_comercial?: number;
  valor_frete?: number;
  valor_despesas?: number;
  icms_proprio_destacado?: number;
}

export interface AnaliseItemFiscal {
  item: ItemNotaFiscal;
  jsonResponse: AnaliseTributariaJSON;
  simulacao: SimulacaoMemoriaCalculo;
}

export interface ResumoConsolidadoNota {
  total_itens_qtd: number;
  total_valor_bruto: number;
  total_desconto_comercial: number;
  total_frete_despesas: number;
  total_base_calculo: number;
  total_desconto_isencao_icms: number;
  total_economia_reducao_bc: number;
  total_economia_tributaria: number;
  total_irrf_retido: number;
  total_liquido_pagar_fornecedor: number;
  total_icms_recolher_mt: number;
  total_icms_origem_destacado: number;
}

export interface AnaliseConsolidadaNota {
  itensAnalise: AnaliseItemFiscal[];
  resumoConsolidado: ResumoConsolidadoNota;
}

export interface OperacaoComercial {
  cnpj_fornecedor: string;
  razao_social_fornecedor?: string;
  uf_origem: string;
  uf_destino: string;
  ncm: string;
  descricao_produto: string;
  finalidade_compra: FinalidadeCompra;
  tipo_adquirente?: TipoAdquirente;
  valor_operacao: number;
  valor_desconto_comercial?: number;
  valor_frete?: number;
  valor_despesas?: number;
  icms_proprio_destacado?: number;
  simples_remetente?: boolean;
  porte_remetente?: PorteEmpresa;
  itens?: ItemNotaFiscal[];
}

export interface CnpjApiResult {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  porte: PorteEmpresa;
  optante_simples: boolean;
  optante_simei: boolean;
  uf: string;
  municipio: string;
  cnae_principal_codigo?: string;
  cnae_principal_descricao?: string;
  situacao_cadastral?: string;
  fonte_api: string;
}

export interface HistoricoAnaliseItem {
  id: string;
  timestamp: number;
  dataHoraFormatada: string;
  cnpj_digitado: string;
  supplierData: CnpjApiResult | null;
  operacao: OperacaoComercial;
  jsonResponse: AnaliseTributariaJSON;
  simulacaoCalculo: SimulacaoMemoriaCalculo;
  fonteAnalise: 'CACHE_AI_LOCAL' | 'GEMINI_AI_AO_VIVO' | 'MOTOR_DETERMINISTICO_LOCAL';
}
