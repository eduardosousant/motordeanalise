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
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-6">
      {/* Cabeçalho do Parecer */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5 text-slate-100" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900">
                Parecer Técnico de Conformidade Fiscal & Previdenciária
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md font-mono">
                {analise.idAnalise}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                Auditoria Tributária Rigorosa
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Laudo pericial fundamentado nos Arts. 18-B da LC 123/2006, IN RFB nº 2.110/2022 e enquadramento de CNAE
            </p>
          </div>
        </div>

        {/* Botões de Ação de Download (PDF + DOCX) */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
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
      </div>

      {/* Conteúdo do Parecer Técnico */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <FileCheck2 className="w-4 h-4 text-emerald-600" />
          Conclusão Técnica Pericial e Determinação de Menor Custo Efetivo Global
        </h4>
        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
          {analise.parecerConclusivo}
        </p>
      </div>

      {/* Critérios Técnicos de Auditoria Pericial */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Auditoria de Objeto Social e CNAE (RFB)</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            A conformidade da despesa exige que o objeto da contratação esteja formalmente contemplado no CNAE Principal ou nas Atividades Secundárias ativas perante o Cadastro Nacional da Pessoa Jurídica (CNPJ). Contratações em desacordo sujeitam o tomador à glosa de prestação de contas por desvio de finalidade econômica.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Scale className="w-4 h-4 text-amber-600" />
            <span>Encargo Previdenciário Patronal Compulsório (Art. 18-B)</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            A contratação de MEI nas atividades de manutenção predial, hidráulica, eletricidade, pintura e correlatas gera fato gerador da Contribuição Previdenciária Patronal (CPP) de 20%, a ser apurada em DCTFWeb pela empresa tomadora e informada no evento S-1200/S-1210 do eSocial, integrando compulsoriamente o custo efetivo do processo.
          </p>
        </div>
      </div>

      {/* Alertas Fiscais Relevantes */}
      {analise.alertasGerais.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Pontos Críticos de Atenção e Obrigações Fiscais Identificados
          </h4>
          <div className="space-y-2">
            {analise.alertasGerais.map((alerta, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{alerta}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Base Legal Normativa Rigorosa */}
      <div className="space-y-3 pt-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Fundamentação Jurídica e Normativa Vigente
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {analise.fundamentacaoLegal.map((fund, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors"
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
      </div>
    </div>
  );
};

