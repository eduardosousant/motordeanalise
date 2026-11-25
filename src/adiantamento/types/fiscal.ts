/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TipoObjeto = 'servico' | 'bens';
export type RegimeTributario = 'simples' | 'mei' | 'lucro';
export type StatusCadastro = 'regular' | 'atualizacao';
export type MetodoIrrf = 'aliquota' | 'fixo';

export interface FiscalFormData {
  fornecedor: string;
  cnpj: string;
  responsavel: string;
  valorSolicitado: number;
  custoEstimado?: number;
  processo?: string;
  setorLotacao?: string;

  tipoObjeto: TipoObjeto;
  regimeTributario: RegimeTributario;
  valorTotal: number;

  // Quando marcado, a operação é considerada aquisição por Suprimento de Fundos.
  suprimentoFundos?: boolean;

  metodoIrrf: MetodoIrrf;
  aliquotaIrrf: number;
  valorIrrfFixo: number;

  statusCadastro: StatusCadastro;
  cnaeCodigo: string;
  cnaeDescricao: string;

  itemLc: string;
  lcDescricao: string;
  municipioIss: string;
  retemIss: boolean;
  valorIss: number;
  retemInss: boolean;
  servicoSujeitoCppMei: boolean;

  possuiSt: boolean;
  valorDescontoIcms: number;
  legislacaoPersonalizada?: string;
}

export interface ItemDeducao {
  nome: string;
  baseLegal: string;
  valor: number;
  descricao: string;
}

export interface CalculoFiscalResultado {
  valorBruto: number;
  valorSolicitado: number;
  custoEfetivoTotal: number;
  saldoAdiantamento: number;
  isCustoAtendido: boolean;
  margemTexto: string;

  custoEstimado: number;
  diferencaCusto: number;

  valorIrrfApurado: number;
  retemIrrfEfetivo: boolean;
  motivoDispensaIrrf?: string;

  valorInss: number;
  retemInssEfetivo: boolean;
  valorIss: number;
  retemIssEfetivo: boolean;
  valorDescontoIcms: number;

  valorCppPatronal?: number;
  custoTotalComEncargos?: number;

  totalAbatimentos: number;
  totalRetencoes: number;
  valorFaturadoAposAbatimento: number;
  totalDeducoes: number;
  valorLiquido: number;

  abatimentosDetalhados: ItemDeducao[];
  retencoesDetalhadas: ItemDeducao[];
  deducoesDetalhadas: ItemDeducao[];
  roteiroPassos: string[];
}

export interface DespachoGerado {
  id: string;
  criadoEm: string;
  formData: FiscalFormData;
  calculo: CalculoFiscalResultado;
  htmlContent: string;
  plainTextContent: string;
}
