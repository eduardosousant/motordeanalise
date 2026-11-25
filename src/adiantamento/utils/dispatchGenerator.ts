/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FiscalFormData, CalculoFiscalResultado, ItemDeducao } from '../types/fiscal';
import { formatarMoeda, htmlParaTextoLimpo } from './formatters';

const INTRODUCAO_PARECER =
  'Este parecer limita-se à conferência da conformidade tributária, das alíquotas aplicáveis e dos cálculos de retenção na fonte do orçamento apresentado, e <b>não constitui aprovação do mérito da contratação</b> — a escolha do modelo de contratação e a condução do processo seguem sob a responsabilidade da área requisitante e do ordenador de despesas.';

const FECHO_RESSALVA =
  'Ressalta-se: a assinatura deste parecer não implica aprovação da legalidade da contratação, competindo essa avaliação ao ordenador de despesas.';

/**
 * Gera a Seção 5: Fundamentação Legal e Referências Normativas aplicáveis ao caso concreto,
 * permitindo que o usuário inclua também legislações complementares ou personalizadas.
 */
function gerarFundamentacaoLegal(
  formData: FiscalFormData,
  calc: CalculoFiscalResultado
): string {
  const ehServico = formData.tipoObjeto === 'servico';
  const itensLegais: string[] = [];

  // 1. IRRF (Geral para órgãos públicos estaduais)
  if (formData.suprimentoFundos) {
    itensLegais.push(
      '• <b>IRRF (Aquisição por Suprimento de Fundos):</b> Dispensa da retenção na fonte nos termos do art. 4º, XXI, da IN RFB nº 1.234/2012.'
    );
  } else {
    itensLegais.push(
      '• <b>IRRF (Imposto de Renda na Fonte):</b> Instrução Normativa RFB nº 1.234/2012, alterada pela Instrução Normativa RFB nº 2.145/2023 (retenção ampla em pagamentos efetuados por órgãos e autarquias estaduais).'
    );
  }

  // Dispensa de IRRF inferior a R$ 10,00
  if (!formData.suprimentoFundos && formData.regimeTributario === 'lucro' && !calc.retemIrrfEfetivo) {
    itensLegais.push(
      '• <b>Dispensa de IRRF &lt; R$ 10,00:</b> Lei Federal nº 9.430/1996, art. 67 (veda a utilização de DARF para valor inferior a dez reais).'
    );
  }

  // 2. Regime Tributário (Simples Nacional ou MEI)
  if (formData.regimeTributario === 'simples' || formData.regimeTributario === 'mei') {
    itensLegais.push(
      '• <b>Regime Tributário Simplificado:</b> Lei Complementar Federal nº 123/2006 (Estatuto Nacional da ME e EPP) e art. 4º, inciso XI, da IN RFB nº 1.234/2012 (dispensa de retenção na fonte para optantes).'
    );
  }

  // 2.1 MEI - Ocupações Permitidas e Enquadramento CGSN
  if (formData.regimeTributario === 'mei') {
    itensLegais.push(
      '• <b>Ocupações Permitidas ao MEI:</b> Anexo XI da Resolução CGSN nº 140, de 22 de maio de 2018 (arts. 100 e 101, § 1º, inciso I, § 2º) — Tabelas A e B (relação de atividades e ocupações autorizadas ao Microempreendedor Individual).'
    );
  }

  // 3. MEI com encargo patronal (CPP 20%)
  if (ehServico && formData.regimeTributario === 'mei' && formData.servicoSujeitoCppMei) {
    itensLegais.push(
      '• <b>CPP Patronal MEI (20%):</b> Art. 18-B da Lei Complementar nº 123/2006 c/c art. 201 da Instrução Normativa RFB nº 2.110/2022 (obrigatoriedade de recolhimento da cota patronal previdenciária pelo contratante).'
    );
  }

  // 4. INSS 11% sobre serviços
  if (ehServico && (calc.retemInssEfetivo || formData.retemInss)) {
    itensLegais.push(
      '• <b>INSS (Retenção Previdenciária):</b> Lei Federal nº 8.212/1991, art. 31, e Instrução Normativa RFB nº 2.110/2022 (retenção de 11% sobre o valor bruto da cessão de mão de obra / prestação de serviços).'
    );
  }

  // 5. ISSQN sobre serviços
  if (ehServico) {
    itensLegais.push(
      `• <b>ISSQN (Imposto Sobre Serviços):</b> Lei Complementar Federal nº 116/2003 (critérios de incidência e local da prestação) e Código Tributário do Município de ${formData.municipioIss ? `<b>${formData.municipioIss}</b>` : 'competência'}.`
    );
  }

  // 6. ICMS (Bens / Mercadorias)
  if (!ehServico) {
    if (formData.valorDescontoIcms > 0) {
      itensLegais.push(
        '• <b>ICMS (Desoneração para Órgãos Públicos):</b> Regulamento do ICMS do Estado de Mato Grosso (RICMS-MT) e Convênio ICMS nº 26/2003 c/c Convênio ICMS nº 73/2004 (desconto obrigatório no preço equivalente ao imposto dispensado nas vendas à Administração Pública, sem recolhimento de DAR).'
      );
    } else {
      itensLegais.push(
        '• <b>ICMS (Circulação de Mercadorias):</b> Lei Complementar Federal nº 87/1996 (Lei Kandir) e Regulamento do ICMS do Estado de Mato Grosso (RICMS-MT).'
      );
    }
  }

  // 7. Consulta e Classificação Nacional de Atividades Econômicas (CNAE / CONCLA - IBGE)
  itensLegais.push(
    '• <b>Consulta e Enquadramento de CNAE:</b> Comissão Nacional de Classificação — CONCLA / IBGE (disponível em: https://concla.ibge.gov.br/busca-online-cnae.html).'
  );

  // 8. Legislação Complementar / Personalizada informada pelo usuário no formulário
  if (formData.legislacaoPersonalizada && formData.legislacaoPersonalizada.trim()) {
    const linhasCustom = formData.legislacaoPersonalizada
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    for (const linha of linhasCustom) {
      const linhaFormatada = linha.startsWith('•') ? linha : `• <b>Legislação Complementar:</b> ${linha}`;
      itensLegais.push(linhaFormatada);
    }
  }

  return `<br><b>5. BASE LEGAL E REFERÊNCIAS NORMATIVAS</b><br>${itensLegais.join('<br>')}<br><br>`;
}

