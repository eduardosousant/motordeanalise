import React from 'react';
import { Play, Loader2, ArrowRight, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { OrcamentoInput, ServicoInput } from '../types/fiscal';

interface AcaoAnaliseProps {
  servico: ServicoInput;
  orcamentos: OrcamentoInput[];
  carregando: boolean;
  onAnalisar: () => void;
}

export const AcaoAnalise: React.FC<AcaoAnaliseProps> = ({
  servico,
  orcamentos,
  carregando,
  onAnalisar,
}) => {
  const camposValidos =
    servico.descricao.trim().length > 3 &&
    servico.cnae.trim().length >= 4 &&
    orcamentos.length > 0 &&
    orcamentos.every(o => o.valor > 0 && o.cnpj.trim().length >= 8);

  const orcamentosComValor = orcamentos.filter(o => o.valor > 0).length;

  return (
    <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 w-full md:w-auto">
        <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            Análise de Conformidade Fiscal & Custo Efetivo
          </h3>
          <p className="text-xs text-slate-300">
            Envia os dados para a API <code className="font-mono text-blue-300 bg-slate-800 px-1.5 py-0.5 rounded">/api/analisar</code> para auditoria das regras do Art. 18-B e cruzamento de CNAEs.
          </p>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle className={`w-3 h-3 ${servico.descricao && servico.cnae ? 'text-emerald-400' : 'text-slate-500'}`} />
              Serviço & CNAE
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle className={`w-3 h-3 ${orcamentosComValor >= 1 ? 'text-emerald-400' : 'text-slate-500'}`} />
              {orcamentosComValor} de {orcamentos.length} cotações com valor
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        {!camposValidos && (
          <span className="text-xs text-amber-400 flex items-center gap-1 hidden sm:flex">
            <AlertCircle className="w-3.5 h-3.5" /> Preencha serviço, CNAE e valores
          </span>
        )}

        <button
          type="button"
          id="btn-analisar-api"
          onClick={onAnalisar}
          disabled={!camposValidos || carregando}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {carregando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              Processando Análise Fiscal...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              Executar Análise de Conformidade
              <ArrowRight className="w-4 h-4 text-blue-200" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
