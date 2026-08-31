import { OperacaoComercial, AnaliseTributariaJSON, SimulacaoMemoriaCalculo, ItemNotaFiscal, AnaliseConsolidadaNota, AnaliseItemFiscal, ResumoConsolidadoNota } from '../types.js';
import { verificarNcmNoAnexoX, consultarNcmOficialMT } from '../data/ncmDatabase.js';

export function checkProductSt(ncmInput: string, _descricaoInput?: string): boolean {
  return verificarNcmNoAnexoX(ncmInput);
}

/**
 * Árvore de Decisão Determinística e Genérica de Enquadramento Tributário por Linha de Produto
 * Sem regras manuais ou fixas por nome de produto.
 */
export function calcularEnquadramentoItem(
    item: { ncm: string; valorTotal: number; descricao?: string; [key: string]: any },
    fornecedor: { isSimplesNacional: boolean; [key: string]: any },
    adquirente: { tipo?: string; [key: string]: any }
): {
  cst: string;
  regimeMt: string;
  descIsencao: number;
  irrf: number;
  liquidoItem: number;
  isST: boolean;
  aliquotaIcmsDestacada: number;
  aliquotaIrrf: number;
  totalRecolherMt: number;
} {
  // 1. a) Consulta o NCM na base completa (Anexo X MT e Tabela de Retenções RFB)
  const dadosNcm = consultarNcmOficialMT(item.ncm, item.descricao);
  const isST = dadosNcm.isSt;
  const valorTotal = Number(item.valorTotal) || 0;

  let cst = '00';
  let regimeMt = 'Tributação Normal';
  let descIsencao = 0.00;
  let irrf = 0.00;
  let aliquotaIcmsDestacada = 0;

  // Alíquota de IRRF dinâmica vinda da base de NCMs (0.24% p/ combustíveis/GLP ou 1.20% p/ mercadorias)
  const aliquotaIrrfPercentual = dadosNcm.irrf !== undefined ? dadosNcm.irrf : 1.20;
  const aliquotaIrrfDecimal = aliquotaIrrfPercentual / 100;

  const isOrgaoPublicoMT = (adquirente.tipo === 'ORGAO_PUBLICO_ESTADUAL');

  // 1. c) Fornecedor do SIMPLES NACIONAL (CRT 1)
  if (fornecedor.isSimplesNacional) {
    if (!isST) {
      cst = '102';
      regimeMt = 'Tributação Normal Simples';
      descIsencao = 0.00;
      irrf = 0.00;
      aliquotaIcmsDestacada = 0.00;
    } else {
      cst = '500';
      regimeMt = 'Substituição Tributária';
      descIsencao = 0.00;
      irrf = 0.00;
      aliquotaIcmsDestacada = 0.00;
    }
  }
  // 1. b) Fornecedor do REGIME NORMAL (CRT 3) e Destinatário ÓRGÃO PÚBLICO ESTADUAL DE MT
  else if (isOrgaoPublicoMT) {
    if (!isST) {
      // Produto fora do Anexo X (Isenção com desconto obrigatório de ICMS de 17%)
      cst = '40';
      regimeMt = 'Isento (Órgão Público MT)';
      descIsencao = valorTotal * 0.17;
      aliquotaIcmsDestacada = 0.00;
      // Retenção do IRRF sobre o valor líquido faturado após o desconto do ICMS desonerado
      const baseAposDesconto = Math.max(0, valorTotal - descIsencao);
      irrf = baseAposDesconto * aliquotaIrrfDecimal;
    } else {
      // Produto no Anexo X com ST retida anteriormente (sem desconto de isenção de ICMS)
      cst = '60';
      regimeMt = 'Substituição Tributária';
      descIsencao = 0.00;
      aliquotaIcmsDestacada = 0.00;
      // Retenção do IRRF sobre a base integral faturada
      irrf = valorTotal * aliquotaIrrfDecimal;
    }
  }
  // 1. d) Venda para CONSUMIDOR FINAL COMUM / CONTRIBUINTE NORMAL (Não Órgão Público)
  else {
    if (!isST) {
      cst = '00';
      regimeMt = 'Tributação Normal';
      descIsencao = 0.00;
      irrf = 0.00;
      aliquotaIcmsDestacada = 0.17;
    } else {
      cst = '60';
      regimeMt = 'Substituição Tributária';
      descIsencao = 0.00;
      irrf = 0.00;
      aliquotaIcmsDestacada = 0.00;
    }
  }

  // Líquido do Item: Valor Total - Desconto Isenção MT - Retenção IRRF
  const liquidoItem = Math.max(0, valorTotal - descIsencao - irrf);
  const totalRecolherMt = 0.00;

  return {
    cst,
    regimeMt,
    descIsencao,
    irrf,
    liquidoItem,
    isST,
    aliquotaIcmsDestacada,
    aliquotaIrrf: irrf > 0 ? aliquotaIrrfPercentual : 0.00,
    totalRecolherMt
  };
}