/**
 * Seção 1 do parecer: orientações em linguagem simples para o responsável.
 * Reaproveita as mesmas condições do parecer técnico (isCustoAtendido,
 * totalAbatimentos, servicoSujeitoCppMei), sem duplicar lógica.
 */
function gerarOrientacoesSimples(
  formData: FiscalFormData,
  calc: CalculoFiscalResultado
): string {
  const ehServico = formData.tipoObjeto === 'servico';
  const valorSolicitadoFmt = formatarMoeda(calc.valorSolicitado);
  const valorFaturadoFmt = formatarMoeda(calc.valorFaturadoAposAbatimento);
  const valorLiquidoFmt = formatarMoeda(calc.valorLiquido);
  const deficitFmt = formatarMoeda(Math.abs(calc.saldoAdiantamento));

  const fraseObjeto = ehServico
    ? 'Acompanhe e confira o serviço executado antes do pagamento'
    : 'Compre e confira os itens na entrega (marca, modelo e quantidade)';

  const fraseGuardarDoc = ehServico
    ? 'Guarde a NFS-e, o comprovante de pagamento e a evidência do serviço executado para a prestação de contas.'
    : 'Guarde a nota, o comprovante de pagamento e o comprovante de recebimento para a prestação de contas.';

  const fraseCustos = ehServico ? 'do serviço' : 'da compra';

  const temRetencao = calc.totalRetencoes > 0;
  const valorPagar = temRetencao ? valorLiquidoFmt : valorFaturadoFmt;

  // [OPCIONAL] Detecção de "retenção marcada, mas valor ainda não informado" (ISS municipal a apurar).
  // Remova os blocos marcados com [OPCIONAL] se preferir validar isso no formulário.
  const issAApurar = ehServico && formData.retemIss && !calc.retemIssEfetivo;

  // Descreve cada guia conforme o fluxo real da Gerência:
  // IRRF -> guia emitida no parecer e anexada ao e-mail; INSS/CPP -> solicita DARF à Gerência; ISSQN -> DAM na Prefeitura
  const descreverGuias = (): string => {
    const partes: string[] = [];
    if (calc.retemIrrfEfetivo) {
      partes.push(`IRRF de <b>${formatarMoeda(calc.valorIrrfApurado)}</b> (a guia <b>acompanha este parecer</b> — basta pagar e enviar o comprovante à Gerência de Execução Financeira)`);
    }
    if (calc.retemInssEfetivo) {
      partes.push(`INSS de <b>${formatarMoeda(calc.valorInss)}</b> (solicite o DARF pelo e-mail <code>gerenciafinanceira@detran.mt.gov.br</code>, assunto "DARF INSS ADIANTAMENTO", e pague)`);
    }
    if (calc.retemIssEfetivo) {
      partes.push(`ISSQN de <b>${formatarMoeda(calc.valorIss)}</b> (solicite e pague a DAM na Prefeitura de <b>${formData.municipioIss || 'competência'}</b> e envie o comprovante)`);
    }
    // [OPCIONAL]
    if (issAApurar) {
      partes.push(`ISSQN a apurar (retenção na fonte pela Prefeitura de <b>${formData.municipioIss || 'competência'}</b>, conforme alíquota municipal aplicada sobre a nota)`);
    }
    return partes.join('; ');
  };

  const introSessao = `<i>O essencial para você está nesta seção, as seguintes trazem detalhes técnico, você não precisa se preocupar com elas.</i><br>`;

  // Caso especial: serviço MEI sujeito a CPP (encargo patronal)
  if (ehServico && formData.regimeTributario === 'mei' && formData.servicoSujeitoCppMei) {
    const valorCppCalc = calc.valorCppPatronal || calc.valorBruto * 0.2;
    const custoTotalFmt = formatarMoeda(calc.custoEfetivoTotal);
    return `${introSessao}O valor de <b>${valorSolicitadoFmt} ${calc.isCustoAtendido ? 'É SUFICIENTE para cobrir todos os custos' : `NÃO É SUFICIENTE — você deve pedir complementação de ${deficitFmt} ANTES de efetuar o pagamento`}.</b><br><br>
<b>1)</b> ${fraseObjeto}. O prestador recebe o valor INTEGRAL da nota (<b>${valorLiquidoFmt}</b>) — ele não sofre desconto.<br>
<b>2)</b> <b>ATENÇÃO:</b> além da nota, a contratação exige o DARF da CPP Patronal de 20% (<b>${formatarMoeda(valorCppCalc)}</b>), que é pago a partir de sua solicitação pelo e-mail <code>gerenciafinanceira@detran.mt.gov.br</code>, assunto "DARF CPP ADIANTAMENTO". O custo total (serviço + CPP) é de <b>${custoTotalFmt}</b>.<br>
<b>3)</b> ${fraseGuardarDoc}<br><br>`;
  }

  if (calc.isCustoAtendido) {
    // SUFICIENTE
    if (calc.totalAbatimentos > 0) {
      // Bens com desconto de ICMS (retenção aqui só pode ser IRRF)
      return `${introSessao}O valor de <b>${valorSolicitadoFmt} É SUFICIENTE</b> para cobrir todos os custos ${fraseCustos}.<br><br>
<b>1)</b> ${fraseObjeto}.<br>
<b>2)</b> <b>Sobre o preço:</b> a nota sai com desconto obrigatório de ICMS de <b>${formatarMoeda(calc.totalAbatimentos)}</b> (valor faturado: <b>${valorFaturadoFmt}</b>).${temRetencao ? ` Há ainda ${descreverGuias()}.` : ''} <b>Pague ao fornecedor exatamente ${valorPagar}.</b><br>
<b>3)</b> ${calc.saldoAdiantamento > 0
        ? `Como o adiantamento era maior que o custo final, <b>sobra um saldo de ${deficitFmt}</b>, a ser devolvido ou comprovado. <b>Sugere-se ajustar o valor do adiantamento para ${valorFaturadoFmt} para evitar sobra.</b>`
        : `O valor solicitado corresponde <b>exatamente ao custo final</b> — não há sobra a devolver nem a complementar.`}<br>
<b>4)</b> ${fraseGuardarDoc}<br><br>`;
    }
    // Padrão: sem desconto de ICMS
    return `${introSessao}O valor de <b>${valorSolicitadoFmt} É SUFICIENTE</b> para cobrir todos os custos ${fraseCustos}.<br><br>
<b>1)</b> ${fraseObjeto}.<br>
<b>2)</b> Pague ao fornecedor ${
      temRetencao
        ? `<b>${valorLiquidoFmt}</b> — a nota sai retida; há ${descreverGuias()}`
        : issAApurar
        ? `<b>até ${valorLiquidoFmt}</b> — como o ISS municipal ainda está a apurar, será descontado o ISS retido na fonte pela Prefeitura de <b>${formData.municipioIss || 'competência'}</b>; o valor final é a nota menos esse ISS`
        : `o valor integral de <b>${valorLiquidoFmt}</b> (sem retenções)`
    }.<br>
<b>3)</b> ${fraseGuardarDoc}<br><br>`;
  }

  // INSUFICIENTE
  return `${introSessao}⚠️ O valor de <b>${valorSolicitadoFmt} NÃO É SUFICIENTE.</b><br><br>
A operação custa mais do que o solicitado (falta um valor de <b>${deficitFmt}</b>).<br>
<b>Ação necessária:</b> antes de efetuar o pagamento, solicite a <b>complementação do valor do adiantamento</b> para cobrir o custo total de <b>${formatarMoeda(calc.custoEfetivoTotal)}</b>.<br><br>`;
}

