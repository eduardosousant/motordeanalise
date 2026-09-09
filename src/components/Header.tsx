import React, { useRef } from 'react';
import { Printer, Download, RotateCcw, ExternalLink, FileUp, Palette } from 'lucide-react';
import { AppTheme } from '../types.js';

interface HeaderProps {
  onReset: () => void;
  onPrint: () => void;
  onExportPdf: () => void;
  isExportingPdf: boolean;
  currentTheme: AppTheme;
  onSelectTheme: (t: AppTheme) => void;
  showThemeBar: boolean;
  onToggleThemeBar: () => void;
  onXmlSelected?: (file: File) => void;
}

export const Header: React.FC<HeaderProps> = ({
                                                onReset,
                                                onPrint,
                                                onExportPdf,
                                                isExportingPdf,
                                                currentTheme,
                                                showThemeBar,
                                                onToggleThemeBar,
                                                onXmlSelected
                                              }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onXmlSelected) {
      onXmlSelected(file);
    }
    e.target.value = '';
  };

  const getThemeStyles = () => {
    switch (currentTheme) {
      case 'INSTITUCIONAL':
        return {
          headerBg: 'bg-slate-900 border-b border-slate-800 text-white',
          logoBg: 'bg-teal-600 text-white',
          badge: 'bg-teal-950/80 text-teal-300 border-teal-700/50',
          subtext: 'text-slate-400',
          btnXml: 'bg-teal-700 hover:bg-teal-600 text-white border-teal-500/40',
          btnXmlIcon: 'text-teal-200',
          btnPdf: 'bg-emerald-600 hover:bg-emerald-500 text-white',
          btnNeutral: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
        };
      case 'FINTECH_PRO':
        return {
          headerBg: 'bg-slate-950 border-b border-indigo-900/50 text-white',
          logoBg: 'bg-indigo-600 text-white',
          badge: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/50',
          subtext: 'text-slate-400',
          btnXml: 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/40 shadow-indigo-900/30',
          btnXmlIcon: 'text-indigo-200',
          btnPdf: 'bg-sky-600 hover:bg-sky-500 text-white',
          btnNeutral: 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
        };
      case 'DARK_AUDITOR':
        return {
          headerBg: 'bg-[#070a11] border-b border-cyan-950/60 text-slate-100',
          logoBg: 'bg-cyan-500 text-black',
          badge: 'bg-slate-900 text-cyan-300 border-cyan-500/40 font-mono',
          subtext: 'text-slate-400',
          btnXml: 'bg-cyan-600 hover:bg-cyan-500 text-black font-bold border-cyan-400',
          btnXmlIcon: 'text-black',
          btnPdf: 'bg-emerald-500 hover:bg-emerald-400 text-black font-bold',
          btnNeutral: 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
        };
      case 'GOV_CLASSIC':
      default:
        return {
          headerBg: 'bg-[#0e3b20] border-b border-emerald-900/80 text-amber-50',
          logoBg: 'bg-emerald-700 text-amber-300 border border-amber-400/40',
          badge: 'bg-emerald-950 text-amber-200 border-amber-400/30',
          subtext: 'text-emerald-200/80',
          btnXml: 'bg-emerald-800 hover:bg-emerald-700 text-amber-100 border-amber-400/40',
          btnXmlIcon: 'text-amber-300',
          btnPdf: 'bg-emerald-600 hover:bg-emerald-500 text-white',
          btnNeutral: 'bg-emerald-950/80 hover:bg-emerald-900 text-amber-100/90 border-emerald-800'
        };
    }
  };

  const s = getThemeStyles();

  return (
      <header className={`${s.headerBg} sticky top-0 z-40 shadow-md transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Lado Esquerdo: Identificação */}
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-xs ${s.logoBg}`}>
              MT
            </div>
            <div>
              <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base tracking-wide">
                Motor Tributário SEFAZ/MT
              </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium border ${s.badge}`}>
                Dec. 2.212/2014
              </span>
              </div>
              <p className={`text-[11px] hidden sm:block ${s.subtext}`}>
                Enquadramento ICMS & Retenções em Compras Públicas (CGE-MT)
              </p>
            </div>
          </div>

          {/* Lado Direito: Ações */}
          <div className="flex items-center gap-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xml"
                className="hidden"
            />

            {/* Botão para alternar barra de temas */}
            {/*} <button
                type="button"
                onClick={onToggleThemeBar}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    showThemeBar ? 'bg-amber-400/20 border-amber-400/60 text-amber-300' : s.btnNeutral
                }`}
                title="Alternar paleta visual de temas"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>*/}

            {/* Importar XML */}
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer border ${s.btnXml}`}
                title="Importar XML da Nota Fiscal Eletrônica"
            >
              <FileUp className={`w-4 h-4 ${s.btnXmlIcon}`} />
              <span className="hidden md:inline">Importar XML da NF-e</span>
              <span className="md:hidden">XML</span>
            </button>

            {/* Livro 27 */}
            <a
                href="http://app1.sefaz.mt.gov.br/sistema/legislacao/regulamentoricms.nsf"
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${s.btnNeutral}`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Livro 27 MT</span>
            </a>

            {/* Imprimir */}
            <button
                type="button"
                onClick={onPrint}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${s.btnNeutral}`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            {/* Exportar PDF */}
            <button
                type="button"
                onClick={onExportPdf}
                disabled={isExportingPdf}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${s.btnPdf}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Gerando...' : 'Exportar PDF'}</span>
            </button>

            {/* Nova Consulta */}
            <button
                type="button"
                onClick={onReset}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${s.btnNeutral}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Consulta</span>
            </button>
          </div>
        </div>
      </header>
  );
};