export function getIrrfClassification(ncm: string, descricao?: string): {
  aliquota: number;
  codigoRfb: string;
  categoria: string;
  justificativa: string;
} {
  const dadosNcm = consultarNcmOficialMT(ncm, descricao);
  const ncmClean = (ncm || '').replace(/\D/g, '');
  const descUpper = (descricao || '').toUpperCase();

  const isTransporte = descUpper.includes('FRETE') || descUpper.includes('TRANSPORTE DE CARGA') || descUpper.includes('CARRETO');
  if (isTransporte) {
    return {
      aliquota: 2.40,
      codigoRfb: '8783',
      categoria: 'Transporte de Cargas (IN 1234 - Cód. 8783)',
      justificativa: 'Retenção na fonte de IRRF no percentual de 2,40% para prestação de serviços de transporte de cargas por Órgãos Públicos (IN RFB nº 1.234/2012 - Anexo I - Código RFB 8783).'
    };
  }

  const isServico = descUpper.includes('SERVIÇO') || descUpper.includes('SERVICO') || descUpper.includes('MANUTENÇÃO') || descUpper.includes('MANUTENCAO') || descUpper.includes('CONSULTORIA') || descUpper.includes('LOCAÇÃO') || descUpper.includes('LOCACAO');
  if (isServico) {
    return {
      aliquota: 4.80,
      codigoRfb: '8754',
      categoria: 'Prestação de Serviços em Geral (IN 1234 - Cód. 8754)',
      justificativa: 'Retenção na fonte de IRRF no percentual de 4,80% para prestação de serviços em geral / manutenção por Órgãos Públicos (IN RFB nº 1.234/2012 - Anexo I - Código RFB 8754).'
    };
  }

  // Se o NCM tem alíquota cadastrada de 0,24% no mapa de dados (Combustíveis/GLP)
  if (dadosNcm.irrf === 0.24 || ncmClean.startsWith('2710') || ncmClean.startsWith('2711')) {
    return {
      aliquota: 0.24,
      codigoRfb: '8730',
      categoria: 'GLP (Gás de Cozinha), Combustíveis e Gás Natural (IN 1234 - Cód. 8730)',
      justificativa: 'Retenção na fonte de IRRF no percentual reduzido de 0,24% para fornecimento de Gás Liquefeito de Petróleo (GLP), combustíveis e derivados por Órgãos Públicos (IN RFB nº 1.234/2012 - Anexo I - Código RFB 8730).'
    };
  }

  return {
    aliquota: 1.20,
    codigoRfb: '8767',
    categoria: 'Bens e Mercadorias em Geral (IN 1234 - Cód. 8767)',
    justificativa: 'Retenção na fonte obrigatória de IRRF no percentual de 1,20% para aquisições de bens e mercadorias em geral por Órgãos Públicos (IN RFB nº 1.234/2012 - Anexo I - Código RFB 8767 e STF Tema 1130 / RE 1.293.453).'
  };
}

export function computeClientSimulation(op: OperacaoComercial, jsonRes: AnaliseTributariaJSON): SimulacaoMemoriaCalculo {
  const valorBruto = Number(op.valor_operacao) || 0;
  const descontoComercial = Number(op.valor_desconto_comercial) || 0;
  const valorProdutosComDesconto = Math.max(0, valorBruto - descontoComercial);
  const valorTotal = valorProdutosComDesconto + (Number(op.valor_frete) || 0) + (Number(op.valor_despesas) || 0);

  const isSimples = Boolean(op.simples_remetente);
  const tipoAdquirente = op.tipo_adquirente || (op.finalidade_compra === 'ORGAO_PUBLICO_CONSUMO' ? 'ORGAO_PUBLICO_ESTADUAL' : 'PRIVADO');
  const isOrgaoPublico = tipoAdquirente === 'ORGAO_PUBLICO_ESTADUAL';

  const enq = calcularEnquadramentoItem(
      { ncm: op.ncm, valorTotal, descricao: op.descricao_produto },
      { isSimplesNacional: isSimples },
      { tipo: tipoAdquirente }
  );

  let icmsOrigem = 0;
  if (!isSimples) {
    const aliqOrigemNum = parseFloat((jsonRes.aliquotas?.aliquota_origem || '7%').replace('%', '')) || 7;
    icmsOrigem = Number(op.icms_proprio_destacado) || (valorTotal * (aliqOrigemNum / 100));
  }

  const irrfClass = getIrrfClassification(op.ncm, op.descricao_produto);

  return {
    base_calculo_origem: valorTotal,
    icms_origem_destacado: icmsOrigem,
    valor_desconto_comercial: descontoComercial > 0 ? descontoComercial : undefined,
    desconto_isencao_orgao_publico: enq.descIsencao > 0 ? enq.descIsencao : undefined,
    economia_tributaria_total: enq.descIsencao > 0 ? enq.descIsencao : undefined,
    valor_liquido_com_desconto: enq.descIsencao > 0 ? (valorTotal - enq.descIsencao) : undefined,

    aplica_irrf_in1234: isOrgaoPublico && !isSimples,
    aliquota_irrf_in1234: (isOrgaoPublico && !isSimples) ? enq.aliquotaIrrf : 0,
    codigo_retencao_irrf: (isOrgaoPublico && !isSimples) ? irrfClass.codigoRfb : 'DISPENSADO',
    categoria_irrf_in1234: isSimples ? 'Simples Nacional - Isento de Retenção (Art. 4º, XI IN 1234)' : irrfClass.categoria,
    valor_irrf_retido: enq.irrf,
    justificativa_irrf_in1234: isSimples ? "Dispensa de retenção na fonte do IRRF: Fornecedor optante pelo Simples Nacional (Art. 4º, inciso XI da Instrução Normativa RFB nº 1.234/2012)." : irrfClass.justificativa,
    valor_liquido_pagamento_fornecedor: enq.liquidoItem,

    total_recolher_mt: 0
  };
}