export function gerarTextoDespacho(
  formData: FiscalFormData,
  calc: CalculoFiscalResultado
): { html: string; plainText: string } {
  const ehServico = formData.tipoObjeto === 'servico';
  const regimeNome =
    formData.regimeTributario === 'simples'
      ? 'Simples Nacional'
      : formData.regimeTributario === 'mei'
      ? 'MEI'
      : 'Lucro Real ou Presumido';

  const valorFormatado = formatarMoeda(calc.valorBruto);
  const valorSolicitadoFmt = formatarMoeda(calc.valorSolicitado);
  const totalDeducoesFmt = formatarMoeda(calc.totalDeducoes);
  const totalAbatimentosFmt = formatarMoeda(calc.totalAbatimentos);
  const totalRetencoesFmt = formatarMoeda(calc.totalRetencoes);
  const valorFaturadoFmt = formatarMoeda(calc.valorFaturadoAposAbatimento);
  const valorLiquidoFmt = formatarMoeda(calc.valorLiquido);
  const custoEfetivoTotalFmt = formatarMoeda(calc.custoEfetivoTotal);

  // Análise de Custos e Cobertura do Adiantamento
  const saldoAdiantamentoAbs = Math.abs(calc.saldoAdiantamento);
  const saldoFmt = formatarMoeda(saldoAdiantamentoAbs);

  // Frases da Situação do Saldo, com tratamento para saldo exatamente zero
  const situacaoSaldoPadrao = saldoAdiantamentoAbs > 0
    ? `O valor solicitado cobre todas as despesas com <b>saldo positivo de ${saldoFmt}</b> a ser devolvido ou comprovado na prestação de contas.`
    : `O valor solicitado corresponde <b>exatamente ao custo total</b> da despesa — não há sobra a devolver nem a complementar.`;
  const situacaoSaldoIcms = saldoAdiantamentoAbs > 0
    ? `O adiantamento é <b>SUFICIENTE</b> e apresentará uma <b>sobra de saldo de ${saldoFmt}</b>. <b>Sugere-se ao responsável ajustar o valor do adiantamento para ${valorFaturadoFmt}</b>, evitando empenho a maior e sobra de saldo na prestação de contas.`
    : `O valor solicitado corresponde <b>exatamente ao valor faturado da NF-e</b> — não há sobra a devolver nem a complementar.`;
  const situacaoSaldoMei = saldoAdiantamentoAbs > 0
    ? `O recurso cobre integralmente o pagamento do prestador e a guia previdenciária da Autarquia, restando <b>saldo de ${saldoFmt}</b> para prestação de contas.`
    : `O valor solicitado corresponde <b>exatamente ao custo total</b> (nota do MEI + DARF da CPP) — não há sobra a devolver nem a complementar.`;
    // Detalhamento do custo: só discrimina "repassado + guias" quando há retenção na fonte
  const detalheCustosPadrao = calc.totalRetencoes > 0
    ? `(<b>${custoEfetivoTotalFmt}</b>, sendo <b>${valorLiquidoFmt}</b> repassado ao fornecedor e <b>${totalRetencoesFmt}</b> recolhido em guias tributárias)`
    : `(<b>${custoEfetivoTotalFmt}</b>, integralmente repassado ao fornecedor — sem retenções nem guias tributárias)`;

  let analiseCustosResp = '';
  if (calc.totalAbatimentos > 0) {
    if (calc.isCustoAtendido) {
      analiseCustosResp = `• <b>ATENDIDO (COM RESSALVA DE DESCONTO DE ICMS).</b><br> Do valor solicitado pelo responsável (<b>${valorSolicitadoFmt}</b>) deduzem-se todos os custos reais da operação (<b>${custoEfetivoTotalFmt}</b>). Como a mercadoria está sujeita ao abatimento obrigatório de ICMS de <b>${totalAbatimentosFmt}</b> (desoneração sem emissão de DAR), o valor faturado da NF-e é de <b>${valorFaturadoFmt}</b>.<br>&nbsp;&nbsp;<b>Situação do Saldo:</b> ${situacaoSaldoIcms}<br>`;
    } else {
      analiseCustosResp = `• <b>INSUFICIENTE (VALOR NÃO COBRE OS CUSTOS).</b><br> Do valor solicitado pelo responsável (<b>${valorSolicitadoFmt}</b>) deduzem-se os custos da contratação (<b>${custoEfetivoTotalFmt}</b>). Mesmo considerando o desconto de ICMS de <b>${totalAbatimentosFmt}</b>, o valor solicitado NÃO é suficiente para cobrir a nota faturada (<b>${valorFaturadoFmt}</b>), estando <b>faltando ${saldoFmt}</b> para cobrir os custos. O responsável deve solicitar a complementação do adiantamento.<br>`;
    }
  } else if (ehServico && formData.regimeTributario === 'mei' && formData.servicoSujeitoCppMei) {
    const valorCppCalc = calc.valorCppPatronal || calc.valorBruto * 0.2;
    const valorCppFmt = formatarMoeda(valorCppCalc);
    if (calc.isCustoAtendido) {
      analiseCustosResp = `• <b>ATENDIDO (ENCARGO PATRONAL MEI INCLUSO).</b><br> Do valor solicitado pelo responsável (<b>${valorSolicitadoFmt}</b>) deduzem-se todos os custos necessários: a nota do MEI no valor de <b>${valorFormatado}</b> mais a guia de DARF da Previdência (CPP Patronal 20%: <b>${valorCppFmt}</b>), totalizando <b>${custoEfetivoTotalFmt}</b>.<br>&nbsp;&nbsp;<b>Situação do Saldo:</b> ${situacaoSaldoMei}<br>`;
    } else {
      analiseCustosResp = `• <b>INSUFICIENTE (ENCARGO PATRONAL MEI NÃO COBERTO).</b><br> O valor solicitado pelo responsável (<b>${valorSolicitadoFmt}</b>) NÃO é suficiente para cobrir todos os custos da operação (<b>${custoEfetivoTotalFmt}</b>), pois incide o pagamento da nota do MEI (<b>${valorFormatado}</b>) mais a guia de DARF da Previdência (CPP 20%: <b>${valorCppFmt}</b>), faltando <b>${saldoFmt}</b> para cobrir o serviço e a guia previdenciária.<br>&nbsp;&nbsp;<b>⚠️ AÇÃO OBRIGATÓRIA:</b> O adiantamento deve ser ajustado para no mínimo <b>${custoEfetivoTotalFmt}</b>, caso contrário faltará saldo para quitar a DARF previdenciária.<br>`;
    }
  } else {
        if (calc.isCustoAtendido) {
      analiseCustosResp = `• <b>ATENDIDO (SALDO SUFICIENTE).</b><br> Do valor solicitado pelo responsável (<b>${valorSolicitadoFmt}</b>) deduzem-se todos os custos da despesa ${detalheCustosPadrao}.<br>&nbsp;&nbsp;<b>Situação do Saldo:</b> ${situacaoSaldoPadrao}<br>`;
    } else {
      analiseCustosResp = `• <b>INSUFICIENTE (VALOR NÃO COBRE OS CUSTOS).</b><br> Do valor solicitado pelo responsável (<b>${valorSolicitadoFmt}</b>) deduzem-se os custos totais da despesa (<b>${custoEfetivoTotalFmt}</b>: líquido ao fornecedor de <b>${valorLiquidoFmt}</b> + guias de tributos de <b>${totalRetencoesFmt}</b>), faltando <b>${saldoFmt}</b>. <b>⚠️ AÇÃO NECESSÁRIA:</b> O responsável deve solicitar a complementação do valor do adiantamento antes de efetivar o pagamento.<br>`;
    }
  }

  // Cabeçalho de identificação (integrado à introdução)
  let cabecalhoId = '';
  if (formData.fornecedor || formData.cnpj || formData.responsavel) {
    const linhas = [];
    linhas.push(`• Fornecedor: <b>${formData.fornecedor || 'Não informado'}</b>`);
    linhas.push(`• CNPJ: <b>${formData.cnpj || 'Não informado'}</b>`);
    linhas.push(`• Servidor Responsável: <b>${formData.responsavel || 'Não informado'}</b>`);
    linhas.push(`• Valor Solicitado pelo Responsável (Adiantamento): <b>${valorSolicitadoFmt}</b>`);
    cabecalhoId = linhas.join('<br>') + '<br><br>';
  }

  // Validação Cadastral (CNAE)
  let alertaCnaeFornecedor = '';
  let alertaCnaeResponsavel = '';
  if (formData.statusCadastro === 'atualizacao') {
    alertaCnaeFornecedor = `<b>⚠️ ATENÇÃO - ATUALIZAÇÃO CADASTRAL PRÉVIA OBRIGATÓRIA:</b><br>Antes de emitir a nota fiscal, a empresa deve incluir obrigatoriamente no seu cartão CNPJ da Receita Federal o CNAE <b>${formData.cnaeCodigo || 'específico'}</b> (<i>${formData.cnaeDescricao || 'atividade correspondente'}</i>). Notas emitidas sem o CNAE correspondente poderão ser rejeitadas.`;
    alertaCnaeResponsavel = `<b>Validação Cadastral:</b> O fornecedor precisa atualizar o cartão CNPJ incluindo o CNAE <b>${formData.cnaeCodigo || 'específico'}</b> (<i>${formData.cnaeDescricao || 'atividade correspondente'}</i>) antes de faturar.`;
  } else {
    alertaCnaeFornecedor = `<b>Cadastro Fiscal:</b> Regular. Autorizado pelo CNAE <b>${formData.cnaeCodigo || 'informado'}</b> — <i>${formData.cnaeDescricao || 'atividade autorizada'}</i>.`;
    alertaCnaeResponsavel = `<b>Validação Cadastral:</b> Regularizada (CNAE <b>${formData.cnaeCodigo || 'informado'}</b> — <i>${formData.cnaeDescricao || 'atividade autorizada'}</i>).`;
  }

  // IRRF
  let irrfExplicacaoFornecedor = '';
  let irrfExplicacaoResponsavel = '';
  let irrfNota = '';
  if (formData.suprimentoFundos) {
    irrfExplicacaoFornecedor = `<b>IRRF:</b> <b>SEM RETENÇÃO NA FONTE.</b> Aquisição realizada por Suprimento de Fundos.`;
    irrfExplicacaoResponsavel = `<b>IRRF:</b> Sem retenção (Aquisição por Suprimento de Fundos).`;
  } else if (formData.regimeTributario === 'simples' || formData.regimeTributario === 'mei') {
    irrfExplicacaoFornecedor = `<b>IRRF:</b> <b>SEM RETENÇÃO.</b> Dispensada legalmente pelo enquadramento no <b>${regimeNome}</b> (art. 4º, XI da IN RFB nº 1.234/2012 e LC nº 123/2006).`;
    irrfExplicacaoResponsavel = `<b>IRRF:</b> Sem retenção (Empresa optante pelo <b>${regimeNome}</b>).`;
  } else if (calc.retemIrrfEfetivo) {
    const valIrrfFmt = formatarMoeda(calc.valorIrrfApurado);
    irrfExplicacaoFornecedor = `<b>IRRF:</b> <b>HAVERÁ RETENÇÃO NA FONTE</b> no valor de <b>${valIrrfFmt}</b>.<br>&nbsp;&nbsp;(Exigência do art. 2º-A da IN RFB nº 1.234/2012 / IN RFB nº 2.145/2023).`;
    irrfExplicacaoResponsavel = `<b>IRRF:</b> Retido no valor de <b>${valIrrfFmt}</b>.`;
    irrfNota = `Inserir no campo de observações da nota: <i>'Retenção de IRRF de ${valIrrfFmt}, conforme a IN RFB nº 1.234/2012 e alterações. Imposto retido a ser recolhido ao Tesouro Estadual.'</i>`;
  } else {
    irrfExplicacaoFornecedor = `<b>IRRF:</b> <b>RETENÇÃO DISPENSADA.</b> O valor calculado (${formatarMoeda(calc.valorIrrfApurado)}) é inferior a R$ 10,00 (art. 67 da Lei nº 9.430/1996).`;
    irrfExplicacaoResponsavel = `<b>IRRF:</b> Retenção dispensada (abaixo do teto de R$ 10,00).`;
  }

  const roteiroServidorStr = calc.roteiroPassos.join('<br>');

  let htmlResult = '';

  if (ehServico) {
    // INSS & ISSQN para Serviços
    let prevExplicacaoFornecedor = '';
    let prevExplicacaoResponsavel = '';
    let prevNota = '';
    const valorCppCalc = calc.valorCppPatronal || calc.valorBruto * 0.2;
    const valorCppFmt = formatarMoeda(valorCppCalc);
    const custoTotalMeiFmt = formatarMoeda(calc.valorBruto + valorCppCalc);

    if (formData.regimeTributario === 'mei' && formData.servicoSujeitoCppMei) {
      prevExplicacaoFornecedor = `<b>INSS Prestador (MEI):</b> <b>NÃO HÁ DESCONTO NA NOTA.</b> O MEI recebe o valor integral de <b>${valorFormatado}</b>.<br>&nbsp;&nbsp;(Encargo Patronal: por ser serviço do art. 18-B da LC 123/2006, o órgão contratante arcará com a CPP de 20% com recursos próprios via DARF, sem nenhum abatimento da nota fiscal do MEI).`;
      prevExplicacaoResponsavel = `<b>INSS / CPP Patronal (MEI):</b> O prestador receberá o valor integral (sem retenção na nota). Todavia, por se tratar de serviço do art. 18-B da LC 123/2006, a Autarquia deve recolher 20% de CPP Patronal via DARF (<b>${valorCppFmt}</b>). O custo total da contratação é de <b>${custoTotalMeiFmt}</b> (Nota de ${valorFormatado} + DARF de ${valorCppFmt}).`;
    } else if (formData.regimeTributario === 'mei') {
      prevExplicacaoFornecedor = `<b>INSS Prestador:</b> <b>NÃO HÁ RETENÇÃO NEM ENCARGO</b> (art. 18-B, § 1º, da LC 123/2006).`;
      prevExplicacaoResponsavel = `<b>INSS:</b> Sem retenção para MEI.`;
    } else if (calc.retemInssEfetivo) {
      const valInssFmt = formatarMoeda(calc.valorInss);
      prevExplicacaoFornecedor = `<b>INSS:</b> <b>HAVERÁ RETENÇÃO de 11%</b> (${valInssFmt}) na fonte (IN RFB nº 2.110/2022).`;
      prevExplicacaoResponsavel = `<b>INSS:</b> Retido 11% (<b>${valInssFmt}</b>).`;
      prevNota = 'Destacar no campo próprio da NFS-e a retenção de 11% de INSS.';
    } else {
      prevExplicacaoFornecedor = `<b>INSS:</b> <b>NÃO HÁ RETENÇÃO NA FONTE.</b>`;
      prevExplicacaoResponsavel = `<b>INSS:</b> Sem retenção na fonte.`;
      prevNota = 'Não destacar retenção de INSS na NFS-e.';
    }

    let issExplicacaoFornecedor = '';
    let issExplicacaoResponsavel = '';
    let issNota = '';
    if (calc.retemIssEfetivo) {
      if (formData.valorIss > 0) {
        issExplicacaoFornecedor = `<b>ISSQN:</b> <b>HAVERÁ RETENÇÃO NA FONTE</b> no valor informado de <b>${formatarMoeda(formData.valorIss)}</b>. O tributo será recolhido diretamente pelo órgão à Prefeitura de <b>${formData.municipioIss || 'competência'}</b>.`;
      } else {
        issExplicacaoFornecedor = `<b>ISSQN:</b> <b>HAVERÁ RETENÇÃO NA FONTE</b> (valor a ser apurado conforme alíquota local). O tributo será recolhido diretamente pelo órgão à Prefeitura de <b>${formData.municipioIss || 'competência'}</b>.`;
      }
      issExplicacaoResponsavel = `<b>ISSQN:</b> Retido na fonte (<b>${formData.municipioIss || 'competência'}</b>).`;
      issNota = `Informar no corpo da nota que o ISSQN será retido na fonte para o município de ${formData.municipioIss || 'competência'}.`;
    } else if (ehServico && formData.retemIss && !calc.retemIssEfetivo) {
      // [OPCIONAL] ISS marcado sem valor informado: retenção devida, valor a apurar
      issExplicacaoFornecedor = `<b>ISSQN:</b> <b>HAVERÁ RETENÇÃO NA FONTE</b> (valor a ser apurado conforme alíquota local). O tributo será recolhido diretamente pelo órgão à Prefeitura de <b>${formData.municipioIss || 'competência'}</b>.`;
      issExplicacaoResponsavel = `<b>ISSQN:</b> Retido na fonte (<b>${formData.municipioIss || 'competência'}</b>) — valor a apurar conforme alíquota municipal.`;
      issNota = `Informar no corpo da nota que o ISSQN será retido na fonte para o município de ${formData.municipioIss || 'competência'}.`;
    } else {
      issExplicacaoFornecedor = `<b>ISSQN:</b> <b>SEM RETENÇÃO NA FONTE.</b> O recolhimento compete integralmente ao prestador.`;
      issExplicacaoResponsavel = `<b>ISSQN:</b> Sem retenção na fonte.`;
      issNota = 'Emitir NFS-e com incidência normal ou devida no município sede da empresa.';
    }

    const explicacaoRetencoesServicos =
      calc.totalDeducoes > 0
        ? `<b>Por que existem retenções no valor recebido?</b><br>O valor líquido depositado em sua conta é inferior ao valor total da nota porque a Autarquia atua como substituta tributária por força de lei. Isso significa que retemos os impostos devidos e os recolhemos diretamente aos cofres públicos em seu nome. <b>Isso não é um desconto ou penalidade:</b> os valores retidos servem como quitação de seus tributos, e as respectivas guias serão enviadas para abatimento contábil.<br><br>`
        : '';

    htmlResult = `Prezados,<br><br>
${INTRODUCAO_PARECER}<br><br>
${cabecalhoId}<b>1. ORIENTAÇÕES EM LINGUAGEM SIMPLES PARA O RESPONSÁVEL PELO ADIANTAMENTO</b><br><br>
${gerarOrientacoesSimples(formData, calc)}<b>2. COMO PROCEDER COM O PAGAMENTO E AS GUIAS</b><br>
${roteiroServidorStr}<br><br>
<b>3. ANÁLISE DE CUSTOS E COBERTURA DO ADIANTAMENTO</b><br>
<b>Síntese dos valores:</b><br>
- Valor Solicitado pelo Responsável (Adiantamento): <b>${valorSolicitadoFmt}</b><br>
- Valor Bruto da Nota: <b>${valorFormatado}</b><br>
- Total de Retenções Tributárias na Fonte: <b>${calc.totalRetencoes > 0 ? `- ${totalRetencoesFmt}` : 'R$ 0,00 (Sem retenção na fonte)'}</b><br>
- Valor Líquido a Pagar ao Fornecedor: <b>${valorLiquidoFmt}</b><br>
${formData.regimeTributario === 'mei' && formData.servicoSujeitoCppMei ? `- Encargo Previdenciário Patronal (CPP 20% via DARF): <b>+ ${formatarMoeda(calc.valorCppPatronal || 0)}</b><br>` : ''}- Custo Efetivo Total da Despesa (Nota + Guias): <b>${custoEfetivoTotalFmt}</b><br>
- Saldo do Adiantamento (Recurso Solicitado - Custos): <b>${calc.isCustoAtendido ? `+ ${saldoFmt} (Sobra / Atendido)` : `- ${saldoFmt} (Falta completar este valor)`}</b><br><br>
${analiseCustosResp}${alertaCnaeResponsavel}<br>
${irrfExplicacaoResponsavel}<br>
${prevExplicacaoResponsavel}<br>
${issExplicacaoResponsavel}<br><br>
${explicacaoRetencoesServicos}<b>4. INFORMAÇÕES AO FORNECEDOR (EMISSÃO DA NOTA FISCAL)</b><br>
${alertaCnaeFornecedor}<br>
<b>Tipo de Nota e Natureza:</b> Prestação de Serviços — Emissão obrigatória de NFS-e.<br>
<b>Regime Tributário Declarado:</b> <b>${regimeNome}</b><br>
<b>Enquadramento Legal:</b> Item <b>${formData.itemLc || '14.01'}</b> da LC 116/03 (<i>${formData.lcDescricao || 'Prestação de serviços'}</i>)<br>
<b>Valor Total da NFS-e:</b> <b>${valorFormatado}</b><br><br>
<b>O que deve constar obrigatoriamente na NFS-e:</b><br>
- ${prevExplicacaoFornecedor} ${prevNota}<br>
- ${irrfExplicacaoFornecedor} ${irrfNota}<br>
${gerarFundamentacaoLegal(formData, calc)}${FECHO_RESSALVA}<br><br>Qualquer dúvida, permaneço à disposição.<br><br>
Atenciosamente,`;
  } else {
    // Fornecimento de Bens / Mercadorias
    let textoTribFornecedor = '';
    let textoTribResponsavel = '';
    if (formData.regimeTributario === 'simples') {
      textoTribFornecedor = `<b>Regime Simples Nacional:</b> não destacar ICMS próprio nem reter tributos na fonte.<br>• Texto obrigatório nos Dados Adicionais da NF-e:<br>&nbsp;&nbsp;<i>"DOCUMENTO EMITIDO POR EMPRESA OPTANTE PELO SIMPLES NACIONAL. NÃO GERA DIREITO A CRÉDITO FISCAL DE IPI. DISPENSADA A RETENÇÃO NA FONTE DE IRRF, CSLL, PIS E COFINS, NOS TERMOS DO ART. 4º, INCISO XI DA INSTRUÇÃO NORMATIVA RFB Nº 1.234/2012 E DO ART. 13 DA LEI COMPLEMENTAR Nº 123/2006."</i>`;
      textoTribResponsavel = `<b>Tributação:</b> Simples Nacional (sem retenções federais ou destaque de ICMS próprio).`;
    } else if (formData.regimeTributario === 'mei') {
      textoTribFornecedor = `<b>Regime MEI:</b> não destacar ICMS nem retenções federais.<br>• Mencionar a condição de optante da Lei Complementar nº 123/2006 nas informações complementares.`;
      textoTribResponsavel = `<b>Tributação:</b> MEI (sem retenções federais).`;
    } else {
      if (formData.possuiSt) {
        textoTribFornecedor = `<b>ICMS:</b> Operação com Substituição Tributária (ST). Não aplicar desconto de desoneração.`;
        textoTribResponsavel = `<b>Tributação:</b> ICMS com Substituição Tributária (ST).`;
      } else if (formData.valorDescontoIcms > 0) {
        textoTribFornecedor = `<b>ICMS (RICMS-MT):</b> Mercadoria sem ST. Destacar abatimento obrigatório de <b>${formatarMoeda(formData.valorDescontoIcms)}</b> no campo próprio de desconto e nos dados adicionais da NF-e mod. 55. <b>Não haverá recolhimento de DAR de ICMS pelo órgão</b>, tratando-se exclusivamente de desoneração comercial no valor faturado.`;
        textoTribResponsavel = `<b>ICMS (Desoneração):</b> Mercadoria sem Substituição Tributária (ST) com abatimento obrigatório de <b>${formatarMoeda(formData.valorDescontoIcms)}</b>. <b>NÃO HÁ PAGAMENTO DE DAR:</b> o desconto de ICMS é aplicado diretamente no preço pelo fornecedor; o órgão público <b>NÃO</b> recolhe guia de ICMS (DAR). Como o valor efetivo a pagar ao fornecedor é menor que a cotação/solicitação inicial, <b>é obrigatório revisar o valor solicitado no adiantamento</b> para ajuste ou devolução do saldo excedente.`;
      } else {
        textoTribFornecedor = `<b>ICMS:</b> Tributação normal (sem ST). Verificar se há benefício de desoneração aplicável.`;
        textoTribResponsavel = `<b>Tributação:</b> ICMS normal.`;
      }
    }

    const explicacaoRetencoesBens =
      calc.totalDeducoes > 0
        ? formData.suprimentoFundos
          ? `<b>Por que podem ocorrer descontos no valor recebido?</b><br>No caso de desconto de ICMS (desoneração), o abatimento é direto no preço do item, sem emissão nem recolhimento de DAR pelo órgão. Não há retenção de IRRF nesta aquisição por Suprimento de Fundos.<br><br>`
          : `<b>Por que podem ocorrer retenções ou descontos no valor recebido?</b><br>O valor líquido repassado pode sofrer abatimentos fiscais exigidos por lei (como retenção de Imposto de Renda ou descontos de ICMS). No caso de retenção de tributos federais (IRRF), a Autarquia recolhe a guia diretamente aos cofres públicos em seu nome, servindo de quitação e crédito contábil. No caso de desconto de ICMS (desoneração), o abatimento é direto no preço do item, sem emissão nem recolhimento de DAR pelo órgão.<br><br>`
        : '';

    htmlResult = `Prezados,<br><br>
${INTRODUCAO_PARECER}<br><br>
${cabecalhoId}<b>1. ORIENTAÇÕES EM LINGUAGEM SIMPLES PARA O RESPONSÁVEL PELO ADIANTAMENTO</b><br>
${gerarOrientacoesSimples(formData, calc)}<b>2. COMO PROCEDER COM O PAGAMENTO E AS GUIAS</b><br>
${roteiroServidorStr}<br><br>
<b>3. ANÁLISE DE CUSTOS E COBERTURA DO ADIANTAMENTO</b><br>
<b>Síntese dos valores:</b><br>
- Valor Solicitado pelo Responsável (Adiantamento): <b>${valorSolicitadoFmt}</b><br>
- Valor Bruto dos Produtos: <b>${valorFormatado}</b><br>
${calc.totalAbatimentos > 0
  ? `- Abatimento / Desconto de ICMS na Nota: <b>- ${totalAbatimentosFmt}</b> <i>(Desoneração comercial sem recolhimento de DAR)</i><br>- Valor Faturado da Nota Fiscal: <b>${valorFaturadoFmt}</b><br>`
  : ''}- Total de Retenções Tributárias na Fonte: <b>${calc.totalRetencoes > 0 ? `- ${totalRetencoesFmt}` : 'R$ 0,00 (Sem retenção na fonte)'}</b><br>
- Valor Líquido a Pagar ao Fornecedor: <b>${valorLiquidoFmt}</b><br>
- Custo Efetivo Total da Despesa: <b>${custoEfetivoTotalFmt}</b><br>
- Saldo do Adiantamento (Recurso Solicitado - Custos): <b>${calc.isCustoAtendido ? `+ ${saldoFmt} (Sobra / Atendido)` : `- ${saldoFmt} (Falta completar este valor)`}</b><br><br>
${analiseCustosResp}${alertaCnaeResponsavel}<br>
${textoTribResponsavel}<br>
${irrfExplicacaoResponsavel}<br><br>
${explicacaoRetencoesBens}<b>4. INFORMAÇÕES AO FORNECEDOR (EMISSÃO DA NOTA FISCAL)</b><br>
${alertaCnaeFornecedor}<br>
<b>Tipo de Nota e Natureza:</b> Fornecimento de Bens / Mercadorias — Emissão obrigatória de NF-e modelo 55.<br>
<b>Regime Tributário:</b> <b>${regimeNome}</b><br>
<b>Valor Total dos Produtos:</b> <b>${valorFormatado}</b><br>
<b>Discriminação obrigatória:</b> Item, marca, modelo, quantidade, valor unitário e código NCM.<br>
- ${textoTribFornecedor}<br>
- ${irrfExplicacaoFornecedor} ${irrfNota}<br>
- <b>Nota: Venda de mercadorias não se sujeita a ISSQN nem a retenção de INSS.</b><br><br>
${gerarFundamentacaoLegal(formData, calc)}${FECHO_RESSALVA}<br><br>Qualquer dúvida, permaneço à disposição.<br><br>
Atenciosamente,`;
  }

  return {
    html: htmlResult,
    plainText: htmlParaTextoLimpo(htmlResult),
  };
}