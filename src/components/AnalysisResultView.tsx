import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  Download,
  FileCheck2,
  FileSpreadsheet,
  BookOpen,
  Info,
  Scale,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Calculator,
  Bug,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AnaliseTributariaJSON, SimulacaoMemoriaCalculo, AppTheme, AnaliseConsolidadaNota } from '../types.js';
import { getCstInfo } from '../lib/taxCalculations.js';

interface AnalysisResultViewProps {
  data: AnaliseTributariaJSON;
  simulacao: SimulacaoMemoriaCalculo;
  fonteAnalise?: 'CACHE_AI_LOCAL' | 'GEMINI_AI_AO_VIVO' | 'MOTOR_DETERMINISTICO_LOCAL';
  currentTheme?: AppTheme;
  consolidado?: AnaliseConsolidadaNota | null;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
                                                                        data,
                                                                        simulacao,
                                                                        fonteAnalise,
                                                                        currentTheme = 'GOV_CLASSIC',
                                                                        consolidado
                                                                      }) => {
  const [activeTab, setActiveTab] = useState<'EXECUTIVA' | 'GRADE_ITENS' | 'LEGAL' | 'CALCULO' | 'DEBUG'>('EXECUTIVA');
  const [copied, setCopied] = useState(false);
  const temMultiplosItens = Boolean(consolidado && consolidado.itensAnalise && consolidado.itensAnalise.length > 1);
  const cstInfoSingle = getCstInfo(data, simulacao, data.resumo_fornecedor.optante_simples);

  const valorBrutoTotal = simulacao.base_calculo_origem + (simulacao.valor_desconto_comercial || 0);

  const getBannerThemeStyles = () => {
    switch (currentTheme) {
      case 'GOV_CLASSIC':
        return {
          bannerBg: 'bg-[#0e3b20] border-b border-emerald-800 text-amber-50 shadow-md',
          iconBox: 'bg-emerald-800/80 text-amber-300 border border-amber-400/40',
          statusBadge: 'text-amber-200 bg-emerald-900/90 border border-amber-400/40',
          cacheBadge: 'text-amber-300 bg-emerald-950 border border-amber-400/60 font-bold',
          geminiBadge: 'text-emerald-200 bg-emerald-950 border border-emerald-500/50',
          motorBadge: 'text-amber-200 bg-emerald-900 border border-amber-300/40',
          btnPrimary: 'bg-emerald-700 hover:bg-emerald-600 text-amber-100 border border-amber-400/40 shadow-sm',
          btnSecondary: 'bg-emerald-950 hover:bg-emerald-900 text-amber-200 border border-emerald-800',
          activeTabBorder: 'border-emerald-700 text-emerald-950',
          tabIndicator: 'text-amber-400'
        };
      case 'FINTECH_PRO':
        return {
          bannerBg: 'bg-slate-950 border-b border-indigo-900/50 text-white shadow-lg',
          iconBox: 'bg-indigo-600/30 text-sky-300 border border-indigo-500/40',
          statusBadge: 'text-indigo-300 bg-indigo-500/20 border border-indigo-500/40',
          cacheBadge: 'text-sky-300 bg-indigo-950/80 border border-sky-400/40 font-bold',
          geminiBadge: 'text-emerald-300 bg-indigo-950/80 border border-emerald-400/40',
          motorBadge: 'text-indigo-200 bg-indigo-950/80 border border-indigo-400/40',
          btnPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20',
          btnSecondary: 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700',
          activeTabBorder: 'border-indigo-600 text-indigo-900',
          tabIndicator: 'text-indigo-400'
        };
      case 'DARK_AUDITOR':
        return {
          bannerBg: 'bg-[#070a11] border-b border-cyan-900/40 text-slate-100 shadow-xl',
          iconBox: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
          statusBadge: 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/40',
          cacheBadge: 'text-cyan-300 bg-slate-900 border border-cyan-400/40 font-bold',
          geminiBadge: 'text-emerald-300 bg-slate-900 border border-emerald-400/40',
          motorBadge: 'text-sky-300 bg-slate-900 border border-sky-400/40',
          btnPrimary: 'bg-cyan-600 hover:bg-cyan-500 text-black font-bold border border-cyan-400',
          btnSecondary: 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700',
          activeTabBorder: 'border-cyan-500 text-cyan-400',
          tabIndicator: 'text-cyan-400'
        };
      case 'INSTITUCIONAL':
      default:
        return {
          bannerBg: 'bg-slate-900 border-b border-slate-800 text-white shadow-md',
          iconBox: 'bg-teal-500/20 text-teal-300 border border-teal-500/40',
          statusBadge: 'text-teal-300 bg-teal-500/20 border border-teal-500/40',
          cacheBadge: 'text-amber-300 bg-amber-500/20 border border-amber-500/40 font-bold',
          geminiBadge: 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/40',
          motorBadge: 'text-sky-300 bg-sky-500/20 border border-sky-500/40',
          btnPrimary: 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm',
          btnSecondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700',
          activeTabBorder: 'border-teal-700 text-teal-900',
          tabIndicator: 'text-teal-400'
        };
    }
  };

  const bannerStyle = getBannerThemeStyles();
  const jsonString = JSON.stringify(data, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analise_tributaria_mt_${data.enquadramento_produto.ncm.replace(/\D/g, '')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatOrientacaoFiscal = (text: string) => {
    if (!text) return '';
    let cleaned = text;
    if (simulacao.base_calculo_origem) {
      cleaned = cleaned
          .replace(/\(R\$\s*[\d\.,]+\)/gi, '')
          .replace(/R\$\s*2\.?000,00/gi, `R$ ${simulacao.base_calculo_origem.toFixed(2)}`)
          .replace(/R\$\s*1\.?950,00/gi, `R$ ${simulacao.base_calculo_origem.toFixed(2)}`);
    }
    return cleaned;
  };

  return (
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-md overflow-hidden">
        {/* Top Banner Status */}
        <div className={`${bannerStyle.bannerBg} p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-300`}>
          <div className="flex items-start space-x-3">
            <div className={`p-2.5 rounded mt-0.5 shadow-xs ${bannerStyle.iconBox}`}>
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded shadow-2xs ${bannerStyle.statusBadge}`}>
                Status: {data.status_analise}
              </span>
                {fonteAnalise === 'CACHE_AI_LOCAL' && (
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded flex items-center gap-1 shadow-2xs ${bannerStyle.cacheBadge}`} title="Análise recuperada do cache local persistido - Sem gasto de cota Gemini">
                  <span className="text-xs">⚡</span> Base Local Reutilizada (Cota R$ 0)
                </span>
                )}
                {fonteAnalise === 'GEMINI_AI_AO_VIVO' && (
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded flex items-center gap-1 shadow-2xs ${bannerStyle.geminiBadge}`} title="Análise gerada pelo Gemini e armazenada na base local para consultas futuras">
                  <span className="text-xs">🤖</span> Gemini AI (Salvo na Base Local)
                </span>
                )}
                {fonteAnalise === 'MOTOR_DETERMINISTICO_LOCAL' && (
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded flex items-center gap-1 shadow-2xs ${bannerStyle.motorBadge}`} title="Análise calculada pelo motor interno de regras do RICMS/MT">
                  <span className="text-xs">⚙️</span> Motor Local SEFAZ/MT
                </span>
                )}
                <span className="text-xs text-amber-200/80 dark:text-slate-300 font-mono">
                RICMS-MT Decreto nº 2.212/2014
              </span>
              </div>
              <h3 className="text-lg font-serif italic text-white mt-1">
                {data.enquadramento_produto.descricao}
              </h3>
              <p className="text-xs text-amber-100/90 dark:text-slate-300 mt-0.5 font-mono">
                NCM: {data.enquadramento_produto.ncm} • Regime: {data.enquadramento_produto.regime_tributario_aplicavel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {/*<button
                onClick={handleCopyJson}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold transition cursor-pointer shadow-sm ${bannerStyle.btnPrimary}`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar JSON Oficial'}</span>
            </button>

            <button
                onClick={handleDownloadJson}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition cursor-pointer ${bannerStyle.btnSecondary}`}
            >
              <Download className="w-4 h-4" />
              <span>Baixar JSON</span>
            </button>*/}
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 bg-slate-100 px-4 overflow-x-auto">
          <button
              onClick={() => setActiveTab('EXECUTIVA')}
              className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition ${
                  activeTab === 'EXECUTIVA'
                      ? 'border-teal-700 text-teal-900 bg-white shadow-2xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Visão Executiva (Resumo Fiscal)</span>
          </button>

          {temMultiplosItens && (
              <button
                  onClick={() => setActiveTab('GRADE_ITENS')}
                  className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition ${
                      activeTab === 'GRADE_ITENS'
                          ? 'border-emerald-700 text-emerald-950 bg-white shadow-2xs font-bold'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
              >
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>Grade de Itens ({consolidado?.itensAnalise.length})</span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-mono rounded font-bold">Nota Completa</span>
              </button>
          )}
          {/*
          <button
              onClick={() => setActiveTab('JSON')}
              className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition ${
                  activeTab === 'JSON'
                      ? 'border-teal-700 text-teal-900 bg-white shadow-2xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
          >
            <Code className="w-4 h-4" />
            <span>JSON Estrito (Regra de Negócio)</span>
          </button>
*/}
          <button
              onClick={() => setActiveTab('LEGAL')}
              className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition ${
                  activeTab === 'LEGAL'
                      ? 'border-teal-700 text-teal-900 bg-white shadow-2xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Fundamentação Legal MT</span>
          </button>

          <button
              onClick={() => setActiveTab('CALCULO')}
              className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition ${
                  activeTab === 'CALCULO'
                      ? 'border-teal-700 text-teal-900 bg-white shadow-2xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
          >
            <Scale className="w-4 h-4" />
            <span>Memória de Cálculo (Simulado)</span>
          </button>

          {/*} <button
              onClick={() => setActiveTab('DEBUG')}
              className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition ${
                  activeTab === 'DEBUG'
                      ? 'border-amber-600 text-amber-900 bg-amber-50/50 shadow-2xs'
                      : 'border-transparent text-slate-600 hover:text-amber-900 hover:bg-amber-100/50'
              }`}
          >
            <Calculator className="w-4 h-4 text-amber-700" />
            <span className="flex items-center gap-1.5">
            <span>Memória Detalhada (Debug View)</span>
            <span className="px-1.5 py-0.2 bg-amber-200/70 text-amber-900 text-[9px] font-mono rounded font-bold uppercase">Auditoria</span>
          </span>
          </button> */}
        </div>

        {/* Tab Content */}
        <div className="p-6 bg-slate-50/70">
          {activeTab === 'EXECUTIVA' && (
              <div className="space-y-6">
                {/* Linha de Enquadramento CST / CSOSN Sugerido */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Código {cstInfoSingle.tipo} Sugerido:
                </span>
                    <span className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs border ${cstInfoSingle.badgeClass}`}>
                  {cstInfoSingle.tipo} {cstInfoSingle.codigo}
                </span>
                  </div>
                  <span className="text-xs text-slate-600 font-medium">
                {cstInfoSingle.descricaoCompleta}
              </span>
                </div>

                {/* Cards de Totais da Operação com Desconto Comercial */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="bg-white border-l-4 border-slate-700 border-y border-r border-slate-200 p-3.5 rounded-r shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block tracking-wider">Total Produtos Bruto</span>
                    <span className="text-sm sm:text-base font-bold text-slate-900 mt-1 block font-mono">
                  {valorBrutoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                    <span className="text-[10.5px] text-slate-500 block mt-0.5">Valor faturado</span>
                  </div>

                  <div className="bg-white border-l-4 border-amber-500 border-y border-r border-slate-200 p-3.5 rounded-r shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-amber-800 font-semibold block tracking-wider">Desconto (Comercial / Isenção)</span>
                    <span className="text-sm sm:text-base font-bold text-amber-700 mt-1 block font-mono">
                  {((simulacao.valor_desconto_comercial || 0) + (simulacao.desconto_isencao_orgao_publico || 0)) > 0
                      ? `- ${((simulacao.valor_desconto_comercial || 0) + (simulacao.desconto_isencao_orgao_publico || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                      : 'R$ 0,00'}
                </span>
                    <span className="text-[10.5px] text-slate-500 block mt-0.5">
                  {simulacao.valor_desconto_comercial ? `Desc. Comercial: R$ ${simulacao.valor_desconto_comercial.toFixed(2)}` : (simulacao.desconto_isencao_orgao_publico ? 'Art. 2º Anexo I (17%)' : 'Sem desconto')}
                </span>
                  </div>

                  <div className="bg-white border-l-4 border-sky-600 border-y border-r border-slate-200 p-3.5 rounded-r shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-sky-800 font-semibold block tracking-wider">Retenção IRRF (IN 1234)</span>
                    <span className="text-sm sm:text-base font-bold text-sky-700 mt-1 block font-mono">
                  {simulacao.valor_irrf_retido ? `- ${(simulacao.valor_irrf_retido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : 'R$ 0,00'}
                </span>
                    <span className="text-[10.5px] text-slate-500 block mt-0.5">
                  Sobre R$ {simulacao.base_calculo_origem.toFixed(2)} ({simulacao.aliquota_irrf_in1234 !== undefined ? `${simulacao.aliquota_irrf_in1234}%` : '1,20%'})
                </span>
                  </div>

                  <div className="bg-emerald-50 border-l-4 border-emerald-600 border-y border-r border-emerald-200 p-3.5 rounded-r shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-emerald-900 font-bold block tracking-wider">Líquido a Pagar Fornecedor</span>
                    <span className="text-sm sm:text-base font-extrabold text-emerald-900 mt-1 block font-mono">
                  {(simulacao.valor_liquido_pagamento_fornecedor ?? (simulacao.base_calculo_origem - (simulacao.valor_irrf_retido || 0))).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                    <span className="text-[10.5px] text-emerald-800 block mt-0.5">Liquidação da despesa</span>
                  </div>

                  <div className="bg-white border-l-4 border-teal-600 border-y border-r border-slate-200 p-3.5 rounded-r shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-teal-800 font-semibold block tracking-wider">Total ICMS a Recolher MT</span>
                    <span className="text-sm sm:text-base font-bold text-teal-700 mt-1 block font-mono">
                  {(simulacao.total_recolher_mt || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                    <span className="text-[10.5px] text-slate-500 block mt-0.5">Via DAR-1 / GNRE MT</span>
                  </div>
                </div>

                {/* Resumo Fornecedor & Impacto do Porte */}
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-mono font-bold text-teal-800 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    Resumo do Fornecedor & Enquadramento no Simples Nacional
                  </h4>
                  <div className="text-xs text-slate-700 space-y-1">
                    <p className="font-mono text-slate-800">
                      <strong>CNPJ:</strong> {data.resumo_fornecedor.cnpj} | <strong>Porte:</strong> {data.resumo_fornecedor.porte} | <strong>Optante pelo Simples Nacional:</strong> {data.resumo_fornecedor.optante_simples ? 'SIM' : 'NÃO'}
                    </p>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded text-slate-800 text-xs mt-2 leading-relaxed font-sans">
                      <strong className="text-teal-800">Impacto Tributário do Porte:</strong> {data.resumo_fornecedor.impacto_tributario_porte}
                    </div>
                  </div>
                </div>

                {/* Orientação Fiscal Banner */}
                <div className="bg-amber-50 border border-amber-300 p-4 rounded-lg flex items-start gap-4 shadow-2xs">
                  <div className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-700">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Orientação Consultiva & Lançamento MT</h4>
                    <p className="text-xs text-amber-950 mt-1 leading-relaxed">
                      {formatOrientacaoFiscal(data.orientacao_fiscal)}
                    </p>
                  </div>
                </div>

                {/* Retenção na Fonte de IRRF (IN RFB 1234/2012 & STF Tema 1130) */}
                {simulacao.aplica_irrf_in1234 !== undefined && (
                    <div className="bg-slate-900 text-white rounded-lg p-4 border border-slate-700 shadow-md space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-sky-400" /> Retenção na Fonte de IRRF — IN RFB nº 1.234/2012 & STF Tema 1130
                  </span>
                        <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Aquisição por Órgão Público
                  </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
                        <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                          <span className="text-[10px] text-slate-400 block font-mono">Alíquota e Código RFB:</span>
                          <span className="text-sm font-bold font-mono text-sky-300">
                      {simulacao.aliquota_irrf_in1234 !== undefined ? `${simulacao.aliquota_irrf_in1234}%` : '0.0%'}
                            {simulacao.codigo_retencao_irrf && ` (Cód. ${simulacao.codigo_retencao_irrf})`}
                    </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate" title={simulacao.categoria_irrf_in1234}>
                      {simulacao.categoria_irrf_in1234 || (simulacao.aplica_irrf_in1234 ? 'Retenção Obrigatória' : 'Dispensa (Simples Nacional)')}
                    </span>
                        </div>
                        <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                          <span className="text-[10px] text-slate-400 block font-mono">Valor Retido de IRRF:</span>
                          <span className="text-sm font-bold font-mono text-amber-300">
                      - R$ {(simulacao.valor_irrf_retido || 0).toFixed(2)}
                    </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Calculado sobre R$ {simulacao.base_calculo_origem.toFixed(2)}</span>
                        </div>
                        <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
                          <span className="text-[10px] text-slate-400 block font-mono">Valor Líquido a Pagar ao Fornecedor:</span>
                          <span className="text-sm font-bold font-mono text-emerald-300">
                      R$ {(simulacao.valor_liquido_pagamento_fornecedor || (simulacao.base_calculo_origem - (simulacao.valor_irrf_retido || 0))).toFixed(2)}
                    </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Desembolso Financeiro Efetivo</span>
                        </div>
                      </div>
                      {simulacao.justificativa_irrf_in1234 && (
                          <p className="text-[11px] text-slate-300 pt-1 font-sans italic border-t border-slate-800">
                            <strong>Fundamentação de Retenção:</strong> {simulacao.justificativa_irrf_in1234}
                          </p>
                      )}
                    </div>
                )}
              </div>
          )}

          {activeTab === 'GRADE_ITENS' && consolidado && (
              <div className="space-y-6">
                {/* Cards de Resumo Consolidado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="bg-white border-l-4 border-slate-700 border-y border-r border-slate-200 p-3.5 rounded-r shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block tracking-wider">Total Produtos Bruto</span>
                    <span className="text-sm sm:text-base font-bold text-slate-900 mt-1 block font-mono">
                  {consolidado.resumoConsolidado.total_valor_bruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                    <span className="text-[10.5px] text-slate-500 block mt-0.5">{consolidado.resumoConsolidado.total_itens_qtd} produtos na nota</span>
                  </div>

                  <div className="bg-white border-l-4 border-amber-500 border-y border-r border-slate-200 p-3.5 rounded-r shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-amber-800 font-semibold block tracking-wider">Desconto Comercial / Isenção</span>
                    <span className="text-sm sm:text-base font-bold text-amber-700 mt-1 block font-mono">
                  - {(consolidado.resumoConsolidado.total_desconto_comercial + consolidado.resumoConsolidado.total_desconto_isencao_icms).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                    <span className="text-[10.5px] text-slate-500 block mt-0.5">
                  Comercial: {consolidado.resumoConsolidado.total_desconto_comercial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                  </div>

                  <div className="bg-white border-l-4 border-sky-600 border-y border-r border-slate-200 p-3.5 rounded-r shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-sky-800 font-semibold block tracking-wider">Retenção IRRF (IN 1234)</span>
                    <span className="text-sm sm:text-base font-bold text-sky-700 mt-1 block font-mono">
                  - {consolidado.resumoConsolidado.total_irrf_retido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                    <span className="text-[10.5px] text-slate-500 block mt-0.5">Retenção RFB</span>
                  </div>

                  <div className="bg-emerald-50 border-l-4 border-emerald-600 border-y border-r border-emerald-200 p-3.5 rounded-r shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-emerald-900 font-bold block tracking-wider">Líquido a Pagar Fornecedor</span>
                    <span className="text-sm sm:text-base font-extrabold text-emerald-900 mt-1 block font-mono">
                  {consolidado.resumoConsolidado.total_liquido_pagar_fornecedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                    <span className="text-[10.5px] text-emerald-800 block mt-0.5">Liquidação total da nota</span>
                  </div>

                  <div className="bg-white border-l-4 border-teal-600 border-y border-r border-slate-200 p-3.5 rounded-r shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-teal-800 font-semibold block tracking-wider">Total ICMS a Recolher MT</span>
                    <span className="text-sm sm:text-base font-bold text-teal-700 mt-1 block font-mono">
                  {(consolidado.resumoConsolidado.total_recolher_mt || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                    <span className="text-[10.5px] text-slate-500 block mt-0.5">Via DAR-1 / GNRE MT</span>
                  </div>
                </div>

                {/* Tabela Detalhada com os Itens da Nota */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-teal-700" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Grade e Enquadramento Fiscal dos Produtos ({consolidado.itensAnalise.length} itens)
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold bg-teal-50 text-teal-800 px-2.5 py-1 rounded border border-teal-200">
                  Total ICMS a Recolher MT: {consolidado.resumoConsolidado.total_icms_recolher_mt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-3 w-12 text-center">#</th>
                        <th className="py-3 px-3 w-28">NCM</th>
                        <th className="py-3 px-2 text-center w-24">CST / CSOSN</th>
                        <th className="py-3 px-4">Descrição do Produto</th>
                        <th className="py-3 px-2 text-center w-16">Qtd</th>
                        <th className="py-3 px-3 text-right">Valor Bruto</th>
                        <th className="py-3 px-3 text-right text-amber-800">Desc. Com.</th>
                        <th className="py-3 px-3">Regime MT</th>
                        <th className="py-3 px-3 text-right text-amber-800">Desc. Isenção</th>
                        <th className="py-3 px-3 text-right text-sky-800">IRRF</th>
                        <th className="py-3 px-3 text-right text-emerald-800">Líquido Item</th>
                        <th className="py-3 px-3 text-right">ICMS MT</th>
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-sans">
                      {consolidado.itensAnalise.map((itemAnalise, idx) => {
                        const item = itemAnalise.item;
                        const sim = itemAnalise.simulacao;
                        const resp = itemAnalise.jsonResponse;
                        const cstInfo = getCstInfo(resp, sim, data.resumo_fornecedor?.optante_simples);
                        const valorBrutoItem = (item.quantidade || 1) * (item.valor_unitario || 0);
                        const liquidoItem = sim.valor_liquido_pagamento_fornecedor !== undefined
                            ? sim.valor_liquido_pagamento_fornecedor
                            : (sim.valor_liquido_com_desconto !== undefined ? sim.valor_liquido_com_desconto : valorBrutoItem);

                        return (
                            <tr key={item.id || idx} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                              <td className="py-3 px-3 font-mono font-bold text-teal-800">
                            <span className="bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                              {item.ncm}
                            </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <div className="flex flex-col items-center justify-center">
                              <span
                                  className={`inline-block font-mono font-bold text-[11px] px-2 py-0.5 rounded border shadow-2xs ${cstInfo.badgeClass}`}
                                  title={cstInfo.descricaoCompleta}
                              >
                                {cstInfo.codigo}
                              </span>
                                  <span
                                      className="text-[9px] text-slate-500 font-medium block truncate max-w-[100px] mt-0.5"
                                      title={cstInfo.descricao}
                                  >
                                {cstInfo.descricao}
                              </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <strong className="text-slate-900 block">{item.descricao}</strong>
                                <span className="text-[10px] text-slate-500">
                              Unit: {item.valor_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                              </td>
                              <td className="py-3 px-2 text-center font-mono font-bold text-slate-700">{item.quantidade}</td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                                {valorBrutoItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-amber-700 font-bold">
                                {item.valor_desconto_comercial && item.valor_desconto_comercial > 0
                                    ? `- ${item.valor_desconto_comercial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                                    : '-'}
                              </td>
                              <td className="py-3 px-3">
                            <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-800 border border-slate-200 block truncate max-w-[140px]" title={resp.enquadramento_produto.regime_tributario_aplicavel}>
                              {resp.enquadramento_produto.regime_tributario_aplicavel}
                            </span>
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-amber-700 font-bold">
                                {sim.desconto_isencao_orgao_publico && sim.desconto_isencao_orgao_publico > 0
                                    ? `- ${sim.desconto_isencao_orgao_publico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                                    : '-'}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-sky-700 font-bold">
                                {sim.valor_irrf_retido && sim.valor_irrf_retido > 0
                                    ? `- ${sim.valor_irrf_retido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                                    : (sim.aplica_irrf_in1234 === false ? 'Dispensa' : '-')}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/40">
                                {liquidoItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                                {sim.total_recolher_mt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                            </tr>
                        );
                      })}
                      </tbody>
                      <tfoot>
                      <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs">
                        <td colSpan={5} className="py-3.5 px-4 text-slate-800 uppercase tracking-wider text-right">
                          TOTAIS CONSOLIDADOS DA NOTA FISCAL:
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-900">
                          {consolidado.resumoConsolidado.total_valor_bruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-amber-800">
                          - {consolidado.resumoConsolidado.total_desconto_comercial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td></td>
                        <td className="py-3.5 px-3 text-right font-mono text-amber-800">
                          - {consolidado.resumoConsolidado.total_desconto_isencao_icms.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-sky-800">
                          - {consolidado.resumoConsolidado.total_irrf_retido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-emerald-900 bg-emerald-100/60 text-sm">
                          {consolidado.resumoConsolidado.total_liquido_pagar_fornecedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-teal-900">
                          {consolidado.resumoConsolidado.total_icms_recolher_mt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
          )}
          {/*
          {activeTab === 'JSON' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600 font-mono font-semibold">
                  <p>RESULTADO_ENGINE.json</p>
                  <button
                      onClick={handleCopyJson}
                      className="text-teal-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar Código JSON
                  </button>
                </div>
                <div className="border border-slate-800 rounded-lg bg-slate-900 p-4 font-mono text-[11px] relative overflow-hidden shadow-inner">
              <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
                {jsonString}
              </pre>
                </div>
              </div>
          )}
*/}
          {activeTab === 'LEGAL' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-2">
                  <h4 className="text-xs font-bold text-slate-900 text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-700" /> Dispositivos Legais Aplicáveis (Decreto nº 2.212/2014-MT)
                  </h4>
                  <a
                      href="https://www.sefaz.mt.gov.br/legislacao/livro.aspx?B=27"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-teal-700 hover:text-teal-900 underline font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Acessar SEFAZ/MT Livro 27</span>
                  </a>
                </div>

                <div className="bg-teal-50 border border-teal-200 p-3.5 rounded-lg flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-teal-600 text-white flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 shadow-2xs">
                      B27
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">Base Oficial: SEFAZ/MT — Livro 27 (Decreto nº 2.212/2014)</h5>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Regulamento do ICMS do Estado de Mato Grosso consolidado com alterações vigentes.
                      </p>
                    </div>
                  </div>
                  <a
                      href="https://www.sefaz.mt.gov.br/legislacao/livro.aspx?B=27"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded flex items-center gap-1.5 transition whitespace-nowrap shadow-xs"
                  >
                    <span>Consultar no Portal SEFAZ</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.fundamentacao_legal.map((item, idx) => (
                      <div key={idx} className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-mono text-xs text-teal-800 font-bold underline decoration-teal-300">
                      {item.artigo_anexo}
                    </span>
                          <span className="text-[10px] font-mono text-slate-500 font-semibold">{item.dispositivo}</span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed pt-1 font-sans">
                          {item.resumo_regra}
                        </p>
                      </div>
                  ))}
                </div>
              </div>
          )}

          {activeTab === 'CALCULO' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 text-base flex items-center gap-2">
                    <Scale className="w-4 h-4 text-teal-700" /> Memória de Cálculo e Simulação do Imposto Devido
                  </h4>
                  <span className="text-xs font-mono text-slate-500 font-semibold">Demonstrativo da Apuração em MT</span>
                </div>

                <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-2xs space-y-3 font-mono text-xs text-slate-800">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600">Total Produtos Bruto (Valor Faturado):</span>
                    <span className="font-bold text-slate-900">R$ {valorBrutoTotal.toFixed(2)}</span>
                  </div>

                  {simulacao.valor_desconto_comercial !== undefined && (
                      <div className="flex justify-between border-b border-slate-100 pb-2 text-amber-900">
                        <span>(-) Desconto Comercial Incondicional:</span>
                        <span className="font-bold">- R$ {simulacao.valor_desconto_comercial.toFixed(2)}</span>
                      </div>
                  )}

                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600">Base de Cálculo Líquida da Operação:</span>
                    <span className="font-bold text-teal-800">R$ {simulacao.base_calculo_origem.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-600">ICMS Próprio Destacado na Origem:</span>
                    <span className="font-bold text-slate-900">R$ {simulacao.icms_origem_destacado.toFixed(2)}</span>
                  </div>

                  {simulacao.mva_percentual !== undefined && (
                      <>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-600">Margem de Lucro Agregado (MVA / Pauta ST):</span>
                          <span className="font-bold text-amber-800">{simulacao.mva_percentual}%</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-600">Base de Cálculo do ICMS Substituição Tributária (BC ST):</span>
                          <span className="font-bold text-slate-900">R$ {simulacao.base_calculo_st?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-600">ICMS ST Devido (Débito ST - Crédito Origem):</span>
                          <span className="font-bold text-teal-800">R$ {simulacao.icms_st_devido?.toFixed(2)}</span>
                        </div>
                      </>
                  )}

                  {simulacao.carga_media_percentual !== undefined && (
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-600">Estimativa Simplificada / Carga Média ({simulacao.carga_media_percentual}% sobre Operação):</span>
                        <span className="font-bold text-teal-800">R$ {simulacao.icms_estimativa_simplificada_devido?.toFixed(2)}</span>
                      </div>
                  )}

                  {simulacao.difal_devido !== undefined && (
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-600">ICMS DIFAL (Alíquota Interna MT - Alíquota Interestadual):</span>
                        <span className="font-bold text-teal-800">R$ {simulacao.difal_devido.toFixed(2)}</span>
                      </div>
                  )}

                  {simulacao.desconto_isencao_orgao_publico !== undefined ? (
                      <div className="bg-amber-50 border border-amber-300 p-3.5 rounded text-amber-950 space-y-1.5 my-2 font-sans">
                        <div className="flex justify-between font-bold text-amber-900 font-mono text-xs">
                          <span>🏛️ ISENÇÃO ICMS ÓRGÃO PÚBLICO ESTADUAL (Conv. 73/04 & Art. 2º Anexo I):</span>
                          <span className="text-sm">- R$ {simulacao.desconto_isencao_orgao_publico.toFixed(2)}</span>
                        </div>
                        <p className="text-[11px] text-amber-900/90 leading-relaxed">
                          <strong>Dedução Obrigatória no Preço:</strong> O valor de R$ {simulacao.desconto_isencao_orgao_publico.toFixed(2)} relativo ao ICMS dispensado deve ser abatido do valor final do bem/fatura do Órgão Público de Mato Grosso e informado na NF-e como <code>vICMSDesonerado</code>.
                        </p>
                      </div>
                  ) : data.enquadramento_produto.regime_tributario_aplicavel.includes('Sem Isenção') || data.enquadramento_produto.regime_tributario_aplicavel.includes('Órgão Público') ? (
                      <div className="bg-blue-50 border border-blue-200 p-3.5 rounded text-blue-950 space-y-1.5 my-2 font-sans">
                        <div className="flex justify-between font-bold text-blue-900 font-mono text-xs">
                          <span>🏛️ COMPRA PÚBLICA ESTADUAL — ISENÇÃO INAPLICÁVEL (OT nº 03/2026 CGE-MT):</span>
                          <span className="text-sm font-semibold">Sem Desconto na Nota</span>
                        </div>
                        <p className="text-[11px] text-blue-900/90 leading-relaxed">
                          <strong>Orientação de Execução Financeira:</strong> {data.resumo_fornecedor.optante_simples ? 'Fornecedor Optante pelo Simples Nacional. Conforme OT CGE 03/2026, a isenção do Art. 65 Anexo IV não se aplica a optantes do Simples Nacional.' : 'Produto sujeito à Substituição Tributária (ST). Conforme Art. 65, § 3º do Anexo IV, mercadorias em ST não gozam de isenção.'} A Nota Fiscal apresentada está <strong>CORRETA pelo Valor Integral</strong> (sem desconto de ICMS).
                        </p>
                      </div>
                  ) : null}

                  {simulacao.desconto_reducao_bc_anexo_v !== undefined && (
                      <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded text-emerald-950 space-y-1.5 my-2 font-sans">
                        <div className="flex justify-between font-bold text-emerald-900 font-mono text-xs">
                          <span>🌾 BENEFÍCIO FISCAL ANEXO V - REDUÇÃO DE BC (Cesta Básica / Carga Efetiva 7%):</span>
                          <span className="text-sm">Economia: - R$ {simulacao.desconto_reducao_bc_anexo_v.toFixed(2)}</span>
                        </div>
                        <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                          <strong>Desconto Tributário Concedido:</strong> Redução de Carga Tributária de 17% para 7% em Mato Grosso, gerando um desconto efetivo de R$ {simulacao.desconto_reducao_bc_anexo_v.toFixed(2)} no imposto devido.
                        </p>
                      </div>
                  )}

                  {simulacao.aplica_irrf_in1234 !== undefined && (
                      <div className="bg-sky-50 border border-sky-300 p-3.5 rounded text-sky-950 space-y-2 my-2 font-sans">
                        <div className="flex justify-between font-bold text-sky-900 font-mono text-xs border-b border-sky-200 pb-1.5">
                          <span>🏛️ RETENÇÃO NA FONTE IRRF (IN RFB nº 1.234/2012 & STF Tema 1130):</span>
                          <span className="text-sm text-sky-950">
                      {simulacao.aplica_irrf_in1234 ? `- R$ ${(simulacao.valor_irrf_retido || 0).toFixed(2)} (${simulacao.aliquota_irrf_in1234 || 1.2}%)` : '0,0% (Dispensado)'}
                    </span>
                        </div>
                        <p className="text-[11px] text-sky-900 leading-relaxed">
                          <strong>{simulacao.aplica_irrf_in1234 ? 'Retenção Obrigatoriamente Efetuada pelo Órgão Público:' : 'Fornecedor Isento de Retenção de IRRF:'}</strong> {simulacao.justificativa_irrf_in1234}
                        </p>
                        {simulacao.valor_liquido_pagamento_fornecedor !== undefined && (
                            <div className="flex justify-between items-center bg-white p-2.5 rounded border border-sky-200 text-xs font-bold text-slate-900 font-mono mt-1">
                              <span>VALOR LÍQUIDO A SER PAGO AO FORNECEDOR PELO ÓRGÃO PÚBLICO:</span>
                              <span className="text-teal-700 text-sm">R$ {simulacao.valor_liquido_pagamento_fornecedor.toFixed(2)}</span>
                            </div>
                        )}
                      </div>
                  )}

                  <div className="flex justify-between pt-3 text-sm font-bold text-emerald-950 bg-emerald-50 p-4 rounded border border-emerald-300">
                    <span>VALOR TOTAL A RECOLHER EM FAVOR DA SEFAZ/MT:</span>
                    <span className="text-emerald-900 font-mono text-base">
                  R$ {simulacao.total_recolher_mt.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                  </div>
                </div>
              </div>
          )}

          {/* Tab 5: DEBUG / AUDITORIA DETALHADA */}
          {activeTab === 'DEBUG' && (
              <div className="space-y-6">
                <div className="bg-slate-900 text-white rounded-lg p-4 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                      <Bug className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                        <span>Memória de Cálculo & Auditoria de Variáveis</span>
                        <span className="px-2 py-0.5 bg-emerald-900/80 text-emerald-300 text-[10px] font-bold rounded border border-emerald-700">
                      Cálculo Sincronizado
                    </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Inspeção linha a linha de cada base de cálculo, alíquota aplicada e valor final processado pelo motor fiscal.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                          const debugText = `AUDITORIA FISCAL - MEMÓRIA DE CÁLCULO
NCM: ${data.enquadramento_produto.ncm} (${data.enquadramento_produto.descricao})
Regime: ${data.enquadramento_produto.regime_tributario_aplicavel}
Fornecedor: ${data.resumo_fornecedor.cnpj} (${data.resumo_fornecedor.optante_simples ? 'Simples Nacional' : 'Regime Normal'} - ${data.resumo_fornecedor.porte})

1. Total Bruto Faturado: R$ ${valorBrutoTotal.toFixed(2)}
${simulacao.valor_desconto_comercial ? `2. Desconto Comercial: - R$ ${simulacao.valor_desconto_comercial.toFixed(2)}\n3. Base Líquida: R$ ${simulacao.base_calculo_origem.toFixed(2)}` : `2. Base de Cálculo da Operação: R$ ${simulacao.base_calculo_origem.toFixed(2)}`}
4. ICMS Destacado na Origem (${data.aliquotas.aliquota_origem || '7%'}): R$ ${simulacao.icms_origem_destacado.toFixed(2)}
${simulacao.desconto_isencao_orgao_publico !== undefined ? `5. Desoneração ICMS Órgão Público: - R$ ${simulacao.desconto_isencao_orgao_publico.toFixed(2)}` : ''}
${simulacao.aplica_irrf_in1234 ? `6. Retenção IRRF IN 1234 (${simulacao.aliquota_irrf_in1234}% - Cód. ${simulacao.codigo_retencao_irrf}): - R$ ${(simulacao.valor_irrf_retido || 0).toFixed(2)}` : '6. Retenção IRRF IN 1234: DISPENSADO (Simples Nacional)'}
7. Valor Líquido Fornecedor: R$ ${(simulacao.valor_liquido_pagamento_fornecedor || (simulacao.base_calculo_origem - (simulacao.valor_irrf_retido || 0))).toFixed(2)}
8. Total Recolher SEFAZ/MT: R$ ${simulacao.total_recolher_mt.toFixed(2)}`;
                          navigator.clipboard.writeText(debugText);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{copied ? 'Copiado!' : 'Copiar Log de Auditoria'}</span>
                    </button>
                  </div>
                </div>

                {/* Tabela Principal de Auditoria Linha a Linha */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-700" /> Decomposição de Linhas Tributárias (Base × Alíquota = Valor)
                </span>
                    <span className="text-[11px] font-mono text-slate-500">Unidade Monetária: BRL (R$)</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4 font-semibold">Tributo / Parâmetro Fiscal</th>
                        <th className="py-3 px-4 font-semibold text-right">Base de Cálculo (R$)</th>
                        <th className="py-3 px-4 font-semibold text-center">Alíquota / Fator</th>
                        <th className="py-3 px-4 font-semibold text-right">Valor Processado (R$)</th>
                        <th className="py-3 px-4 font-semibold text-center">Impacto / Destinação</th>
                        <th className="py-3 px-4 font-semibold">Regra / Enquadramento Legal</th>
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                      <tr className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          1. Total dos Produtos (Valor Bruto)
                          <span className="block text-[10px] font-normal text-slate-500 font-sans">
                          Valor faturado antes das deduções comerciais
                        </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          R$ {valorBrutoTotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600">100,00%</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          R$ {valorBrutoTotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                          Valor Bruto
                        </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] font-sans text-slate-600">
                          Art. 13 da LC 87/1996
                        </td>
                      </tr>

                      {simulacao.valor_desconto_comercial !== undefined && (
                          <tr className="hover:bg-amber-50/50 transition bg-amber-50/20">
                            <td className="py-3 px-4 font-semibold text-amber-950">
                              2. Desconto Comercial Incondicional
                              <span className="block text-[10px] font-normal text-amber-800 font-sans">
                            Abatimento no preço comercial do produto
                          </span>
                            </td>
                            <td className="py-3 px-4 text-right text-amber-900">
                              R$ {valorBrutoTotal.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-amber-900">
                              Dedução
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-amber-900">
                              - R$ {simulacao.valor_desconto_comercial.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-950 rounded text-[10px] font-semibold border border-amber-300">
                            Abatimento
                          </span>
                            </td>
                            <td className="py-3 px-4 text-[11px] font-sans text-amber-900">
                              Dedução Comercial na NF-e
                            </td>
                          </tr>
                      )}

                      <tr className="hover:bg-teal-50/50 transition bg-teal-50/20">
                        <td className="py-3 px-4 font-semibold text-teal-950">
                          3. Base de Cálculo Efetiva (Líquida)
                          <span className="block text-[10px] font-normal text-teal-800 font-sans">
                          Base de cálculo para incidência de ICMS e IRRF
                        </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-teal-900">
                          R$ {simulacao.base_calculo_origem.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-teal-900">
                          Base
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-teal-900">
                          R$ {simulacao.base_calculo_origem.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-900 rounded text-[10px] font-semibold border border-teal-300">
                          Base Líquida
                        </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] font-sans text-teal-900">
                          IN RFB 1.234/2012 & RICMS/MT
                        </td>
                      </tr>

                      {/* Linha: Retenção na Fonte de IRRF */}
                      {simulacao.aplica_irrf_in1234 !== undefined && (
                          <tr className={`hover:bg-sky-50/50 transition ${simulacao.aplica_irrf_in1234 ? 'bg-sky-50/30' : 'bg-slate-50/40'}`}>
                            <td className="py-3 px-4 font-semibold text-sky-950">
                              4. Retenção na Fonte de IRRF (IN RFB nº 1.234/2012)
                              <span className="block text-[10px] font-normal text-sky-800 font-sans">
                            {simulacao.categoria_irrf_in1234 || 'Aquisição de Bens por Órgão Público'}
                          </span>
                            </td>
                            <td className="py-3 px-4 text-right text-sky-900 font-bold">
                              R$ {simulacao.base_calculo_origem.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-sky-900">
                              {simulacao.aplica_irrf_in1234 ? `${(simulacao.aliquota_irrf_in1234 || 1.2).toFixed(2)}%` : '0,00%'}
                              {simulacao.codigo_retencao_irrf && ` (Cód. ${simulacao.codigo_retencao_irrf})`}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-sky-950">
                              {simulacao.aplica_irrf_in1234
                                  ? `- R$ ${(simulacao.valor_irrf_retido || 0).toFixed(2)}`
                                  : 'R$ 0,00 (Dispensado)'}
                            </td>
                            <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              simulacao.aplica_irrf_in1234
                                  ? 'bg-sky-100 text-sky-900 border-sky-300'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {simulacao.aplica_irrf_in1234 ? 'Retido p/ Órgão' : 'Isento (Simples)'}
                          </span>
                            </td>
                            <td className="py-3 px-4 text-[11px] font-sans text-sky-900">
                              IN RFB 1.234/2012 & STF Tema 1130
                            </td>
                          </tr>
                      )}

                      {/* Linha: VALOR LÍQUIDO AO FORNECEDOR */}
                      <tr className="bg-emerald-50/50 hover:bg-emerald-50 transition border-t-2 border-slate-300">
                        <td className="py-3.5 px-4 font-bold text-emerald-950">
                          5. VALOR LÍQUIDO A PAGAR AO FORNECEDOR
                          <span className="block text-[10px] font-normal text-emerald-800 font-sans">
                          Valor faturado deduzidas eventuais desonerações de ICMS e a retenção de IRRF
                        </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-700">
                          R$ {simulacao.base_calculo_origem.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-900">
                          Líquido
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-sm text-emerald-900">
                          R$ {(simulacao.valor_liquido_pagamento_fornecedor || (simulacao.base_calculo_origem - (simulacao.valor_irrf_retido || 0))).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 bg-emerald-700 text-white rounded text-[10px] font-bold shadow-xs">
                          Conta Fornecedor
                        </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] font-sans font-semibold text-emerald-950">
                          Ordem Bancária / Liquidação Financeira
                        </td>
                      </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Prova Real */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                        Prova Real Financeira (Desembolso Total)
                      </h5>
                    </div>
                    <div className="space-y-1.5 text-slate-700">
                      <div className="flex justify-between">
                        <span>(+) Líquido Pago ao Fornecedor:</span>
                        <span className="font-bold text-emerald-700">
                      R$ {(simulacao.valor_liquido_pagamento_fornecedor || (simulacao.base_calculo_origem - (simulacao.valor_irrf_retido || 0))).toFixed(2)}
                    </span>
                      </div>
                      {simulacao.valor_irrf_retido !== undefined && simulacao.valor_irrf_retido > 0 && (
                          <div className="flex justify-between">
                            <span>(+) IRRF Recolhido via DARF (RFB):</span>
                            <span className="font-bold text-sky-700">
                        R$ {simulacao.valor_irrf_retido.toFixed(2)}
                      </span>
                          </div>
                      )}
                      {simulacao.valor_desconto_comercial !== undefined && (
                          <div className="flex justify-between">
                            <span>(+) Desconto Comercial Concedido:</span>
                            <span className="font-bold text-amber-700">
                        R$ {simulacao.valor_desconto_comercial.toFixed(2)}
                      </span>
                          </div>
                      )}
                      <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                        <span>(=) Total dos Produtos (Valor Bruto):</span>
                        <span className="text-teal-800">
                      R$ {valorBrutoTotal.toFixed(2)}
                    </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Cpu className="w-4 h-4 text-amber-600" />
                      <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                        Parâmetros Brutos de Entrada (Payload)
                      </h5>
                    </div>
                    <div className="space-y-1.5 text-slate-700 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">NCM / Descrição:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[220px]" title={data.enquadramento_produto.descricao}>
                      {data.enquadramento_produto.ncm}
                    </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Regime Tributário MT:</span>
                        <span className="font-bold text-slate-800">
                      {data.enquadramento_produto.regime_tributario_aplicavel}
                    </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Enquadramento Fornecedor:</span>
                        <span className="font-bold text-slate-800">
                      {data.resumo_fornecedor.optante_simples ? 'Simples Nacional' : 'Regime Normal'} ({data.resumo_fornecedor.porte})
                    </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Origem da Resposta:</span>
                        <span className="font-bold text-teal-700">
                      {fonteAnalise || 'CACHE_AI_LOCAL'}
                    </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          )}
        </div>
      </div>
  );
};