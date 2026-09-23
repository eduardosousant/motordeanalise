import React from 'react';
import {
  FileCheck2,
  FileDown,
  BookOpen,
  AlertTriangle,
  Scale,
  CheckCircle2,
  ShieldCheck,
  Building2,
  FileText,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { AnaliseFiscalResponse } from '../types/fiscal';
import { formatarMoeda } from '../utils/formatters';

interface ParecerFiscalCardProps {
  analise: AnaliseFiscalResponse;
  onDownloadDocx: () => void;
  gerandoDocx: boolean;
  onDownloadPdf: () => void;
  gerandoPdf: boolean;
}

export const ParecerFiscalCard: React.FC<ParecerFiscalCardProps> = ({
  analise,
  onDownloadDocx,
  gerandoDocx,
  onDownloadPdf,
  gerandoPdf,
}) => {
  return (
    <div
      id="parecer-conformidade-report"
      className="bg-white border border-slate-300 shadow-sm space-y-5 p-0 overflow-hidden"
    >
      {/* Cabeçalho do Parecer */}
      <header className="bg-emerald-950 text-white px-5 md:px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-emerald-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-white uppercase tracking-wide">
                Parecer Técnico de Conformidade Fiscal & Previdenciária
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-900 text-emerald-100 rounded-md font-mono border border-emerald-700">
                {analise.idAnalise}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-800 text-emerald-100 border border-emerald-600 rounded-md">
                Auditoria Tributária Rigorosa
              </span>
            </div>
            <p className="text-xs text-emerald-100/80">
              Laudo pericial fundamentado nos Arts. 18-B da LC 123/2006, IN RFB nº 2.110/2022 e enquadramento de CNAE
            </p>
          </div>
        </div>

        {/* Botões de Ação de Download (PDF + DOCX) */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto print:hidden">
          {/* Botão de Download PDF com destaque pericial */}
          <button
            type="button"
            id="btn-download-pdf-parecer"
            onClick={onDownloadPdf}
            disabled={gerandoPdf}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 active:bg-rose-900 rounded-lg shadow-xs transition-all disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {gerandoPdf ? 'Gerando Laudo PDF...' : 'Gerar Parecer em PDF'}
          </button>

          {/* Botão de Download DOCX */}
          <button
            type="button"
            id="btn-download-docx-parecer"
            onClick={onDownloadDocx}
            disabled={gerandoDocx}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg border border-slate-200 transition-all disabled:opacity-50"
          >
            <FileDown className="w-4 h-4 text-slate-600" />
            {gerandoDocx ? 'Gerando DOCX...' : 'Exportar DOCX'}
          </button>
        </div>
      </header>

      {/* Conteúdo do Parecer Técnico */}
      <section className="mx-5 md:mx-6 border border-slate-300 rounded-md overflow-hidden">
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-300">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
          <FileCheck2 className="w-4 h-4 text-emerald-600" />
          Conclusão Técnica Pericial e Determinação de Menor Custo Efetivo Global
          </h4>
        </div>
        <p className="p-4 text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
          {analise.parecerConclusivo}
        </p>
      </section>

      {/* Critérios Técnicos de Auditoria Pericial */}
      <section className="mx-5 md:mx-6">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 mb-2">1. Critérios Técnicos de Auditoria Pericial</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
        <div className="p-3.5 rounded-md border border-slate-300 bg-white space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Auditoria de Objeto Social e CNAE (RFB)</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            A conformidade da despesa exige que o objeto da contratação esteja formalmente contemplado no CNAE Principal ou nas Atividades Secundárias ativas perante o Cadastro Nacional da Pessoa Jurídica (CNPJ). Contratações em desacordo sujeitam o tomador à glosa de prestação de contas por desvio de finalidade econômica.
          </p>
        </div>

        <div className="p-3.5 rounded-md border border-slate-300 bg-white space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Scale className="w-4 h-4 text-amber-600" />
            <span>Encargo Previdenciário Patronal Compulsório (Art. 18-B)</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            A contratação de MEI nas atividades de manutenção predial, hidráulica, eletricidade, pintura e correlatas gera fato gerador da Contribuição Previdenciária Patronal (CPP) de 20%, a ser apurada em DCTFWeb pela empresa tomadora e informada no evento S-1200/S-1210 do eSocial, integrando compulsoriamente o custo efetivo do processo.
          </p>
        </div>
        </div>
      </section>

      {/* Alertas Fiscais Relevantes */}
      {analise.alertasGerais.length > 0 && (
        <section className="mx-5 md:mx-6 space-y-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Pontos Críticos de Atenção e Obrigações Fiscais Identificados
          </h4>
          <div className="space-y-2">
            {analise.alertasGerais.map((alerta, idx) => (
              <div
                key={idx}
                className="p-3 rounded-md bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{alerta}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Base Legal Normativa Rigorosa */}
      <section className="mx-5 md:mx-6 space-y-3 pt-1 pb-6">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Fundamentação Jurídica e Normativa Vigente
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {analise.fundamentacaoLegal.map((fund, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-md border border-slate-300 bg-white hover:border-slate-400 transition-colors"
            >
              <span className="text-[11px] font-bold text-blue-800 block mb-1">
                {fund.artigo}
              </span>
              <span className="text-xs font-semibold text-slate-800 block mb-1">
                {fund.titulo}
              </span>
              <p className="text-[11px] text-slate-600 leading-normal">
                {fund.resumo}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
