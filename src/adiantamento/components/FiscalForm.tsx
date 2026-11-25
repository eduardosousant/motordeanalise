/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FiscalFormData,
  TipoObjeto,
  RegimeTributario,
  StatusCadastro,
  MetodoIrrf,
} from '../types/fiscal';
import { formatarCNPJ, formatarMoeda } from '../utils/formatters';
import {
  Building2,
  FileCheck2,
  Receipt,
  HelpCircle,
  RotateCcw,
  Layers,
  Info,
  Scale,
  BookOpen,
  ExternalLink,
} from 'lucide-react';

interface FiscalFormProps {
  formData: FiscalFormData;
  onChange: (updated: Partial<FiscalFormData>) => void;
  onReset: () => void;
}

export const FiscalForm: React.FC<FiscalFormProps> = ({
  formData,
  onChange,
  onReset,
}) => {
  const ehServico = formData.tipoObjeto === 'servico';
  const ehLucro = formData.regimeTributario === 'lucro';
  const ehMei = formData.regimeTributario === 'mei';

  // Pré-visualização do IRRF calculado
  const previewIrrf =
    ehLucro && !formData.suprimentoFundos
      ? formData.metodoIrrf === 'aliquota'
        ? (formData.valorTotal * formData.aliquotaIrrf) / 100
        : formData.valorIrrfFixo
      : 0;
  const isIrrfDispensado = previewIrrf > 0 && previewIrrf < 10.0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 sm:p-6 space-y-6 w-full" id="formulario">
      {/* 1. Identificação do Fornecedor e Gestão (2 campos por linha) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-900" />
            <span>1. Identificação do Fornecedor e Gestão</span>
          </h3>
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-md hover:bg-slate-100"
            title="Limpar todos os campos do formulário"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar formulário</span>
          </button>
        </div>

        {/* Grade com exatamente 2 campos por linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Linha 1 - Campo 1: Fornecedor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Fornecedor (Razão Social)
            </label>
            <input
              type="text"
              placeholder="Ex: Tech Soluções e Informática Ltda"
              value={formData.fornecedor}
              onChange={(e) => onChange({ fornecedor: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-shadow bg-white"
            />
          </div>

          {/* Linha 1 - Campo 2: CNPJ */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              CNPJ do Fornecedor
            </label>
            <input
              type="text"
              placeholder="00.000.000/0000-00"
              value={formData.cnpj}
              onChange={(e) => onChange({ cnpj: formatarCNPJ(e.target.value) })}
              maxLength={18}
              className="w-full px-3.5 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-shadow bg-white"
            />
          </div>

          {/* Linha 2 - Campo 1: Servidor Responsável */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Servidor Responsável (Fiscal / Gestor)
            </label>
            <input
              type="text"
              placeholder="Ex: Carlos Eduardo Mendes (Matrícula / Cargo)"
              value={formData.responsavel}
              onChange={(e) => onChange({ responsavel: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-shadow bg-white"
            />
          </div>

          {/* Linha 2 - Campo 2: Valor Solicitado pelo Responsável (Adiantamento) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Valor Solicitado pelo Responsável (R$)
              </label>
              <span className="text-[10px] font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                Adiantamento Solicitado
              </span>
            </div>
            <input
              type="number"
              step="50"
              min="0"
              placeholder="0,00"
              value={formData.valorSolicitado ?? formData.custoEstimado ?? ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onChange({ valorSolicitado: val, custoEstimado: val });
              }}
              className="w-full px-3.5 py-2 text-xs font-mono-tabular font-medium border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-shadow bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Recurso total concedido do qual serão deduzidos todos os custos (líquido ao fornecedor + guias tributárias + encargos).
            </p>
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 2. Natureza da Operação e Regime Tributário */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <Receipt className="w-4 h-4 text-blue-900" />
          <span>2. Natureza da Operação e Regime Tributário</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Natureza */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Natureza da Operação
            </label>
            <div className="grid grid-cols-1 gap-2">
              <label
                className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                  formData.tipoObjeto === 'servico'
                    ? 'border-blue-900 bg-blue-50/30'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="tipoObjeto"
                  checked={formData.tipoObjeto === 'servico'}
                  onChange={() => onChange({ tipoObjeto: 'servico' })}
                  className="mt-0.5 text-blue-900 focus:ring-blue-900"
                />
                <div className="ml-2.5">
                  <div className="text-xs font-semibold text-slate-900">
                    Prestação de Serviços (Emissão de NFS-e)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Incidência de ISSQN, regras de INSS e LC 116/2003
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                  formData.tipoObjeto === 'bens'
                    ? 'border-blue-900 bg-blue-50/30'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="tipoObjeto"
                  checked={formData.tipoObjeto === 'bens'}
                  onChange={() => onChange({ tipoObjeto: 'bens' })}
                  className="mt-0.5 text-blue-900 focus:ring-blue-900"
                />
                <div className="ml-2.5">
                  <div className="text-xs font-semibold text-slate-900">
                    Fornecimento de Bens / Mercadorias (NF-e mod. 55)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Incidência de ICMS estadual e regras de Substituição Tributária
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Regime */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Regime Tributário do Fornecedor
            </label>
            <div className="space-y-2">
              <select
                value={formData.regimeTributario}
                onChange={(e) =>
                  onChange({ regimeTributario: e.target.value as RegimeTributario })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 bg-white"
              >
                <option value="simples">Simples Nacional (LC 123/2006)</option>
                <option value="mei">MEI - Microempreendedor Individual</option>
                <option value="lucro">Lucro Real ou Presumido</option>
              </select>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Valor Total do Objeto / Contrato (R$)
                </label>
                <input
                  type="number"
                  step="50"
                  min="0"
                  value={formData.valorTotal || ''}
                  onChange={(e) => onChange({ valorTotal: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs font-mono-tabular font-semibold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                />
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-lg text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
                <span>
                  {formData.regimeTributario === 'simples' &&
                    'Optantes pelo Simples Nacional são legalmente dispensados de retenção de IRRF na fonte (art. 4º, XI da IN RFB nº 1.234/2012).'}
                  {formData.regimeTributario === 'mei' &&
                    'MEI é dispensado de retenções federais na fonte. Se o serviço for de alvenaria, pintura ou manutenção (art. 18-B LC 123), o órgão arca com a CPP patronal de 20% por fora.'}
                  {formData.regimeTributario === 'lucro' &&
                    'Sujeito a retenção de IRRF com alíquota regulamentar e dispensa legal se o valor calculado for menor que R$ 10,00.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Condicional IRRF se Lucro Real ou Presumido */}
        {ehLucro && !formData.suprimentoFundos && (
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>IRRF — Imposto de Renda Retido na Fonte (IN RFB nº 1.234/2012)</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Dispensa automática se &lt; R$ 10,00
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="metodoIrrf"
                  checked={formData.metodoIrrf === 'aliquota'}
                  onChange={() => onChange({ metodoIrrf: 'aliquota' })}
                  className="text-blue-900 focus:ring-blue-900"
                />
                <span>Calcular por alíquota (%)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="metodoIrrf"
                  checked={formData.metodoIrrf === 'fixo'}
                  onChange={() => onChange({ metodoIrrf: 'fixo' })}
                  className="text-blue-900 focus:ring-blue-900"
                />
                <span>Informar valor fixo da nota (R$)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {formData.metodoIrrf === 'aliquota' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Alíquota de IRRF (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.aliquotaIrrf}
                      onChange={(e) =>
                        onChange({ aliquotaIrrf: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-1.5 text-xs font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                    />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => onChange({ aliquotaIrrf: 4.8 })}
                        className="px-2 py-1 text-[11px] bg-white border border-slate-200 rounded hover:bg-slate-100"
                      >
                        4,80%
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange({ aliquotaIrrf: 1.2 })}
                        className="px-2 py-1 text-[11px] bg-white border border-slate-200 rounded hover:bg-slate-100"
                      >
                        1,20%
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Valor total de IRRF a reter (R$)
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    value={formData.valorIrrfFixo || ''}
                    onChange={(e) =>
                      onChange({ valorIrrfFixo: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  />
                </div>
              )}

              <div className="flex items-center">
                <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 w-full">
                  <div className="text-slate-500 text-[11px]">Cálculo prévio de IRRF:</div>
                  <div className="font-semibold font-mono-tabular text-slate-900">
                    {formatarMoeda(previewIrrf)}
                  </div>
                  {isIrrfDispensado ? (
                    <span className="text-amber-700 text-[11px] font-medium block mt-0.5">
                      ⚠️ Abaixo de R$ 10,00: Retenção dispensada por lei.
                    </span>
                  ) : previewIrrf >= 10 ? (
                    <span className="text-emerald-700 text-[11px] font-medium block mt-0.5">
                      ✓ Retenção aplicável e obrigatória no pagamento.
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Condicional Bens / Mercadorias em Lucro Real/Presumido */}
        {!ehServico && ehLucro && (
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3 mt-3">
            <span className="text-xs font-bold text-slate-900 block">
              ICMS / RICMS-MT (Regras de Tributação de Bens)
            </span>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="possuiSt"
                  checked={formData.possuiSt}
                  onChange={() => onChange({ possuiSt: true, valorDescontoIcms: 0 })}
                  className="text-blue-900 focus:ring-blue-900"
                />
                <span>Sim (Substituição Tributária — ST sem desconto)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="possuiSt"
                  checked={!formData.possuiSt}
                  onChange={() => onChange({ possuiSt: false })}
                  className="text-blue-900 focus:ring-blue-900"
                />
                <span>Não (Tributação normal com desconto de ICMS)</span>
              </label>
            </div>

            {!formData.possuiSt && (
              <div className="space-y-2 pt-1">
                <div className="max-w-xs">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Desconto / Abatimento de ICMS na Nota (R$)
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    value={formData.valorDescontoIcms || ''}
                    onChange={(e) =>
                      onChange({ valorDescontoIcms: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  />
                </div>
                {formData.valorDescontoIcms > 0 && (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-950 space-y-1">
                    <div className="font-semibold">
                      ℹ️ Desoneração de ICMS — Sem pagamento de DAR
                    </div>
                    <div>
                      O abatimento de <b>{formatarMoeda(formData.valorDescontoIcms)}</b> é aplicado diretamente no preço da mercadoria pelo fornecedor. <b>A Autarquia NÃO recolhe guia (DAR) de ICMS.</b>
                    </div>
                    <div className="text-blue-900 text-[10.5px]">
                      <b>Revisão do valor solicitado:</b> Como o valor líquido a pagar ({formatarMoeda(Math.max(0, formData.valorTotal - formData.valorDescontoIcms))}) é inferior à cotação bruta inicial, reavalie o valor solicitado no adiantamento para evitar sobra excessiva de recursos.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* 3. Se Serviços: Previdência (INSS) e ISSQN */}
      {ehServico && (
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-blue-900" />
            <span>3. Previdência (INSS), ISSQN e LC 116/2003</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Item da LC 116/2003
              </label>
              <input
                type="text"
                value={formData.itemLc}
                onChange={(e) => onChange({ itemLc: e.target.value })}
                placeholder="Ex: 14.01"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-mono-tabular"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Descrição do Enquadramento na LC 116
              </label>
              <input
                type="text"
                value={formData.lcDescricao}
                onChange={(e) => onChange({ lcDescricao: e.target.value })}
                placeholder="Ex: Conserto, manutenção e conservação de máquinas e equipamentos"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opções de Previdência */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-900 block">
                Previdência Social (INSS)
              </span>

              {ehMei ? (
                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.servicoSujeitoCppMei}
                      onChange={(e) => onChange({ servicoSujeitoCppMei: e.target.checked })}
                      className="mt-0.5 rounded text-blue-900 focus:ring-blue-900"
                    />
                    <span>
                      Serviço sujeito a CPP patronal de 20% (art. 18-B da LC 123/2006).
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        O órgão contratante arca com 20% via DARF com recursos próprios, sem desconto da nota do MEI.
                      </span>
                    </span>
                  </label>
                  {formData.servicoSujeitoCppMei && (
                    <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
                      <div className="font-semibold">
                        ⚠️ Atenção: Revisão do Valor Solicitado no Adiantamento
                      </div>
                      <div>
                        Valor da guia DARF de CPP (20%): <b>{formatarMoeda(formData.valorTotal * 0.2)}</b>
                      </div>
                      <div>
                        Custo total da contratação: <b>{formatarMoeda(formData.valorTotal * 1.2)}</b> (Nota + DARF).
                      </div>
                      <div className="text-amber-800 text-[10.5px]">
                        Se o adiantamento foi solicitado apenas pelo valor da nota, <b>o saldo será insuficiente</b> para pagar a guia da Previdência.
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.retemInss}
                    onChange={(e) => onChange({ retemInss: e.target.checked })}
                    className="mt-0.5 rounded text-blue-900 focus:ring-blue-900"
                  />
                  <span>
                    Reter INSS de 11% sobre o valor bruto (IN RFB nº 2.110/2022).
                    {formData.retemInss && (
                      <span className="block text-[11px] font-mono-tabular text-amber-700 mt-0.5 font-medium">
                        Valor a reter: {formatarMoeda(formData.valorTotal * 0.11)}
                      </span>
                    )}
                  </span>
                </label>
              )}
            </div>

            {/* Opções de ISSQN */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  ISSQN Municipal
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.retemIss}
                    onChange={(e) => onChange({ retemIss: e.target.checked })}
                    className="rounded text-blue-900 focus:ring-blue-900"
                  />
                  <span>Reter ISSQN na fonte</span>
                </label>
              </div>

              {formData.retemIss ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Município de Competência
                    </label>
                    <input
                      type="text"
                      value={formData.municipioIss}
                      onChange={(e) => onChange({ municipioIss: e.target.value })}
                      placeholder="Ex: Cuiabá / Vila Rica"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Valor do ISSQN a reter (R$)
                    </label>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={formData.valorIss || ''}
                      onChange={(e) =>
                        onChange({ valorIss: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500">
                  Sem retenção na fonte. O recolhimento compete integralmente ao prestador em seu município sede.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {ehServico && <hr className="border-slate-100" />}

      {/* 4. Cadastro Fiscal e CNAE */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <FileCheck2 className="w-4 h-4 text-blue-900" />
          <span>4. Situação Cadastral e CNAE (Receita Federal)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <label
            className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
              formData.statusCadastro === 'regular'
                ? 'border-emerald-700 bg-emerald-50/20'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="statusCadastro"
              checked={formData.statusCadastro === 'regular'}
              onChange={() => onChange({ statusCadastro: 'regular' })}
              className="mt-0.5 text-emerald-700 focus:ring-emerald-700"
            />
            <div className="ml-2.5">
              <div className="text-xs font-semibold text-slate-900">
                Cadastro Regular (Já possui CNAE)
              </div>
              <div className="text-[11px] text-slate-500">
                Fornecedor habilitado no cartão CNPJ para faturar
              </div>
            </div>
          </label>

          <label
            className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
              formData.statusCadastro === 'atualizacao'
                ? 'border-amber-600 bg-amber-50/30'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="statusCadastro"
              checked={formData.statusCadastro === 'atualizacao'}
              onChange={() => onChange({ statusCadastro: 'atualizacao' })}
              className="mt-0.5 text-amber-600 focus:ring-amber-600"
            />
            <div className="ml-2.5">
              <div className="text-xs font-semibold text-slate-900">
                Necessita de Atualização Cadastral Prévia
              </div>
              <div className="text-[11px] text-slate-500">
                Exigir inclusão obrigatória do CNAE antes da emissão
              </div>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                Código CNAE
              </label>
              <a
                href="https://concla.ibge.gov.br/busca-online-cnae.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-blue-900 hover:text-blue-700 flex items-center gap-1 hover:underline"
                title="Abrir Busca Online CNAE no CONCLA / IBGE"
              >
                <span>Consultar no IBGE</span>
                <ExternalLink className="w-3 h-3 text-blue-800" />
              </a>
            </div>
            <input
              type="text"
              value={formData.cnaeCodigo}
              onChange={(e) => onChange({ cnaeCodigo: e.target.value })}
              placeholder="Ex: 9521-5/00"
              className="w-full px-3 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Descrição da Atividade do CNAE
            </label>
            <input
              type="text"
              value={formData.cnaeDescricao}
              onChange={(e) => onChange({ cnaeDescricao: e.target.value })}
              placeholder="Ex: Reparação e manutenção de equipamentos..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
            />
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 4. Fundamentação Legal Complementar (Opcional) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-900" />
            <span>4. Legislação & Base Normativa Complementar</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">Opcional</span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          O sistema já inclui automaticamente as normas federais e estaduais cabíveis (IN RFB 1.234/2012, IN 2.145/2023, LC 123/2006, RICMS-MT, etc.). Se desejar citar decretos, portarias internas, convênios ou leis locais específicas neste parecer, adicione abaixo (uma por linha):
        </p>

        <textarea
          rows={3}
          value={formData.legislacaoPersonalizada || ''}
          onChange={(e) => onChange({ legislacaoPersonalizada: e.target.value })}
          placeholder="Exemplo:&#10;• Decreto Estadual nº 1.234/2024 (Regulamento de Suprimento de Fundos da Autarquia)&#10;• Portaria Interna DETRAN-MT nº 89/2025"
          className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 leading-relaxed bg-white"
        />

        {/* Sugestões rápidas de inserção com um clique */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-slate-400" />
            <span>Inserir modelo rápido:</span>
          </span>
          <button
            type="button"
            onClick={() => {
              const textoAtual = formData.legislacaoPersonalizada ? formData.legislacaoPersonalizada.trim() + '\n' : '';
              onChange({
                legislacaoPersonalizada: textoAtual + '• Decreto Estadual nº 1.547/2008 (Regulamento de Suprimento de Fundos e Adiantamentos do Estado de Mato Grosso).',
              });
            }}
            className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-900 rounded border border-slate-200 transition-colors"
          >
            + Regulamento de Adiantamento MT
          </button>
          <button
            type="button"
            onClick={() => {
              const textoAtual = formData.legislacaoPersonalizada ? formData.legislacaoPersonalizada.trim() + '\n' : '';
              onChange({
                legislacaoPersonalizada: textoAtual + '• Lei Federal nº 14.133/2021, art. 75, inciso II (Dispensa de Licitação em razão do valor).',
              });
            }}
            className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-900 rounded border border-slate-200 transition-colors"
          >
            + Lei 14.133/2021 (Dispensa)
          </button>
          <button
            type="button"
            onClick={() => {
              const textoAtual = formData.legislacaoPersonalizada ? formData.legislacaoPersonalizada.trim() + '\n' : '';
              onChange({
                legislacaoPersonalizada: textoAtual + '• Lei Complementar Estadual nº 631/2019 (Reinstituição de Benefícios Fiscais de ICMS no Estado de Mato Grosso).',
              });
            }}
            className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-900 rounded border border-slate-200 transition-colors"
          >
            + LC Estadual nº 631/2019
          </button>
        </div>
      </div>
    </div>
  );
};