export function computeDeterministicAnalysisLocal(op: OperacaoComercial): {
  jsonResponse: AnaliseTributariaJSON;
  simulacaoCalculo: SimulacaoMemoriaCalculo;
  fonteAnalise: 'MOTOR_DETERMINISTICO_LOCAL';
} {
  const valorBruto = Number(op.valor_operacao) || 0;
  const descontoComercial = Number(op.valor_desconto_comercial) || 0;
  const valorProdutosComDesconto = Math.max(0, valorBruto - descontoComercial);
  const valorTotal = valorProdutosComDesconto + (Number(op.valor_frete) || 0) + (Number(op.valor_despesas) || 0);

  const isSimples = Boolean(op.simples_remetente);
  const porte = op.porte_remetente || 'ME';
  const tipoAdquirente = op.tipo_adquirente || (op.finalidade_compra === 'ORGAO_PUBLICO_CONSUMO' ? 'ORGAO_PUBLICO_ESTADUAL' : 'PRIVADO');
  const isOrgaoPublico = tipoAdquirente === 'ORGAO_PUBLICO_ESTADUAL';

  const enq = calcularEnquadramentoItem(
      { ncm: op.ncm, valorTotal, descricao: op.descricao_produto },
      { isSimplesNacional: isSimples },
      { tipo: tipoAdquirente }
  );

  const ufOrigem = (op.uf_origem || 'SP').toUpperCase();
  let aliqOrigem = '7%';
  if (['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SE', 'TO'].includes(ufOrigem)) {
    if (['SP', 'RJ', 'MG', 'PR', 'RS', 'SC'].includes(ufOrigem)) {
      aliqOrigem = '7%';
    } else {
      aliqOrigem = '12%';
    }
  }

  const aliqMT = "17%";

  let mvaPauta = enq.isST ? "Substituição Tributária (Anexo X MT)" : (enq.cst === '40' ? "Isento c/ Desconto Obrigatório no Preço (Conv. 73/04)" : "Tributação Normal MT");
  if (isSimples) {
    mvaPauta = enq.isST ? "CSOSN 500 (ST Antecipada)" : "CSOSN 102 (Valor Integral da Proposta)";
  }

  const fundamentacao: { artigo_anexo: string; dispositivo: string; resumo_regra: string }[] = [];
  const irrfClass = getIrrfClassification(op.ncm, op.descricao_produto);

  if (isOrgaoPublico) {
    if (isSimples) {
      fundamentacao.push({
        artigo_anexo: "Orientação Técnica nº 03/2026 - CGE/MT & LC 123/2006",
        dispositivo: "Cartilha de Execução Financeira CGE-MT / RICMS-MT",
        resumo_regra: "Conforme a OT CGE 03/2026, a isenção de ICMS do Art. 65 Anexo IV NÃO se aplica a fornecedores optantes pelo Simples Nacional. A nota é emitida pelo valor integral da proposta, sem desconto de 17% (CSOSN 102 ou 500)."
      });
      fundamentacao.push({
        artigo_anexo: "Art. 4º, XI da IN RFB nº 1.234/2012",
        dispositivo: "Instrução Normativa RFB nº 1.234/2012",
        resumo_regra: "Dispensa de retenção na fonte do IRRF para empresas optantes pelo Simples Nacional nos pagamentos efetuados por órgãos públicos."
      });
    } else if (enq.isST) {
      fundamentacao.push({
        artigo_anexo: "Art. 65, § 3º do Anexo IV do RICMS/MT & OT 03/2026 CGE-MT",
        dispositivo: "Decreto nº 2.212/2014-MT / OT 03/2026",
        resumo_regra: "Produtos enquadrados em Substituição Tributária (Anexo X) possuem fase tributária encerrada anteriormente (CST 60) e NÃO sofrem desconto de isenção de ICMS nas vendas a Órgãos Públicos."
      });
      fundamentacao.push({
        artigo_anexo: "IN RFB nº 1.234/2012 & STF Tema 1130 (RE 1.293.453)",
        dispositivo: `Instrução Normativa RFB nº 1.234/2012 (Anexo I - Código ${irrfClass.codigoRfb})`,
        resumo_regra: `Retenção na fonte obrigatória de IRRF no percentual de ${enq.aliquotaIrrf.toFixed(2)}% (${irrfClass.categoria}) sobre o valor faturado no fornecimento de mercadorias a Órgãos Públicos.`
      });
    } else {
      fundamentacao.push({
        artigo_anexo: "Artigo 2º do Anexo I & Art. 65 Anexo IV do RICMS/MT",
        dispositivo: "Decreto nº 2.212/2014-MT / Convênio ICMS 73/2004",
        resumo_regra: "Isenção do ICMS mandatória para fornecedor do Regime Normal vendendo produto fora da ST para Órgão Público Estadual (CST 40), com desconto do ICMS desonerado (17%) no valor final da nota."
      });
      fundamentacao.push({
        artigo_anexo: "IN RFB nº 1.234/2012 & STF Tema 1130 (RE 1.293.453)",
        dispositivo: `Instrução Normativa RFB nº 1.234/2012 (Anexo I - Código ${irrfClass.codigoRfb})`,
        resumo_regra: `Retenção na fonte obrigatória de IRRF no percentual de ${enq.aliquotaIrrf.toFixed(2)}% (${irrfClass.categoria}) sobre o valor faturado (após abatimento da isenção de ICMS) no fornecimento de bens a Órgãos Públicos.`
      });
    }
  } else {
    if (enq.isST) {
      fundamentacao.push({
        artigo_anexo: "Anexo X do RICMS/MT (Decreto nº 2.212/2014)",
        dispositivo: "Regime de Substituição Tributária MT",
        resumo_regra: "Mercadoria sujeita ao regime de Substituição Tributária no Estado de Mato Grosso."
      });
    } else {
      fundamentacao.push({
        artigo_anexo: "Art. 1º ao Art. 14 do RICMS/MT",
        dispositivo: "Tributação Normal Interna e Interestadual",
        resumo_regra: "Operação sujeita às regras gerais de tributação do ICMS no Estado de Mato Grosso."
      });
    }
  }

  let orientacao = "";
  if (isOrgaoPublico) {
    if (isSimples) {
      orientacao = `CONFORMIDADE FINANCEIRA DE COMPRAS PÚBLICAS (OT CGE-MT nº 03/2026): 1) FORNECEDOR SIMPLES NACIONAL (${enq.cst === '500' ? 'CSOSN 500' : 'CSOSN 102'}): A isenção de ICMS NÃO se aplica. 2) A Nota Fiscal deve ser faturada pelo VALOR INTEGRAL da proposta sem desconto. 3) Dispensa de retenção de IRRF (Art. 4º, XI da IN RFB 1.234/2012).`;
    } else if (enq.isST) {
      orientacao = `CONFORMIDADE FINANCEIRA DE COMPRAS PÚBLICAS (OT CGE-MT nº 03/2026 & Art. 65 § 3º Anexo IV): 1) PRODUTO EM SUBSTITUIÇÃO TRIBUTÁRIA (CST 60): A isenção de ICMS não se aplica a mercadorias sob ST. 2) A NF-e é emitida pelo valor integral sem desconto de ICMS. 3) Retenção na fonte de IRRF de ${enq.aliquotaIrrf.toFixed(2)}% (${irrfClass.categoria}) no pagamento ao fornecedor.`;
    } else {
      orientacao = `CONFORMIDADE FINANCEIRA DE COMPRAS PÚBLICAS (OT CGE-MT nº 03/2026 & Conv. 73/04): 1) REGIME NORMAL FORA DA ST (CST 40): Isenção de ICMS OBRIGATÓRIA. 2) A NF-e deve destacar o abatimento no campo 'vICMSDesonerado' (17%). 3) Retenção de IRRF de ${enq.aliquotaIrrf.toFixed(2)}% (${irrfClass.categoria}) sobre o valor faturado com desconto.`;
    }
  } else {
    orientacao = `Operação comercial enquadrada no regime de ${enq.regimeMt}.`;
  }

  const jsonResponse: AnaliseTributariaJSON = {
    status_analise: "SUCESSO",
    resumo_fornecedor: {
      cnpj: op.cnpj_fornecedor,
      porte: porte,
      optante_simples: isSimples,
      impacto_tributario_porte: `Fornecedor enquadrado no ${porte} (${isSimples ? 'Optante pelo Simples Nacional' : 'Regime Normal'}). ${orientacao}`
    },
    enquadramento_produto: {
      ncm: op.ncm,
      descricao: op.descricao_produto,
      regime_tributario_aplicavel: enq.regimeMt,
      cst_codigo: enq.cst
    },
    aliquotas: {
      aliquota_origem: aliqOrigem,
      aliquota_interna_mt: aliqMT,
      mva_ou_pauta: mvaPauta
    },
    fundamentacao_legal: fundamentacao,
    orientacao_fiscal: orientacao
  };

  const simulacaoCalculo: SimulacaoMemoriaCalculo = {
    base_calculo_origem: valorTotal,
    icms_origem_destacado: isSimples ? 0 : (op.icms_proprio_destacado || 0),
    valor_desconto_comercial: descontoComercial > 0 ? descontoComercial : undefined,
    desconto_isencao_orgao_publico: enq.descIsencao > 0 ? enq.descIsencao : undefined,
    economia_tributaria_total: enq.descIsencao > 0 ? enq.descIsencao : undefined,
    valor_liquido_com_desconto: enq.descIsencao > 0 ? (valorTotal - enq.descIsencao) : undefined,
    aplica_irrf_in1234: isOrgaoPublico && !isSimples,
    aliquota_irrf_in1234: (isOrgaoPublico && !isSimples) ? enq.aliquotaIrrf : 0,
    codigo_retencao_irrf: (isOrgaoPublico && !isSimples) ? irrfClass.codigoRfb : 'DISPENSADO',
    categoria_irrf_in1234: isSimples ? 'Simples Nacional - Isento de Retenção (Art. 4º, XI IN 1234)' : irrfClass.categoria,
    valor_irrf_retido: enq.irrf,
    justificativa_irrf_in1234: isSimples ? 'Dispensa de retenção na fonte do IRRF: Fornecedor optante pelo Simples Nacional (Art. 4º, inciso XI da IN RFB nº 1.234/2012).' : irrfClass.justificativa,
    valor_liquido_pagamento_fornecedor: enq.liquidoItem,
    total_recolher_mt: 0
  };

  return {
    jsonResponse,
    simulacaoCalculo,
    fonteAnalise: 'MOTOR_DETERMINISTICO_LOCAL'
  };
}

