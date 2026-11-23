import React, { useEffect, useState } from 'react';
import { Package, Calculator, ArrowRightLeft, DollarSign, Play, ListPlus } from 'lucide-react';
import { OperacaoComercial, FinalidadeCompra, CnpjApiResult, AppTheme, ItemNotaFiscal } from '../types.js';
import { MultiItemManager } from './MultiItemManager.tsx';
import { sanitizarOuSugerirNcm } from '../data/ncmDatabase.js';

interface OperationFormProps {
  operacao: OperacaoComercial;
  onChange: (updated: Partial<OperacaoComercial>) => void;
  onSubmit: () => void;
  loading: boolean;
  supplier: CnpjApiResult | null;
  currentTheme?: AppTheme;
}

const UFS = ['SP','PR','RJ','SC','MG','RS','DF','GO','MS','BA','PE','CE','PA','ES','AM','MT','AL','AP','AC','MA','PB','PI','RN','RO','RR','SE','TO'];

export const OperationForm: React.FC<OperationFormProps> = ({ operacao, onChange, onSubmit, loading, supplier, currentTheme = 'GOV_CLASSIC' }) => {
  const [modoMultiItem, setModoMultiItem] = useState(Boolean(operacao.itens && operacao.itens.length > 1));

  useEffect(() => {
    if (operacao.itens && operacao.itens.length > 1) setModoMultiItem(true);
  }, [operacao.itens]);

  const itensAtuais: ItemNotaFiscal[] = operacao.itens && operacao.itens.length > 0
    ? operacao.itens
    : [{ id: 'item_1', ncm: operacao.ncm || '3209.10.00', descricao: operacao.descricao_produto || '', quantidade: 1, valor_unitario: operacao.valor_operacao || 0, valor_total: operacao.valor_operacao || 0, valor_desconto_comercial: operacao.valor_desconto_comercial || 0, valor_frete: operacao.valor_frete || 0, valor_despesas: operacao.valor_despesas || 0, icms_proprio_destacado: operacao.icms_proprio_destacado || 0 }];

  const handleMultiItensChange = (newItens: ItemNotaFiscal[]) => {
    const primeiro = newItens[0];
    onChange({
      itens: newItens,
      valor_operacao: newItens.reduce((sum, item) => sum + item.quantidade * item.valor_unitario, 0),
      valor_desconto_comercial: newItens.reduce((sum, item) => sum + (item.valor_desconto_comercial || 0), 0),
      valor_frete: newItens.reduce((sum, item) => sum + (item.valor_frete || 0), 0),
      valor_despesas: newItens.reduce((sum, item) => sum + (item.valor_despesas || 0), 0),
      icms_proprio_destacado: newItens.reduce((sum, item) => sum + (item.icms_proprio_destacado || 0), 0),
      ncm: primeiro?.ncm || operacao.ncm,
      descricao_produto: newItens.length > 1 ? `${primeiro?.descricao || ''} (+ ${newItens.length - 1} outros produtos)` : (primeiro?.descricao || operacao.descricao_produto)
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800"><Package className="w-5 h-5" /></div>
          <div><h2 className="text-sm font-bold text-slate-900 tracking-tight">2. Dados da Operação Comercial (MT)</h2><p className="text-xs text-slate-500">NCMs, produtos, rota fiscal, valores da nota e finalidade de uso</p></div>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button type="button" onClick={() => setModoMultiItem(false)} className={`px-3 py-1 rounded ${!modoMultiItem ? 'bg-white text-slate-900 shadow font-bold' : 'text-slate-500'}`}>Item Único</button>
          <button type="button" onClick={() => setModoMultiItem(true)} className={`px-3 py-1 rounded flex items-center gap-1.5 ${modoMultiItem ? 'bg-emerald-800 text-white shadow font-bold' : 'text-slate-600'}`}><ListPlus className="w-3.5 h-3.5" /> Múltiplos Itens ({itensAtuais.length})</button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600 mb-1.5">Tipo do Adquirente em MT *</label>
            <select value={operacao.tipo_adquirente || 'ORGAO_PUBLICO_ESTADUAL'} onChange={(e) => onChange({ tipo_adquirente: e.target.value as OperacaoComercial['tipo_adquirente'] })} className="w-full px-3.5 py-2.5 border border-slate-300 rounded text-xs font-semibold">
              <option value="ORGAO_PUBLICO_ESTADUAL">Órgão Público Estadual (Secretaria / Autarquia / Fundação MT)</option>
              <option value="PRIVADO">Empresa Privada / Contribuinte / Comércio</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600 mb-1.5">Finalidade da Compra em MT *</label>
            <select value={operacao.finalidade_compra} onChange={(e) => {
              const val = e.target.value as FinalidadeCompra;
              onChange({ finalidade_compra: val, tipo_adquirente: val === 'ORGAO_PUBLICO_CONSUMO' || val === ('SUPRIMENTO_FUNDOS' as FinalidadeCompra) ? 'ORGAO_PUBLICO_ESTADUAL' : operacao.tipo_adquirente });
            }} className="w-full px-3.5 py-2.5 border border-slate-300 rounded text-xs font-semibold">
              <option value="ORGAO_PUBLICO_CONSUMO">Aquisição para Consumo de Órgão Público Estadual</option>
              <option value="SUPRIMENTO_FUNDOS" className="font-bold text-sky-900">Suprimentos de Fundos (Dispensa IRRF e contribuições federais)</option>
              <option value="REVENDA">Revenda / Comercialização</option>
              <option value="USO_CONSUMO">Uso e Consumo Privado</option>
              <option value="ATIVO_IMOBILIZADO">Ativo Imobilizado Privado</option>
              <option value="INDUSTRIALIZACAO">Industrialização / Insumo</option>
            </select>
            {operacao.finalidade_compra === ('SUPRIMENTO_FUNDOS' as FinalidadeCompra) && (
              <p class="sr-only">Aquisição realizada por meio de Suprimento de Fundos. Dispensada a retenção na fonte do Imposto de Renda (IRRF) e das contribuições sociais (CSLL, PIS/Pasep e Cofins).</p>
            )}
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1"><ArrowRightLeft className="w-3 h-3 inline" /> UF Origem</label><select value={operacao.uf_origem} onChange={(e) => onChange({ uf_origem: e.target.value })} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs">{UFS.map(uf => <option key={uf} value={uf}>{uf}{supplier?.uf === uf ? ' (Mesmo do Fornecedor)' : ''}</option>)}</select></div>
          <div><label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-1">UF Destino</label><input type="text" value="MT (RICMS Dec. 2.212/2014)" disabled className="w-full px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded text-xs font-bold text-center" /></div>
        </div>

        {modoMultiItem ? (
          <MultiItemManager itens={itensAtuais} onChangeItens={handleMultiItensChange} currentTheme={currentTheme} finalidadeCompra={operacao.finalidade_compra} />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-xs uppercase font-semibold text-slate-600 mb-1.5">NCM *</label><input type="text" value={operacao.ncm} onChange={(e) => { const ncm = e.target.value; onChange({ ncm }); if (itensAtuais.length === 1) onChange({ itens: [{ ...itensAtuais[0], ncm }] }); }} onBlur={() => { const sanitizado = sanitizarOuSugerirNcm(operacao.ncm, operacao.descricao_produto); if (sanitizado.valido || sanitizado.foiAjustado) onChange({ ncm: sanitizado.ncmFormatado }); }} placeholder="Ex: 3209.10.00" className="w-full px-3.5 py-2.5 border border-slate-300 rounded text-xs font-mono" /></div>
              <div className="sm:col-span-2"><label className="block text-xs uppercase font-semibold text-slate-600 mb-1.5">Descrição Detalhada do Produto *</label><input type="text" value={operacao.descricao_produto} onChange={(e) => { const descricao_produto = e.target.value; onChange({ descricao_produto }); if (itensAtuais.length === 1) onChange({ itens: [{ ...itensAtuais[0], descricao: descricao_produto }] }); }} className="w-full px-3.5 py-2.5 border border-slate-300 rounded text-xs" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div><label className="block text-xs uppercase font-semibold text-slate-600 mb-1.5"><DollarSign className="w-3.5 h-3.5 inline" /> Valor Produtos</label><input type="number" min="0" step="10" value={operacao.valor_operacao} onChange={(e) => { const val = parseFloat(e.target.value) || 0; onChange({ valor_operacao: val }); if (itensAtuais.length === 1) onChange({ itens: [{ ...itensAtuais[0], valor_unitario: val, valor_total: val }] }); }} className="w-full px-3.5 py-2.5 border border-slate-300 rounded text-xs font-mono" /></div>
              <div><label className="block text-xs uppercase font-semibold text-amber-800 mb-1.5">Desconto Comercial</label><input type="number" min="0" step="10" value={operacao.valor_desconto_comercial || 0} onChange={(e) => onChange({ valor_desconto_comercial: parseFloat(e.target.value) || 0 })} className="w-full px-3.5 py-2.5 bg-amber-50 border border-amber-300 rounded text-xs font-mono" /></div>
              <div><label className="block text-xs uppercase font-semibold text-slate-600 mb-1.5">Frete e Despesas</label><input type="number" min="0" step="10" value={(operacao.valor_frete || 0) + (operacao.valor_despesas || 0)} onChange={(e) => { const val = parseFloat(e.target.value) || 0; onChange({ valor_frete: val, valor_despesas: 0 }); }} className="w-full px-3.5 py-2.5 border border-slate-300 rounded text-xs font-mono" /></div>
              <div><label className="block text-xs uppercase font-semibold text-slate-600 mb-1.5">ICMS Próprio Origem</label><input type="number" min="0" step="10" value={operacao.icms_proprio_destacado || 0} onChange={(e) => onChange({ icms_proprio_destacado: parseFloat(e.target.value) || 0 })} className="w-full px-3.5 py-2.5 border border-slate-300 rounded text-xs font-mono" /></div>
            </div>
          </div>
        )}

        <button type="button" onClick={onSubmit} disabled={loading} className="w-full py-3.5 px-5 font-bold text-xs rounded-lg flex items-center justify-center gap-2 bg-emerald-700 text-white">
          {loading ? <><Calculator className="w-5 h-5 animate-spin" /><span>Processando análise fiscal...</span></> : <><Play className="w-4 h-4 fill-current" /><span>{modoMultiItem && itensAtuais.length > 1 ? `Gerar análise consolidada dos ${itensAtuais.length} itens` : 'Gerar análise tributária completa'}</span></>}
        </button>
      </div>
    </div>
  );
};
