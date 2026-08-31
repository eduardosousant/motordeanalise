import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { OperacaoComercial, AnaliseTributariaJSON, SimulacaoMemoriaCalculo } from '../types.js';
import { consultarNcmOficialMT, verificarNcmNoAnexoX } from '../data/ncmDatabase.js';
import { calcularEnquadramentoItem, getIrrfClassification } from '../lib/taxCalculations.js';

let aiClient: GoogleGenAI | null = null;

// Persistent cache storage structure
interface TaxCacheEntry {
  cacheKey: string;
  createdAt: string;
  ncm: string;
  ufOrigem: string;
  ufDestino: string;
  simplesRemetente: boolean;
  porteRemetente: string;
  finalidadeCompra: string;
  tipoAdquirente: string;
  origemAi: boolean;
  jsonResponse: AnaliseTributariaJSON;
}

interface TaxCacheFile {
  updatedAt: string;
  totalEntries: number;
  entries: Record<string, TaxCacheEntry>;
}

const CACHE_FILE_PATH = path.join(process.cwd(), 'tax_cache.json');
let taxCacheInMemory: Record<string, TaxCacheEntry> | null = null;

function normalizeNcm(ncm: string): string {
  return ncm.replace(/\D/g, '');
}

function buildCacheKey(op: OperacaoComercial): string {
  const ncmClean = normalizeNcm(op.ncm);
  const ufOrigem = (op.uf_origem || 'SP').toUpperCase();
  const ufDestino = (op.uf_destino || 'MT').toUpperCase();
  const simples = Boolean(op.simples_remetente) ? 'SIMPLES' : 'NORMAL';
  const porte = (op.porte_remetente || 'ME').toUpperCase();
  const adquirente = (op.tipo_adquirente || (op.finalidade_compra === 'ORGAO_PUBLICO_CONSUMO' ? 'ORGAO_PUBLICO_ESTADUAL' : 'PRIVADO')).toUpperCase();
  const finalidade = (op.finalidade_compra || 'REVENDA').toUpperCase();

  return `${ncmClean}_${ufOrigem}_${ufDestino}_${simples}_${porte}_${adquirente}_${finalidade}`;
}

function loadTaxCache(): Record<string, TaxCacheEntry> {
  if (taxCacheInMemory) {
    return taxCacheInMemory;
  }

  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const rawData = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
      const parsedData: TaxCacheFile = JSON.parse(rawData);
      taxCacheInMemory = parsedData.entries || {};
      console.log(`[TAX ENGINE CACHE] ${Object.keys(taxCacheInMemory).length} análises tributárias carregadas do arquivo local (tax_cache.json).`);
      return taxCacheInMemory;
    }
  } catch (err) {
    console.warn('[TAX ENGINE CACHE] Erro ao ler tax_cache.json, iniciando base vazia:', err);
  }

  taxCacheInMemory = {};
  return taxCacheInMemory;
}

function saveTaxCache(cache: Record<string, TaxCacheEntry>): void {
  taxCacheInMemory = cache;
  try {
    const payload: TaxCacheFile = {
      updatedAt: new Date().toISOString(),
      totalEntries: Object.keys(cache).length,
      entries: cache
    };
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    console.log(`[TAX ENGINE CACHE] Base local tax_cache.json atualizada com sucesso (${payload.totalEntries} análises salvas).`);
  } catch (err) {
    console.error('[TAX ENGINE CACHE] Erro ao salvar tax_cache.json:', err);
  }
}

export function getTaxCacheStats(): {
  totalCacheEntries: number;
  ncmsCached: string[];
  lastUpdate?: string;
} {
  const cache = loadTaxCache();
  const entries = Object.values(cache);
  const uniqueNcms = Array.from(new Set(entries.map(e => e.ncm)));

  return {
    totalCacheEntries: entries.length,
    ncmsCached: uniqueNcms,
    lastUpdate: entries.length > 0 ? entries[entries.length - 1].createdAt : undefined
  };
}

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

