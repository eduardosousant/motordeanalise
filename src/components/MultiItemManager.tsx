import React from 'react';
import { Plus, Trash2, PackageCheck, AlertCircle } from 'lucide-react';
import { ItemNotaFiscal, AppTheme, FinalidadeCompra } from '../types.js';

interface MultiItemManagerProps {
  itens: ItemNotaFiscal[];
  onChangeItens: (itens: ItemNotaFiscal[]) => void;
  currentTheme?: AppTheme;
  finalidadeCompra?: FinalidadeCompra;
}

export const MultiItemManager: React.FC<MultiItemManagerProps> = ({
                                                                    itens,
                                                                    onChangeItens
                                                                  }) => {
  const handleItemChange = (index: number, field: keyof ItemNotaFiscal, value: any) => {
    const updated = [...itens];
    const item = { ...updated[index], [field]: value };

    // Recalcula valor total da linha
    if (field === 'quantidade' || field === 'valor_unitario') {
      const qtd = field === 'quantidade' ? parseFloat(value) || 0 : item.quantidade || 1;
      const un = field === 'valor_unitario' ? parseFloat(value) || 0 : item.valor_unitario || 0;
      item.valor_total = qtd * un;
    }

    updated[index] = item;
    onChangeItens(updated);
  };

  const handleAddItem = () => {
    const newItem: ItemNotaFiscal = {
      id: `item_${Date.now()}`,
      item_numero: itens.length + 1,
      ncm: '3209.10.00',
      descricao: 'Novo Item Comercial Adicionado',
      quantidade: 1,
      valor_unitario: 100,
      valor_total: 100,
      valor_desconto_comercial: 0,
      valor_frete: 0,
      valor_despesas: 0,
      icms_proprio_destacado: 0
    };
    onChangeItens([...itens, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (itens.length <= 1) {
      alert('A nota fiscal precisa ter pelo menos um item.');
      return;
    }
    const updated = itens.filter((_, i) => i !== index);
    onChangeItens(updated);
  };

  const totalBruto = itens.reduce((acc, curr) => acc + (curr.quantidade * curr.valor_unitario), 0);
  const totalDesconto = itens.reduce((acc, curr) => acc + (curr.valor_desconto_comercial || 0), 0);
  const totalLiquido = totalBruto - totalDesconto;

  return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Itens da Nota Fiscal ({itens.length} {itens.length === 1 ? 'produto' : 'produtos'})
            </h3>
          </div>
          <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Produto
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[11px] uppercase">
              <th className="py-2.5 px-2 text-center w-10">#</th>
              <th className="py-2.5 px-3 w-32">NCM</th>
              <th className="py-2.5 px-3">Descrição da Mercadoria</th>
              <th className="py-2.5 px-2 text-center w-16">Qtd</th>
              <th className="py-2.5 px-3 text-right w-28">V. Unit (R$)</th>
              <th className="py-2.5 px-3 text-right w-28">Desc. (R$)</th>
              <th className="py-2.5 px-3 text-right w-28">Total (R$)</th>
              <th className="py-2.5 px-2 text-center w-12">Ação</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
            {itens.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50 transition">
                  <td className="py-2 px-2 text-center font-mono font-bold text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3">
                    <input
                        type="text"
                        value={item.ncm}
                        onChange={(e) => handleItemChange(idx, 'ncm', e.target.value)}
                        placeholder="0000.00.00"
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-emerald-800 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                        type="text"
                        value={item.descricao}
                        onChange={(e) => handleItemChange(idx, 'descricao', e.target.value)}
                        placeholder="Descrição do produto"
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(idx, 'quantidade', parseFloat(e.target.value) || 1)}
                        className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-center font-mono text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.valor_unitario}
                        onChange={(e) => handleItemChange(idx, 'valor_unitario', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.valor_desconto_comercial || 0}
                        onChange={(e) => handleItemChange(idx, 'valor_desconto_comercial', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-amber-50/70 border border-amber-300 rounded text-right font-mono text-amber-900 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {((item.quantidade * item.valor_unitario) - (item.valor_desconto_comercial || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        title="Remover este item"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
            ))}
            </tbody>
            <tfoot>
            <tr className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-800 text-xs">
              <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider">
                Totais Faturados:
              </td>
              <td className="py-3 px-2 text-center font-mono">
                {itens.reduce((acc, it) => acc + (it.quantidade || 1), 0)}
              </td>
              <td className="py-3 px-3 text-right font-mono text-slate-900">
                {totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </td>
              <td className="py-3 px-3 text-right font-mono text-amber-700">
                - {totalDesconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </td>
              <td className="py-3 px-3 text-right font-mono text-emerald-800 text-sm">
                {totalLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </td>
              <td></td>
            </tr>
            </tfoot>
          </table>
        </div>
      </div>
  );
};