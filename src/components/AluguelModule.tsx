import React, { useState, useEffect } from 'react';
import { Home, ShieldCheck, AlertCircle, Info, Scale, CheckCircle2 } from 'lucide-react';
import {
    identificarDocumento,
    calcularAluguelPF2026,
    calcularAluguelPJ,
    ResultadoCalculoAluguel
} from '../lib/aluguelCalculations.js';

export const AluguelModule: React.FC = () => {
    const [documentoInput, setDocumentoInput] = useState('01700969986');
    const [valorBruto, setValorBruto] = useState<number>(9550.00);
    const [inssRetido, setInssRetido] = useState<number>(0.00);
    const [dependentes, setDependentes] = useState<number>(0);
    const [usarSimplificado, setUsarSimplificado] = useState<boolean>(true);
    const [dispensarMinimo, setDispensarMinimo] = useState<boolean>(true);
    const [forcarSimples, setForcarSimples] = useState<boolean>(false);
    const [loadingCnpj, setLoadingCnpj] = useState<boolean>(false);
    const [razaoSocial, setRazaoSocial] = useState<string>('');

    const docIdentificado = identificarDocumento(documentoInput);

    // Consulta CNPJ automática com fallback
    useEffect(() => {
        if (docIdentificado.tipo === 'CNPJ') {
            setLoadingCnpj(true);
            fetch(`/api/cnpj/${docIdentificado.limpo}`)
                .then(res => res.json())
                .then(data => {
                    if (data && !data.error) {
                        setRazaoSocial(data.razao_social || data.nome_fantasia || '');
                        setForcarSimples(Boolean(data.optante_simples));
                    }
                })
                .catch(() => {})
                .finally(() => setLoadingCnpj(false));
        } else {
            setRazaoSocial('');
        }
    }, [docIdentificado.limpo, docIdentificado.tipo]);

    let resultado: ResultadoCalculoAluguel | null = null;
    if (docIdentificado.tipo === 'CPF') {
        resultado = calcularAluguelPF2026(valorBruto, inssRetido, dependentes, usarSimplificado, dispensarMinimo);
    } else if (docIdentificado.tipo === 'CNPJ') {
        resultado = calcularAluguelPJ(valorBruto, forcarSimples, dispensarMinimo);
    }

    const formatMoney = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-6">
            {/* Banner Superior do Módulo */}
            <div className="bg-[#0e3b20] border-b border-emerald-800 text-amber-50 p-5 rounded-xl shadow-md flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded bg-emerald-800/80 text-amber-300 border border-amber-400/40 shadow-xs">
                        <Home className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded bg-emerald-900 border border-amber-400/40 text-amber-200">
                Módulo de Locação Predial
              </span>
                            <span className="text-xs text-amber-200/80 font-mono">
                Art. 157, I da CF/88 • IN RFB nº 1.234/2012 • Lei nº 15.270/2025
              </span>
                        </div>
                        <h2 className="text-lg font-serif italic text-white mt-1">
                            Apuração de IRRF sobre Aluguéis (Imóveis Funcionais e Administrativos)
                        </h2>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* COLUNA ESQUERDA: ENTRADA DE DADOS */}
                <div className="lg:col-span-6 space-y-6">
                    {/* 1. Identificação */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            1. Identificação do Locador (Fornecedor)
                        </h3>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                CPF ou CNPJ do Locador:
                            </label>
                            <input
                                type="text"
                                value={documentoInput}
                                onChange={e => setDocumentoInput(e.target.value)}
                                placeholder="Digite os dígitos do CPF ou CNPJ"
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                            />
                        </div>

                        {docIdentificado.tipo === 'CPF' && (
                            <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900 font-mono">
                                <strong>Pessoa Física detectada:</strong> {docIdentificado.limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                            </div>
                        )}

                        {docIdentificado.tipo === 'CNPJ' && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950 space-y-2">
                                <p className="font-mono">
                                    <strong>Pessoa Jurídica detectada:</strong> {docIdentificado.limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                                    {loadingCnpj && <span className="ml-2 text-slate-500 animate-pulse">(Consultando RFB...)</span>}
                                </p>
                                {razaoSocial && (
                                    <p className="font-semibold text-slate-800">
                                        Razão Social: <span className="font-normal">{razaoSocial}</span>
                                    </p>
                                )}
                                <label className="flex items-center gap-2 mt-2 pt-2 border-t border-emerald-200 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={forcarSimples}
                                        onChange={e => setForcarSimples(e.target.checked)}
                                        className="rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span>Optante pelo Simples Nacional (Dispensado de Retenção - Art. 4º, XI da IN 1.234/12)</span>
                                </label>
                            </div>
                        )}

                        {docIdentificado.tipo === 'INVALIDO' && documentoInput && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                                Dígitos inválidos ou incompletos para CPF / CNPJ.
                            </div>
                        )}
                    </div>

                    {/* 2. Dados da Contratação */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <Scale className="w-4 h-4 text-emerald-700" />
                            2. Dados do Contrato / Pagamento Mensal
                        </h3>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Valor Bruto do Aluguel (R$):
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={valorBruto}
                                onChange={e => setValorBruto(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                            />
                        </div>

                        {docIdentificado.tipo === 'CPF' && (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Deduções Legais de Pessoa Física (Tabela Progressiva / Vigência 2026)
                </span>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] text-slate-600 mb-1">Previdência Oficial / INSS (R$):</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={inssRetido}
                                            onChange={e => setInssRetido(parseFloat(e.target.value) || 0)}
                                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-slate-600 mb-1">Nº de Dependentes:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="20"
                                            value={dependentes}
                                            onChange={e => setDependentes(parseInt(e.target.value, 10) || 0)}
                                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono"
                                        />
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={usarSimplificado}
                                        onChange={e => setUsarSimplificado(e.target.checked)}
                                        className="rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span>Aplicar Desconto Simplificado de 2026 (R$ 607,20 - se mais benéfico)</span>
                                </label>
                            </div>
                        )}

                        {docIdentificado.tipo === 'CNPJ' && (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
                                <strong>Enquadramento IN RFB nº 1.234/2012:</strong>
                                <p>Código 6190 — Locação de Bens Imóveis (Alíquota nominal de 4,80% de IRRF retido no pagamento).</p>
                            </div>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 pt-1">
                            <input
                                type="checkbox"
                                checked={dispensarMinimo}
                                onChange={e => setDispensarMinimo(e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Dispensar retenção se o valor de IR for ≤ R$ 10,00</span>
                        </label>
                    </div>
                </div>

                {/* COLUNA DIREITA: RESULTADO DA APURAÇÃO */}
                <div className="lg:col-span-6 space-y-6">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                            <span>3. Resultado da Apuração Financeira</span>
                            <span className="text-[11px] font-mono font-normal text-slate-500">Mês de Competência</span>
                        </h3>

                        {resultado ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                                        <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">Valor Bruto do Aluguel</span>
                                        <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                      {formatMoney(resultado.valorBruto)}
                    </span>
                                    </div>
                                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                                        <span className="text-[10px] font-mono uppercase text-emerald-800 font-semibold block">Líquido a Pagar ao Locador</span>
                                        <span className="text-lg font-bold font-mono text-emerald-900 mt-1 block">
                      {formatMoney(resultado.valorLiquido)}
                    </span>
                                    </div>
                                </div>

                                <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-lg">
                                    <span className="text-[10px] font-mono uppercase text-sky-800 font-semibold block">Total de IR Retido na Fonte</span>
                                    <span className="text-xl font-extrabold font-mono text-sky-950 mt-1 block">
                    {formatMoney(resultado.irrfRetido)}
                  </span>
                                </div>

                                {/* TABELA DE MEMÓRIA DE CÁLCULO */}
                                <div className="border-t border-slate-200 pt-4">
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                                        {resultado.tipoPessoa === 'PF' ? 'Memória de Cálculo — Pessoa Física (2026)' : 'Resumo do Enquadramento — Pessoa Jurídica'}
                                    </h4>

                                    {resultado.tipoPessoa === 'PF' ? (
                                        <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                                <tr>
                                                    <th className="py-2 px-3">Parâmetro</th>
                                                    <th className="py-2 px-3 text-right">Valor / Detalhamento</th>
                                                </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                <tr>
                                                    <td className="py-2 px-3 text-slate-600">Regra de Cálculo</td>
                                                    <td className="py-2 px-3 text-right font-medium">Tabela Progressiva Mensal 2026 (Lei nº 15.270/2025)</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 px-3 text-slate-600">Dedução Escolhida</td>
                                                    <td className="py-2 px-3 text-right font-medium">{resultado.deducaoUtilizada}</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 px-3 text-slate-600">Base de Cálculo Efetiva</td>
                                                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{formatMoney(resultado.baseCalculo)}</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 px-3 text-slate-600">Alíquota da Faixa</td>
                                                    <td className="py-2 px-3 text-right font-mono">{resultado.aliquotaNominal}%</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 px-3 text-slate-600">Parcela a Deduzir</td>
                                                    <td className="py-2 px-3 text-right font-mono">{formatMoney(resultado.parcelaDeduzir)}</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 px-3 text-slate-600">Imposto Antes da Redução</td>
                                                    <td className="py-2 px-3 text-right font-mono">{formatMoney(resultado.impostoAntesReducao)}</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 px-3 text-slate-600">Redução do Imposto (Lei 15.270/25)</td>
                                                    <td className="py-2 px-3 text-right font-mono text-emerald-700 font-semibold">{resultado.detalheReducao}</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 px-3 text-slate-600">Alíquota Efetiva de IR</td>
                                                    <td className="py-2 px-3 text-right font-mono font-bold">{resultado.aliquotaEfetiva.toFixed(2)}%</td>
                                                </tr>
                                                <tr className="bg-slate-50">
                                                    <td className="py-2 px-3 font-semibold text-slate-800">Destino do Recolhimento</td>
                                                    <td className="py-2 px-3 text-right font-semibold text-emerald-900">Receita Própria do Estado (Art. 157, I da CF/88)</td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                                <tr>
                                                    <th className="py-2 px-3">Parâmetro</th>
                                                    <th className="py-2 px-3 text-right">Valor / Detalhamento</th>
                                                </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                <tr>
                                                    <td className="py-2 px-3 text-slate-600">Enquadramento</td>
                                                    <td className="py-2 px-3 text-right font-medium">
                                                        {resultado.dispensadoSimples ? 'Optante Simples Nacional (Dispensado)' : 'Regime Geral / Lucro Presumido ou Real'}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 px-3 text-slate-600">Alíquota Aplicável</td>
                                                    <td className="py-2 px-3 text-right font-mono">{resultado.aliquotaIr}%</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 px-3 text-slate-600">Código de Receita (IN RFB 1.234/12)</td>
                                                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{resultado.codReceita}</td>
                                                </tr>
                                                <tr className="bg-slate-50">
                                                    <td className="py-2 px-3 font-semibold text-slate-800">Destino do Recolhimento</td>
                                                    <td className="py-2 px-3 text-right font-semibold text-emerald-900">Receita Própria do Estado (DAR-1 / DRE)</td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs text-center">
                                Preencha os dados do locador e o valor da locação para calcular.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};