export async function processTaxAnalysis(operacao: OperacaoComercial): Promise<{
  jsonResponse: AnaliseTributariaJSON;
  simulacaoCalculo: SimulacaoMemoriaCalculo;
  fonteAnalise: 'CACHE_AI_LOCAL' | 'GEMINI_AI_AO_VIVO' | 'MOTOR_DETERMINISTICO_LOCAL';
}> {
  const cacheMap = loadTaxCache();
  const cacheKey = buildCacheKey(operacao);

  // 1. VERIFICAÇÃO PRÉVIA NO CACHE LOCAL PERSISTIDO
  if (cacheMap[cacheKey]) {
    const cachedEntry = cacheMap[cacheKey];
    console.info(`[TAX ENGINE CACHE HIT] Análise recuperada da base local para NCM ${operacao.ncm} (${cacheKey}). Sem consumo de API/Cota.`);

    const simulacao = computeSimulation(operacao, cachedEntry.jsonResponse);

    return {
      jsonResponse: cachedEntry.jsonResponse,
      simulacaoCalculo: simulacao,
      fonteAnalise: 'CACHE_AI_LOCAL'
    };
  }

  // 2. SE NÃO ESTIVER EM CACHE, TENTA A GEMINI API
  const ai = getAiClient();

  if (ai) {
    try {
      const systemPrompt = `Você é um Motor de Análise Tributária e Auditoria Fiscal especialista na legislação do Estado de Mato Grosso (Decreto nº 2.212/2014 - RICMS/MT), na Orientação Técnica nº 03/2026 da CGE-MT (Controladoria-Geral do Estado), na Instrução Normativa RFB nº 1.234/2012 (com STF Tema 1130 / RE 1.293.453 para IRRF em aquisições públicas), no Convênio ICMS 73/2004 e na LC 123/2006.

REGRAS CRÍTICAS PARA COMPRAS DE ÓRGÃOS PÚBLICOS ESTADUAIS DE MATO GROSSO (Secretarias, Autarquias e Fundações):
Conforme a Orientação Técnica CGE nº 03/2026, Anexo IV (Art. 65 § 3º) / Anexo I (Art. 2º) do RICMS/MT, e IN RFB nº 1.234/2012:

1. ICMS - SE O FORNECEDOR FOR OPTANTE PELO SIMPLES NACIONAL:
   - A ISENÇÃO DE ICMS NÃO SE APLICA (Orientação Técnica CGE nº 03/2026 e Cartilha de Compras Públicas CGE/MT).
   - Justificativa: O Simples Nacional possui tributação unificada própria (LC 123/2006) e a legislação estadual de MT não estende esse benefício de isenção a optantes do Simples.
   - Consequência: A nota fiscal (NF-e) DEVE ser faturada pelo valor integral da proposta, SEM DESCONTO DE ISENÇÃO DE ICMS (sem abatimento de 17% ou 12%). O Estado paga a proposta na íntegra.

2. ICMS - SE O FORNECEDOR FOR DO REGIME NORMAL:
   - Passo 2A: Verificar se o produto (pelo NCM) está enquadrado em Substituição Tributária (ST - Apêndice do Anexo X do RICMS/MT):
     * Se estiver em ST (ex: tintas 3209, cimentos 2523, combustíveis 2710/2711, lâmpadas 8539, materiais sanitários 3922/6910): A ISENÇÃO NÃO SE APLICA, conforme determinado no Art. 65, § 3º do Anexo IV do RICMS/MT & Orientação Técnica CGE nº 03/2026. A nota fiscal NÃO terá desconto de isenção e é faturada pelo valor integral (CST 60), com retenção de IRRF (IN RFB 1.234/2012) no pagamento.
     * Se NÃO estiver em ST (ex: solventes/thinner 3814, lanternas 8513, papel A4 4802): A ISENÇÃO É OBRIGATÓRIA (Art. 2º do Anexo I e Art. 65 do Anexo IV do RICMS/MT / Conv. ICMS 73/04). A nota fiscal DEVE ser emitida sob CST 40, ICMS R$ 0,00 e o valor equivalente ao ICMS dispensado (17% ou alíquota correspondente) DEVE ser destacado no campo 'vICMSDesonerado' e ABATIDO no valor final do produto/fatura.

3. IMPOSTO DE RENDA RETIDO NA FONTE (IRRF - IN RFB Nº 1.234/2012 & STF TEMA 1130 / RE 1.293.453):
   - Nas aquisições efetuadas por Órgãos Públicos (Estado de MT), aplica-se a retenção na fonte do IRRF no momento do pagamento da fatura, calculada sobre o valor líquido faturado após os descontos comerciais e desonerações:
     * SIMPLES NACIONAL: DISPENSADO de retenção na fonte de IRRF (Art. 4º, XI da IN RFB nº 1.234/2012). Alíquota = 0,0%.
     * REGIME NORMAL (Lucro Presumido / Lucro Real):
       - Alíquota 0,24% (Cód. RFB 8730): Gás Liquefeito de Petróleo (GLP - Gás de Cozinha NCM 2711), Gasolina, Óleo Diesel, QAV, Gás Natural e derivados de petróleo.
       - Alíquota 1,20% (Cód. RFB 8767): Bens e mercadorias em geral (suprimentos, água mineral, peças, medicamentos, móveis, equipamentos, papéis, etc.).
       - Alíquota 2,40% (Cód. RFB 8783): Serviços de transporte de cargas e fretes.
       - Alíquota 4,80% (Cód. RFB 8754 / 6147): Serviços em geral (manutenção, TI, assessoria, segurança, limpeza, conservação, etc.).
     * O montante do IRRF é retido na fonte pelo Órgão Público adquirente no pagamento e o valor líquido é repassado ao fornecedor.

IMPORTANTE: Na propriedade 'orientacao_fiscal', apresente as orientações normativas de forma conceitual e percentual. NÃO insira valores monetários numéricos fixos em Reais (R$) no texto da orientacao_fiscal, pois a memória de cálculo financeira é gerada dinamicamente pelo sistema.

FORMATO ESTRITO DE RESPOSTA JSON EXIGIDO:
{
  "status_analise": "SUCESSO" | "INFORMAÇÃO_INCOMPLETA",
  "resumo_fornecedor": {
    "cnpj": "string",
    "porte": "MEI | ME | EPP | DEMAIS",
    "optante_simples": true | false,
    "impacto_tributario_porte": "string explicativa detalhando OT 03/2026 se for compra pública"
  },
  "enquadramento_produto": {
    "ncm": "string",
    "descricao": "string",
    "regime_tributario_aplicavel": "Substituição Tributária | Estimativa Simplificada | Isento | Tributação Normal | Isento (Órgão Público Estadual) | Simples Nacional - Sem Isenção OT 03/2026"
  },
  "aliquotas": {
    "aliquota_origem": "string%",
    "aliquota_interna_mt": "string%",
    "mva_ou_pauta": "string ou N/A"
  },
  "fundamentacao_legal": [
    {
      "artigo_anexo": "string (ex: Orientação Técnica nº 03/2026 CGE-MT / Art. 65 § 3º Anexo IV RICMS/MT)",
      "dispositivo": "Decreto nº 2.212/2014-MT / OT 03/2026",
      "resumo_regra": "string"
    }
  ],
  "orientacao_fiscal": "string descritiva com o checklist de validação para a execução financeira e emissão da NF-e."
}`;

      const promptUser = `Realize a análise tributária para o Estado de Mato Grosso com base nos dados desta operação:
- CNPJ Fornecedor: ${operacao.cnpj_fornecedor} (${operacao.razao_social_fornecedor || 'Fornecedor Consultado'})
- Tipo do Adquirente em MT: ${operacao.tipo_adquirente === 'ORGAO_PUBLICO_ESTADUAL' || operacao.finalidade_compra === 'ORGAO_PUBLICO_CONSUMO' ? 'ÓRGÃO PÚBLICO ESTADUAL / SECRETARIA / AUTARQUIA / FUNDAÇÃO DE MT' : 'Empresa Privada'}
- UF Origem: ${operacao.uf_origem} -> UF Destino: ${operacao.uf_destino || 'MT'}
- Porte Fornecedor: ${operacao.porte_remetente || 'ME'} | Optante Simples Nacional: ${operacao.simples_remetente ? 'SIM' : 'NÃO'}
- NCM: ${operacao.ncm}
- Descrição do Produto: ${operacao.descricao_produto}
- Finalidade da Compra em MT: ${operacao.finalidade_compra}
- Valor da Operação: R$ ${operacao.valor_operacao.toFixed(2)}
- Desconto Comercial: R$ ${(operacao.valor_desconto_comercial || 0).toFixed(2)}
- Valor do Frete: R$ ${(operacao.valor_frete || 0).toFixed(2)}
- ICMS Próprio Destacado na Origem: R$ ${(operacao.icms_proprio_destacado || 0).toFixed(2)}`;

      const candidateModels = ['gemini-2.5-flash', 'gemini-1.5-flash'];
      let parsedJson: AnaliseTributariaJSON | null = null;

      for (const modelName of candidateModels) {
        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts && !parsedJson) {
          attempts++;
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: promptUser,
              config: {
                systemInstruction: systemPrompt,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    status_analise: { type: Type.STRING, description: "SUCESSO ou INFORMAÇÃO_INCOMPLETA" },
                    resumo_fornecedor: {
                      type: Type.OBJECT,
                      properties: {
                        cnpj: { type: Type.STRING },
                        porte: { type: Type.STRING },
                        optante_simples: { type: Type.BOOLEAN },
                        impacto_tributario_porte: { type: Type.STRING }
                      },
                      required: ["cnpj", "porte", "optante_simples", "impacto_tributario_porte"]
                    },
                    enquadramento_produto: {
                      type: Type.OBJECT,
                      properties: {
                        ncm: { type: Type.STRING },
                        descricao: { type: Type.STRING },
                        regime_tributario_aplicavel: { type: Type.STRING }
                      },
                      required: ["ncm", "descricao", "regime_tributario_aplicavel"]
                    },
                    aliquotas: {
                      type: Type.OBJECT,
                      properties: {
                        aliquota_origem: { type: Type.STRING },
                        aliquota_interna_mt: { type: Type.STRING },
                        mva_ou_pauta: { type: Type.STRING }
                      },
                      required: ["aliquota_origem", "aliquota_interna_mt", "mva_ou_pauta"]
                    },
                    fundamentacao_legal: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          artigo_anexo: { type: Type.STRING },
                          dispositivo: { type: Type.STRING },
                          resumo_regra: { type: Type.STRING }
                        },
                        required: ["artigo_anexo", "dispositivo", "resumo_regra"]
                      }
                    },
                    orientacao_fiscal: { type: Type.STRING }
                  },
                  required: ["status_analise", "resumo_fornecedor", "enquadramento_produto", "aliquotas", "fundamentacao_legal", "orientacao_fiscal"]
                }
              }
            });

            if (response.text) {
              parsedJson = JSON.parse(response.text.trim()) as AnaliseTributariaJSON;
              break;
            }
          } catch (modelErr: any) {
            const isHighDemand = modelErr?.status === 503 || modelErr?.status === 'UNAVAILABLE' || modelErr?.message?.includes('503');
            const isQuota = modelErr?.status === 429 || modelErr?.status === 'RESOURCE_EXHAUSTED' || modelErr?.message?.includes('429');

            if ((isHighDemand || isQuota) && attempts < maxAttempts) {
              await new Promise((r) => setTimeout(r, 600 * attempts));
            } else {
              break;
            }
          }
        }

        if (parsedJson) {
          break;
        }
      }

      if (parsedJson) {
        cacheMap[cacheKey] = {
          cacheKey,
          createdAt: new Date().toISOString(),
          ncm: operacao.ncm,
          ufOrigem: operacao.uf_origem,
          ufDestino: operacao.uf_destino || 'MT',
          simplesRemetente: Boolean(operacao.simples_remetente),
          porteRemetente: operacao.porte_remetente || 'ME',
          finalidadeCompra: operacao.finalidade_compra,
          tipoAdquirente: operacao.tipo_adquirente || 'PRIVADO',
          origemAi: true,
          jsonResponse: parsedJson
        };
        saveTaxCache(cacheMap);

        const simulacao = computeSimulation(operacao, parsedJson);
        return {
          jsonResponse: parsedJson,
          simulacaoCalculo: simulacao,
          fonteAnalise: 'GEMINI_AI_AO_VIVO'
        };
      }
    } catch (e: any) {
      console.info('[TAX ENGINE] Alternando para motor determinístico local SEFAZ/MT.');
    }
  }

  // 3. FALLBACK PARA O MOTOR DETERMINÍSTICO SEFAZ/MT
  const detResult = computeDeterministicAnalysis(operacao);

  cacheMap[cacheKey] = {
    cacheKey,
    createdAt: new Date().toISOString(),
    ncm: operacao.ncm,
    ufOrigem: operacao.uf_origem,
    ufDestino: operacao.uf_destino || 'MT',
    simplesRemetente: Boolean(operacao.simples_remetente),
    porteRemetente: operacao.porte_remetente || 'ME',
    finalidadeCompra: operacao.finalidade_compra,
    tipoAdquirente: operacao.tipo_adquirente || 'PRIVADO',
    origemAi: false,
    jsonResponse: detResult.jsonResponse
  };
  saveTaxCache(cacheMap);

  return {
    ...detResult,
    fonteAnalise: 'MOTOR_DETERMINISTICO_LOCAL'
  };
}

