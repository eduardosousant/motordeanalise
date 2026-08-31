import React, { useState } from 'react';
import {
  History,
  ArrowRight,
  RotateCcw,
  Scale,
  Trash2,
  Building2,
  Layers,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { HistoricoAnaliseItem, AppTheme, OperacaoComercial, AnaliseTributariaJSON, SimulacaoMemoriaCalculo } from '../types.js';

interface HistoricoAnalisesProps {
  historico: HistoricoAnaliseItem[];
  onRestore: (item: HistoricoAnaliseItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  currentOperacao: OperacaoComercial;
  currentResult: {
    jsonResponse: AnaliseTributariaJSON;
    simulacaoCalculo: SimulacaoMemoriaCalculo;
    fonteAnalise?: 'CACHE_AI_LOCAL' | 'GEMINI_AI_AO_VIVO' | 'MOTOR_DETERMINISTICO_LOCAL';
  } | null;
  currentTheme?: AppTheme;
}

export const HistoricoAnalises: React.FC<HistoricoAnalisesProps> = ({
  historico,
  onRestore,
  onDelete,
  onClear,
  currentOperacao,
  currentResult,
  currentTheme = 'GOV_CLASSIC'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<HistoricoAnaliseItem | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const getThemeStyles = () => {
    switch (currentTheme) {
      case 'GOV_CLASSIC':
        return {
          headerBg: 'bg-emerald-50 border border-emerald-200 text-emerald-900',
          iconColor: 'text-emerald-700',
          badgeCount: 'bg-emerald-800 text-amber-200 border border-amber-400/40',
          btnPrimary: 'bg-emerald-700 hover:bg-emerald-800 text-amber-100 border border-amber-400/40',
          btnSecondary: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200',
          cardActive: 'border-emerald-500 bg-emerald-50/40',
          compareModalHeader: 'bg-[#0e3b20] text-amber-50 border-b border-emerald-800',
          tag: 'text-emerald-800 bg-emerald-100 border-emerald-300'
        };
      case 'FINTECH_PRO':
        return {
          headerBg: 'bg-indigo-50 border border-indigo-200 text-indigo-950',
          iconColor: 'text-indigo-600',
          badgeCount: 'bg-indigo-600 text-white',
          btnPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 shadow-sm',
          btnSecondary: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200',
          cardActive: 'border-indigo-500 bg-indigo-50/40',
          compareModalHeader: 'bg-slate-950 text-white border-b border-indigo-900/50',
          tag: 'text-indigo-800 bg-indigo-100 border-indigo-300'
        };
      case 'DARK_AUDITOR':
        return {
          headerBg: 'bg-[#0b0f19] border border-cyan-900/50 text-slate-100',
          iconColor: 'text-cyan-400',
          badgeCount: 'bg-cyan-600 text-black font-black',
          btnPrimary: 'bg-cyan-600 hover:bg-cyan-500 text-black font-bold border border-cyan-400',
          btnSecondary: 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-900',
          cardActive: 'border-cyan-500 bg-cyan-950/20',
          compareModalHeader: 'bg-[#070a11] text-cyan-300 border-b border-cyan-900/60',
          tag: 'text-cyan-300 bg-cyan-950 border-cyan-700'
        };
      case 'INSTITUCIONAL':
      default:
        return {
          headerBg: 'bg-teal-50 border border-teal-200 text-teal-950',
          iconColor: 'text-teal-700',
          badgeCount: 'bg-teal-700 text-white',
          btnPrimary: 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm',
          btnSecondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300',
          cardActive: 'border-teal-500 bg-teal-50/40',
          compareModalHeader: 'bg-slate-900 text-white border-b border-slate-800',
          tag: 'text-teal-800 bg-teal-100 border-teal-300'
        };
    }
  };

  const themeStyle = getThemeStyles();

  if (historico.length === 0) {
    return null;
  }

  const formatMoney = (val: number | undefined) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getRelativeTime = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'agora mesmo';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `há ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `há ${diffHours} h`;
    return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
      {/* Header do Accordion de Histórico */}
      <div className="p-4 flex items-center justify-between gap-3 border-b border-slate-100">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 text-left flex-1 cursor-pointer group"
        >
          <div className={`p-2 rounded-lg ${themeStyle.headerBg}`}>
            <History className={`w-4 h-4 ${themeStyle.iconColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Histórico Local de Análises</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shadow-2xs ${themeStyle.badgeCount}`}>
                  {historico.length} {historico.length === 1 ? 'análise salva' : 'análises salvas (Max 5)'}
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-500">
              Guarda CNPJ, produto, tributos apurados e permite comparar cálculos anteriores com o atual em 1 clique.
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 transition cursor-pointer text-xs font-semibold flex items-center gap-1"
          >
            <span>{isOpen ? 'Recolher' : 'Expandir Histórico'}</span>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            onClick={onClear}
            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer text-[11px] flex items-center gap-1"
            title="Limpar todas as análises salvas no navegador"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpar Histórico</span>
          </button>
        </div>
      </div>

      {/* Lista de Análises Salvas (Últimas 5) */}
      {isOpen && (
        <div className="p-4 bg-slate-50/50 space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {historico.map((item, idx) => {
              const isExpanded = expandedItemId === item.id;
              const fornecedorNome = item.supplierData?.razao_social || item.operacao.razao_social_fornecedor || 'Fornecedor';
              const fornecedorCnpj = item.supplierData?.cnpj || item.operacao.cnpj_fornecedor;
              const isSimples = item.supplierData ? item.supplierData.optante_simples : Boolean(item.operacao.simples_remetente);

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg border p-3.5 transition-all shadow-2xs hover:shadow-xs ${
                    idx === 0 ? 'border-slate-300 ring-1 ring-slate-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Informações da Operação */}
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          #{idx + 1}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[220px]" title={fornecedorNome}>
                            {fornecedorNome}
                          </span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">({fornecedorCnpj})</span>
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-semibold ${
                            isSimples
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isSimples ? 'Simples Nacional' : 'Regime Normal'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {getRelativeTime(item.timestamp)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="font-mono">
                          <strong className="text-slate-800">NCM {item.operacao.ncm}:</strong>{' '}
                          <span className="truncate inline-block max-w-[260px] align-bottom" title={item.operacao.descricao_produto}>
                            {item.operacao.descricao_produto}
                          </span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          UF Origem: <strong className="text-slate-700">{item.operacao.uf_origem}</strong> → MT
                        </span>
                      </div>

                      {/* Resumo Financeiro da Análise */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs font-mono">
                        <span className="text-slate-600">
                          Base: <strong className="text-slate-900">{formatMoney(item.simulacaoCalculo.base_calculo_origem)}</strong>
                        </span>
                        <span className="text-emerald-700">
                          Líquido Fornecedor: <strong>{formatMoney(item.simulacaoCalculo.valor_liquido_pagamento_fornecedor || item.simulacaoCalculo.base_calculo_origem)}</strong>
                        </span>
                        <span className="text-slate-800">
                          Total SEFAZ/MT: <strong>{formatMoney(item.simulacaoCalculo.total_recolher_mt)}</strong>
                        </span>
                        {item.simulacaoCalculo.valor_irrf_retido !== undefined && item.simulacaoCalculo.valor_irrf_retido > 0 && (
                          <span className="text-sky-700">
                            IRRF Retido: <strong>{formatMoney(item.simulacaoCalculo.valor_irrf_retido)}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-end">
                      <button
                        onClick={() => setSelectedForComparison(item)}
                        className="px-2.5 py-1.5 rounded text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Comparar esta análise salva com o cálculo atual da tela"
                      >
                        <Scale className="w-3.5 h-3.5 text-amber-600" />
                        <span>Comparar</span>
                      </button>

                      <button
                        onClick={() => onRestore(item)}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${themeStyle.btnPrimary}`}
                        title="Carregar todos os parâmetros e resultados desta análise de volta na tela"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar</span>
                      </button>

                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="Remover esta análise do histórico"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Comparação Lado a Lado (Side-by-side Comparison) */}
      {selectedForComparison && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Header do Modal */}
            <div className={`p-4 flex items-center justify-between ${themeStyle.compareModalHeader}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-sans flex items-center gap-2">
                    <span>Comparativo Tributário Lado a Lado</span>
                    <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-mono font-bold rounded">
                      Auditoria
                    </span>
                  </h3>
                  <p className="text-xs opacity-80">
                    Contraste direto entre a análise atual na tela e a análise histórica selecionada.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedForComparison(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabela Comparativa Detalhada */}
            <div className="p-6 overflow-x-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coluna 1: Análise Atual na Tela */}
                <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                    <span className="text-xs font-mono font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                      Cálculo Atual (Na Tela)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-semibold">
                      Ativo
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-mono uppercase">Fornecedor / Origem</span>
                      <p className="font-bold text-slate-900">
                        {currentResult?.jsonResponse.resumo_fornecedor.razao_social || currentOperacao.razao_social_fornecedor || 'Fornecedor Atual'}
                      </p>
                      <p className="text-slate-600 font-mono text-[11px]">
                        CNPJ: {currentOperacao.cnpj_fornecedor} • UF: {currentOperacao.uf_origem} • {currentOperacao.simples_remetente ? 'Simples Nacional' : 'Regime Normal'}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] font-mono uppercase">Produto & NCM</span>
                      <p className="font-semibold text-slate-900">{currentOperacao.descricao_produto}</p>
                      <p className="text-slate-600 font-mono text-[11px]">NCM: {currentOperacao.ncm} • Finalidade: {currentOperacao.finalidade_compra}</p>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-teal-100 space-y-1.5 font-mono">
                      <div className="flex justify-between text-slate-700">
                        <span>Base de Cálculo:</span>
                        <span className="font-bold text-slate-900">{formatMoney(currentResult?.simulacaoCalculo.base_calculo_origem || currentOperacao.valor_operacao)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>ICMS Destacado Origem:</span>
                        <span className="font-bold text-slate-900">{formatMoney(currentResult?.simulacaoCalculo.icms_origem_destacado || 0)}</span>
                      </div>
                      {currentResult?.simulacaoCalculo.desconto_isencao_orgao_publico !== undefined && (
                        <div className="flex justify-between text-amber-700">
                          <span>Desoneração ICMS:</span>
                          <span className="font-bold">- {formatMoney(currentResult.simulacaoCalculo.desconto_isencao_orgao_publico)}</span>
                        </div>
                      )}
                      {currentResult?.simulacaoCalculo.valor_irrf_retido !== undefined && currentResult.simulacaoCalculo.valor_irrf_retido > 0 && (
                        <div className="flex justify-between text-sky-700">
                          <span>Retenção IRRF (IN 1234):</span>
                          <span className="font-bold">- {formatMoney(currentResult.simulacaoCalculo.valor_irrf_retido)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-emerald-800 border-t border-slate-100 pt-1 font-bold">
                        <span>Líquido Fornecedor:</span>
                        <span className="text-sm">{formatMoney(currentResult?.simulacaoCalculo.valor_liquido_pagamento_fornecedor || currentResult?.simulacaoCalculo.base_calculo_origem || 0)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-bold border-t border-slate-100 pt-1">
                        <span>Total SEFAZ/MT:</span>
                        <span className="text-sm">{formatMoney(currentResult?.simulacaoCalculo.total_recolher_mt || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna 2: Análise Histórica Selecionada */}
                <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-slate-600" />
                      Análise Histórica ({selectedForComparison.dataHoraFormatada})
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold">
                      Histórico
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-mono uppercase">Fornecedor / Origem</span>
                      <p className="font-bold text-slate-900">
                        {selectedForComparison.supplierData?.razao_social || selectedForComparison.operacao.razao_social_fornecedor || 'Fornecedor Salvo'}
                      </p>
                      <p className="text-slate-600 font-mono text-[11px]">
                        CNPJ: {selectedForComparison.operacao.cnpj_fornecedor} • UF: {selectedForComparison.operacao.uf_origem} • {selectedForComparison.operacao.simples_remetente ? 'Simples Nacional' : 'Regime Normal'}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] font-mono uppercase">Produto & NCM</span>
                      <p className="font-semibold text-slate-900">{selectedForComparison.operacao.descricao_produto}</p>
                      <p className="text-slate-600 font-mono text-[11px]">NCM: {selectedForComparison.operacao.ncm} • Finalidade: {selectedForComparison.operacao.finalidade_compra}</p>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 font-mono">
                      <div className="flex justify-between text-slate-700">
                        <span>Base de Cálculo:</span>
                        <span className="font-bold text-slate-900">{formatMoney(selectedForComparison.simulacaoCalculo.base_calculo_origem)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>ICMS Destacado Origem:</span>
                        <span className="font-bold text-slate-900">{formatMoney(selectedForComparison.simulacaoCalculo.icms_origem_destacado)}</span>
                      </div>
                      {selectedForComparison.simulacaoCalculo.desconto_isencao_orgao_publico !== undefined && (
                        <div className="flex justify-between text-amber-700">
                          <span>Desoneração ICMS:</span>
                          <span className="font-bold">- {formatMoney(selectedForComparison.simulacaoCalculo.desconto_isencao_orgao_publico)}</span>
                        </div>
                      )}
                      {selectedForComparison.simulacaoCalculo.valor_irrf_retido !== undefined && selectedForComparison.simulacaoCalculo.valor_irrf_retido > 0 && (
                        <div className="flex justify-between text-sky-700">
                          <span>Retenção IRRF (IN 1234):</span>
                          <span className="font-bold">- {formatMoney(selectedForComparison.simulacaoCalculo.valor_irrf_retido)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-emerald-800 border-t border-slate-100 pt-1 font-bold">
                        <span>Líquido Fornecedor:</span>
                        <span className="text-sm">{formatMoney(selectedForComparison.simulacaoCalculo.valor_liquido_pagamento_fornecedor || selectedForComparison.simulacaoCalculo.base_calculo_origem)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-bold border-t border-slate-100 pt-1">
                        <span>Total SEFAZ/MT:</span>
                        <span className="text-sm">{formatMoney(selectedForComparison.simulacaoCalculo.total_recolher_mt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quadro de Variação (Delta / Diferenças entre os Cálculos) */}
              {currentResult && (
                <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <Scale className="w-4 h-4" /> Variação Financeira (Δ Atual vs. Histórico)
                    </span>
                    <span className="text-[10px] text-slate-400">Diferença Nominal</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {/* Delta Base */}
                    {(() => {
                      const diffBase = (currentResult.simulacaoCalculo.base_calculo_origem || 0) - (selectedForComparison.simulacaoCalculo.base_calculo_origem || 0);
                      return (
                        <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
                          <span className="text-slate-400 block text-[10px]">Diferença na Base de Cálculo</span>
                          <span className={`text-sm font-bold flex items-center gap-1 ${diffBase >= 0 ? 'text-slate-100' : 'text-slate-300'}`}>
                            {diffBase > 0 ? <ArrowUpRight className="w-3.5 h-3.5 text-sky-400" /> : diffBase < 0 ? <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" /> : <Minus className="w-3.5 h-3.5 text-slate-400" />}
                            {formatMoney(diffBase)}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Delta Líquido Fornecedor */}
                    {(() => {
                      const liqAtual = currentResult.simulacaoCalculo.valor_liquido_pagamento_fornecedor || currentResult.simulacaoCalculo.base_calculo_origem || 0;
                      const liqHist = selectedForComparison.simulacaoCalculo.valor_liquido_pagamento_fornecedor || selectedForComparison.simulacaoCalculo.base_calculo_origem || 0;
                      const diffLiq = liqAtual - liqHist;
                      return (
                        <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
                          <span className="text-slate-400 block text-[10px]">Diferença no Líquido ao Fornecedor</span>
                          <span className={`text-sm font-bold flex items-center gap-1 ${diffLiq > 0 ? 'text-emerald-400' : diffLiq < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                            {diffLiq > 0 ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : diffLiq < 0 ? <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" /> : <Minus className="w-3.5 h-3.5 text-slate-400" />}
                            {formatMoney(diffLiq)}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Delta Tributo MT */}
                    {(() => {
                      const mtAtual = currentResult.simulacaoCalculo.total_recolher_mt || 0;
                      const mtHist = selectedForComparison.simulacaoCalculo.total_recolher_mt || 0;
                      const diffMt = mtAtual - mtHist;
                      return (
                        <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
                          <span className="text-slate-400 block text-[10px]">Diferença no ICMS SEFAZ/MT</span>
                          <span className={`text-sm font-bold flex items-center gap-1 ${diffMt > 0 ? 'text-amber-400' : diffMt < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {diffMt > 0 ? <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" /> : diffMt < 0 ? <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" /> : <Minus className="w-3.5 h-3.5 text-slate-400" />}
                            {formatMoney(diffMt)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedForComparison(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Fechar Comparação
              </button>

              <button
                onClick={() => {
                  onRestore(selectedForComparison);
                  setSelectedForComparison(null);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm ${themeStyle.btnPrimary}`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restaurar Esta Análise na Tela</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