export function computeConsolidatedSimulation(
    itens: { item: ItemNotaFiscal; jsonResponse: AnaliseTributariaJSON; simulacao: SimulacaoMemoriaCalculo }[]
): ResumoConsolidadoNota {
  let totalValorBruto = 0;
  let totalDescontoComercial = 0;
  let totalFreteDespesas = 0;
  let totalBaseCalculo = 0;
  let totalDescontoIsencaoIcms = 0;
  let totalEconomiaReducaoBc = 0;
  let totalEconomiaTributaria = 0;
  let totalIrrfRetido = 0;
  let totalLiquidoPagar = 0;
  let totalIcmsRecolherMt = 0;
  let totalIcmsOrigemDestacado = 0;

  for (const { item, simulacao } of itens) {
    const vBrutoItem = (item.quantidade || 1) * (item.valor_unitario || 0);
    const vDescItem = Number(item.valor_desconto_comercial) || 0;
    const vFreteDespItem = (Number(item.valor_frete) || 0) + (Number(item.valor_despesas) || 0);

    totalValorBruto += vBrutoItem;
    totalDescontoComercial += vDescItem;
    totalFreteDespesas += vFreteDespItem;
    totalBaseCalculo += simulacao.base_calculo_origem || (Math.max(0, vBrutoItem - vDescItem) + vFreteDespItem);
    totalDescontoIsencaoIcms += simulacao.desconto_isencao_orgao_publico || 0;
    totalEconomiaReducaoBc += simulacao.desconto_reducao_bc_anexo_v || 0;
    totalEconomiaTributaria += (simulacao.desconto_isencao_orgao_publico || 0) + (simulacao.desconto_reducao_bc_anexo_v || 0);
    totalIrrfRetido += simulacao.valor_irrf_retido || 0;
    totalLiquidoPagar += (simulacao.valor_liquido_pagamento_fornecedor !== undefined
        ? simulacao.valor_liquido_pagamento_fornecedor
        : (simulacao.valor_liquido_com_desconto !== undefined ? simulacao.valor_liquido_com_desconto : vBrutoItem));
    totalIcmsRecolherMt += simulacao.total_recolher_mt || 0;
    totalIcmsOrigemDestacado += simulacao.icms_origem_destacado || 0;
  }

  return {
    total_itens_qtd: itens.length,
    total_valor_bruto: totalValorBruto,
    total_desconto_comercial: totalDescontoComercial,
    total_frete_despesas: totalFreteDespesas,
    total_base_calculo: totalBaseCalculo,
    total_desconto_isencao_icms: totalDescontoIsencaoIcms,
    total_economia_reducao_bc: totalEconomiaReducaoBc,
    total_economia_tributaria: totalEconomiaTributaria,
    total_irrf_retido: totalIrrfRetido,
    total_liquido_pagar_fornecedor: totalLiquidoPagar,
    total_icms_recolher_mt: totalIcmsRecolherMt,
    total_icms_origem_destacado: totalIcmsOrigemDestacado
  };
}

