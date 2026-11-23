import { SimulacaoMemoriaCalculo } from '../types.js';
import { SUPRIMENTO_FUNDOS_TEXT } from '../data/suprimentoFundos.js';

export function isSuprimentoFundos(finalidade: unknown): boolean {
  return finalidade === 'SUPRIMENTO_FUNDOS';
}

/** Keeps ICMS deductions intact while disabling federal withholding for this purchase modality. */
export function aplicarDispensaSuprimentoFundos<T extends SimulacaoMemoriaCalculo>(
  simulacao: T,
  baseCalculo: number = simulacao.base_calculo_origem
): T {
  const base = Number(baseCalculo) || 0;
  const abatimentosIcms = (simulacao.desconto_isencao_orgao_publico || 0) + (simulacao.valor_glosa_icms || 0);
  return {
    ...simulacao,
    aplica_irrf_in1234: false,
    aliquota_irrf_in1234: 0,
    codigo_retencao_irrf: 'DISPENSADO',
    categoria_irrf_in1234: 'Suprimento de Fundos - dispensa de retenções federais',
    base_calculo_irrf_efetiva: base,
    valor_irrf_calculado: 0,
    valor_irrf_retido: 0,
    irrf_dispensa_valor_minimo: false,
    justificativa_irrf_in1234: SUPRIMENTO_FUNDOS_TEXT,
    valor_liquido_pagamento_fornecedor: Math.max(0, base - abatimentosIcms),
    texto_informacoes_adicionais_nfe_nfse: SUPRIMENTO_FUNDOS_TEXT,
    retencao_csll_dispensada: true,
    retencao_pis_pasep_dispensada: true,
    retencao_cofins_dispensada: true
  };
}
