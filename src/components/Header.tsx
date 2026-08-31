import React from 'react';
import { ShieldCheck, FileText, Printer, ExternalLink, Download, RefreshCw, Palette } from 'lucide-react';
import { AppTheme } from '../types.js';

interface HeaderProps {
  onReset: () => void;
  onPrint: () => void;
  onExportPdf: () => void;
  isExportingPdf?: boolean;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  showThemeBar: boolean;
  onToggleThemeBar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  onPrint,
  onExportPdf,
  isExportingPdf,
  currentTheme,
  showThemeBar,
  onToggleThemeBar
}) => {
  // Cores dinâmicas de acordo com o tema selecionado
  const getHeaderStyles = () => {
    switch (currentTheme) {
      case 'FINTECH_PRO':
        return {
          bg: 'bg-slate-950/95 border-b border-indigo-900/50 backdrop-blur-xl text-white',
          logoBg: 'bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-indigo-500/30 shadow-md',
          accentText: 'text-sky-400',
          badge: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300',
          buttonPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-600/20',
          tag: 'Fintech Pro'
        };
      case 'DARK_AUDITOR':
        return {
          bg: 'bg-[#070a11] border-b border-cyan-900/40 text-slate-100 shadow-xl',
          logoBg: 'bg-cyan-600 text-black font-black shadow-cyan-500/30 shadow-md',
          accentText: 'text-cyan-400',
          badge: 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300',
          buttonPrimary: 'bg-cyan-600 hover:bg-cyan-500 text-black font-bold border-cyan-400 shadow-cyan-600/20',
          tag: 'Dark Auditor'
        };
      case 'GOV_CLASSIC':
        return {
          bg: 'bg-[#0e3b20] border-b border-emerald-800 text-amber-50 shadow-md',
          logoBg: 'bg-emerald-600 border border-amber-400/60 text-amber-200 font-extrabold shadow-sm',
          accentText: 'text-amber-300',
          badge: 'bg-emerald-900/80 border-amber-400/40 text-amber-200',
          buttonPrimary: 'bg-emerald-700 hover:bg-emerald-600 text-amber-100 border-amber-400/40',
          tag: 'Governo MT'
        };
      case 'INSTITUCIONAL':
      default:
        return {
          bg: 'bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md',
          logoBg: 'bg-teal-600 text-white shadow-sm',
          accentText: 'text-teal-400',
          badge: 'bg-teal-500/20 border-teal-500/40 text-teal-300',
          buttonPrimary: 'bg-teal-600 hover:bg-teal-700 text-white border-teal-500',
          tag: 'Institucional'
        };
    }
  };

  const themeStyle = getHeaderStyles();

  return (
    <header className={`${themeStyle.bg} sticky top-0 z-30 transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className={`w-9 h-9 rounded flex items-center justify-center font-extrabold italic flex-shrink-0 ${themeStyle.logoBg}`}>
            MT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight font-sans">
                Motor de Análise Tributária <span className={themeStyle.accentText}>RICMS/MT</span>
              </h1>
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono ${themeStyle.badge}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                <span>{themeStyle.tag.toUpperCase()}</span>
              </div>
            </div>
            <p className="text-xs text-slate-300/90 mt-0.5">
              Decreto nº 2.212/2014 • Anexo V (Redução BC), Anexo X (ST), Estimativa Simplificada & DIFAL
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
          <a
              href="https://www.sefaz.mt.gov.br/legislacao/livro.aspx?B=27"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition cursor-pointer"
              title="Acessar Legislação Oficial SEFAZ-MT Livro 27"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Livro 27 MT</span>
          </a>

          <button
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-medium transition cursor-pointer shadow-sm"
              title="Imprimir Parecer Tributário Oficial"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
              onClick={onExportPdf}
              disabled={isExportingPdf}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold transition cursor-pointer shadow-sm disabled:opacity-50 ${themeStyle.buttonPrimary}`}
              title="Exportar Parecer Tributário em PDF via jsPDF"
          >
            {isExportingPdf ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Gerando...</span>
                </>
            ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar PDF</span>
                </>
            )}
          </button>

          <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-medium transition cursor-pointer shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">Nova Consulta</span>
          </button>
        </div>
      </div>
    </header>
  );
};