export function computeConsolidatedNotaLocal(op: OperacaoComercial): {
  jsonResponse: AnaliseTributariaJSON;
  simulacaoCalculo: SimulacaoMemoriaCalculo;
  fonteAnalise: 'MOTOR_DETERMINISTICO_LOCAL';
  consolidado: AnaliseConsolidadaNota | null;
} {
  if (!op.itens || op.itens.length === 0) {
    const single = computeDeterministicAnalysisLocal(op);
    return {
      jsonResponse: single.jsonResponse,
      simulacaoCalculo: single.simulacaoCalculo,
      fonteAnalise: 'MOTOR_DETERMINISTICO_LOCAL',
      consolidado: null
    };
  }

  const isSimples = Boolean(op.simples_remetente);
  const tipoAdquirente = op.tipo_adquirente || (op.finalidade_compra === 'ORGAO_PUBLICO_CONSUMO' ? 'ORGAO_PUBLICO_ESTADUAL' : 'PRIVADO');

  const itensAnalise: AnaliseItemFiscal[] = op.itens.map(it => {
    const valorBrutoItem = (it.quantidade || 1) * (it.valor_unitario || 0);
    const descontoItem = Number(it.valor_desconto_comercial) || 0;
    const freteDespesasItem = (Number(it.valor_frete) || 0) + (Number(it.valor_despesas) || 0);

    // Base líquida da mercadoria após o desconto comercial:
    const valorLiquidoBaseItem = Math.max(0, valorBrutoItem - descontoItem) + freteDespesasItem;

    // Aplicação da Árvore de Decisão Determinística por Item
    const enq = calcularEnquadramentoItem(
        { ncm: it.ncm, valorTotal: valorLiquidoBaseItem, descricao: it.descricao },
        { isSimplesNacional: isSimples },
        { tipo: tipoAdquirente }
    );

    const itemOp: OperacaoComercial = {
      ...op,
      ncm: it.ncm,
      descricao_produto: it.descricao,
      valor_operacao: valorBrutoItem,
      valor_desconto_comercial: descontoItem,
      valor_frete: it.valor_frete || 0,
      valor_despesas: it.valor_despesas || 0,
      icms_proprio_destacado: it.icms_proprio_destacado || 0,
      itens: undefined
    };

    const det = computeDeterministicAnalysisLocal(itemOp);

    const simulacaoAtualizada: SimulacaoMemoriaCalculo = {
      ...det.simulacaoCalculo,
      base_calculo_origem: valorLiquidoBaseItem,
      valor_desconto_comercial: descontoItem > 0 ? descontoItem : undefined,
      desconto_isencao_orgao_publico: enq.descIsencao > 0 ? enq.descIsencao : undefined,
      valor_liquido_com_desconto: enq.descIsencao > 0 ? (valorLiquidoBaseItem - enq.descIsencao) : undefined,
      valor_irrf_retido: enq.irrf,
      aliquota_irrf_in1234: enq.aliquotaIrrf,
      valor_liquido_pagamento_fornecedor: enq.liquidoItem
    };

    const jsonAtualizado: AnaliseTributariaJSON = {
      ...det.jsonResponse,
      enquadramento_produto: {
        ...det.jsonResponse.enquadramento_produto,
        regime_tributario_aplicavel: enq.regimeMt,
        cst_codigo: enq.cst
      }
    };

    return {
      item: {
        ...it,
        valor_total: valorBrutoItem
      },
      jsonResponse: jsonAtualizado,
      simulacao: simulacaoAtualizada
    };
  });

  const resumo = computeConsolidatedSimulation(itensAnalise);
  const primeiro = itensAnalise[0];

  const temMultiplosItens = itensAnalise.length > 1;
  let orientacaoConsolidada = "";

  if (isSimples) {
    orientacaoConsolidada = `CONFORMIDADE FINANCEIRA DE COMPRAS PÚBLICAS (OT CGE-MT nº 03/2026): 1) FORNECEDOR SIMPLES NACIONAL (CSOSN 102/500): A isenção de ICMS do Art. 65 do Anexo IV NÃO se aplica. 2) A Nota Fiscal deve ser faturada pelo VALOR INTEGRAL da proposta sem desconto. 3) Dispensa de retenção de IRRF (Art. 4º, XI da IN RFB nº 1.234/2012).`;
  } else if (temMultiplosItens) {
    orientacaoConsolidada = `CONFORMIDADE FINANCEIRA DE COMPRAS PÚBLICAS (IN RFB nº 1.234/2012 & OT CGE-MT nº 03/2026): 1) Operação com ${itensAnalise.length} itens. Os itens sujeitos à Substituição Tributária (CST 60) são faturados pelo valor integral e os itens fora da ST (CST 40) exigem abatimento de 17% de ICMS desonerado. 2) Retenção na fonte de IRRF apurada ITEM A ITEM conforme enquadramento do Anexo I da IN RFB nº 1.234/2012 (incluindo 0,24% para combustíveis/GLP e 1,20% para mercadorias em geral), totalizando a retenção de ${resumo.total_irrf_retido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} no pagamento ao fornecedor.`;
  } else {
    const aliqUnica = itensAnalise[0]?.simulacao.aliquota_irrf_in1234 || 1.20;
    const isStUnico = itensAnalise[0]?.jsonResponse.enquadramento_produto.regime_tributario_aplicavel?.includes('Substituição');
    if (isStUnico) {
      orientacaoConsolidada = `CONFORMIDADE FINANCEIRA DE COMPRAS PÚBLICAS (OT CGE-MT nº 03/2026 & Art. 65 § 3º Anexo IV): 1) PRODUTO EM SUBSTITUIÇÃO TRIBUTÁRIA (CST 60): A isenção de ICMS não se aplica a mercadorias sob ST. 2) A Nota Fiscal é faturada pelo valor integral sem desconto de ICMS. 3) Retenção na fonte de IRRF de ${aliqUnica.toFixed(2)}% no pagamento ao fornecedor.`;
    } else {
      orientacaoConsolidada = `CONFORMIDADE FINANCEIRA DE COMPRAS PÚBLICAS (OT CGE-MT nº 03/2026 & Conv. 73/04): 1) REGIME NORMAL FORA DA ST (CST 40): Isenção de ICMS OBRIGATÓRIA (17%). 2) Retenção de IRRF de ${aliqUnica.toFixed(2)}% sobre o valor faturado com desconto.`;
    }
  }

  const fundamentacaoConsolidada = temMultiplosItens
      ? [
        {
          artigo_anexo: "Orientação Técnica nº 03/2026 CGE-MT & RICMS/MT",
          dispositivo: "Decreto nº 2.212/2014-MT",
          resumo_regra: `Operação com ${itensAnalise.length} itens: produtos enquadrados no Anexo X (ST) são faturados integralmente (CST 60) e itens fora da ST exigem abatimento obrigatório de 17% a título de ICMS desonerado (CST 40).`
        },
        {
          artigo_anexo: "IN RFB nº 1.234/2012 & STF Tema 1130 (RE 1.293.453)",
          dispositivo: "Instrução Normativa RFB nº 1.234/2012 (Anexo I)",
          resumo_regra: isSimples
              ? "Dispensa de retenção na fonte do IRRF para fornecedor optante pelo Simples Nacional (Art. 4º, XI)."
              : "Retenção na fonte de IRRF apurada item a item conforme alíquotas do Anexo I (0,24% para derivados de petróleo/GLP e 1,20% para bens em geral)."
        }
      ]
      : primeiro.jsonResponse.fundamentacao_legal;

  const jsonConsolidado: AnaliseTributariaJSON = {
    ...primeiro.jsonResponse,
    fundamentacao_legal: fundamentacaoConsolidada,
    resumo_fornecedor: {
      ...primeiro.jsonResponse.resumo_fornecedor,
      impacto_tributario_porte: `Fornecedor enquadrado no ${op.porte_remetente || 'EPP'} (${isSimples ? 'Optante pelo Simples Nacional' : 'Regime Normal'}). ${orientacaoConsolidada}`
    },
    orientacao_fiscal: orientacaoConsolidada
  };

  return {
    jsonResponse: jsonConsolidado,
    simulacaoCalculo: {
      ...primeiro.simulacao,
      base_calculo_origem: resumo.total_base_calculo,
      icms_origem_destacado: resumo.total_icms_origem_destacado,
      valor_desconto_comercial: resumo.total_desconto_comercial > 0 ? resumo.total_desconto_comercial : undefined,
      desconto_isencao_orgao_publico: resumo.total_desconto_isencao_icms > 0 ? resumo.total_desconto_isencao_icms : undefined,
      desconto_reducao_bc_anexo_v: resumo.total_economia_reducao_bc > 0 ? resumo.total_economia_reducao_bc : undefined,
      economia_tributaria_total: resumo.total_economia_tributaria > 0 ? resumo.total_economia_tributaria : undefined,
      valor_liquido_com_desconto: resumo.total_base_calculo - resumo.total_desconto_isencao_icms,
      valor_irrf_retido: resumo.total_irrf_retido > 0 ? resumo.total_irrf_retido : 0,
      valor_liquido_pagamento_fornecedor: resumo.total_liquido_pagar_fornecedor,
      total_recolher_mt: resumo.total_icms_recolher_mt
    },
    fonteAnalise: 'MOTOR_DETERMINISTICO_LOCAL',
    consolidado: {
      itensAnalise,
      resumoConsolidado: resumo
    }
  };
}

