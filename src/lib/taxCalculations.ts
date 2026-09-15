import {
  OperacaoComercial,
  AnaliseTributariaJSON,
  SimulacaoMemoriaCalculo,
  ItemNotaFiscal,
  AnaliseConsolidadaNota,
  AnaliseItemFiscal,
  ResumoConsolidadoNota
} from '../types.js';
import { verificarNcmNoAnexoX, consultarNcmOficialMT } from '../data/ncmDatabase.js';

/**
 * Função utilitária equivalente ao TRUNCAR(valor; 2) do Excel.
 * Corta as casas decimais a partir da 2ª casa sem realizar arredondamento.
 */
export function truncar(valor: number, casas: number = 2): number {
  if (isNaN(valor) || !isFinite(valor)) return 0;
  const fator = Math.pow(10, casas);
  return Math.trunc(valor * fator) / fator;
}

/**
 * Multiplica dois números e trunca o resultado em 2 casas decimais (estilo Excel TRUNCAR).
 */
export function multiplicarETruncar(num1: number, num2: number, casas: number = 2): number {
  return truncar(num1 * num2, casas);
}

export function checkProductSt(ncmInput: string, _descricaoInput?: string): boolean {
  return verificarNcmNoAnexoX(ncmInput);
}

export function calcularEnquadramentoItem(
    item: {
      ncm: string;
      valorTotal: number;
      descricao?: string;
      valor_icms_desonerado?: number;
      cst?: string;
      [key: string]: any;
    },
    fornecedor: { isSimplesNacional: boolean; [key: string]: any },
    adquirente: { tipo?: string; [key: string]: any }
): {
  cst: string;
  regimeMt: string;
  descIsencao: number;
  valorGlosaIcms: number;
  isGlosaAdministrativa: boolean;
  baseCalculoIrrf: number;
  irrf: number;
  liquidoItem: number;
  isST: boolean;
  aliquotaIcmsDestacada: number;
  aliquotaIrrf: number;
  totalRecolherMt: number;
} {
  const dadosNcm = consultarNcmOficialMT(item.ncm, item.descricao);
  const isST = dadosNcm.isSt;
  const valorTotal = truncar(Number(item.valorTotal) || 0, 2);

  let cst = '00';
  let regimeMt = 'Tributação Normal';
  let descIsencao = 0.00;
  let valorGlosaIcms = 0.00;
  let isGlosaAdministrativa = false;
  let baseCalculoIrrf = valorTotal;
  let irrf = 0.00;
  let aliquotaIcmsDestacada = 0.00;

  const aliquotaIrrfPercentual = dadosNcm.irrf !== undefined ? dadosNcm.irrf : 1.20;
  const aliquotaIrrfDecimal = aliquotaIrrfPercentual / 100;
  const isOrgaoPublicoMT = (adquirente.tipo === 'ORGAO_PUBLICO_ESTADUAL');

  // 1. Fornecedor do SIMPLES NACIONAL (CRT 1)
  if (fornecedor.isSimplesNacional) {
    if (!isST) {
      cst = '102';
      regimeMt = 'Tributação Normal Simples';
    } else {
      cst = '500';
      regimeMt = 'Substituição Tributária';
    }
    descIsencao = 0.00;
    valorGlosaIcms = 0.00;
    isGlosaAdministrativa = false;
    baseCalculoIrrf = valorTotal;
    irrf = 0.00;
    aliquotaIcmsDestacada = 0.00;
  }
  // 2. Fornecedor do REGIME NORMAL e Destinatário ÓRGÃO PÚBLICO ESTADUAL DE MT
  else if (isOrgaoPublicoMT) {
    if (!isST) {
      regimeMt = 'Isento (Órgão Público MT)';
      // Trunca o ICMS Isento em 2 casas decimais (17%)
      const valorIcmsIsentoCalculado = multiplicarETruncar(valorTotal, 0.17, 2);

      const cstInformado = item.cst;
      const temDesoneracaoFormalXml = (Number(item.valor_icms_desonerado) || 0) > 0 || cstInformado === '40';

      cst = '40';

      if (temDesoneracaoFormalXml) {
        // Cenário A: Desoneração formal na NF-e
        descIsencao = truncar(Number(item.valor_icms_desonerado) || valorIcmsIsentoCalculado, 2);
        valorGlosaIcms = 0.00;
        isGlosaAdministrativa = false;
        baseCalculoIrrf = truncar(Math.max(0, valorTotal - descIsencao), 2);
        irrf = multiplicarETruncar(baseCalculoIrrf, aliquotaIrrfDecimal, 2);
      } else {
        // Cenário B: GLOSA ADMINISTRATIVA
        descIsencao = 0.00;
        valorGlosaIcms = valorIcmsIsentoCalculado;
        isGlosaAdministrativa = true;
        baseCalculoIrrf = valorTotal;
        irrf = multiplicarETruncar(baseCalculoIrrf, aliquotaIrrfDecimal, 2);
      }
      aliquotaIcmsDestacada = 0.00;
    } else {
      cst = '60';
      regimeMt = 'Substituição Tributária';
      descIsencao = 0.00;
      valorGlosaIcms = 0.00;
      isGlosaAdministrativa = false;
      baseCalculoIrrf = valorTotal;
      irrf = multiplicarETruncar(baseCalculoIrrf, aliquotaIrrfDecimal, 2);
      aliquotaIcmsDestacada = 0.00;
    }
  }
  // 3. Venda para CONSUMIDOR FINAL COMUM
  else {
    if (!isST) {
      cst = '00';
      regimeMt = 'Tributação Normal';
      aliquotaIcmsDestacada = 0.17;
    } else {
      cst = '60';
      regimeMt = 'Substituição Tributária';
      aliquotaIcmsDestacada = 0.00;
    }
    descIsencao = 0.00;
    valorGlosaIcms = 0.00;
    isGlosaAdministrativa = false;
    baseCalculoIrrf = valorTotal;
    irrf = 0.00;
  }

  const abatimentoTotal = isGlosaAdministrativa ? valorGlosaIcms : descIsencao;
  const liquidoItem = truncar(Math.max(0, valorTotal - abatimentoTotal - irrf), 2);

  return {
    cst,
    regimeMt,
    descIsencao,
    valorGlosaIcms,
    isGlosaAdministrativa,
    baseCalculoIrrf,
    irrf,
    liquidoItem,
    isST,
    aliquotaIcmsDestacada,
    aliquotaIrrf: irrf > 0 ? aliquotaIrrfPercentual : 0.00,
    totalRecolherMt: 0.00
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
  const valorBruto = truncar(Number(op.valor_operacao) || 0, 2);
  const descontoComercial = truncar(Number(op.valor_desconto_comercial) || 0, 2);
  const valorProdutosComDesconto = Math.max(0, valorBruto - descontoComercial);
  const valorTotal = truncar(valorProdutosComDesconto + (Number(op.valor_frete) || 0) + (Number(op.valor_despesas) || 0), 2);

  const isSimples = Boolean(op.simples_remetente);
  const tipoAdquirente = op.tipo_adquirente || (op.finalidade_compra === 'ORGAO_PUBLICO_CONSUMO' ? 'ORGAO_PUBLICO_ESTADUAL' : 'PRIVADO');
  const isOrgaoPublico = tipoAdquirente === 'ORGAO_PUBLICO_ESTADUAL';

  const primeiroItem = op.itens && op.itens.length > 0 ? op.itens[0] : null;

  const enq = calcularEnquadramentoItem(
      {
        ncm: op.ncm,
        valorTotal,
        descricao: op.descricao_produto,
        valor_icms_desonerado: primeiroItem?.valor_icms_desonerado,
        cst: primeiroItem?.cst
      },
      { isSimplesNacional: isSimples },
      { tipo: tipoAdquirente }
  );

  let icmsOrigem = 0;
  if (!isSimples) {
    const aliqOrigemNum = parseFloat((jsonRes.aliquotas?.aliquota_origem || '7%').replace('%', '')) || 7;
    icmsOrigem = Number(op.icms_proprio_destacado) !== undefined && Number(op.icms_proprio_destacado) > 0
        ? truncar(Number(op.icms_proprio_destacado), 2)
        : multiplicarETruncar(valorTotal, aliqOrigemNum / 100, 2);
  }

  const irrfClass = getIrrfClassification(op.ncm, op.descricao_produto);

  let justificativaIrrfFinal = '';
  if (isSimples) {
    justificativaIrrfFinal = 'Dispensa de retenção na fonte do IRRF: Fornecedor optante pelo Simples Nacional (Art. 4º, inciso XI da Instrução Normativa RFB nº 1.234/2012).';
  } else if (enq.isGlosaAdministrativa) {
    justificativaIrrfFinal = `Pagamento efetuado com GLOSA ADMINISTRATIVA do ICMS indevido (R$ ${enq.valorGlosaIcms.toFixed(2)}), sem emissão de nova nota fiscal. Em cumprimento estrito ao Art. 2º, § 10 da IN RFB nº 1.234/2012, a retenção de IRRF (${enq.aliquotaIrrf}%) incide sobre o VALOR ORIGINAL integral da nota (R$ ${enq.baseCalculoIrrf.toFixed(2)}) para cruzamento com a EFD-Reinf/DCTFWeb.`;
  } else if (enq.descIsencao > 0) {
    justificativaIrrfFinal = `Retenção de ${enq.aliquotaIrrf}% de IRRF incidente sobre o valor líquido faturado a pagar (R$ ${enq.baseCalculoIrrf.toFixed(2)}), com dedução legítima do ICMS desonerado discriminado na NF-e (Art. 3º-A da IN RFB nº 1.234/2012 e Solução de Consulta Cosit nº 34/2014).`;
  } else {
    justificativaIrrfFinal = irrfClass.justificativa;
  }

  return {
    base_calculo_origem: valorTotal,
    base_calculo_irrf_efetiva: enq.baseCalculoIrrf,
    is_glosa_administrativa: enq.isGlosaAdministrativa,
    valor_glosa_icms: enq.valorGlosaIcms > 0 ? enq.valorGlosaIcms : undefined,
    icms_origem_destacado: icmsOrigem,
    valor_desconto_comercial: descontoComercial > 0 ? descontoComercial : undefined,
    desconto_isencao_orgao_publico: enq.descIsencao > 0 ? enq.descIsencao : undefined,
    economia_tributaria_total: (enq.descIsencao + enq.valorGlosaIcms) > 0 ? truncar(enq.descIsencao + enq.valorGlosaIcms, 2) : undefined,
    valor_liquido_com_desconto: (enq.descIsencao + enq.valorGlosaIcms) > 0 ? truncar(valorTotal - (enq.descIsencao + enq.valorGlosaIcms), 2) : undefined,

    aplica_irrf_in1234: isOrgaoPublico && !isSimples,
    aliquota_irrf_in1234: (isOrgaoPublico && !isSimples) ? enq.aliquotaIrrf : 0,
    codigo_retencao_irrf: (isOrgaoPublico && !isSimples) ? irrfClass.codigoRfb : 'DISPENSADO',
    categoria_irrf_in1234: isSimples ? 'Simples Nacional - Isento de Retenção (Art. 4º, XI IN 1234)' : irrfClass.categoria,
    valor_irrf_retido: enq.irrf,
    justificativa_irrf_in1234: justificativaIrrfFinal,
    valor_liquido_pagamento_fornecedor: enq.liquidoItem,

    total_recolher_mt: 0
  };
}

export function computeDeterministicAnalysisLocal(op: OperacaoComercial): {
  jsonResponse: AnaliseTributariaJSON;
  simulacaoCalculo: SimulacaoMemoriaCalculo;
  fonteAnalise: 'MOTOR_DETERMINISTICO_LOCAL';
} {
  const valorBruto = truncar(Number(op.valor_operacao) || 0, 2);
  const descontoComercial = truncar(Number(op.valor_desconto_comercial) || 0, 2);
  const valorProdutosComDesconto = Math.max(0, valorBruto - descontoComercial);
  const valorTotal = truncar(valorProdutosComDesconto + (Number(op.valor_frete) || 0) + (Number(op.valor_despesas) || 0), 2);

  const isSimples = Boolean(op.simples_remetente);
  const porte = op.porte_remetente || 'ME';
  const tipoAdquirente = op.tipo_adquirente || (op.finalidade_compra === 'ORGAO_PUBLICO_CONSUMO' ? 'ORGAO_PUBLICO_ESTADUAL' : 'PRIVADO');
  const isOrgaoPublico = tipoAdquirente === 'ORGAO_PUBLICO_ESTADUAL';

  const primeiroItem = op.itens && op.itens.length > 0 ? op.itens[0] : null;

  const enq = calcularEnquadramentoItem(
      {
        ncm: op.ncm,
        valorTotal,
        descricao: op.descricao_produto,
        valor_icms_desonerado: primeiroItem?.valor_icms_desonerado,
        cst: primeiroItem?.cst
      },
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

  let mvaPauta = enq.isST
      ? "Substituição Tributária (Anexo X MT)"
      : (enq.cst === '40' ? "Isento c/ Desconto Obrigatório no Preço (Conv. 73/04)" : "Tributação Normal MT");

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
        resumo_regra: "Conforme a OT CGE 03/2026, a isenção de ICMS do Art. 65 Anexo IV NÃO se aplica a fornecedores optantes pelo Simples Nacional. A nota é faturada pelo valor integral da proposta (CSOSN 102 ou 500)."
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
        resumo_regra: "Produtos enquadrados em Substituição Tributária (Anexo X) possuem fase tributária encerrada (CST 60) e NÃO sofrem desconto de isenção de ICMS nas vendas a Órgãos Públicos."
      });
      fundamentacao.push({
        artigo_anexo: "IN RFB nº 1.234/2012 & STF Tema 1130 (RE 1.293.453)",
        dispositivo: `Instrução Normativa RFB nº 1.234/2012 (Anexo I - Código ${irrfClass.codigoRfb})`,
        resumo_regra: `Retenção na fonte obrigatória de IRRF de ${enq.aliquotaIrrf.toFixed(2)}% (${irrfClass.categoria}) sobre o valor faturado no fornecimento a Órgãos Públicos.`
      });
    } else if (enq.isGlosaAdministrativa) {
      fundamentacao.push({
        artigo_anexo: "Art. 2º, § 10 da Instrução Normativa RFB nº 1.234/2012",
        dispositivo: "Regulamento de Retenção de Tributos Federais",
        resumo_regra: "Havendo pagamento com glosa do ICMS indevidamente faturado sem emissão de nova NF-e substitutiva, a retenção de IRRF DEVE INCIDIR SOBRE O VALOR ORIGINAL DA NOTA para fechamento da EFD-Reinf e DCTFWeb."
      });
      fundamentacao.push({
        artigo_anexo: "Artigo 2º Anexo I & Art. 65 Anexo IV do RICMS/MT",
        dispositivo: "Decreto Estadual nº 2.212/2014-MT / Convênio ICMS 73/2004",
        resumo_regra: "A isenção do ICMS é condicionada à demonstração expressa da dedução no documento fiscal. A ausência do desconto formal na nota autoriza a glosa financeira de 17% pelo Órgão Público."
      });
    } else {
      fundamentacao.push({
        artigo_anexo: "Artigo 2º do Anexo I & Art. 65 Anexo IV do RICMS/MT",
        dispositivo: "Decreto nº 2.212/2014-MT / Convênio ICMS 73/2004",
        resumo_regra: "Isenção do ICMS mandatória para fornecedor do Regime Normal vendendo produto fora da ST para Órgão Público Estadual (CST 40), com desconto do ICMS desonerado (17%) no valor final da nota."
      });
      fundamentacao.push({
        artigo_anexo: "Art. 3º-A da IN RFB 1.234/2012 & SC Cosit nº 34/2014",
        dispositivo: `Instrução Normativa RFB nº 1.234/2012 (Anexo I - Código ${irrfClass.codigoRfb})`,
        resumo_regra: `Retenção na fonte de IRRF de ${enq.aliquotaIrrf.toFixed(2)}% incidente sobre o valor líquido faturado a pagar, em razão da dedução regular do ICMS desonerado constante na NF-e.`
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
    } else if (enq.isGlosaAdministrativa) {
      orientacao = `ALERTA DE GLOSA ADMINISTRATIVA (Art. 2º, § 10 da IN RFB nº 1.234/2012): A NF-e foi emitida sem a dedução formal do ICMS isento (CST 00/sem vICMSDeson). 1) O Órgão Público glosará R$ ${enq.valorGlosaIcms.toFixed(2)} (17% de ICMS indevido) no pagamento financeiro. 2) A retenção de IRRF (${enq.aliquotaIrrf}%) DEVE SER CALCULADA SOBRE O VALOR ORIGINAL DA NOTA (R$ ${enq.baseCalculoIrrf.toFixed(2)}), gerando IRRF retido de R$ ${enq.irrf.toFixed(2)}. 3) Ordem Bancária líquida ao fornecedor: R$ ${enq.liquidoItem.toFixed(2)}.`;
    } else {
      orientacao = `CONFORMIDADE FINANCEIRA DE COMPRAS PÚBLICAS (OT CGE-MT nº 03/2026 & Conv. 73/04): 1) REGIME NORMAL FORA DA ST (CST 40): Isenção de ICMS OBRIGATÓRIA (17%). 2) Desconto discriminado no campo 'vICMSDesonerado'. 3) Retenção de IRRF de ${enq.aliquotaIrrf.toFixed(2)}% sobre o valor faturado com desconto (Art. 3º-A da IN 1.234/12).`;
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
    base_calculo_irrf_efetiva: enq.baseCalculoIrrf,
    is_glosa_administrativa: enq.isGlosaAdministrativa,
    valor_glosa_icms: enq.valorGlosaIcms > 0 ? enq.valorGlosaIcms : undefined,
    icms_origem_destacado: isSimples ? 0 : truncar(op.icms_proprio_destacado || 0, 2),
    valor_desconto_comercial: descontoComercial > 0 ? descontoComercial : undefined,
    desconto_isencao_orgao_publico: enq.descIsencao > 0 ? enq.descIsencao : undefined,
    economia_tributaria_total: (enq.descIsencao + enq.valorGlosaIcms) > 0 ? truncar(enq.descIsencao + enq.valorGlosaIcms, 2) : undefined,
    valor_liquido_com_desconto: (enq.descIsencao + enq.valorGlosaIcms) > 0 ? truncar(valorTotal - (enq.descIsencao + enq.valorGlosaIcms), 2) : undefined,
    aplica_irrf_in1234: isOrgaoPublico && !isSimples,
    aliquota_irrf_in1234: (isOrgaoPublico && !isSimples) ? enq.aliquotaIrrf : 0,
    codigo_retencao_irrf: (isOrgaoPublico && !isSimples) ? irrfClass.codigoRfb : 'DISPENSADO',
    categoria_irrf_in1234: isSimples ? 'Simples Nacional - Isento de Retenção (Art. 4º, XI IN 1234)' : irrfClass.categoria,
    valor_irrf_retido: enq.irrf,
    justificativa_irrf_in1234: isSimples ? 'Dispensa de retenção na fonte do IRRF: Fornecedor optante pelo Simples Nacional (Art. 4º, inciso XI da IN RFB nº 1.234/2012).' : orientacao,
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
  let totalGlosaIcms = 0;
  let totalBaseIrrf = 0;
  let totalEconomiaReducaoBc = 0;
  let totalEconomiaTributaria = 0;
  let totalIrrfRetido = 0;
  let totalLiquidoPagar = 0;
  let totalIcmsRecolherMt = 0;
  let totalIcmsOrigemDestacado = 0;

  for (const { item, simulacao } of itens) {
    const vBrutoItem = truncar((item.quantidade || 1) * (item.valor_unitario || 0), 2);
    const vDescItem = truncar(Number(item.valor_desconto_comercial) || 0, 2);
    const vFreteDespItem = truncar((Number(item.valor_frete) || 0) + (Number(item.valor_despesas) || 0), 2);

    totalValorBruto += vBrutoItem;
    totalDescontoComercial += vDescItem;
    totalFreteDespesas += vFreteDespItem;
    totalBaseCalculo += simulacao.base_calculo_origem || Math.max(0, vBrutoItem - vDescItem) + vFreteDespItem;
    totalDescontoIsencaoIcms += simulacao.desconto_isencao_orgao_publico || 0;
    totalGlosaIcms += simulacao.valor_glosa_icms || 0;
    totalBaseIrrf += simulacao.base_calculo_irrf_efetiva || simulacao.base_calculo_origem;
    totalEconomiaReducaoBc += simulacao.desconto_reducao_bc_anexo_v || 0;
    totalEconomiaTributaria += (simulacao.desconto_isencao_orgao_publico || 0) + (simulacao.valor_glosa_icms || 0) + (simulacao.desconto_reducao_bc_anexo_v || 0);
    totalIrrfRetido += simulacao.valor_irrf_retido || 0;
    totalLiquidoPagar += (simulacao.valor_liquido_pagamento_fornecedor !== undefined
        ? simulacao.valor_liquido_pagamento_fornecedor
        : (simulacao.valor_liquido_com_desconto !== undefined ? simulacao.valor_liquido_com_desconto : vBrutoItem));
    totalIcmsRecolherMt += simulacao.total_recolher_mt || 0;
    totalIcmsOrigemDestacado += simulacao.icms_origem_destacado || 0;
  }

  return {
    total_itens_qtd: itens.length,
    total_valor_bruto: truncar(totalValorBruto, 2),
    total_desconto_comercial: truncar(totalDescontoComercial, 2),
    total_frete_despesas: truncar(totalFreteDespesas, 2),
    total_base_calculo: truncar(totalBaseCalculo, 2),
    total_desconto_isencao_icms: truncar(totalDescontoIsencaoIcms, 2),
    total_glosa_icms: truncar(totalGlosaIcms, 2),
    total_base_irrf: truncar(totalBaseIrrf, 2),
    total_economia_reducao_bc: truncar(totalEconomiaReducaoBc, 2),
    total_economia_tributaria: truncar(totalEconomiaTributaria, 2),
    total_irrf_retido: truncar(totalIrrfRetido, 2),
    total_liquido_pagar_fornecedor: truncar(totalLiquidoPagar, 2),
    total_icms_recolher_mt: truncar(totalIcmsRecolherMt, 2),
    total_icms_origem_destacado: truncar(totalIcmsOrigemDestacado, 2)
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
    const valorBrutoItem = truncar((it.quantidade || 1) * (it.valor_unitario || 0), 2);
    const descontoItem = truncar(Number(it.valor_desconto_comercial) || 0, 2);
    const freteDespesasItem = truncar((Number(it.valor_frete) || 0) + (Number(it.valor_despesas) || 0), 2);

    const valorLiquidoBaseItem = truncar(Math.max(0, valorBrutoItem - descontoItem) + freteDespesasItem, 2);

    const enq = calcularEnquadramentoItem(
        {
          ncm: it.ncm,
          valorTotal: valorLiquidoBaseItem,
          descricao: it.descricao,
          valor_icms_desonerado: it.valor_icms_desonerado,
          cst: it.cst
        },
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
      base_calculo_irrf_efetiva: enq.baseCalculoIrrf,
      is_glosa_administrativa: enq.isGlosaAdministrativa,
      valor_glosa_icms: enq.valorGlosaIcms > 0 ? enq.valorGlosaIcms : undefined,
      valor_desconto_comercial: descontoItem > 0 ? descontoItem : undefined,
      desconto_isencao_orgao_publico: enq.descIsencao > 0 ? enq.descIsencao : undefined,
      valor_liquido_com_desconto: (enq.descIsencao + enq.valorGlosaIcms) > 0 ? truncar(valorLiquidoBaseItem - (enq.descIsencao + enq.valorGlosaIcms), 2) : undefined,
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
  const temAlgumaGlosa = itensAnalise.some(i => i.simulacao.is_glosa_administrativa);

  let orientacaoConsolidada = "";

  if (isSimples) {
    orientacaoConsolidada = `CONFORMIDADE FINANCEIRA DE COMPRAS PÚBLICAS (OT CGE-MT nº 03/2026): 1) FORNECEDOR SIMPLES NACIONAL (CSOSN 102/500): A isenção de ICMS do Art. 65 do Anexo IV NÃO se aplica. 2) A Nota Fiscal deve ser faturada pelo VALOR INTEGRAL da proposta sem desconto. 3) Dispensa de retenção de IRRF (Art. 4º, XI da IN RFB nº 1.234/2012).`;
  } else if (temMultiplosItens) {
    orientacaoConsolidada = `CONFORMIDADE FINANCEIRA DE COMPRAS PÚBLICAS (IN RFB nº 1.234/2012 & OT CGE-MT nº 03/2026): 1) Operação com ${itensAnalise.length} itens.${temAlgumaGlosa ? ` Identificada GLOSA ADMINISTRATIVA em itens sem desoneração formal (Art. 2º, § 10 da IN 1.234/12), onde a retenção de IRRF incide sobre o valor original.` : ''} 2) Retenção na fonte de IRRF apurada ITEM A ITEM conforme Anexo I da IN RFB nº 1.234/2012 (incluindo 0,24% para combustíveis/GLP e 1,20% para mercadorias), totalizando a retenção de ${resumo.total_irrf_retido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} no pagamento ao fornecedor.`;
  } else {
    const aliqUnica = itensAnalise[0]?.simulacao.aliquota_irrf_in1234 || 1.20;
    const isStUnico = itensAnalise[0]?.jsonResponse.enquadramento_produto.regime_tributario_aplicavel?.includes('Substituição');
    if (isStUnico) {
      orientacaoConsolidada = `CONFORMIDADE FINANCEIRA DE COMPRAS PÚBLICAS (OT CGE-MT nº 03/2026 & Art. 65 § 3º Anexo IV): 1) PRODUTO EM SUBSTITUIÇÃO TRIBUTÁRIA (CST 60): A isenção de ICMS não se aplica a mercadorias sob ST. 2) A Nota Fiscal é faturada pelo valor integral sem desconto de ICMS. 3) Retenção na fonte de IRRF de ${aliqUnica.toFixed(2)}% no pagamento ao fornecedor.`;
    } else if (primeiro.simulacao.is_glosa_administrativa) {
      orientacaoConsolidada = `ALERTA DE GLOSA ADMINISTRATIVA (Art. 2º, § 10 da IN RFB 1.234/2012): A NF-e não trouxe o ICMS desonerado formal. Glosa financeira de R$ ${resumo.total_glosa_icms.toFixed(2)} aplicada no pagamento. A retenção de IRRF (${aliqUnica}%) incide obrigatoriamente sobre o valor original da nota.`;
    } else {
      orientacaoConsolidada = `CONFORMIDADE FINANCEIRA DE COMPRAS PÚBLICAS (OT CGE-MT nº 03/2026 & Conv. 73/04): 1) REGIME NORMAL FORA DA ST (CST 40): Isenção de ICMS OBRIGATÓRIA (17%). 2) Retenção de IRRF de ${aliqUnica.toFixed(2)}% sobre o valor faturado com desconto.`;
    }
  }

  const fundamentacaoConsolidada = temMultiplosItens
      ? [
        {
          artigo_anexo: "Orientação Técnica nº 03/2026 CGE-MT & RICMS/MT",
          dispositivo: "Decreto nº 2.212/2014-MT",
          resumo_regra: `Operação com ${itensAnalise.length} itens: produtos enquadrados no Anexo X (ST) são faturados integralmente (CST 60) e itens fora da ST exigem abatimento de 17% a título de ICMS desonerado (CST 40) ou glosa administrativa.`
        },
        {
          artigo_anexo: "IN RFB nº 1.234/2012 & STF Tema 1130 (RE 1.293.453)",
          dispositivo: "Instrução Normativa RFB nº 1.234/2012 (Art. 2º, § 10 c/c Art. 3º-A)",
          resumo_regra: isSimples
              ? "Dispensa de retenção na fonte do IRRF para fornecedor optante pelo Simples Nacional (Art. 4º, XI)."
              : "Retenção na fonte de IRRF item a item: base líquida para descontos formais (Art. 3º-A) ou base integral para pagamentos com glosa sem nova NF (Art. 2º, § 10)."
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
      base_calculo_irrf_efetiva: resumo.total_base_irrf,
      is_glosa_administrativa: temAlgumaGlosa,
      valor_glosa_icms: resumo.total_glosa_icms > 0 ? resumo.total_glosa_icms : undefined,
      icms_origem_destacado: resumo.total_icms_origem_destacado,
      valor_desconto_comercial: resumo.total_desconto_comercial > 0 ? resumo.total_desconto_comercial : undefined,
      desconto_isencao_orgao_publico: resumo.total_desconto_isencao_icms > 0 ? resumo.total_desconto_isencao_icms : undefined,
      desconto_reducao_bc_anexo_v: resumo.total_economia_reducao_bc > 0 ? resumo.total_economia_reducao_bc : undefined,
      economia_tributaria_total: resumo.total_economia_tributaria > 0 ? resumo.total_economia_tributaria : undefined,
      valor_liquido_com_desconto: truncar(resumo.total_base_calculo - (resumo.total_desconto_isencao_icms + resumo.total_glosa_icms), 2),
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