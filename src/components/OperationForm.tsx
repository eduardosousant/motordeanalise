import React from 'react';
import { Package, Calculator, Play, ListPlus } from 'lucide-react';
import { OperacaoComercial, FinalidadeCompra, CnpjApiResult, AppTheme, ItemNotaFiscal } from '../types.js';
import { MultiItemManager } from './MultiItemManager.tsx';

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
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-800 text-white text-xs font-bold shadow">
          <ListPlus className="w-3.5 h-3.5" /> Itens ({itensAtuais.length})
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600 mb-1.5">Tipo do Adquirente</label>
            <select value={operacao.tipo_adquirente || 'ORGAO_PUBLICO_ESTADUAL'} onChange={(e) => onChange({ tipo_adquirente: e.target.value as OperacaoComercial['tipo_adquirente'] })} className="w-full px-3.5 py-2.5 border border-slate-300 rounded text-xs font-semibold">
              <option value="ORGAO_PUBLICO_ESTADUAL">Órgão Público Estadual</option>
              <option value="PRIVADO">Empresa Privada / Contribuinte / Comércio</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600 mb-1.5">Finalidade da Compra</label>
            <select value={operacao.finalidade_compra} onChange={(e) => {
              const val = e.target.value as FinalidadeCompra;
              onChange({ finalidade_compra: val, tipo_adquirente: val === 'ORGAO_PUBLICO_CONSUMO' || val === 'SUPRIMENTO_FUNDOS' ? 'ORGAO_PUBLICO_ESTADUAL' : operacao.tipo_adquirente });
            }} className="w-full px-3.5 py-2.5 border border-slate-300 rounded text-xs font-semibold">
              <option value="ORGAO_PUBLICO_CONSUMO">Aquisição de Órgão Público Estadual</option>
              <option value="SUPRIMENTO_FUNDOS" className="font-bold text-sky-900">Suprimentos de Fundos</option>
              <option value="REVENDA">Revenda / Comercialização</option>
              <option value="USO_CONSUMO">Uso e Consumo Privado</option>
              <option value="ATIVO_IMOBILIZADO">Ativo Imobilizado Privado</option>
              <option value="INDUSTRIALIZACAO">Industrialização / Insumo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600 mb-1.5">UF Origem *</label>
            <select value={operacao.uf_origem} onChange={(e) => onChange({ uf_origem: e.target.value })} className="w-full px-3.5 py-2.5 border border-slate-300 rounded text-xs font-semibold">
              {UFS.map(uf => <option key={uf} value={uf}>{uf}{supplier?.uf === uf ? ' (Mesmo do Fornecedor)' : ''}</option>)}
            </select>
          </div>
        </div>

        <MultiItemManager itens={itensAtuais} onChangeItens={handleMultiItensChange} currentTheme={currentTheme} finalidadeCompra={operacao.finalidade_compra} />

        <button type="button" onClick={onSubmit} disabled={loading} className="w-full py-3.5 px-5 font-bold text-xs rounded-lg flex items-center justify-center gap-2 bg-emerald-700 text-white">
          {loading ? <><Calculator className="w-5 h-5 animate-spin" /><span>Processando análise fiscal...</span></> : <><Play className="w-4 h-4 fill-current" /><span>{itensAtuais.length > 1 ? `Gerar análise consolidada dos ${itensAtuais.length} itens` : 'Gerar análise tributária completa'}</span></>}
        </button>
      </div>
    </div>
  );
};