export interface CstInfo {
  codigo: string;
  tipo: 'CST' | 'CSOSN';
  descricao: string;
  descricaoCompleta: string;
  badgeClass: string;
}

export function getCstInfo(
    jsonResponse?: AnaliseTributariaJSON | null,
    simulacao?: SimulacaoMemoriaCalculo | null,
    optanteSimples?: boolean,
    ncm?: string
): CstInfo {
  const isSimples = optanteSimples !== undefined ? optanteSimples : Boolean(jsonResponse?.resumo_fornecedor?.optante_simples);
  const cstFromEngine = jsonResponse?.enquadramento_produto?.cst_codigo;

  if (cstFromEngine) {
    if (cstFromEngine === '500') {
      return {
        codigo: '500',
        tipo: 'CSOSN',
        descricao: 'ICMS cobrado anteriormente por ST',
        descricaoCompleta: 'CSOSN 500 - ICMS cobrado anteriormente por substituição tributária (revenda a consumidor final / órgão público)',
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-300'
      };
    }
    if (cstFromEngine === '102') {
      return {
        codigo: '102',
        tipo: 'CSOSN',
        descricao: 'Tributada no Simples sem crédito',
        descricaoCompleta: 'CSOSN 102 - Tributada pelo Simples Nacional sem permissão de crédito (Sem desconto de isenção estadual - OT CGE-MT nº 03/2026)',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300'
      };
    }
    if (cstFromEngine === '60') {
      return {
        codigo: '60',
        tipo: 'CST',
        descricao: 'ICMS cobrado anteriormente por ST',
        descricaoCompleta: 'CST 60 - ICMS cobrado anteriormente por substituição tributária (Comércio Varejista / Consumidor Final - Anexo X RICMS/MT)',
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-300'
      };
    }
    if (cstFromEngine === '40') {
      return {
        codigo: '40',
        tipo: 'CST',
        descricao: 'Isenta c/ Desconto Obrigatório',
        descricaoCompleta: 'CST 40 - Isenta (Aquisição por Órgão Público Estadual de MT - Art. 2º do Anexo I do RICMS/MT c/c Convênio ICMS 73/2004)',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300'
      };
    }
    if (cstFromEngine === '00') {
      return {
        codigo: '00',
        tipo: 'CST',
        descricao: 'Tributada integralmente',
        descricaoCompleta: 'CST 00 - Tributada integralmente (Operação com destaque de ICMS na origem e/ou interna MT)',
        badgeClass: 'bg-teal-100 text-teal-900 border-teal-300'
      };
    }
  }

  const ncmAtual = ncm || jsonResponse?.enquadramento_produto?.ncm || '';
  const isSt = verificarNcmNoAnexoX(ncmAtual);

  if (isSimples) {
    if (isSt) {
      return {
        codigo: '500',
        tipo: 'CSOSN',
        descricao: 'ICMS cobrado anteriormente por ST',
        descricaoCompleta: 'CSOSN 500 - ICMS cobrado anteriormente por substituição tributária (revenda a consumidor final / órgão público)',
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-300'
      };
    }
    return {
      codigo: '102',
      tipo: 'CSOSN',
      descricao: 'Tributada no Simples sem crédito',
      descricaoCompleta: 'CSOSN 102 - Tributada pelo Simples Nacional sem permissão de crédito (Sem desconto de isenção estadual - OT CGE-MT nº 03/2026)',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300'
    };
  }

  // Regime Normal (CST ICMS 2 dígitos)
  if (isSt) {
    return {
      codigo: '60',
      tipo: 'CST',
      descricao: 'ICMS cobrado anteriormente por ST',
      descricaoCompleta: 'CST 60 - ICMS cobrado anteriormente por substituição tributária (Comércio Varejista / Consumidor Final - Anexo X RICMS/MT)',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300'
    };
  }

  const isIsento = (simulacao?.desconto_isencao_orgao_publico !== undefined && simulacao.desconto_isencao_orgao_publico > 0) ||
      jsonResponse?.enquadramento_produto?.regime_tributario_aplicavel?.includes('Isento');

  if (isIsento) {
    return {
      codigo: '40',
      tipo: 'CST',
      descricao: 'Isenta c/ Desconto Obrigatório',
      descricaoCompleta: 'CST 40 - Isenta (Aquisição por Órgão Público Estadual de MT - Art. 2º do Anexo I do RICMS/MT c/c Convênio ICMS 73/2004)',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    };
  }

  return {
    codigo: '00',
    tipo: 'CST',
    descricao: 'Tributada integralmente',
    descricaoCompleta: 'CST 00 - Tributada integralmente (Operação com destaque de ICMS na origem e/ou interna MT)',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300'
  };
}