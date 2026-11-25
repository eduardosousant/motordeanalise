/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FiscalFormData, CalculoFiscalResultado, ItemDeducao } from '../types/fiscal';
import { formatarMoeda } from './formatters';

export function calcularFiscal(data: FiscalFormData): CalculoFiscalResultado {
  const ehServico = data.tipoObjeto === 'servico';
  const valorBruto = Math.max(0, data.valorTotal);
  const valorSolicitado = Math.max(0, data.valorSolicitado ?? data.custoEstimado ?? 0);
  const custoEstimado = valorSolicitado; // mantido para compatibilidade retroativa

  let totalRetencoes = 0;
  let totalAbatimentos = 0;
  const retencoesDetalhadas: ItemDeducao[] = [];
  const abatimentosDetalhados: ItemDeducao[] = [];
  const deducoesDetalhadas: ItemDeducao[] = [];

  // 1. IRRF (Lucro Real ou Presumido) — RETENÇÃO NA FONTE
  let valorIrrfApurado = 0;
  let retemIrrfEfetivo = false;
  let motivoDispensaIrrf = '';

  if (data.suprimentoFundos && data.regimeTributario === 'lucro') {
    motivoDispensaIrrf =
      'Dispensa por pagamento realizado por meio de Suprimento de Fundos.';
  } else if (data.regimeTributario === 'lucro') {
    if (data.metodoIrrf === 'aliquota') {
      valorIrrfApurado = valorBruto * (Math.max(0, data.aliquotaIrrf) / 100);
    } else {
      valorIrrfApurado = Math.max(0, data.valorIrrfFixo);
    }

    if (valorIrrfApurado >= 10.0) {
      retemIrrfEfetivo = true;
      totalRetencoes += valorIrrfApurado;
      const itemIrrf: ItemDeducao = {
        nome: 'IRRF (Imposto de Renda Retido na Fonte)',
        baseLegal: 'IN RFB nº 1.234/2012 e IN RFB nº 2.145/2023',
        valor: valorIrrfApurado,
        descricao: data.metodoIrrf === 'aliquota'
          ? `Alíquota de ${data.aliquotaIrrf.toFixed(2)}% sobre o valor bruto (DAR estadual)`
          : 'Valor fixo informado para retenção (DAR estadual)',
      };
      retencoesDetalhadas.push(itemIrrf);
      deducoesDetalhadas.push(itemIrrf);
    } else if (valorIrrfApurado > 0) {
      motivoDispensaIrrf = `Valor calculado (${formatarMoeda(valorIrrfApurado)}) é inferior a R$ 10,00 (dispensa legal pelo art. 67 da Lei nº 9.430/1996).`;
    }
  }

  // 2. INSS (Serviços) — RETENÇÃO NA FONTE
  let valorInss = 0;
  let retemInssEfetivo = false;
  if (ehServico && data.retemInss && data.regimeTributario !== 'mei') {
    valorInss = valorBruto * 0.11;
    retemInssEfetivo = true;
    totalRetencoes += valorInss;
    const itemInss: ItemDeducao = {
      nome: 'INSS (Retenção Previdenciária de 11%)',
      baseLegal: 'IN RFB nº 2.110/2022',
      valor: valorInss,
      descricao: '11% retido na fonte para recolhimento via DARF',
    };
    retencoesDetalhadas.push(itemInss);
    deducoesDetalhadas.push(itemInss);
  }

  // 3. ISSQN (Serviços) — RETENÇÃO NA FONTE
  let valorIss = 0;
  let retemIssEfetivo = false;
  if (ehServico && data.retemIss && data.valorIss > 0) {
    valorIss = data.valorIss;
    retemIssEfetivo = true;
    totalRetencoes += valorIss;
    const itemIss: ItemDeducao = {
      nome: 'ISSQN (Imposto Sobre Serviços de Qualquer Natureza)',
      baseLegal: `LC 116/2003 - Município de ${data.municipioIss || 'Competência'}`,
      valor: valorIss,
      descricao: `Retenção na fonte para recolhimento via DAM municipal (${data.municipioIss || 'competência'})`,
    };
    retencoesDetalhadas.push(itemIss);
    deducoesDetalhadas.push(itemIss);
  }

  // 4. ICMS (Bens / Mercadorias em Lucro Real/Presumido sem ST) — ABATIMENTO EM NOTA (SEM GUIA)
  let valorDescontoIcms = 0;
  if (!ehServico && data.regimeTributario === 'lucro' && !data.possuiSt && data.valorDescontoIcms > 0) {
    valorDescontoIcms = data.valorDescontoIcms;
    totalAbatimentos += valorDescontoIcms;
    const itemIcms: ItemDeducao = {
      nome: 'Desconto de ICMS (Abatimento / Desoneração na Nota)',
      baseLegal: 'RICMS-MT / Legislação Estadual',
      valor: valorDescontoIcms,
      descricao: 'Abatimento direto no preço da mercadoria faturada. NÃO gera recolhimento de DAR pelo órgão.',
    };
    abatimentosDetalhados.push(itemIcms);
    deducoesDetalhadas.push(itemIcms);
  }

  // 5. Encargo Patronal Previdenciário (MEI CPP 20% - art. 18-B da LC 123/2006)
  let valorCppPatronal = 0;
  if (ehServico && data.regimeTributario === 'mei' && data.servicoSujeitoCppMei) {
    valorCppPatronal = valorBruto * 0.20;
  }

  const totalDeducoes = totalAbatimentos + totalRetencoes;
  const valorFaturadoAposAbatimento = Math.max(0, valorBruto - totalAbatimentos);
  const valorLiquido = Math.max(0, valorBruto - totalDeducoes);

  // CUSTO EFETIVO TOTAL DA OPERAÇÃO:
  // Todos os custos que devem ser desembolsados do Adiantamento:
  // = Valor Líquido (ao fornecedor) + Retenções na Fonte (guias ao Fisco) + CPP Patronal MEI (guia DARF 20%)
  // Como (Valor Líquido + Retenções na Fonte) = Valor Faturado da Nota após abatimento de ICMS:
  const custoEfetivoTotal = valorFaturadoAposAbatimento + valorCppPatronal;
  const custoTotalComEncargos = custoEfetivoTotal;

  // SALDO DO ADIANTAMENTO SOLICITADO:
  // Do valor solicitado pelo responsável, deduzem-se todos os custos reais:
  const saldoAdiantamento = valorSolicitado - custoEfetivoTotal;
  const isCustoAtendido = saldoAdiantamento >= 0;
  const diferencaCusto = saldoAdiantamento; // mantido para compatibilidade retroativa
  const margemTexto = isCustoAtendido
    ? `Saldo restante de ${formatarMoeda(saldoAdiantamento)}`
    : `Déficit de ${formatarMoeda(Math.abs(saldoAdiantamento))}`;

  // 6. Construção dinâmica do roteiro de passos sequenciais (sem saltos)
  const roteiroPassos: string[] = [];
  let stepIndex = 1;

  if (ehServico) {
    if (data.regimeTributario === 'mei' && data.servicoSujeitoCppMei) {
      roteiroPassos.push(
        `${stepIndex++}. Efetuar o pagamento bancário ao fornecedor MEI no valor LÍQUIDO integral de <b>${formatarMoeda(valorLiquido)}</b> (sem descontos na nota fiscal).`
      );
      roteiroPassos.push(
        `${stepIndex++}. Compreender o encargo patronal: O MEI recebe o valor integral. A Autarquia deve arcar com 20% de CPP Patronal (<b>${formatarMoeda(valorCppPatronal)}</b>) com recursos próprios por fora.`
      );
      roteiroPassos.push(
        `${stepIndex++}. Solicitar e pagar a guia de DARF de CPP (20%) no valor de <b>${formatarMoeda(valorCppPatronal)}</b> à Gerência Financeira (<code>gerenciafinanceira@detran.mt.gov.br</code>) com o assunto <i>'DARF CPP ADIANTAMENTO'</i>. <b>Atenção:</b> O adiantamento precisa cobrir o MEI + a DARF (custo total de <b>${formatarMoeda(custoTotalComEncargos)}</b>). Caso o valor solicitado inicial não englobe a CPP, revise o valor solicitado antes do pagamento.`
      );
      if (data.retemIss) {
        roteiroPassos.push(
          `${stepIndex++}. Solicitar à Prefeitura de <b>${data.municipioIss || 'competência'}</b> e pagar a DAM do ISSQN retido.`
        );
      }
      roteiroPassos.push(
        `${stepIndex++}. O que fazer depois do pagamento: Arquivar os comprovantes no processo (comprovante do MEI e da DARF quitada), encaminhar as guias pagas e disponibilizar os comprovantes ao fornecedor.`
      );
    } else {
      roteiroPassos.push(
        `${stepIndex++}. Efetuar o pagamento bancário ao fornecedor no valor LÍQUIDO de <b>${formatarMoeda(valorLiquido)}</b>.`
      );
      // CORREÇÃO: o passo de "compreender a retenção" só existe quando há retenção efetiva
      // ou retenção de ISS marcada ainda a apurar.
      if (retemIrrfEfetivo || retemInssEfetivo) {
        roteiroPassos.push(
          `${stepIndex++}. Compreender a retenção: o desconto do valor bruto ocorreu porque o órgão público é obrigado por lei a reter impostos e repassá-los diretamente ao Fisco.`
        );
      } else if (data.retemIss && !retemIssEfetivo) {
        roteiroPassos.push(
          `${stepIndex++}. Compreender o ISSQN: o serviço terá retenção na fonte pela Prefeitura de <b>${data.municipioIss || 'competência'}</b> conforme a alíquota municipal, a ser apurada sobre a nota — portanto o valor a pagar ao prestador será menor que o total da NFS-e.`
        );
      }

      if (data.retemIss) {
        roteiroPassos.push(
          `${stepIndex++}. Solicitar à Prefeitura de <b>${data.municipioIss || 'competência'}</b> e pagar a DAM do ISSQN retido.`
        );
      }

      if (retemIrrfEfetivo) {
        roteiroPassos.push(
          `${stepIndex++}. Pagar o DAR de IRRF solicitando à Gerência de Execução Financeira (<code>gerenciafinanceira@detran.mt.gov.br</code>) com o assunto <i>'DAR e Comprovante IRRF ADIANTAMENTO'</i>.`
        );
      }

      if (retemInssEfetivo) {
        roteiroPassos.push(
          `${stepIndex++}. Solicitar o DARF de INSS (11%) à Gerência Financeira com o assunto <i>'DARF INSS ADIANTAMENTO'</i>.`
        );
      }

      // CORREÇÃO: menção a guias/atestes de retenção só quando elas existem
      roteiroPassos.push(
        `${stepIndex++}. O que fazer depois do pagamento: Arquivar os comprovantes no processo${retemIrrfEfetivo || retemInssEfetivo || data.retemIss ? ', encaminhar as guias pagas e disponibilizar os comprovantes de retenção ao fornecedor' : ''}.`
      );
    }
  } else {
    roteiroPassos.push(
      `${stepIndex++}. Realizar a conferência física e ateste de recebimento dos bens (conferir item, marca, modelo e quantidade).`
    );
    const detalheDeducoesPagamento =
      valorDescontoIcms > 0 && totalRetencoes > 0
        ? ` (já deduzidos o desconto de ICMS de <b>${formatarMoeda(valorDescontoIcms)}</b> e as retenções na fonte de <b>${formatarMoeda(totalRetencoes)}</b>)`
        : valorDescontoIcms > 0
        ? ` (já deduzido o desconto obrigatório de ICMS de <b>${formatarMoeda(valorDescontoIcms)}</b>, sem emissão nem pagamento de DAR)`
        : totalRetencoes > 0
        ? ` (já deduzidas as retenções na fonte de <b>${formatarMoeda(totalRetencoes)}</b>)`
        : '';

    roteiroPassos.push(
      `${stepIndex++}. Pagar ao fornecedor o valor LÍQUIDO apurado de <b>${formatarMoeda(valorLiquido)}</b>${detalheDeducoesPagamento}.`
    );

    // CORREÇÃO: o passo "Compreender o ICMS/desconto" só existe quando há abatimento;
    // sem ICMS e sem retenção, nada a explicar sobre reduções no valor.
    if (valorDescontoIcms > 0) {
      roteiroPassos.push(
        `${stepIndex++}. Compreender o desconto de ICMS: <b>NÃO HÁ EMISSÃO NEM PAGAMENTO DE DAR DE ICMS.</b> Trata-se de desoneração direta no preço da NF-e. Como o valor faturado é menor que a cotação/solicitação inicial, <b>deve-se revisar o valor solicitado no adiantamento</b> para ajuste ou devolução do saldo excedente.`
      );
    } else if (retemIrrfEfetivo) {
      roteiroPassos.push(
        `${stepIndex++}. Compreender a retenção/desconto: o abatimento efetuado na nota decorre de exigências fiscais legais.`
      );
    }

    if (retemIrrfEfetivo) {
      roteiroPassos.push(
        `${stepIndex++}. Pagar o DAR de IRRF e enviar (comprovante + nota) à Gerência de Execução Financeira (<code>gerenciafinanceira@detran.mt.gov.br</code>).`
      );
    }

    // CORREÇÃO: menção a guias quitadas só quando existe retenção
    roteiroPassos.push(
      `${stepIndex++}. O que fazer depois do pagamento: Arquivar os atestes e comprovantes no processo de pagamento${retemIrrfEfetivo ? ' e disponibilizar as guias quitadas para a contabilidade da empresa' : ''}.`
    );
  }

  return {
    valorBruto,
    valorSolicitado,
    custoEfetivoTotal,
    saldoAdiantamento,
    custoEstimado,
    diferencaCusto,
    isCustoAtendido,
    margemTexto,
    valorIrrfApurado,
    retemIrrfEfetivo,
    motivoDispensaIrrf,
    valorInss,
    retemInssEfetivo,
    valorIss,
    retemIssEfetivo,
    valorDescontoIcms,
    valorCppPatronal,
    custoTotalComEncargos,
    totalAbatimentos,
    totalRetencoes,
    valorFaturadoAposAbatimento,
    totalDeducoes,
    valorLiquido,
    abatimentosDetalhados,
    retencoesDetalhadas,
    deducoesDetalhadas,
    roteiroPassos,
  };
}
