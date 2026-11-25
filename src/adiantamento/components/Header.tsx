/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileText, Sparkles, Printer } from 'lucide-react';

interface HeaderProps {
  onGerarClick: () => void;
  onPrintClick: () => void;
  hasDespacho: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onGerarClick, onPrintClick, hasDespacho }) => {
  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <a href="#" className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              Despacho Fiscal <span className="text-blue-900 text-sm font-semibold">· Autarquia Estadual</span>
            </a>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
             Gerador de Orientações para Faturamento, Retenções e Liquidação
          </nav>

          {/* Zone 3: Primary action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {hasDespacho && (
              <button
                type="button"
                onClick={onPrintClick}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                title="Imprimir ou Salvar em PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Imprimir / PDF</span>
              </button>
            )}
            <button
              type="button"
              onClick={onGerarClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 active:scale-[0.98] rounded-lg transition-all shadow-sm whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gerar Despacho Oficial</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
