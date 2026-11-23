export const SUPRIMENTO_FUNDOS_TEXT = 'Aquisição realizada por meio de Suprimento de Fundos. Dispensada a retenção na fonte do Imposto de Renda (IRRF) e das contribuições sociais (CSLL, PIS/Pasep e Cofins), nos termos do art. 4º, inciso XXI, da Instrução Normativa RFB nº 1.234/2012, c/c arts. 45 a 47 do Decreto nº 93.872/1986.';

export function isSuprimentoFundos(finalidadeCompra?: string): boolean {
  return finalidadeCompra === 'SUPRIMENTO_FUNDOS';
}

export function aplicarRegraSuprimentoFundos<T extends { valor_irrf_calculado?: number; valor_irrf_retido?: number; aplica_irrf_in1234?: boolean; aliquota_irrf_in1234?: number; codigo_retencao_irrf?: string; categoria_irrf_in1234?: string; irrf_dispensa_valor_minimo?: boolean; justificativa_irrf_in1234?: string; base_calculo_irrf_efetiva?: number }>(simulacao: T, baseCalculo: number): T & typeof simulacao {
  return {
    ...simulacao,
    aplica_irrf_in1234: false,
    aliquota_irrf_in1234: 0,
    codigo_retencao_irrf: 'DISPENSADO',
    categoria_irrf_in1234: 'Suprimento de Fundos - Dispensa da retenção federal',
    base_calculo_irrf_efetiva: baseCalculo,
    valor_irrf_calculado: 0,
    valor_irrf_retido: 0,
    irrf_dispensa_valor_minimo: true,
    justificativa_irrf_in1234: SUPRIMENTO_FUNDOS_TEXT
  };
}
