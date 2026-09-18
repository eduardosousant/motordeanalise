import React from 'react';
import {
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileDown,
  FileText,
  ShieldCheck,
  Building,
  ArrowRight,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { AnaliseFiscalResponse } from '../types/fiscal';
import { formatarMoeda, formatarPercentual } from '../utils/formatters';

interface ResultadosCardsProps {
  analise: AnaliseFiscalResponse;
  onDownloadDocx: () => void;
  gerandoDocx: boolean;
  onDownloadPdf?: () => void;
  gerandoPdf?: boolean;
}

export const ResultadosCards: React.FC<ResultadosCardsProps> = ({
  analise,
  onDownloadDocx,
  gerandoDocx,
  onDownloadPdf,
  gerandoPdf,
}) => {
  const melhor = analise.melhorOrcamento;

  return (
    <div className="space-y-4">
      {/* Banner Resumo de Recomendação */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded uppercase tracking-wider">
                Melhor Custo Efetivo
              </span>
              <span className="text-xs text-slate-300">
                1º Lugar no Ranking Fiscal
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              {melhor.razaoSocial}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Custo Efetivo Global: <strong className="text-emerald-400 font-mono text-sm">{formatarMoeda(melhor.custoEfetivoTotal)}</strong>
              {melhor.incideCPP18B ? ' (inclui 20% CPP Art. 18-B)' : ' (sem incidência de CPP patronal)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {analise.economiaEmRelacaoAoMaior > 0 && (
            <div className="bg-slate-800/80 px-3.5 py-2 rounded-lg border border-slate-700 text-right hidden sm:block">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Economia Máxima</span>
              <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                {formatarMoeda(analise.economiaEmRelacaoAoMaior)}
              </span>
            </div>
          )}

          {onDownloadPdf && (
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={gerandoPdf}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-white" />
              {gerandoPdf ? 'Gerando PDF...' : 'Parecer em PDF'}
            </button>
          )}

          <button
            type="button"
            onClick={onDownloadDocx}
            disabled={gerandoDocx}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            {gerandoDocx ? 'Gerando...' : 'Baixar DOCX'}
          </button>
        </div>
      </div>

      {/* Grid de Cards dos Orçamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analise.resultados.map((item, index) => {
          const isPrimeiro = index === 0;

          return (
            <div
              key={item.id}
              id={`card-resultado-${item.id}`}
              className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                isPrimeiro
                  ? 'border-emerald-400 bg-white shadow-md ring-2 ring-emerald-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
              }`}
            >
              <div>
                {/* Header do Card com Rank */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isPrimeiro
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.posicaoRanking}º
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        isPrimeiro
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isPrimeiro ? 'Recomendado' : `Proposta #${item.posicaoRanking}`}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      item.regimeTributario === 'MEI'
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {item.regimeTributario === 'MEI' ? 'MEI' : item.regimeTributario.replace('_', ' ')}
                  </span>
                </div>

                {/* Fornecedor */}
                <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                  {item.razaoSocial}
                </h4>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  CNPJ: {item.cnpj}
                </p>

                {/* Detalhamento de Custos */}
                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Valor Proposto (Nominal):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatarMoeda(item.valorNominal)}
                    </span>
                  </div>

                  {/* CPP Art. 18-B */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 flex items-center gap-1">
                      CPP Art. 18-B (20%):
                    </span>
                    {item.incideCPP18B ? (
                      <span className="font-mono font-bold text-rose-600">
                        + {formatarMoeda(item.valorCPP)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">
                        R$ 0,00 (Não incide)
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Custo Efetivo Total:</span>
                    <span
                      className={`text-sm font-mono font-extrabold ${
                        isPrimeiro ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {formatarMoeda(item.custoEfetivoTotal)}
                    </span>
                  </div>
                </div>

                {/* Status de CNAE */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">Compatibilidade de CNAE:</span>
                    {item.compatibilidadeCNAE === 'compativel' ? (
                      item.origemCompatibilidade === 'secundario' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> CNAE Secundário
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> CNAE Principal
                        </span>
                      )
                    ) : item.compatibilidadeCNAE === 'parcial' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Subclasse divergente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" /> Incompatível
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate flex items-center justify-between">
                    <span>CNAE: {item.cnaeCompativelEncontrado || item.cnaePrestador || 'Não informado'}</span>
                    {item.cnaesSecundarios && item.cnaesSecundarios.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-sans">
                        ({item.cnaesSecundarios.length} secundários verificados)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    {item.justificativaCnae}
                  </p>
                </div>

                {/* Alerta de Art. 18-B no Card */}
                {item.incideCPP18B && (
                  <div className="mt-3 p-2 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-1.5 text-[11px] text-rose-800">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Obrigação Acessória:</strong> A empresa tomadora deverá informar esta contratação no eSocial e recolher guia DARF/DCTFWeb de <strong>20% de CPP</strong>.
                    </span>
                  </div>
                )}
              </div>

              {/* Footer do Card com comparativo de diferença */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                {isPrimeiro ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1 text-xs">
                    <ShieldCheck className="w-4 h-4" /> Proposta mais vantajosa
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px]">
                    +{formatarMoeda(item.diferencaParaMelhor)} ({formatarPercentual(item.diferencaPercentual)}) mais cara
                  </span>
                )}

                <span className="text-[10px] text-slate-400 font-mono">
                  ID: #{item.id}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
