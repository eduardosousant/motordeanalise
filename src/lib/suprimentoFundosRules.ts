import { SUPRIMENTO_FUNDOS_TEXT } from '../data/suprimentoFundos.js';

export function isSuprimentoFundos(finalidade: unknown): boolean {
  return finalidade === 'SUPRIMENTO_FUNDOS';
}

export function aplicarDispensaSuprimentoFundos<T extends Record<string, unknown>>(resultado: T, baseCalculo: number): T {
  const base = Number(baseCalculo) || 0;
  return {
    ...resultado,
    aplica_irrf_in1234: false,
    aliquota_irrf_in1234: 0,
    codigo_retencao_irrf: 'DISPENSADO',
    categoria_irrf_in1234: 'Suprimento de Fundos - dispensa federal',
    base_calculo_irrf_efetiva: base,
    valor_irrf_calculado: 0,
    valor_irrf_retido: 0,
    irrf_dispensa_valor_minimo: true,
    justificativa_irrf_in1234: SUPRIMENTO_FUNDOS_TEXT,
    valor_liquido_pagamento_fornecedor: base,
    texto_informacoes_adicionais_nfe_nfse: SUPRIMENTO_FUNDOS_TEXT
  } as T;
}
