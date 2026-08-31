import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { ItemNotaFiscal, FinalidadeCompra, AppTheme } from '../types.js';
import { sanitizarOuSugerirNcm } from '../data/ncmDatabase.js';

interface MultiItemManagerProps {
  itens: ItemNotaFiscal[];
  onChangeItens: (itens: ItemNotaFiscal[]) => void;
  currentTheme?: AppTheme;
  finalidadeCompra?: FinalidadeCompra;
}

const PRESET_QUICK_ITEMS = [
  { ncm: '3814.00.90', desc: 'Solvente Diluente Thinner 5L (Fora da ST -> CST 40 / Desc. 17%)', qtd: 10, unit: 58.40 },
  { ncm: '8513.10.10', desc: 'Lanterna Tática Portátil LED (Fora da ST -> CST 40 / Desc. 17%)', qtd: 8, unit: 50.00 },
  { ncm: '3922.90.00', desc: 'Mecanismo de Descarga Sanitária Plástico (ST Anexo X -> CST 60)', qtd: 15, unit: 78.00 },
  { ncm: '8539.52.00', desc: 'Lâmpada LED Tubular 18W Bivolt (ST Anexo X -> CST 60)', qtd: 40, unit: 24.50 },
  { ncm: '8539.31.20', desc: 'Lâmpada Fluorescente Compacta Eletrônica (ST Anexo X -> CST 60)', qtd: 36, unit: 20.03 },
  { ncm: '2201.10.00', desc: 'Água mineral galão 20L retornável (ST Anexo X)', qtd: 50, unit: 18.00 },
  { ncm: '2711.19.10', desc: 'Gás de cozinha GLP botijão P13 (IN 1234 0.24%)', qtd: 10, unit: 115.00 },
  { ncm: '3209.10.00', desc: 'Tinta Acrílica Fosca 18L (ST Anexo X)', qtd: 8, unit: 380.00 },
  { ncm: '4802.56.10', desc: 'Papel A4 Alcalino 75g Resma 500fls (Isenção Art 2º Anexo I)', qtd: 100, unit: 28.50 },
  { ncm: '8471.30.12', desc: 'Notebook Corporativo i5 16GB (TI / DIFAL)', qtd: 5, unit: 4200.00 }
];

