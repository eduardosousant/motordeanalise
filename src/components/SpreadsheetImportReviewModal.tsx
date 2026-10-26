import React from 'react';
import { FileSpreadsheet, X } from 'lucide-react';
import { ItemNotaFiscal } from '../types.js';

interface SpreadsheetImportReviewModalProps {
  fileName: string;
  items: ItemNotaFiscal[];
  onImport: () => void;
  onClose: () => void;
}

export const SpreadsheetImportReviewModal: React.FC<SpreadsheetImportReviewModalProps> = ({
  fileName,
  items,
  onImport,
  onClose
}) => {
  const total = items.reduce((sum, item) => sum + item.valor_total, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="spreadsheet-review-title"
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-800">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 id="spreadsheet-review-title" className="text-base font-bold text-slate-900">
                Conferir itens da planilha
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                {fileName} · {items.length} {items.length === 1 ? 'item encontrado' : 'itens encontrados'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar conferência da planilha"
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="overflow-auto p-5">
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
            Confira os dados antes de importar. A importação substituirá os itens atuais; depois você ainda poderá editá-los na operação.
          </p>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-slate-100 text-[10px] uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2.5 text-center">#</th>
                  <th className="px-3 py-2.5">NCM</th>
                  <th className="px-3 py-2.5">Produto</th>
                  <th className="px-3 py-2.5 text-right">Quantidade</th>
                  <th className="px-3 py-2.5 text-right">Valor unitário</th>
                  <th className="px-3 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="px-3 py-2 text-center text-slate-500">{index + 1}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-slate-800">{item.ncm}</td>
                    <td className="px-3 py-2 text-slate-800">{item.descricao}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{item.quantidade}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {item.valor_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      {item.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-right font-bold uppercase text-slate-700">Total dos produtos</td>
                  <td className="px-3 py-3 text-right font-bold text-emerald-800">
                    {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onImport}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            Importar {items.length} {items.length === 1 ? 'item' : 'itens'}
          </button>
        </footer>
      </section>
    </div>
  );
};
