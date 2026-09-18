import React from 'react';
import { ShieldCheck, FileSpreadsheet, Sparkles, RefreshCw } from 'lucide-react';
import { EXEMPLO_CENARIOS } from '../data/cnaes';
import { OrcamentoInput, ServicoInput } from '../types/fiscal';

interface HeaderProps {
  onCarregarCenario: (servico: ServicoInput, orcamentos: OrcamentoInput[]) => void;
  onLimpar: () => void;
  temResultados: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onCarregarCenario, onLimpar, temResultados }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Conformidade Fiscal de Adiantamentos
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Auditoria & Custos
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Análise tributária de prestadores, impacto do Art. 18-B (LC 123/2006) e compatibilidade de CNAE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <span className="text-xs font-medium text-slate-600 px-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Carregar Cenário:
            </span>
            <button
              type="button"
              onClick={() => onCarregarCenario(EXEMPLO_CENARIOS[0].servico, EXEMPLO_CENARIOS[0].orcamentos)}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-white text-slate-800 hover:bg-slate-50 shadow-xs border border-slate-200 transition-colors"
              title="Cenário de manutenção elétrica com impacto do Art. 18-B sobre MEI"
            >
              1: Manutenção Elétrica (Art. 18-B)
            </button>
            <button
              type="button"
              onClick={() => onCarregarCenario(EXEMPLO_CENARIOS[1].servico, EXEMPLO_CENARIOS[1].orcamentos)}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-white text-slate-800 hover:bg-slate-50 shadow-xs border border-slate-200 transition-colors"
              title="Cenário de serviço de TI"
            >
              2: Suporte em TI
            </button>
          </div>

          <button
            type="button"
            onClick={onLimpar}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-1 transition-colors"
            title="Limpar formulário"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Limpar
          </button>
        </div>
      </div>
    </header>
  );
};