function checkProductSt(ncmInput: string, _descricaoInput?: string): boolean {
  return verificarNcmNoAnexoX(ncmInput);
}

function computeSimulation(op: OperacaoComercial, jsonRes: AnaliseTributariaJSON): SimulacaoMemoriaCalculo {
  const valorBruto = Number(op.valor_operacao) || 0;
  const descontoComercial = Number(op.valor_desconto_comercial) || 0;
  const valorProdutosComDesconto = Math.max(0, valorBruto - descontoComercial);
  const valorTotal = valorProdutosComDesconto + (Number(op.valor_frete) || 0) + (Number(op.valor_despesas) || 0);

  const aligOrigemNum = parseFloat((jsonRes.aliquotas?.aliquota_origem || '7%').replace('%', '')) || 7;
  const aliqMTNum = parseFloat((jsonRes.aliquotas?.aliquota_interna_mt || '17%').replace('%', '')) || 17;

  let icmsOrigem = Number(op.icms_proprio_destacado) || (valorTotal * (aligOrigemNum / 100));
  if (op.simples_remetente) {
    icmsOrigem = 0;
  }

  const isOrgaoPublico = op.tipo_adquirente === 'ORGAO_PUBLICO_ESTADUAL' || op.finalidade_compra === 'ORGAO_PUBLICO_CONSUMO';
  const regime = jsonRes.enquadramento_produto.regime_tributario_aplicavel;
  const isSimples = Boolean(op.simples_remetente);
  const isStProduct = regime === 'Substituição Tributária' || checkProductSt(op.ncm, op.descricao_produto);

  let totalRecolher = 0;
  let mvaNum: number | undefined = undefined;
  let baseCalculoSt: number | undefined = undefined;
  let icmsStDevido: number | undefined = undefined;
  let difalDevido: number | undefined = undefined;
  let cargaMediaPct: number | undefined = undefined;
  let icmsEstimativaDevido: number | undefined = undefined;
  let descontoIsencaoOrgaoPublico: number | undefined = undefined;
  let descontoReducaoBcAnexoV: number | undefined = undefined;

  const isCestaBasica = jsonRes.fundamentacao_legal.some(f => f.artigo_anexo.includes('Anexo V') || f.resumo_regra.includes('cesta básica') || f.resumo_regra.includes('carga tributária equivalente a 7%'));

  if (isOrgaoPublico || regime === 'Isento (Órgão Público Estadual)') {
    if (isSimples) {
      descontoIsencaoOrgaoPublico = undefined;
      totalRecolher = 0;
    } else if (isStProduct) {
      descontoIsencaoOrgaoPublico = undefined;
      totalRecolher = 0;
    } else {
      descontoIsencaoOrgaoPublico = valorTotal * (aliqMTNum / 100);
      totalRecolher = 0;
    }
  } else if (op.finalidade_compra === 'USO_CONSUMO' || op.finalidade_compra === 'ATIVO_IMOBILIZADO') {
    const aliqDifal = Math.max(0, aliqMTNum - aligOrigemNum);
    difalDevido = valorTotal * (aliqDifal / 100);
    totalRecolher = difalDevido;
  } else if (regime === 'Substituição Tributária') {
    const mvaStr = jsonRes.aliquotas.mva_ou_pauta || '40%';
    mvaNum = parseFloat(mvaStr.replace('%', '').replace('MVA', '')) || 40;
    baseCalculoSt = valorTotal * (1 + (mvaNum / 100));
    const icmsSubtotal = baseCalculoSt * (aliqMTNum / 100);
    icmsStDevido = Math.max(0, icmsSubtotal - icmsOrigem);
    totalRecolher = icmsStDevido;
  } else if (regime === 'Estimativa Simplificada') {
    if (isCestaBasica) {
      cargaMediaPct = 7.0;
      const icmsSemBeneficio = valorTotal * (aliqMTNum / 100);
      icmsEstimativaDevido = valorTotal * (cargaMediaPct / 100);
      descontoReducaoBcAnexoV = Math.max(0, icmsSemBeneficio - icmsEstimativaDevido);
    } else {
      cargaMediaPct = 12.5;
      icmsEstimativaDevido = valorTotal * (cargaMediaPct / 100);
    }
    totalRecolher = icmsEstimativaDevido;
  } else if (regime === 'Isento') {
    totalRecolher = 0;
  } else {
    const icmsInterno = valorTotal * (aliqMTNum / 100);
    totalRecolher = Math.max(0, icmsInterno - icmsOrigem);
  }

  const economiaTributariaTotal = (descontoIsencaoOrgaoPublico || 0) + (descontoReducaoBcAnexoV || 0);
  const valorLiquidoComDesconto = Math.max(0, valorTotal - (descontoIsencaoOrgaoPublico || 0));

  let aplicaIrrfIn1234: boolean | undefined = undefined;
  let aliquotaIrrfIn1234: number | undefined = undefined;
  let codigoRetencaoIrrf: string | undefined = undefined;
  let categoriaIrrfIn1234: string | undefined = undefined;
  let valorIrrfRetido: number | undefined = undefined;
  let justificativaIrrfIn1234: string | undefined = undefined;
  let valorLiquidoPagamentoFornecedor: number | undefined = undefined;

  if (isOrgaoPublico) {
    if (isSimples) {
      aplicaIrrfIn1234 = false;
      aliquotaIrrfIn1234 = 0;
      codigoRetencaoIrrf = 'DISPENSADO';
      categoriaIrrfIn1234 = 'Simples Nacional - Isento de Retenção (Art. 4º, XI IN 1234)';
      valorIrrfRetido = 0;
      justificativaIrrfIn1234 = "Dispensa de retenção na fonte do IRRF: Fornecedor optante pelo Simples Nacional (Art. 4º, inciso XI da Instrução Normativa RFB nº 1.234/2012).";
      valorLiquidoPagamentoFornecedor = valorLiquidoComDesconto;
    } else {
      const classifIrrf = getIrrfClassification(op.ncm, op.descricao_produto);
      aplicaIrrfIn1234 = true;
      aliquotaIrrfIn1234 = classifIrrf.aliquota;
      codigoRetencaoIrrf = classifIrrf.codigoRfb;
      categoriaIrrfIn1234 = classifIrrf.categoria;
      valorIrrfRetido = valorLiquidoComDesconto * (aliquotaIrrfIn1234 / 100);
      justificativaIrrfIn1234 = classifIrrf.justificativa;
      valorLiquidoPagamentoFornecedor = Math.max(0, valorLiquidoComDesconto - valorIrrfRetido);
    }
  }

  return {
    base_calculo_origem: valorTotal,
    icms_origem_destacado: icmsOrigem,
    mva_percentual: mvaNum,
    base_calculo_st: baseCalculoSt,
    icms_st_devido: icmsStDevido,
    carga_media_percentual: cargaMediaPct,
    icms_estimativa_simplificada_devido: icmsEstimativaDevido,
    difal_devido: difalDevido,
    valor_desconto_comercial: descontoComercial > 0 ? descontoComercial : undefined,
    desconto_isencao_orgao_publico: descontoIsencaoOrgaoPublico,
    desconto_reducao_bc_anexo_v: descontoReducaoBcAnexoV,
    economia_tributaria_total: economiaTributariaTotal > 0 ? economiaTributariaTotal : undefined,
    valor_liquido_com_desconto: valorLiquidoComDesconto !== valorTotal ? valorLiquidoComDesconto : undefined,

    aplica_irrf_in1234: aplicaIrrfIn1234,
    aliquota_irrf_in1234: aliquotaIrrfIn1234,
    codigo_retencao_irrf: codigoRetencaoIrrf,
    categoria_irrf_in1234: categoriaIrrfIn1234,
    valor_irrf_retido: valorIrrfRetido,
    justificativa_irrf_in1234: justificativaIrrfIn1234,
    valor_liquido_pagamento_fornecedor: valorLiquidoPagamentoFornecedor,

    total_recolher_mt: totalRecolher
  };
}

