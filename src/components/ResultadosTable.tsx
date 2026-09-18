import React from 'react';
import {
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  FileDown,
  FileText,
  Info,
} from 'lucide-react';
import { ResultadoOrcamento, AnaliseFiscalResponse } from '../types/fiscal';
import { formatarMoeda, formatarPercentual } from '../utils/formatters';

interface ResultadosTableProps {
  analise: AnaliseFiscalResponse;
  onDownloadDocx: () => void;
  gerandoDocx: boolean;
  onDownloadPdf?: () => void;
  gerandoPdf?: boolean;
}

export const ResultadosTable: React.FC<ResultadosTableProps> = ({
  analise,
  onDownloadDocx,
  gerandoDocx,
  onDownloadPdf,
  gerandoPdf,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Quadro Comparativo de Custo Efetivo
            </h3>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              Ordenado por Menor Custo Global
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Inclui encargos previdenciários da contratante (CPP 20% do Art. 18-B) e conformidade de CNAE
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onDownloadPdf && (
            <button
              type="button"
              id="btn-download-pdf-tabela"
              onClick={onDownloadPdf}
              disabled={gerandoPdf}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-2xs transition-all disabled:opacity-50"
              title="Baixar Parecer Técnico de Conformidade Fiscal em formato PDF"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              {gerandoPdf ? 'Gerando PDF...' : 'Parecer em PDF'}
            </button>
          )}

          <button
            type="button"
            id="btn-download-docx-tabela"
            onClick={onDownloadDocx}
            disabled={gerandoDocx}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-all disabled:opacity-50"
            title="Baixar Parecer Técnico de Conformidade Fiscal em formato Word (.docx)"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-600" />
            {gerandoDocx ? 'Gerando DOCX...' : 'Relatório (.DOCX)'}
          </button>
        </div>
      </div>

      {/* Tabela de Resultados */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/75 text-slate-700 font-semibold tracking-wider uppercase text-[11px]">
              <th className="py-3 px-4 text-center w-16">Rank</th>
              <th className="py-3 px-4">Fornecedor / CNPJ</th>
              <th className="py-3 px-4">Regime Tributário</th>
              <th className="py-3 px-4 text-right">Valor Proposto</th>
              <th className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <span>CPP (Art. 18-B)</span>
                  <span title="Contribuição Previdenciária Patronal de 20% a cargo da tomadora quando contratado MEI em serviços específicos">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>
              </th>
              <th className="py-3 px-4 text-right">
                <span className="text-slate-900 font-bold">Custo Efetivo Total</span>
              </th>
              <th className="py-3 px-4 text-center">CNAE do Prestador</th>
              <th className="py-3 px-4 text-center">Situação Fiscal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {analise.resultados.map((item, index) => {
              const isPrimeiro = index === 0;
              const hasArt18B = item.incideCPP18B;

              return (
                <tr
                  key={item.id}
                  id={`linha-resultado-${item.id}`}
                  className={`transition-colors ${
                    isPrimeiro
                      ? 'bg-emerald-50/40 hover:bg-emerald-50/70 font-medium'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Posição no Ranking */}
                  <td className="py-3.5 px-4 text-center">
                    {isPrimeiro ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white font-bold shadow-xs">
                        <Trophy className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs">
                        {item.posicaoRanking}º
                      </span>
                    )}
                  </td>

                  {/* Nome e CNPJ */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                      {item.razaoSocial}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      CNPJ: {item.cnpj}
                    </div>
                  </td>

                  {/* Regime Tributário */}
                  <td className="py-3.5 px-4">
                    {item.regimeTributario === 'MEI' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        MEI
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {item.regimeTributario.replace('_', ' ')}
                      </span>
                    )}
                  </td>

                  {/* Valor Proposto / Nominal */}
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-800">
                    {formatarMoeda(item.valorNominal)}
                  </td>

                  {/* Incidência do Artigo 18-B (CPP Patronal) */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    {hasArt18B ? (
                      <div>
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          + {formatarMoeda(item.valorCPP)} (20%)
                        </span>
                        <div className="text-[10px] text-rose-600 mt-0.5">
                          Recolhimento patronal obrigatório
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        R$ 0,00 (Isento de CPP)
                      </span>
                    )}
                  </td>

                  {/* Custo Efetivo Total */}
                  <td className="py-3.5 px-4 text-right">
                    <div
                      className={`text-sm font-mono font-extrabold ${
                        isPrimeiro ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {formatarMoeda(item.custoEfetivoTotal)}
                    </div>
                    {item.diferencaParaMelhor > 0 && (
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3 text-slate-400" />
                        +{formatarMoeda(item.diferencaParaMelhor)} ({formatarPercentual(item.diferencaPercentual)})
                      </div>
                    )}
                  </td>

                  {/* Compatibilidade de CNAE */}
                  <td className="py-3.5 px-4 text-center">
                    {item.compatibilidadeCNAE === 'compativel' ? (
                      <div>
                        {item.origemCompatibilidade === 'secundario' ? (
                          <span
                            title={item.justificativaCnae}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                            CNAE Secundário
                          </span>
                        ) : (
                          <span
                            title={item.justificativaCnae}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            CNAE Principal
                          </span>
                        )}
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {item.cnaeCompativelEncontrado || item.cnaePrestador || 'Não informado'}
                        </div>
                      </div>
                    ) : item.compatibilidadeCNAE === 'parcial' ? (
                      <div>
                        <span
                          title={item.justificativaCnae}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Subclasse Divergente
                        </span>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {item.cnaePrestador || 'Não informado'}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span
                          title={item.justificativaCnae}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Incompatível
                        </span>
                        <div className="text-[10px] text-rose-600 mt-0.5">
                          Fora do Principal e Secundários
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Parecer / Situação */}
                  <td className="py-3.5 px-4 text-center">
                    {isPrimeiro ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600 text-white shadow-xs">
                        Recomendado
                      </span>
                    ) : item.status === 'incompativel' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
                        Risco Fiscal Alto
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                        Proposta Superior
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Nota de rodapé da tabela */}
      <div className="p-4 bg-slate-50/75 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Fundamentação:</strong> O Custo Efetivo Total soma o valor da fatura aos encargos adicionais suportados pela contratante, como os 20% de CPP patronal determinados pelo <strong>Art. 18-B da LC 123/2006</strong>.
          </span>
        </div>
      </div>
    </div>
  );
};
