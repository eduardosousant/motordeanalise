export const SUPRIMENTO_FUNDOS_TEXT = 'Aquisição realizada por meio de Suprimento de Fundos. Dispensada a retenção na fonte do Imposto de Renda (IRRF) e das contribuições sociais (CSLL, PIS/Pasep e Cofins), nos termos do art. 4º, inciso XXI, da Instrução Normativa RFB nº 1.234/2012, c/c arts. 45 a 47 do Decreto nº 93.872/1986.';

export function isSuprimentoFundos(finalidadeCompra?: string): boolean {
  return finalidadeCompra === 'SUPRIMENTO_FUNDOS';
}
