/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CalculoFiscalResultado } from '../types/fiscal';
import { formatarMoeda } from '../utils/formatters';
import { CheckCircle2, AlertTriangle, ArrowDownRight, Wallet, ReceiptText, ShieldCheck } from 'lucide-react';

interface FinancialSummaryCardsProps {
  calculo: CalculoFiscalResultado;
}

export const FinancialSummaryCards: React.FC<FinancialSummaryCardsProps> = ({ calculo }) => {
  const possuiAbatimento = calculo.totalAbatimentos > 0;

  return (
    <div className="space-y-4 w-full" id="resumo-financeiro">
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${possuiAbatimento ? 'lg:grid-cols-5' : 'lg:grid-cols-5'} gap-3.5 w-full`}>
        {/* Card 1: Valor Solicitado pelo Responsável */}
        <div className="bg-white border border-blue-200 bg-blue-50/20 rounded-xl p-4 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-blue-900 font-semibold mb-1.5">
            <span>Valor Solicitado (Adiantamento)</span>
            <Wallet className="w-4 h-4 text-blue-800" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-950 font-mono-tabular tracking-tight">
            {formatarMoeda(calculo.valorSolicitado)}
          </div>
          <div className="text-xs text-blue-800/80 mt-1">
            Recurso total disponível para a despesa
          </div>
        </div>

        {/* Card 2: Valor da Nota Fiscal (Faturado) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Valor Faturado da Nota</span>
            <ReceiptText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono-tabular tracking-tight">
            {formatarMoeda(calculo.valorFaturadoAposAbatimento)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {possuiAbatimento
              ? `Bruto ${formatarMoeda(calculo.valorBruto)} - ICMS ${formatarMoeda(calculo.totalAbatimentos)}`
              : 'Valor total emitido na nota fiscal'}
          </div>
        </div>

        {/* Card 3: Retenções Tributárias na Fonte */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Retenções na Fonte (Guias)</span>
            <ArrowDownRight className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 font-mono-tabular tracking-tight">
            {calculo.totalRetencoes > 0 ? `- ${formatarMoeda(calculo.totalRetencoes)}` : 'R$ 0,00'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {calculo.retencoesDetalhadas.length > 0
              ? `${calculo.retencoesDetalhadas.length} guia(s) ao Fisco (DAR/DARF/DAM)`
              : 'Sem retenções na fonte a recolher'}
          </div>
        </div>

        {/* Card 4: Valor Líquido ao Fornecedor */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Líquido ao Fornecedor</span>
            <ReceiptText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono-tabular tracking-tight">
            {formatarMoeda(calculo.valorLiquido)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Depósito bancário efetivo ao fornecedor
          </div>
        </div>

        {/* Card 5: Cobertura do Adiantamento (Saldo / Déficit) */}
        <div
          className={`border rounded-xl p-4 shadow-xs transition-colors ${
            calculo.isCustoAtendido
              ? 'bg-emerald-50/50 border-emerald-300'
              : 'bg-rose-50/60 border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className={calculo.isCustoAtendido ? 'text-emerald-900' : 'text-rose-900'}>
              {calculo.isCustoAtendido ? 'Saldo do Adiantamento' : 'Déficit no Adiantamento'}
            </span>
            {calculo.isCustoAtendido ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl sm:text-2xl font-bold font-mono-tabular tracking-tight ${
                calculo.isCustoAtendido ? 'text-emerald-800' : 'text-rose-700'
              }`}
            >
              {calculo.isCustoAtendido ? '+' : '-'} {formatarMoeda(Math.abs(calculo.saldoAdiantamento))}
            </span>
          </div>
          <div
            className={`text-xs mt-1 font-medium ${
              calculo.isCustoAtendido ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {calculo.isCustoAtendido
              ? `Custo total (${formatarMoeda(calculo.custoEfetivoTotal)}) atendido com sobra`
              : `Custo total (${formatarMoeda(calculo.custoEfetivoTotal)}) excede o recurso`}
          </div>
        </div>
      </div>

      {/* Detalhamento separado: Abatimentos x Retenções */}
      {(calculo.abatimentosDetalhados.length > 0 || calculo.retencoesDetalhadas.length > 0) && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-blue-900" />
              <span>Discriminação Fiscal: Abatimentos em Nota vs Retenções Tributárias</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono-tabular">
              Total Geral de Deduções: - {formatarMoeda(calculo.totalDeducoes)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Bloco 1: Abatimentos / Descontos (Sem DAR) */}
            {calculo.abatimentosDetalhados.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  <span>Abatimentos Comerciais / Fiscais na Nota (Sem Guia / DAR)</span>
                </div>
                {calculo.abatimentosDetalhados.map((item, idx) => (
                  <div key={idx} className="bg-white border border-purple-200/80 rounded-lg p-2.5 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{item.nome}</span>
                      <span className="text-purple-700 font-mono-tabular font-bold">
                        - {formatarMoeda(item.valor)}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{item.baseLegal}</div>
                    <div className="text-slate-600 text-[11px] mt-0.5">{item.descricao}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Bloco 2: Retenções Tributárias (Com DAR/DAM) */}
            {calculo.retencoesDetalhadas.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  <span>Retenções Tributárias na Fonte (Com Recolhimento de Guias)</span>
                </div>
                {calculo.retencoesDetalhadas.map((item, idx) => (
                  <div key={idx} className="bg-white border border-amber-200/80 rounded-lg p-2.5 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{item.nome}</span>
                      <span className="text-amber-700 font-mono-tabular font-bold">
                        - {formatarMoeda(item.valor)}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{item.baseLegal}</div>
                    <div className="text-slate-600 text-[11px] mt-0.5">{item.descricao}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerta de Custo Total para MEI com CPP de 20% */}
      {calculo.valorCppPatronal && calculo.valorCppPatronal > 0 ? (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="font-semibold text-amber-900 flex items-center gap-1.5">
              <span>⚠️ MEI com CPP Patronal de 20% (art. 18-B da LC 123/2006)</span>
            </div>
            <div className="text-[11.5px] text-amber-800">
              O órgão deve pagar a nota integral ao MEI ({formatarMoeda(calculo.valorBruto)}) + a guia de DARF ({formatarMoeda(calculo.valorCppPatronal)}). Custo efetivo total: <b>{formatarMoeda(calculo.custoTotalComEncargos || 0)}</b>.
            </div>
          </div>
          <div className="text-right shrink-0 text-[11px] text-amber-900 font-semibold bg-white/80 px-2.5 py-1.5 rounded-lg border border-amber-200">
            Revisar se adiantamento cobre {formatarMoeda(calculo.custoTotalComEncargos || 0)}
          </div>
        </div>
      ) : null}
    </div>
  );
};