export const MultiItemManager: React.FC<MultiItemManagerProps> = ({
  itens,
  onChangeItens,
  currentTheme = 'GOV_CLASSIC'
}) => {
  const [newItemNcm, setNewItemNcm] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQtd, setNewItemQtd] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState(0);

  const addItem = () => {
    if (!newItemNcm || !newItemDesc || newItemUnit <= 0) return;

    const sanitizado = sanitizarOuSugerirNcm(newItemNcm, newItemDesc);
    const ncmFinal = sanitizado.ncmFormatado;

    const qtd = Math.max(1, newItemQtd);
    const total = qtd * newItemUnit;

    const newItem: ItemNotaFiscal = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ncm: ncmFinal,
      descricao: newItemDesc.trim(),
      quantidade: qtd,
      valor_unitario: newItemUnit,
      valor_total: total,
      valor_desconto_comercial: 0,
      valor_frete: 0,
      valor_despesas: 0,
      icms_proprio_destacado: 0
    };

    onChangeItens([...itens, newItem]);
    setNewItemNcm('');
    setNewItemDesc('');
    setNewItemQtd(1);
    setNewItemUnit(0);
  };

  const removeItem = (id: string) => {
    if (itens.length <= 1) return;
    onChangeItens(itens.filter(i => i.id !== id));
  };

  const updateItemField = (id: string, updates: Partial<ItemNotaFiscal>) => {
    onChangeItens(
      itens.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        if (updates.quantidade !== undefined || updates.valor_unitario !== undefined) {
          const qtd = updates.quantidade !== undefined ? updates.quantidade : item.quantidade;
          const unit = updates.valor_unitario !== undefined ? updates.valor_unitario : item.valor_unitario;
          updated.valor_total = Math.max(0, qtd * unit);
        }
        return updated;
      })
    );
  };

  const handleSelectPreset = (preset: typeof PRESET_QUICK_ITEMS[0]) => {
    const total = preset.qtd * preset.unit;
    const newItem: ItemNotaFiscal = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ncm: preset.ncm,
      descricao: preset.desc,
      quantidade: preset.qtd,
      valor_unitario: preset.unit,
      valor_total: total,
      valor_desconto_comercial: 0,
      valor_frete: 0,
      valor_despesas: 0,
      icms_proprio_destacado: 0
    };
    onChangeItens([...itens, newItem]);
  };

  const totalGeral = itens.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);

  return (
    <div className="space-y-4 pt-1">
      {/* Título e Contador */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Grade de Produtos da Nota Fiscal / Pedido ({itens.length} {itens.length === 1 ? 'item' : 'itens'})
            </h3>
            <p className="text-[11px] text-slate-500">
              Cada produto é analisado individualmente quanto a ST, Isenção (OT 03/2026) e IRRF (IN 1234)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600 font-medium">Total dos Produtos:</span>
          <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-200">
            {totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </div>

      {/* Lista de Itens Cadastrados */}
      <div className="space-y-2.5">
        {itens.map((item, idx) => (
          <div
            key={item.id}
            className="p-3 bg-slate-50 hover:bg-slate-50/90 rounded-lg border border-slate-200 text-xs transition-all space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold font-mono text-[10px] flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {item.ncm}
                </span>
                <strong className="text-slate-800 font-semibold">{item.descricao}</strong>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">Subtotal:</span>
                <strong className="font-mono text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                  {item.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </strong>
                {itens.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                    title="Remover este item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Inputs editáveis inline para o item */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/70 text-[11px]">
              <div>
                <label className="block text-[10px] text-slate-500 font-medium">Quantidade:</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantidade}
                  onChange={(e) => updateItemField(item.id, { quantidade: parseFloat(e.target.value) || 1 })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-medium">Valor Unitário (R$):</label>
                <input
                  type="number"
                  min="0"
                  step="0.10"
                  value={item.valor_unitario}
                  onChange={(e) => updateItemField(item.id, { valor_unitario: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
              <div>
                <label className="block text-[10px] text-amber-800 font-medium">Desc. Comercial (R$):</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={item.valor_desconto_comercial || 0}
                  onChange={(e) => updateItemField(item.id, { valor_desconto_comercial: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 bg-amber-50/80 border border-amber-300 rounded font-mono text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-medium">Frete/Despesas (R$):</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={(item.valor_frete || 0) + (item.valor_despesas || 0)}
                  onChange={(e) => updateItemField(item.id, { valor_frete: parseFloat(e.target.value) || 0, valor_despesas: 0 })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bloco para Adicionar Novo Item Manual */}
      <div className="p-3 bg-white rounded-lg border-2 border-dashed border-slate-300 space-y-3">
        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-teal-700" /> Adicionar Produto / Mercadoria à Nota:
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-3">
            <input
              type="text"
              placeholder="NCM (ex: 2201.10.00)"
              value={newItemNcm}
              onChange={(e) => setNewItemNcm(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Descrição do Produto..."
              value={newItemDesc}
              onChange={(e) => setNewItemDesc(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>
          <div className="sm:col-span-2">
            <input
              type="number"
              min="1"
              placeholder="Qtd"
              value={newItemQtd}
              onChange={(e) => setNewItemQtd(parseFloat(e.target.value) || 1)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>
          <div className="sm:col-span-2">
            <input
              type="number"
              min="0"
              step="0.50"
              placeholder="R$ Unit"
              value={newItemUnit || ''}
              onChange={(e) => setNewItemUnit(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Presets Rápidos */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Inserir rápido:</span>
            {PRESET_QUICK_ITEMS.slice(0, 4).map((p) => (
              <button
                key={p.ncm}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-teal-50 hover:text-teal-900 hover:border-teal-300 border border-slate-300 rounded font-medium text-slate-700 transition"
              >
                + {p.ncm} ({p.desc.split(' ')[0]})
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            disabled={!newItemNcm || !newItemDesc || newItemUnit <= 0}
            className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white font-bold text-xs rounded uppercase tracking-wider flex items-center gap-1 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Inserir Item
          </button>
        </div>
      </div>
    </div>
  );
};