function computeDeterministicAnalysis(op: OperacaoComercial): {
  jsonResponse: AnaliseTributariaJSON;
  simulacaoCalculo: SimulacaoMemoriaCalculo;
} {
  const valorBruto = Number(op.valor_operacao) || 0;
  const descontoComercial = Number(op.valor_desconto_comercial) || 0;
  const valorProdutosComDesconto = Math.max(0, valorBruto - descontoComercial);
  const valorTotal = valorProdutosComDesconto + (Number(op.valor_frete) || 0) + (Number(op.valor_despesas) || 0);

  const ufOrigem = (op.uf_origem || 'SP').toUpperCase();
  const isSimples = Boolean(op.simples_remetente);
  const porte = op.porte_remetente || 'ME';
  const tipoAdquirente = op.tipo_adquirente || (op.finalidade_compra === 'ORGAO_PUBLICO_CONSUMO' ? 'ORGAO_PUBLICO_ESTADUAL' : 'PRIVADO');
  const isOrgaoPublico = tipoAdquirente === 'ORGAO_PUBLICO_ESTADUAL';

  const enq = calcularEnquadramentoItem(
      { ncm: op.ncm, valorTotal, descricao: op.descricao_produto },
      { isSimplesNacional: isSimples },
      { tipo: tipoAdquirente }
  );

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
        resumo_regra: "Produtos enquadrados no regime de Substituição Tributária (Anexo X) são exceção e NÃO gozam de isenção de ICMS nas vendas a Órgãos Públicos."
      });
      fundamentacao.push({
        artigo_anexo: "IN RFB nº 1.234/2012 & STF Tema 1130 (RE 1.293.453)",
        dispositivo: `Instrução Normativa RFB nº 1.234/2012 (Anexo I - Código ${irrfClass.codigoRfb})`,
        resumo_regra: `Retenção na fonte obrigatória de IRRF no percentual de ${enq.aliquotaIrrf.toFixed(2)}% (${irrfClass.categoria}) sobre o valor faturado no fornecimento de bens a Órgãos Públicos.`
      });
    } else {
      fundamentacao.push({
        artigo_anexo: "Artigo 2º do Anexo I & Art. 65 Anexo IV do RICMS/MT",
        dispositivo: "Decreto nº 2.212/2014-MT / Convênio ICMS 73/2004",
        resumo_regra: "Isenção do ICMS mandatória para empresas do Regime Normal vendendo produtos fora da ST para Órgãos Públicos Estaduais. Exige desconto equivalente ao ICMS dispensado (17%) e CST 40."
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
      orientacao = `CONFORMIDADE FINANCEIRA DE COMPRAS PÚBLICAS (OT CGE-MT nº 03/2026): 1) FORNECEDOR SIMPLES NACIONAL (${enq.cst === '500' ? 'CSOSN 500' : 'CSOSN 102'}): A isenção de ICMS do Art. 65 do Anexo IV NÃO se aplica ao Simples Nacional. 2) A Nota Fiscal apresentada deve ser emitida pelo VALOR INTEGRAL da proposta, sem desconto de ICMS. 3) Dispensa de retenção de IRRF (Art. 4º, XI da IN RFB nº 1.234/2012).`;
    } else if (enq.isST) {
      orientacao = `CONFORMIDADE FINANCEIRA DE COMPRAS PÚBLICAS (OT CGE-MT nº 03/2026 & Art. 65 § 3º Anexo IV): 1) PRODUTO EM SUBSTITUIÇÃO TRIBUTÁRIA (CST 60): A isenção de ICMS não abrange mercadorias sob ST. 2) A Nota Fiscal é faturada pelo valor integral sem desconto de ICMS. 3) Retenção na fonte de IRRF de ${enq.aliquotaIrrf.toFixed(2)}% (${irrfClass.categoria}) no pagamento ao fornecedor.`;
    } else {
      orientacao = `CONFORMIDADE FINANCEIRA DE COMPRAS PÚBLICAS (OT CGE-MT nº 03/2026 & Conv. 73/04): 1) REGIME NORMAL SEM ST (CST 40): Isenção de ICMS OBRIGATÓRIA com desconto destacado em 'vICMSDesonerado' (17%). 2) Retenção na fonte de IRRF de ${enq.aliquotaIrrf.toFixed(2)}% (${irrfClass.categoria}) sobre o valor faturado com desconto.`;
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
    icms_origem_destacado: isSimples ? 0 : (Number(op.icms_proprio_destacado) || 0),
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

  return { jsonResponse, simulacaoCalculo };
}