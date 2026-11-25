/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DespachoGerado } from '../types/fiscal';
import { formatarMoeda, formatarDataHora } from '../utils/formatters';
import { History, Trash2, ArrowUpRight, Clock } from 'lucide-react';

interface DispatchHistoryProps {
  historico: DespachoGerado[];
  onLoadDespacho: (item: DespachoGerado) => void;
  onDeleteDespacho: (id: string) => void;
  onClearHistorico: () => void;
}

export const DispatchHistory: React.FC<DispatchHistoryProps> = ({
  historico,
  onLoadDespacho,
  onDeleteDespacho,
  onClearHistorico,
}) => {
  if (historico.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 no-print">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-blue-900" />
          <span>Histórico Recente de Despachos ({historico.length})</span>
        </h3>
        <button
          type="button"
          onClick={onClearHistorico}
          className="text-xs text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          <span>Limpar histórico</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {historico.slice(0, 6).map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-900/40 bg-slate-50/50 hover:bg-blue-50/20 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {formatarDataHora(item.criadoEm)}
                </span>
                <span className="font-medium text-slate-600">
                  {item.formData.tipoObjeto === 'servico' ? 'NFS-e' : 'NF-e'}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-900 truncate">
                {item.formData.fornecedor || 'Fornecedor não identificado'}
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                CNPJ: {item.formData.cnpj || 'Não informado'}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs pt-1 border-t border-slate-200/70">
                <span className="text-slate-600">Líquido a pagar:</span>
                <span className="font-bold text-blue-950 font-mono-tabular">
                  {formatarMoeda(item.calculo.valorLiquido)}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => onLoadDespacho(item)}
                className="text-xs font-medium text-blue-900 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Recarregar dados</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteDespacho(item.id)}
                className="text-slate-400 hover:text-rose-600 p-1 rounded"
                title="Remover"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
