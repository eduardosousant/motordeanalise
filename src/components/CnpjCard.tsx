import React, { useState } from 'react';
import { Search, Building2, CheckCircle2, AlertTriangle, RefreshCw, Server, MapPin, Tag } from 'lucide-react';
import { CnpjApiResult, AppTheme } from '../types.js';

interface CnpjCardProps {
  onSupplierLoaded: (data: CnpjApiResult) => void;
  currentSupplier: CnpjApiResult | null;
  currentTheme?: AppTheme;
}

export const CnpjCard: React.FC<CnpjCardProps> = ({ onSupplierLoaded, currentSupplier, currentTheme = 'GOV_CLASSIC' }) => {
  const [cnpjInput, setCnpjInput] = useState('60.701.190/0001-04');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getThemeStyles = () => {
    switch (currentTheme) {
      case 'GOV_CLASSIC':
        return {
          iconBox: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
          btnSearch: 'bg-emerald-700 hover:bg-emerald-800 text-amber-100 border border-emerald-600',
          focusRing: 'focus:ring-emerald-600/20 focus:border-emerald-600',
          badgeApi: 'text-emerald-800 bg-emerald-50 border-emerald-200',
          tagNormal: 'bg-emerald-100 text-emerald-950 border border-emerald-300'
        };
      case 'FINTECH_PRO':
        return {
          iconBox: 'bg-indigo-50 border border-indigo-200 text-indigo-700',
          btnSearch: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20',
          focusRing: 'focus:ring-indigo-600/20 focus:border-indigo-600',
          badgeApi: 'text-indigo-800 bg-indigo-50 border-indigo-200',
          tagNormal: 'bg-indigo-100 text-indigo-950 border border-indigo-300'
        };
      case 'DARK_AUDITOR':
        return {
          iconBox: 'bg-cyan-950 border border-cyan-800 text-cyan-400',
          btnSearch: 'bg-cyan-600 hover:bg-cyan-500 text-black font-bold border border-cyan-400',
          focusRing: 'focus:ring-cyan-500/20 focus:border-cyan-500',
          badgeApi: 'text-cyan-300 bg-slate-900 border-cyan-800',
          tagNormal: 'bg-cyan-950 text-cyan-200 border border-cyan-700'
        };
      case 'INSTITUCIONAL':
      default:
        return {
          iconBox: 'bg-teal-50 border border-teal-200 text-teal-700',
          btnSearch: 'bg-teal-700 hover:bg-teal-800 text-white',
          focusRing: 'focus:ring-teal-600/20 focus:border-teal-600',
          badgeApi: 'text-teal-800 bg-white border-slate-200',
          tagNormal: 'bg-teal-100 text-teal-900 border border-teal-300'
        };
    }
  };

  const themeStyle = getThemeStyles();

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpjInput(formatCnpj(e.target.value));
    setError(null);
  };

  const handleSearch = async (cnpjToQuery?: string) => {
    const targetCnpj = cnpjToQuery || cnpjInput;
    const cleanDigits = targetCnpj.replace(/\D/g, '');

    if (cleanDigits.length !== 14) {
      setError('Por favor, informe um CNPJ válido com 14 dígitos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/cnpj/${cleanDigits}`);
      const contentType = res.headers.get('content-type') || '';

      if (!res.ok) {
        let errorMsg = 'Falha ao consultar CNPJ';
        if (contentType.includes('application/json')) {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        }
        throw new Error(errorMsg);
      }

      if (!contentType.includes('application/json')) {
        throw new Error('Serviço de CNPJ indisponível no momento.');
      }

      const data: CnpjApiResult = await res.json();
      onSupplierLoaded(data);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com API do CNPJ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 transition-all space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded ${themeStyle.iconBox}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">1. Dados Cadastrais do Fornecedor</h2>
            <p className="text-xs text-slate-500">
              Consulta em tempo real via dados abertos da Receita Federal (Fallback automático)
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3.5">
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600 mb-1.5">
            CNPJ do Fornecedor / Remetente
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={cnpjInput}
                onChange={handleInputChange}
                placeholder="00.000.000/0000-00"
                className={`w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 transition ${themeStyle.focusRing}`}
              />
            </div>
            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={loading}
              className={`px-4 py-2.5 font-bold text-xs rounded flex items-center gap-2 transition shadow-sm disabled:opacity-50 cursor-pointer flex-shrink-0 ${themeStyle.btnSearch}`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Consultando...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Consultar CNPJ</span>
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-2 text-xs text-rose-800 flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-2.5 rounded">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {currentSupplier && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-4 text-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block font-semibold">Razão Social</span>
                <span className="font-bold text-slate-900 text-sm">{currentSupplier.razao_social}</span>
                {currentSupplier.nome_fantasia && (
                  <span className="text-slate-600 block text-xs">({currentSupplier.nome_fantasia})</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 text-teal-800 px-2.5 py-1 rounded text-[11px] font-mono shadow-2xs">
                <Server className="w-3 h-3 text-teal-600" />
                <span>API: {currentSupplier.fonte_api}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block font-semibold">Porte Fiscal</span>
                <span className="font-semibold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded inline-block mt-0.5 shadow-2xs">
                  {currentSupplier.porte}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block font-semibold">Simples Nacional</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1 mt-0.5 ${
                    currentSupplier.optante_simples
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-teal-100 text-teal-900 border border-teal-300'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {currentSupplier.optante_simples ? 'Sim (Optante LC 123/06)' : 'Não (Regime Normal / DEMAIS)'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block font-semibold">Origem</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  {currentSupplier.uf} - {currentSupplier.municipio || 'São Paulo'}
                </span>
              </div>
            </div>

            {currentSupplier.cnae_principal_descricao && (
              <div className="pt-2 text-slate-600 border-t border-slate-200 flex items-start gap-1.5 font-sans">
                <Tag className="w-3.5 h-3.5 text-teal-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-slate-800">CNAE Principal:</strong> {currentSupplier.cnae_principal_codigo} - {currentSupplier.cnae_principal_descricao}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
