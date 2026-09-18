import React, { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle2, Search, Info } from 'lucide-react';
import { ServicoInput } from '../types/fiscal';
import { CNAES_SERVICOS } from '../data/cnaes';
import { formatarCNAE } from '../utils/formatters';

interface ServicoFormProps {
  servico: ServicoInput;
  onChange: (campo: keyof ServicoInput, valor: string) => void;
}

export const ServicoForm: React.FC<ServicoFormProps> = ({ servico, onChange }) => {
  const [buscaCnae, setBuscaCnae] = useState('');
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  // Verifica se o CNAE atual cai na regra do Art. 18-B
  const cnaeSelecionadoObj = CNAES_SERVICOS.find(c => c.codigo === servico.cnae);
  const incideArtigo18B = cnaeSelecionadoObj?.sujeitoArt18B ?? (
    ['4321', '4322', '4330', '4399', '4520', '3314', '3313'].some(pref => servico.cnae.replace(/\D/g, '').startsWith(pref))
  );

  const cnaesFiltrados = CNAES_SERVICOS.filter(
    c =>
      c.codigo.toLowerCase().includes(buscaCnae.toLowerCase()) ||
      c.descricao.toLowerCase().includes(buscaCnae.toLowerCase())
  );

  const handleCnaeSelect = (codigo: string) => {
    onChange('cnae', codigo);
    setMostrarSugestoes(false);
    setBuscaCnae('');
  };

  const handleCnaeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = formatarCNAE(e.target.value);
    onChange('cnae', formatado);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Dados do Serviço e Objeto do Adiantamento
            </h2>
            <p className="text-xs text-slate-500">
              Informe a descrição do serviço a ser contratado e o CNAE fiscal de enquadramento
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Descrição do Serviço */}
        <div className="md:col-span-7 space-y-2">
          <label htmlFor="descricao-servico" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Descrição do Serviço <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <textarea
              id="descricao-servico"
              rows={3}
              value={servico.descricao}
              onChange={e => onChange('descricao', e.target.value)}
              placeholder="Ex: Contratação de serviço emergencial para reparo e manutenção no quadro de distribuição de energia da filial..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder:text-slate-400 resize-none transition-all"
            />
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Detalhe a natureza da atividade (ex: elétrica, pintura, manutenção, TI) para cruzamento das regras fiscais.
          </p>
        </div>

        {/* CNAE e Enquadramento */}
        <div className="md:col-span-5 space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="cnae-servico" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              CNAE do Serviço <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setMostrarSugestoes(!mostrarSugestoes)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <Search className="w-3 h-3" />
              {mostrarSugestoes ? 'Ocultar catálogo' : 'Pesquisar CNAEs'}
            </button>
          </div>

          <div className="relative">
            <input
              id="cnae-servico"
              type="text"
              value={servico.cnae}
              onChange={handleCnaeInputChange}
              maxLength={10}
              placeholder="Ex: 4321-5/00"
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder:text-slate-400 transition-all"
            />
          </div>

          {/* Destaque se o CNAE estiver no Artigo 18-B */}
          {incideArtigo18B ? (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Atenção ao Art. 18-B (LC 123/2006):</span> Esta atividade (eletricidade/hidráulica/manutenção/pintura) exige retenção/recolhimento patronal de <strong>20% de CPP</strong> caso contratado de prestador MEI!
              </div>
            </div>
          ) : servico.cnae ? (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Atividade Geral de Serviços:</span> Fora do rol obrigatório de 20% de CPP para MEI pelo Art. 18-B.
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Catálogo de CNAEs sugeridos (Dropdown / Lista rápida) */}
      {mostrarSugestoes && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Catálogo de CNAEs Comuns para Serviços e Adiantamentos:
            </span>
            <input
              type="text"
              value={buscaCnae}
              onChange={e => setBuscaCnae(e.target.value)}
              placeholder="Filtrar por código ou descrição..."
              className="px-2.5 py-1 text-xs bg-slate-100 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-56"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
            {cnaesFiltrados.map(item => (
              <button
                key={item.codigo}
                type="button"
                onClick={() => handleCnaeSelect(item.codigo)}
                className={`text-left p-2.5 rounded-lg border text-xs transition-all flex flex-col justify-between ${
                  servico.cnae === item.codigo
                    ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-slate-900">{item.codigo}</span>
                    {item.sujeitoArt18B && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded">
                        Art. 18-B (20% CPP)
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 line-clamp-2 leading-relaxed">{item.descricao}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">{item.categoria}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Identificação complementar do processo (opcional mas essencial em rotinas corporativas de adiantamento) */}
      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="proc-adiantamento" className="block text-[11px] font-medium text-slate-500 mb-1">
            Nº Processo / Adiantamento
          </label>
          <input
            id="proc-adiantamento"
            type="text"
            value={servico.numeroAdiantamento || ''}
            onChange={e => onChange('numeroAdiantamento', e.target.value)}
            placeholder="Ex: ADV-2026/084"
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="proc-solicitante" className="block text-[11px] font-medium text-slate-500 mb-1">
            Solicitante do Adiantamento
          </label>
          <input
            id="proc-solicitante"
            type="text"
            value={servico.solicitante || ''}
            onChange={e => onChange('solicitante', e.target.value)}
            placeholder="Ex: Carlos Mendes (Facilities)"
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="proc-departamento" className="block text-[11px] font-medium text-slate-500 mb-1">
            Departamento / Centro de Custo
          </label>
          <input
            id="proc-departamento"
            type="text"
            value={servico.departamento || ''}
            onChange={e => onChange('departamento', e.target.value)}
            placeholder="Ex: Infraestrutura / 102.30"
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
