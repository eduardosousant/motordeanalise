import { CalculoFiscalResultado, FiscalFormData } from '../types/fiscal';
import { formatarMoeda } from './formatters';

export const TEXTO_SUPRIMENTO_FUNDOS =
  'Aquisição realizada por meio de Suprimento de Fundos. Dispensada a retenção na fonte do Imposto de Renda (IRRF) e das contribuições sociais (CSLL, PIS/Pasep e Cofins), nos termos do art. 4º, inciso XXI, da Instrução Normativa RFB nº 1.234/2012, c/c arts. 45 a 47 do Decreto nº 93.872/1986.';

export function aplicarSuprimentoFundos(
  data: FiscalFormData,
  calculo: CalculoFiscalResultado
): CalculoFiscalResultado {
  if (!data.suprimentoFundos) return calculo;

  const retencoesDetalhadas = calculo.retencoesDetalhadas.filter(
    (item) => !item.nome.toLowerCase().includes('irrf')
  );
  const deducoesDetalhadas = calculo.deducoesDetalhadas.filter(
    (item) => !item.nome.toLowerCase().includes('irrf')
  );
  const roteiroPassos = calculo.roteiroPassos.filter(
    (passo) => !passo.toLowerCase().includes('irrf')
  );

  const totalRetencoes = retencoesDetalhadas.reduce((total, item) => total + item.valor, 0);
  const totalAbatimentos = calculo.totalAbatimentos;
  const totalDeducoes = totalAbatimentos + totalRetencoes;
  const valorFaturadoAposAbatimento = Math.max(0, calculo.valorBruto - totalAbatimentos);
  const valorLiquido = Math.max(0, valorFaturadoAposAbatimento - totalRetencoes);
  const valorCppPatronal = calculo.valorCppPatronal || 0;
  const custoEfetivoTotal = valorFaturadoAposAbatimento + valorCppPatronal;
  const saldoAdiantamento = calculo.valorSolicitado - custoEfetivoTotal;

  return {
    ...calculo,
    valorIrrfApurado: 0,
    retemIrrfEfetivo: false,
    motivoDispensaIrrf:
      'Dispensa por pagamento realizado por meio de Suprimento de Fundos, nos termos do art. 4º, XXI, da IN RFB nº 1.234/2012.',
    totalRetencoes,
    totalDeducoes,
    valorFaturadoAposAbatimento,
    valorLiquido,
    custoEfetivoTotal,
    saldoAdiantamento,
    isCustoAtendido: saldoAdiantamento >= 0,
    margemTexto:
      saldoAdiantamento >= 0
        ? `Saldo restante de ${formatarMoeda(saldoAdiantamento)}`
        : `Déficit de ${formatarMoeda(Math.abs(saldoAdiantamento))}`,
    retencoesDetalhadas,
    deducoesDetalhadas,
    roteiroPassos,
  };
}

export function adicionarTextoSuprimentoFundos(
  data: FiscalFormData,
  html: string,
  plainText: string
): { html: string; plainText: string } {
  if (!data.suprimentoFundos) return { html, plainText };

  const blocoHtml =
    '<br><b>Texto obrigatório nos Dados Adicionais da NF-e ou da NFS-e:</b><br>' +
    `<i>“${TEXTO_SUPRIMENTO_FUNDOS}”</i><br><br>`;
  const blocoTexto = `\nTexto obrigatório nos Dados Adicionais da NF-e ou da NFS-e:\n“${TEXTO_SUPRIMENTO_FUNDOS}”\n\n`;

  const htmlComTexto = html.includes('<b>4. INFORMAÇÕES AO FORNECEDOR')
    ? html.replace('<b>4. INFORMAÇÕES AO FORNECEDOR', blocoHtml + '<b>4. INFORMAÇÕES AO FORNECEDOR')
    : html + blocoHtml;

  const plainComTexto = plainText.includes('4. INFORMAÇÕES AO FORNECEDOR')
    ? plainText.replace('4. INFORMAÇÕES AO FORNECEDOR', blocoTexto + '4. INFORMAÇÕES AO FORNECEDOR')
    : plainText + blocoTexto;

  return { html: htmlComTexto, plainText: plainComTexto };
}
