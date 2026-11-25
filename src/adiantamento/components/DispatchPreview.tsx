/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FiscalFormData, CalculoFiscalResultado } from '../types/fiscal';
import { copiarFormatadoParaWord } from '../utils/clipboard';
import { exportarDespachoDocx, downloadBlob } from '../utils/docxExporter';
import {
  Copy,
  Check,
  Download,
  Printer,
  FileCode,
  Eye,
  ShieldCheck,
  CheckCircle,
  FileText,
} from 'lucide-react';

interface DispatchPreviewProps {
  htmlContent: string;
  plainTextContent: string;
  formData: FiscalFormData;
  calculo: CalculoFiscalResultado;
  onSaveSession: () => void;
  isSaved?: boolean;
}

export const DispatchPreview: React.FC<DispatchPreviewProps> = ({
  htmlContent,
  plainTextContent,
  formData,
  calculo,
  onSaveSession,
  isSaved = false,
}) => {
  const [copiedType, setCopiedType] = useState<'word' | 'plain' | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopiarWord = async () => {
    const ok = await copiarFormatadoParaWord(htmlContent);
    if (ok) {
      setCopiedType('word');
      showToast('Copiado com formatação! Pressione Ctrl+V no Microsoft Word.');
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleCopiarTextoPuro = async () => {
    try {
      await navigator.clipboard.writeText(plainTextContent);
      setCopiedType('plain');
      showToast('Texto puro copiado para a área de transferência.');
      setTimeout(() => setCopiedType(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadDocx = async () => {
    try {
      setIsExportingDocx(true);
      const blob = await exportarDespachoDocx(htmlContent, formData, calculo);
      const safeName = formData.fornecedor
        ? formData.fornecedor.trim().replace(/[^a-zA-Z0-9_-]/g, '_')
        : 'Faturamento';
      downloadBlob(blob, `Despacho_${safeName}.docx`);
      showToast('Arquivo Word (.docx) baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar documento Word:', err);
      showToast('Erro ao exportar docx. Use o botão de copiar.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handlePrint = () => {
    const clearPrintMode = () => document.body.classList.remove('print-adiantamento');
    document.body.classList.add('print-adiantamento');
    window.addEventListener('afterprint', clearPrintMode, { once: true });
    window.print();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden" id="despacho-oficial">
      {/* Barra de Ações Superior */}
      <div className="no-print bg-slate-900 text-white px-4 py-3 sm:px-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-300" />
          <span className="text-xs sm:text-sm font-semibold tracking-tight">
            Despacho Oficial Pronto para Envio
          </span>
        </div>

        {/* Segmented Switch: Visual vs Código */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              viewMode === 'preview'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Formatado</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('code')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              viewMode === 'code'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>HTML Bruto</span>
          </button>
        </div>
      </div>

      {/* Barra de Botões de Exportação e Cópia */}
      <div className="no-print bg-slate-50 border-b border-slate-200 px-4 py-2.5 sm:px-5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Principal: Copiar para Word */}
          <button
            type="button"
            onClick={handleCopiarWord}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-semibold text-white bg-blue-900 hover:bg-blue-800 active:scale-[0.98] rounded-lg transition-all shadow-xs"
            title="Copia com bolds, itálicos e quebras de linha para colar no Word com Ctrl+V"
          >
            {copiedType === 'word' ? (
              <Check className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>
              {copiedType === 'word'
                ? 'Copiado para o Word!'
                : 'Copiar para o Word (Ctrl+V)'}
            </span>
          </button>

          {/* Botão DOCX */}
          <button
            type="button"
            onClick={handleDownloadDocx}
            disabled={isExportingDocx}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 active:scale-[0.98] rounded-lg transition-all shadow-xs disabled:opacity-50"
            title="Gera um arquivo .docx compatível com Microsoft Word e LibreOffice"
          >
            <Download className="w-3.5 h-3.5 text-blue-900" />
            <span>{isExportingDocx ? 'Gerando .docx...' : 'Baixar Word (.docx)'}</span>
          </button>

          {/* Botão Texto Puro */}
          <button
            type="button"
            onClick={handleCopiarTextoPuro}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all shadow-xs"
            title="Copia o texto sem formatação HTML"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>{copiedType === 'plain' ? 'Texto copiado!' : 'Copiar Texto Puro'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Imprimir */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
            title="Visualizar e imprimir formato oficial A4"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimir / PDF</span>
          </button>

          {/* Salvar na Sessão */}
          <button
            type="button"
            onClick={onSaveSession}
            disabled={isSaved}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-all ${
              isSaved
                ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {isSaved ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Salvo na Sessão</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
                <span>Guardar na Sessão</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print bg-emerald-900 text-white text-xs px-4 py-2 flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-300" />
            <span>{toastMessage}</span>
          </div>
          <span className="text-[11px] text-emerald-200">Pronto para uso</span>
        </div>
      )}

      {/* Visualização do Conteúdo */}
      <div className="p-5 sm:p-7 max-h-[720px] min-h-[460px] overflow-y-auto bg-white font-sans text-slate-900 leading-relaxed despacho-paper w-full">
        {viewMode === 'preview' ? (
          <div
            className="prose prose-sm max-w-none text-slate-900 leading-relaxed space-y-1 select-text"
            style={{
              fontFamily: 'Calibri, Arial, sans-serif',
              fontSize: '13.5px',
              lineHeight: '1.55',
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-slate-500 font-mono">
              Código HTML gerado (para incorporação em sistemas de processo eletrônico):
            </div>
            <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono whitespace-pre-wrap select-all overflow-x-auto">
              {htmlContent}
            </pre>
          </div>
        )}
      </div>

      {/* Rodapé Informativo */}
      <div className="no-print bg-slate-50 border-t border-slate-200 px-4 py-2.5 sm:px-5 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <div>
          <span>Regras vigentes: IN RFB nº 1.234/2012 · IN 2.145/2023 · LC 123/2006 · LC 116/2003</span>
        </div>
        <div>
          <span>Ao colar no Word com <b>Ctrl+V</b>, negritos e itálicos permanecem nativos.</span>
        </div>
      </div>
    </div>
  );
};
