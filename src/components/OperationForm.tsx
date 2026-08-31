import React, { useState } from 'react';
import { Package, Calculator, ArrowRightLeft, DollarSign, Play, Layers, ListPlus } from 'lucide-react';
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

const PRESET_NCMS = [
  { ncm: '2201.10.00', desc: 'Água mineral retornável igual ou superior a 20 (vinte) litros (ST Anexo X / Bebidas)', finalidade: 'ORGAO_PUBLICO_CONSUMO' as FinalidadeCompra },
  { ncm: '2711.19.10', desc: 'Gás liquefeito de petróleo em botijão de 13 Kg (ST Anexo X / COMBUSTÍVEIS E LUBRIFICANTES)', finalidade: 'ORGAO_PUBLICO_CONSUMO' as FinalidadeCompra },    
  { ncm: '3209.10.00', desc: 'Tintas e Vernizes (ST Anexo X - MVA 42.5% / Dec. 2.212)', finalidade: 'ORGAO_PUBLICO_CONSUMO' as FinalidadeCompra },
  { ncm: '8708.29.99', desc: 'Autopeças & Acessórios Automotivos (ST Anexo X)', finalidade: 'USO_CONSUMO' as FinalidadeCompra },
  { ncm: '3004.90.99', desc: 'Medicamentos & Farmacêuticos (ST Anexo X / PMC / Livro 27)', finalidade: 'USO_CONSUMO' as FinalidadeCompra },
  { ncm: '1006.30.21', desc: 'Arroz Polido Tipo 1 (Cesta Básica - Anexo V Redução BC 7%)', finalidade: 'USO_CONSUMO' as FinalidadeCompra },
  { ncm: '0201.30.00', desc: 'Carne Bovina Desossada (Pauta Fiscal MT / Diferimento)', finalidade: 'USO_CONSUMO' as FinalidadeCompra },
  { ncm: '8471.50.10', desc: 'Computadores e Servidores (DIFAL Uso e Consumo / Imobilizado)', finalidade: 'USO_CONSUMO' as FinalidadeCompra },
  { ncm: '3105.20.00', desc: 'Insumos Agrícolas NPK (Isenção / Redução Agro Anexo V)', finalidade: 'USO_CONSUMO' as FinalidadeCompra },
  { ncm: '7214.20.00', desc: 'Aço e Vergalhões Construção (ST Anexo X / Carga Média)', finalidade: 'USO_CONSUMO' as FinalidadeCompra },
  { ncm: '4649.90.00', desc: 'Artefatos do Comércio (Estimativa Simplificada / Carga Média MT)', finalidade: 'USO_CONSUMO' as FinalidadeCompra },
  { ncm: '2210.10.00', desc: 'Água mineral natural (ST Anexo X / Bebidas)', finalidade: 'USO_CONSUMO' as FinalidadeCompra },  
];

const UFS = [
  'SP', 'PR', 'RJ', 'SC', 'MG', 'RS', 'DF', 'GO', 'MS', 'BA', 'PE', 'CE', 'PA', 'ES', 'AM', 'MT', 'AL', 'AP', 'AC', 'MA', 'PB', 'PI', 'RN', 'RO', 'RR', 'SE', 'TO'
];

