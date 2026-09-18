import React, { useRef } from 'react';
import { Printer, Download, RotateCcw, ExternalLink, FileUp, ShieldCheck, Sparkles, RefreshCw, Home } from 'lucide-react';
import { AppTheme } from '../types.js';
import { OrcamentoInput, ServicoInput } from '../types/fiscal';
import { EXEMPLO_CENARIOS } from '../data/cnaes';

interface HeaderProps {
  // Comuns ou específicos de ICMS
  onReset?: () => void;
  onPrint?: () => void;
  onExportPdf?: () => void;
  isExportingPdf?: boolean;
  currentTheme?: AppTheme;
  onSelectTheme?: (t: AppTheme) => void;
  showThemeBar?: boolean;
  onToggleThemeBar?: () => void;
  onXmlSelected?: (file: File) => void;

  // Modos do sistema ('icms' | 'comparador' | 'aluguel')
  modo?: 'icms' | 'comparador' | 'aluguel';

  // Específicos do Comparador de Orçamentos
  onCarregarCenario?: (servico: ServicoInput, orcamentos: OrcamentoInput[]) => void;
  onLimpar?: () => void;

  // Específicos do Aluguel Predial (opcionais, caso queira ações próprias)
  onLimparAluguel?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
                                                onReset,
                                                onPrint,
                                                onExportPdf,
                                                isExportingPdf = false,
                                                currentTheme = 'INSTITUCIONAL',
                                                onXmlSelected,
                                                modo = 'icms',
                                                onCarregarCenario,
                                                onLimpar,
                                                onLimparAluguel,
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
    return {
      headerBg: 'bg-slate-900 border-b border-slate-800 text-white',
      logoBg: 'bg-teal-600 text-white',
      badge: 'bg-teal-950/80 text-teal-300 border-teal-700/50',
      subtext: 'text-slate-400',
      btnAction: 'bg-teal-700 hover:bg-teal-600 text-white border-teal-500/40',
      btnActionIcon: 'text-teal-200',
      btnPdf: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      btnNeutral: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
    };
  };

  const s = getThemeStyles();

  // Define textos e ícones dinâmicos com base no modo ativo
  const getHeaderInfo = () => {
    switch (modo) {
      case 'comparador':
        return {
          icon: <ShieldCheck className="w-5 h-5 text-white" />,
          titulo: 'Conformidade Fiscal de Adiantamentos',
          badgeText: 'Art. 18-B (LC 123)',
          subtitulo: 'Análise tributária de prestadores, impacto previdenciário e CNAE',
          logoColor: s.logoBg
        };
      case 'aluguel':
        return {
          icon: <Home className="w-5 h-5 text-white" />,
          titulo: 'Tributação de Aluguel Predial (PF/PJ)',
          badgeText: 'Exercício 2026',
          subtitulo: 'Cálculo comparativo de Carnê-Leão, IRPF e retenções jurídicas',
          logoColor: s.logoBg
        };
      case 'icms':
      default:
        return {
          icon: <span className="font-bold text-sm">MT</span>,
          titulo: 'Motor Tributário SEFAZ/MT',
          badgeText: 'Dec. 2.212/2014',
          subtitulo: 'Enquadramento ICMS & Retenções em Compras Públicas (CGE-MT)',
          logoColor: s.logoBg
        };
    }
  };

  const info = getHeaderInfo();

  return (
      <header className={`${s.headerBg} sticky top-0 z-50 shadow-md transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Lado Esquerdo: Identificação Dinâmica */}
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-xs ${info.logoColor}`}>
              {info.icon}
            </div>

            <div>
              <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base tracking-wide">
                {info.titulo}
              </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium border ${s.badge}`}>
                {info.badgeText}
              </span>
              </div>
              <p className={`text-[11px] hidden sm:block ${s.subtext}`}>
                {info.subtitulo}
              </p>
            </div>
          </div>

          {/* Lado Direito: Ações condicionadas ao modo */}
          <div className="flex items-center gap-2">
            {modo === 'comparador' && (
                <>
                  <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
                <span className="text-xs font-medium text-slate-300 px-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Cenários:
                </span>
                    <button
                        type="button"
                        onClick={() => onCarregarCenario && onCarregarCenario(EXEMPLO_CENARIOS[0].servico, EXEMPLO_CENARIOS[0].orcamentos)}
                        className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-700 text-slate-100 hover:bg-slate-600 shadow-xs border border-slate-600 transition-colors"
                    >
                      1: Elétrica
                    </button>
                    <button
                        type="button"
                        onClick={() => onCarregarCenario && onCarregarCenario(EXEMPLO_CENARIOS[1].servico, EXEMPLO_CENARIOS[1].orcamentos)}
                        className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-700 text-slate-100 hover:bg-slate-600 shadow-xs border border-slate-600 transition-colors"
                    >
                      2: TI
                    </button>
                  </div>

                  <button
                      type="button"
                      onClick={onLimpar}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${s.btnNeutral}`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Limpar</span>
                  </button>
                </>
            )}

            {modo === 'aluguel' && (
                <>
                  {/* Adicione ações específicas para o módulo de aluguel se necessário, ex: botão limpar */}
                  {onLimparAluguel && (
                      <button
                          type="button"
                          onClick={onLimparAluguel}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${s.btnNeutral}`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Limpar Simulador</span>
                      </button>
                  )}
                </>
            )}

            {modo === 'icms' && (
                <>
                  <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".xml"
                      className="hidden"
                  />

                  <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer border ${s.btnAction}`}
                      title="Importar XML da Nota Fiscal Eletrônica"
                  >
                    <FileUp className={`w-4 h-4 ${s.btnActionIcon}`} />
                    <span className="hidden md:inline">Importar XML da NF-e</span>
                    <span className="md:hidden">XML</span>
                  </button>

                  <a
                      href="http://app1.sefaz.mt.gov.br/sistema/legislacao/regulamentoricms.nsf"
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${s.btnNeutral}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Livro 27 MT</span>
                  </a>

                  <button
                      type="button"
                      onClick={onPrint}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${s.btnNeutral}`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir</span>
                  </button>

                  <button
                      type="button"
                      onClick={onExportPdf}
                      disabled={isExportingPdf}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${s.btnPdf}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingPdf ? 'Gerando...' : 'Exportar PDF'}</span>
                  </button>

                  <button
                      type="button"
                      onClick={onReset}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${s.btnNeutral}`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Nova Consulta</span>
                  </button>
                </>
            )}
          </div>

        </div>
      </header>
  );
};