export const OperationForm: React.FC<OperationFormProps> = ({
  operacao,
  onChange,
  onSubmit,
  loading,
  supplier,
  currentTheme = 'GOV_CLASSIC'
}) => {
  const [modoMultiItem, setModoMultiItem] = useState<boolean>(
    Boolean(operacao.itens && operacao.itens.length > 1)
  );

  const getThemeStyles = () => {
    switch (currentTheme) {
      case 'GOV_CLASSIC':
        return {
          iconBox: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
          btnSubmit: 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-amber-100 border border-amber-400/40 shadow-md',
          focusRing: 'focus:ring-emerald-600/20 focus:border-emerald-600'
        };
      case 'FINTECH_PRO':
        return {
          iconBox: 'bg-indigo-50 border border-indigo-200 text-indigo-700',
          btnSubmit: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-lg shadow-indigo-600/25',
          focusRing: 'focus:ring-indigo-600/20 focus:border-indigo-600'
        };
      case 'DARK_AUDITOR':
        return {
          iconBox: 'bg-cyan-950 border border-cyan-800 text-cyan-400',
          btnSubmit: 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-black font-extrabold border border-cyan-400 shadow-lg shadow-cyan-900/30',
          focusRing: 'focus:ring-cyan-500/20 focus:border-cyan-500'
        };
      case 'INSTITUCIONAL':
      default:
        return {
          iconBox: 'bg-teal-50 border border-teal-200 text-teal-700',
          btnSubmit: 'bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white shadow-sm',
          focusRing: 'focus:ring-teal-600/20 focus:border-teal-600'
        };
    }
  };

  const themeStyle = getThemeStyles();

  // Itens padrão caso o array esteja vazio
  const itensAtuais: ItemNotaFiscal[] = operacao.itens && operacao.itens.length > 0
    ? operacao.itens
    : [
        {
          id: 'item_1',
          ncm: operacao.ncm || '3209.10.00',
          descricao: operacao.descricao_produto || 'Tinta acrílica fosca para exteriores galão 18L',
          quantidade: 1,
          valor_unitario: operacao.valor_operacao || 15000,
          valor_total: operacao.valor_operacao || 15000,
          valor_desconto_comercial: operacao.valor_desconto_comercial || 0,
          valor_frete: operacao.valor_frete || 0,
          valor_despesas: operacao.valor_despesas || 0,
          icms_proprio_destacado: operacao.icms_proprio_destacado || 0
        }
      ];

  const handleNcmPresetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const found = PRESET_NCMS.find(p => p.ncm === val);
    if (found) {
      onChange({
        ncm: found.ncm,
        descricao_produto: found.desc,
        finalidade_compra: found.finalidade
      });
      if (itensAtuais.length === 1) {
        const updatedItens = [{
          ...itensAtuais[0],
          ncm: found.ncm,
          descricao: found.desc
        }];
        onChange({ itens: updatedItens });
      }
    }
  };

  const handleMultiItensChange = (newItens: ItemNotaFiscal[]) => {
    const totalOperacao = newItens.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
    const totalDesconto = newItens.reduce((acc, curr) => acc + (curr.valor_desconto_comercial || 0), 0);
    const totalFrete = newItens.reduce((acc, curr) => acc + (curr.valor_frete || 0), 0);
    const totalDespesas = newItens.reduce((acc, curr) => acc + (curr.valor_despesas || 0), 0);
    const totalIcmsProprio = newItens.reduce((acc, curr) => acc + (curr.icms_proprio_destacado || 0), 0);

    const primeiroItem = newItens[0];

    onChange({
      itens: newItens,
      valor_operacao: totalOperacao,
      valor_desconto_comercial: totalDesconto,
      valor_frete: totalFrete,
      valor_despesas: totalDespesas,
      icms_proprio_destacado: totalIcmsProprio,
      ncm: primeiroItem?.ncm || operacao.ncm,
      descricao_produto: newItens.length > 1
        ? `${primeiroItem?.descricao || ''} (+ ${newItens.length - 1} outros produtos)`
        : (primeiroItem?.descricao || operacao.descricao_produto)
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">
      {/* Header com Toggle Único / Múltiplos Itens */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded ${themeStyle.iconBox}`}>
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">2. Dados da Operação Comercial (MT)</h2>
            <p className="text-xs text-slate-500">
              NCMs, produtos, rota fiscal orig/dest, valores da nota e finalidade de uso
            </p>
          </div>
        </div>

        {/* Toggle Modo Único vs Múltiplos Itens */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setModoMultiItem(false);
              if (itensAtuais.length > 1) {
                handleMultiItensChange([itensAtuais[0]]);
              }
            }}
            className={`px-3 py-1 rounded transition ${!modoMultiItem ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Item Único
          </button>
          <button
            type="button"
            onClick={() => setModoMultiItem(true)}
            className={`px-3 py-1 rounded flex items-center gap-1.5 transition ${modoMultiItem ? 'bg-teal-700 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <ListPlus className="w-3.5 h-3.5" /> Múltiplos Itens ({itensAtuais.length})
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Adquirente e Finalidade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600 mb-1.5">
              Tipo do Adquirente em MT *
            </label>
            <select
              value={operacao.tipo_adquirente || (operacao.finalidade_compra === 'ORGAO_PUBLICO_CONSUMO' ? 'ORGAO_PUBLICO_ESTADUAL' : 'PRIVADO')}
              onChange={(e) => {
                const isOp = e.target.value === 'ORGAO_PUBLICO_ESTADUAL';
                onChange({
                  tipo_adquirente: e.target.value as any,
                  finalidade_compra: isOp ? 'ORGAO_PUBLICO_CONSUMO' : (operacao.finalidade_compra === 'ORGAO_PUBLICO_CONSUMO' ? 'REVENDA' : operacao.finalidade_compra)
                });
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            >
              <option value="PRIVADO" className="bg-white text-slate-900">Empresa Privada / Contribuinte / Comércio</option>
              <option value="ORGAO_PUBLICO_ESTADUAL" className="bg-amber-50 text-amber-900 font-bold">🏛️ Órgão Público Estadual (Secretaria / Autarquia / Fundação MT)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600 mb-1.5">
              Finalidade da Compra em MT *
            </label>
            <select
              value={operacao.finalidade_compra}
              onChange={(e) => {
                const val = e.target.value as FinalidadeCompra;
                onChange({
                  finalidade_compra: val,
                  tipo_adquirente: val === 'ORGAO_PUBLICO_CONSUMO' ? 'ORGAO_PUBLICO_ESTADUAL' : operacao.tipo_adquirente
                });
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            >
              <option value="ORGAO_PUBLICO_CONSUMO" className="bg-amber-50 text-amber-900 font-bold">🏛️ Aquisição para Consumo de Órgão Público Estadual (Isento Anexo I / Conv. 73/04)</option>
              <option value="REVENDA" className="bg-white text-slate-900">Revenda / Comercialização (ST / Estimativa)</option>
              <option value="USO_CONSUMO" className="bg-white text-slate-900">Uso e Consumo Privado (DIFAL)</option>
              <option value="ATIVO_IMOBILIZADO" className="bg-white text-slate-900">Ativo Imobilizado Privado (DIFAL)</option>
              <option value="INDUSTRIALIZACAO" className="bg-white text-slate-900">Industrialização / Insumo</option>
            </select>
          </div>
        </div>

        {(operacao.tipo_adquirente === 'ORGAO_PUBLICO_ESTADUAL' || operacao.finalidade_compra === 'ORGAO_PUBLICO_CONSUMO') && (
          <div className="bg-amber-50 border border-amber-300 p-3 rounded-lg text-xs text-amber-950 flex items-start gap-2 font-sans shadow-2xs">
            <span className="text-base leading-none">🏛️</span>
            <div>
              <strong className="block font-bold text-amber-900 uppercase tracking-wide">Aquisição por Órgão da Administração Pública do Estado de Mato Grosso:</strong>
              <p className="mt-0.5 text-amber-900/90 leading-relaxed">
                Operação isenta de ICMS (Art. 2º do Anexo I do RICMS/MT & Convênio ICMS 73/2004) exceto se fornecedor optante pelo Simples Nacional (OT 03/2026 CGE-MT) ou produto em Substituição Tributária (Art. 65 § 3º Anexo IV).
              </p>
            </div>
          </div>
        )}

        {/* Route Selector */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-1 flex items-center gap-1">
              <ArrowRightLeft className="w-3 h-3 text-teal-700" /> UF Origem (Saída Nota)
            </label>
            <select
              value={operacao.uf_origem}
              onChange={(e) => onChange({ uf_origem: e.target.value })}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              {UFS.map(uf => (
                <option key={uf} value={uf} className="bg-white text-slate-900">{uf} {supplier && supplier.uf === uf ? '(Mesmo do Fornecedor)' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-1">
              UF Destino (Mato Grosso)
            </label>
            <input
              type="text"
              value="MT (RICMS Dec. 2.212/2014)"
              disabled
              className="w-full px-3 py-1.5 bg-teal-50 border border-teal-200 rounded text-xs font-bold text-teal-800 text-center"
            />
          </div>
        </div>

        {/* CONTEÚDO: MODO MULTI-ITEM OU MODO ÚNICO ITEM */}
        {modoMultiItem ? (
          <MultiItemManager
            itens={itensAtuais}
            onChangeItens={handleMultiItensChange}
            currentTheme={currentTheme}
            finalidadeCompra={operacao.finalidade_compra}
          />
        ) : (
          <div className="space-y-4">
            {/* NCM Quick Preset Selector */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600 mb-1.5">
                Presets de NCMs Comuns para Análises Rápidas
              </label>
              <select
                onChange={handleNcmPresetSelect}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              >
                <option value="" className="bg-white text-slate-700">-- Selecione uma sugestão de NCM com regra fiscal específica --</option>
                {PRESET_NCMS.map((item) => (
                  <option key={item.ncm} value={item.ncm} className="bg-white text-slate-900">
                    {item.ncm} - {item.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* NCM and Description */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600 mb-1.5">
                  NCM (Código Mercosul) *
                </label>
                <input
                  type="text"
                  value={operacao.ncm}
                  onChange={(e) => {
                    const ncm = e.target.value;
                    onChange({ ncm });
                    if (itensAtuais.length === 1) {
                      onChange({ itens: [{ ...itensAtuais[0], ncm }] });
                    }
                  }}
                  onBlur={() => {
                    if (operacao.ncm) {
                      const sanitizado = sanitizarOuSugerirNcm(operacao.ncm, operacao.descricao_produto);
                      if (sanitizado.valido || sanitizado.foiAjustado) {
                        onChange({ ncm: sanitizado.ncmFormatado });
                        if (itensAtuais.length === 1) {
                          onChange({ itens: [{ ...itensAtuais[0], ncm: sanitizado.ncmFormatado }] });
                        }
                      }
                    }
                  }}
                  placeholder="Ex: 3209.10.00"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600 mb-1.5">
                  Descrição Detalhada do Produto *
                </label>
                <input
                  type="text"
                  value={operacao.descricao_produto}
                  onChange={(e) => {
                    const descricao_produto = e.target.value;
                    onChange({ descricao_produto });
                    if (itensAtuais.length === 1) {
                      onChange({ itens: [{ ...itensAtuais[0], descricao: descricao_produto }] });
                    }
                  }}
                  placeholder="Ex: Tinta acrílica fosca para exteriores galao 18L"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                />
              </div>
            </div>

            {/* Financial values */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-teal-700" /> Valor Produtos (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={operacao.valor_operacao}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onChange({ valor_operacao: val });
                    if (itensAtuais.length === 1) {
                      onChange({ itens: [{ ...itensAtuais[0], valor_unitario: val, valor_total: val }] });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-amber-800 mb-1.5">
                  Desconto Comercial (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={operacao.valor_desconto_comercial || 0}
                  onChange={(e) => onChange({ valor_desconto_comercial: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-amber-50/60 border border-amber-300 rounded text-xs font-mono font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600 mb-1.5">
                  Frete e Despesas (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={((operacao.valor_frete || 0) + (operacao.valor_despesas || 0))}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onChange({ valor_frete: val, valor_despesas: 0 });
                  }}
                  className={`w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 ${themeStyle.focusRing}`}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600 mb-1.5">
                  ICMS Próprio Origem (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={operacao.icms_proprio_destacado || 0}
                  onChange={(e) => onChange({ icms_proprio_destacado: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 ${themeStyle.focusRing}`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className={`w-full py-3.5 px-5 font-bold text-xs rounded-lg uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 ${themeStyle.btnSubmit}`}
          >
            {loading ? (
              <>
                <Calculator className="w-5 h-5 animate-spin" />
                <span>Processando Análise Fiscal dos Itens (Decreto nº 2.212/2014-MT)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {modoMultiItem && itensAtuais.length > 1
                    ? `Gerar Análise Consolidada dos ${itensAtuais.length} Itens da Nota`
                    : 'Gerar Análise Tributária Completa (JSON & Legislação MT)'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
