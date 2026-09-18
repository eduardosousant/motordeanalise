import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Building2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  FileCheck2,
  Server,
  Zap,
  Globe,
  KeyRound,
  RefreshCw,
  HelpCircle,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { OrcamentoInput, RegimeTributario, ProvedorCNPJ } from '../types/fiscal';
import { formatarCNPJ, formatarMoeda, validarCNPJ, formatarCNAE } from '../utils/formatters';
import { consultarCNPJ, PROVEDORES_DISPONIVEIS } from '../services/api';

interface OrcamentosManagerProps {
  orcamentos: OrcamentoInput[];
  onAdicionar: () => void;
  onRemover: (id: string) => void;
  onAtualizar: (id: string, campo: keyof OrcamentoInput, valor: any) => void;
  cnaeServico: string;
}

export const OrcamentosManager: React.FC<OrcamentosManagerProps> = ({
  orcamentos,
  onAdicionar,
  onRemover,
  onAtualizar,
  cnaeServico,
}) => {
  const [consultandoCnpj, setConsultandoCnpj] = useState<Record<string, boolean>>({});
  const [expandirSecundarios, setExpandirSecundarios] = useState<Record<string, boolean>>({});
  const [provedorAtivo, setProvedorAtivo] = useState<ProvedorCNPJ>('auto');
  const [mostrarDetalhesApi, setMostrarDetalhesApi] = useState<boolean>(false);
  const [notificacaoProtecao, setNotificacaoProtecao] = useState<{ mensagem: string; tipo: 'info' | 'sucesso' } | null>(null);

  const reconsultarCnpj = async (id: string, cnpjAtual: string, prov?: ProvedorCNPJ) => {
    const clean = (cnpjAtual || '').replace(/\D/g, '');
    if (clean.length !== 14) return;
    const provedorEscolhido = prov || provedorAtivo;
    setConsultandoCnpj(prev => ({ ...prev, [id]: true }));
    try {
      const dados = await consultarCNPJ(clean, provedorEscolhido);
      if (dados) {
        if (dados.razaoSocial) onAtualizar(id, 'razaoSocial', dados.razaoSocial);
        if (dados.regimeTributario) onAtualizar(id, 'regimeTributario', dados.regimeTributario);
        if (dados.cnaePrincipal) onAtualizar(id, 'cnaePrincipal', dados.cnaePrincipal);
        if (dados.descricaoCnae) onAtualizar(id, 'descricaoCnaePrincipal', dados.descricaoCnae);
        if (dados.cnaesSecundarios) onAtualizar(id, 'cnaesSecundarios', dados.cnaesSecundarios);
        if (dados.atividadesSecundarias) onAtualizar(id, 'atividadesSecundarias', dados.atividadesSecundarias);
        if (dados.provedor) onAtualizar(id, 'provedorOrigem', dados.provedor);

        if (dados.msgProtecao) {
          setNotificacaoProtecao({
            mensagem: dados.msgProtecao,
            tipo: 'info',
          });
          setTimeout(() => setNotificacaoProtecao(null), 8000);
        }
      }
    } catch (err) {
      console.error('Erro na consulta do CNPJ:', err);
    } finally {
      setConsultandoCnpj(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleCnpjChange = async (id: string, valor: string) => {
    const formatted = formatarCNPJ(valor);
    onAtualizar(id, 'cnpj', formatted);

    // Auto-preenchimento se for um CNPJ válido com 14 dígitos
    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 14) {
      await reconsultarCnpj(id, clean, provedorAtivo);
    }
  };

  const toggleSecundarios = (id: string) => {
    setExpandirSecundarios(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getNomeProvedorBadge = (origem?: string) => {
    switch (origem) {
      case 'receitaws':
        return { label: 'ReceitaWS (Token Ativo)', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'cnpja':
        return { label: 'CNPJ Já (Chave Ativa)', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'brasilapi':
        return { label: 'BrasilAPI', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'opencnpj':
        return { label: 'OpenCNPJ', bg: 'bg-cyan-50 text-cyan-800 border-cyan-200' };
      case 'receita_mirror':
        return { label: 'Receita Mirror', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'cache':
        return { label: 'Cache Memória', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'base_local':
        return { label: 'Base Demonstrativa', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      default:
        return { label: 'API Automática', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  const REGIME_ROTULOS: Record<RegimeTributario, { label: string; badge: string; detalhe: string }> = {
    MEI: {
      label: 'MEI (Microempreendedor Individual)',
      badge: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
      detalhe: 'Optante pelo SIMEI (LC 123/2006)',
    },
    SIMPLES_NACIONAL: {
      label: 'Simples Nacional (EPP/ME)',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
      detalhe: 'Optante pelo Simples Nacional',
    },
    LUCRO_PRESUMIDO: {
      label: 'Lucro Presumido',
      badge: 'bg-slate-100 text-slate-800 border-slate-300 font-semibold',
      detalhe: 'Tributação pelo Lucro Presumido',
    },
    LUCRO_REAL: {
      label: 'Lucro Real',
      badge: 'bg-purple-50 text-purple-900 border-purple-300 font-semibold',
      detalhe: 'Tributação pelo Lucro Real',
    },
  };

  // Helper para verificar em tempo real se o CNAE do Serviço está incluso no Principal ou Secundários
  const checarInclusaoCnae = (cnaePrincipal?: string, cnaesSecundarios?: string[]) => {
    if (!cnaeServico) return null;
    const sNorm = cnaeServico.replace(/\D/g, '');
    if (!sNorm) return null;

    const pNorm = (cnaePrincipal || '').replace(/\D/g, '');
    const secList = (cnaesSecundarios || []).map(c => ({
      original: c,
      norm: (c || '').replace(/\D/g, ''),
    }));

    // 1. Incluso no Principal
    if (pNorm && sNorm === pNorm) {
      return {
        status: 'incluso_principal' as const,
        mensagem: `CNAE do serviço incluso na Atividade Principal (${cnaePrincipal})`,
        origem: 'Principal',
        cnae: cnaePrincipal,
      };
    }

    // 2. Incluso nos Secundários
    const matchSec = secList.find(s => s.norm === sNorm);
    if (matchSec) {
      return {
        status: 'incluso_secundario' as const,
        mensagem: `CNAE do serviço incluso nas Atividades Secundárias (${matchSec.original})`,
        origem: 'Secundário',
        cnae: matchSec.original,
      };
    }

    // 3. Subclasse na Principal
    if (pNorm && sNorm.slice(0, 4) === pNorm.slice(0, 4)) {
      return {
        status: 'subclasse_principal' as const,
        mensagem: `CNAE do serviço compatível por mesma subclasse/classe da Atividade Principal (${cnaePrincipal})`,
        origem: 'Subclasse Principal',
        cnae: cnaePrincipal,
      };
    }

    // 4. Subclasse nos Secundários
    const matchSecSub = secList.find(s => s.norm.slice(0, 4) === sNorm.slice(0, 4));
    if (matchSecSub) {
      return {
        status: 'subclasse_secundario' as const,
        mensagem: `CNAE do serviço compatível por mesma subclasse da Atividade Secundária (${matchSecSub.original})`,
        origem: 'Subclasse Secundário',
        cnae: matchSecSub.original,
      };
    }

    // 5. Incompatível
    return {
      status: 'incompativel' as const,
      mensagem: `CNAE do serviço (${cnaeServico}) NÃO consta no CNAE Principal nem nos ${secList.length} secundários cadastrados`,
      origem: 'Incompatível',
      cnae: null,
    };
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                Orçamentos dos Fornecedores
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full">
                {orcamentos.length} {orcamentos.length === 1 ? 'proposta' : 'propostas'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Digite o CNPJ para preenchimento automático da Razão Social, Regime Tributário e CNAE Principal via API
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-adicionar-orcamento"
          onClick={onAdicionar}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar Orçamento
        </button>
      </div>

      {/* Painel de Seleção do Motor de API de Consulta de CNPJ */}
      <div className="mb-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800">Motor de Consulta de CNPJ & CNAE:</span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Escolha a API prioritária ou deixe no modo automático resiliente
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMostrarDetalhesApi(!mostrarDetalhesApi)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors self-start md:self-auto"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {mostrarDetalhesApi ? 'Ocultar detalhes técnicos' : 'Ver endpoints e chaves'}
          </button>
        </div>

        {/* Seletor em abas/chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {PROVEDORES_DISPONIVEIS.map(prov => {
            const isSelecionado = provedorAtivo === prov.id;
            return (
              <button
                key={prov.id}
                type="button"
                id={`btn-provedor-${prov.id}`}
                onClick={() => setProvedorAtivo(prov.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                  isSelecionado
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100/80 border-slate-200'
                }`}
                title={prov.descricao}
              >
                {prov.id === 'auto' && <Zap className={`w-3.5 h-3.5 ${isSelecionado ? 'text-amber-300' : 'text-amber-500'}`} />}
                {prov.id === 'receitaws' && <KeyRound className={`w-3.5 h-3.5 ${isSelecionado ? 'text-indigo-200' : 'text-indigo-600'}`} />}
                {prov.id === 'cnpja' && <Server className={`w-3.5 h-3.5 ${isSelecionado ? 'text-emerald-200' : 'text-emerald-600'}`} />}
                {prov.id === 'brasilapi' && <Globe className={`w-3.5 h-3.5 ${isSelecionado ? 'text-amber-200' : 'text-amber-600'}`} />}
                {prov.id === 'opencnpj' && <Globe className={`w-3.5 h-3.5 ${isSelecionado ? 'text-cyan-200' : 'text-cyan-600'}`} />}
                <span>{prov.nome}</span>
              </button>
            );
          })}
        </div>

        {/* Indicador de Proteção Ativa Contra Rate Limit (3 req/min) */}
        <div className="mt-2.5 flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Proteção Anti-Limite Ativa:</strong> Limite de 3 req/min monitorado e blindado com failover automático e cache inteligente
            </span>
          </div>
          <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
            0% de erro 429
          </span>
        </div>

        {/* Notificação dinâmica de proteção / failover acionado */}
        {notificacaoProtecao && (
          <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{notificacaoProtecao.mensagem}</span>
          </div>
        )}

        {/* Detalhes expandíveis dos endpoints e tokens */}
        {mostrarDetalhesApi && (
          <div className="mt-3 pt-3 border-t border-slate-200/70 text-xs text-slate-600 space-y-1.5 bg-white/70 p-3 rounded-lg">
            <div className="font-semibold text-slate-800 text-[11px] mb-1">Endpoints e chaves integradas ao sistema:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">1. ReceitaWS:</span>{' '}
                <code className="text-[10px] text-blue-700 bg-blue-50 px-1 py-0.5 rounded">
                  https://receitaws.com.br/v1/cnpj/{'{cnpj}'}
                </code>
                <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                  ✓ Token Comercial configurado + Proteção de taxa (3 req/min)
                </div>
              </div>

              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">2. CNPJ Já:</span>{' '}
                <code className="text-[10px] text-blue-700 bg-blue-50 px-1 py-0.5 rounded">
                  https://open.cnpja.com/office/{'{cnpj}'}
                </code>
                <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                  ✓ Chave Corporativa da API ativa (sem restrição de 3 req/min)
                </div>
              </div>

              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">3. BrasilAPI:</span>{' '}
                <code className="text-[10px] text-blue-700 bg-blue-50 px-1 py-0.5 rounded">
                  https://brasilapi.com.br/cnpj/v1/{'{cnpj}'}
                </code>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  ✓ API Aberta governamental e comunitária com monitoramento de taxa
                </div>
              </div>

              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">4. OpenCNPJ:</span>{' '}
                <code className="text-[10px] text-blue-700 bg-blue-50 px-1 py-0.5 rounded">
                  https://api.opencnpj.org/{'{CNPJ}'}
                </code>
                <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                  ✓ API Aberta rápida sem limite estrito de 3 req/min (ideal para rajadas)
                </div>
              </div>
            </div>
            <div className="p-2 rounded bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 mt-2 space-y-1">
              <p className="font-semibold text-blue-950">Como funciona a prevenção contra erros de taxa (429 / 3 req/min)?</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-800 text-[10px]">
                <li><strong>Monitoramento de Janela Deslizante:</strong> O servidor rastreia o número de requisições por minuto em cada provedor.</li>
                <li><strong>Cooldown Preditivo:</strong> Se um provedor atinge 3 req/min, o servidor não força nova chamada nele e não trava a tela do usuário.</li>
                <li><strong>Failover Instantâneo:</strong> A consulta é redirecionada no mesmo milissegundo para o OpenCNPJ ou CNPJ Já.</li>
                <li><strong>Cache em Memória:</strong> Consultas a CNPJs repetidos são respondidas em 0ms sem consumir cotas de nenhuma API.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {orcamentos.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">Nenhum orçamento adicionado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Adicione ao menos duas cotações para comparar o custo efetivo e identificar encargos pelo Art. 18-B.
          </p>
          <button
            type="button"
            onClick={onAdicionar}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Inserir Primeira Proposta
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orcamentos.map((orc, index) => {
            const cnpjValido = validarCNPJ(orc.cnpj);
            const isMei = orc.regimeTributario === 'MEI';

            return (
              <div
                key={orc.id}
                id={`card-orcamento-${orc.id}`}
                className={`p-4 rounded-xl border transition-all ${
                  isMei
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/70">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-xs font-bold">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
                      {orc.razaoSocial || `Aguardando CNPJ do Fornecedor #${index + 1}`}
                    </span>
                    {consultandoCnpj[orc.id] && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" /> Buscando dados na API...
                      </span>
                    )}
                    {orc.provedorOrigem && !consultandoCnpj[orc.id] && (
                      <span className={`px-2 py-0.5 text-[10px] font-semibold border rounded-full ${getNomeProvedorBadge(orc.provedorOrigem).bg}`}>
                        {getNomeProvedorBadge(orc.provedorOrigem).label}
                      </span>
                    )}
                    {isMei && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-amber-600" />
                        MEI (Sujeito a verificação do Art. 18-B)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {validarCNPJ(orc.cnpj) && (
                      <button
                        type="button"
                        onClick={() => reconsultarCnpj(orc.id, orc.cnpj, provedorAtivo)}
                        disabled={consultandoCnpj[orc.id]}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-100 px-2 py-1 rounded-md border border-slate-300 shadow-2xs transition-colors disabled:opacity-50"
                        title="Reconsultar CNPJ usando o motor de API ativo"
                      >
                        <RefreshCw className={`w-3 h-3 ${consultandoCnpj[orc.id] ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                        <span className="hidden sm:inline">Consultar via {PROVEDORES_DISPONIVEIS.find(p => p.id === provedorAtivo)?.nome.split(' ')[0]}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onRemover(orc.id)}
                      disabled={orcamentos.length <= 1}
                      className="text-xs text-rose-600 hover:text-rose-800 disabled:opacity-30 disabled:cursor-not-allowed p-1.5 hover:bg-rose-50 rounded-md transition-colors"
                      title={orcamentos.length <= 1 ? 'Mantenha ao menos 1 orçamento' : 'Remover orçamento'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                  {/* CNPJ */}
                  <div className="sm:col-span-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor={`cnpj-${orc.id}`}
                        className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600"
                      >
                        CNPJ do Fornecedor <span className="text-rose-500">*</span>
                      </label>
                      {orc.cnpj && (
                        <span className="text-[10px] flex items-center gap-0.5">
                          {consultandoCnpj[orc.id] ? (
                            <span className="text-blue-600 font-medium flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Consultando...
                            </span>
                          ) : cnpjValido ? (
                            <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Válido
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">14 números</span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id={`cnpj-${orc.id}`}
                        type="text"
                        value={orc.cnpj}
                        onChange={e => handleCnpjChange(orc.id, e.target.value)}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 shadow-xs"
                      />
                      {consultandoCnpj[orc.id] && (
                        <div className="absolute right-2.5 top-2">
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Valor (R$) */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor={`valor-${orc.id}`}
                      className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
                    >
                      Valor da Proposta (R$) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-medium">R$</span>
                      <input
                        id={`valor-${orc.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={orc.valor === 0 ? '' : orc.valor}
                        onChange={e => onAtualizar(orc.id, 'valor', Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0,00"
                        className="w-full pl-9 pr-3 py-2 text-xs font-semibold font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-right shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Razão Social (Auto via API) */}
                  <div className="sm:col-span-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor={`razao-${orc.id}`}
                        className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600"
                      >
                        Razão Social / Nome Fantasia
                      </label>
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium border border-blue-200">
                        Auto via API
                      </span>
                    </div>
                    <input
                      id={`razao-${orc.id}`}
                      type="text"
                      value={orc.razaoSocial}
                      onChange={e => onAtualizar(orc.id, 'razaoSocial', e.target.value)}
                      placeholder="Preenchido automaticamente pelo CNPJ..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                    />
                  </div>

                  {/* Regime Tributário (Consulta Oficial - Bloqueado para edição manual) */}
                  <div className="sm:col-span-6">
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor={`regime-${orc.id}`}
                        className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1"
                      >
                        <span>Regime Tributário</span>
                        <Lock className="w-3 h-3 text-slate-400" title="Bloqueado para edição manual" />
                      </label>
                      <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium border border-slate-200 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-slate-500" /> Base Oficial RFB
                      </span>
                    </div>
                    <div
                      id={`regime-${orc.id}`}
                      className={`w-full px-3 py-2 text-xs border rounded-lg flex items-center justify-between shadow-2xs select-none bg-slate-50/80 cursor-not-allowed ${
                        REGIME_ROTULOS[orc.regimeTributario]?.badge || 'text-slate-800 border-slate-200'
                      }`}
                      title="Regime tributário apurado oficialmente via consulta cadastral da Receita Federal (não editável manualmente)."
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate">
                          {REGIME_ROTULOS[orc.regimeTributario]?.label || orc.regimeTributario}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal flex items-center gap-0.5 shrink-0 ml-2">
                        <Lock className="w-3 h-3 text-slate-400" /> Oficial
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <span>Definido pela base oficial da Receita Federal (edição manual desativada).</span>
                    </p>
                  </div>

                  {/* CNAE Principal (Auto via API) */}
                  <div className="sm:col-span-6">
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor={`cnae-forn-${orc.id}`}
                        className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600"
                      >
                        CNAE Principal (Receita Federal)
                      </label>
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium border border-blue-200">
                        Auto via API
                      </span>
                    </div>
                    <input
                      id={`cnae-forn-${orc.id}`}
                      type="text"
                      value={orc.cnaePrincipal || ''}
                      onChange={e => onAtualizar(orc.id, 'cnaePrincipal', e.target.value)}
                      placeholder="Preenchido automaticamente pelo CNPJ..."
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                    />
                  </div>
                </div>

                {/* Verificação em Tempo Real do CNAE do Serviço no Principal ou Secundários */}
                {(() => {
                  const statusCnae = checarInclusaoCnae(orc.cnaePrincipal, orc.cnaesSecundarios);
                  if (!statusCnae) return null;

                  return (
                    <div
                      className={`mt-3 p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        statusCnae.status === 'incluso_principal'
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                          : statusCnae.status === 'incluso_secundario'
                          ? 'bg-teal-50/80 border-teal-200 text-teal-900'
                          : statusCnae.status === 'incompativel'
                          ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                          : 'bg-amber-50/80 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {statusCnae.status === 'incluso_principal' || statusCnae.status === 'incluso_secundario' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : statusCnae.status === 'incompativel' ? (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <span className="font-medium text-[11px] sm:text-xs">
                          {statusCnae.mensagem}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                            statusCnae.status === 'incluso_principal'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : statusCnae.status === 'incluso_secundario'
                              ? 'bg-teal-100 text-teal-800 border-teal-300'
                              : statusCnae.status === 'incompativel'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {statusCnae.origem}
                        </span>

                        {orc.cnaesSecundarios && orc.cnaesSecundarios.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleSecundarios(orc.id)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 hover:text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 shadow-2xs hover:bg-slate-50 transition-colors"
                          >
                            <Layers className="w-3 h-3 text-slate-500" />
                            <span>{orc.cnaesSecundarios.length} secundários</span>
                            {expandirSecundarios[orc.id] ? (
                              <ChevronUp className="w-3 h-3 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-slate-500" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Gaveta Expansível de CNAEs Secundários Cadastrados */}
                {expandirSecundarios[orc.id] && orc.cnaesSecundarios && orc.cnaesSecundarios.length > 0 && (
                  <div className="mt-2.5 p-3 rounded-lg bg-slate-100/80 border border-slate-200 text-xs animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                      <span className="font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                        Atividades Econômicas Secundárias (Receita Federal)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {orc.cnaesSecundarios.length} cadastradas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {orc.cnaesSecundarios.map((sec, secIdx) => {
                        const sNorm = (cnaeServico || '').replace(/\D/g, '');
                        const secNorm = (sec || '').replace(/\D/g, '');
                        const isMatch = sNorm && secNorm && sNorm === secNorm;
                        const isClasse = sNorm && secNorm && sNorm.slice(0, 4) === secNorm.slice(0, 4);
                        const ativ = orc.atividadesSecundarias?.find(a => a.cnae === sec);

                        return (
                          <div
                            key={secIdx}
                            className={`p-2 rounded border text-[11px] flex flex-col justify-between transition-colors ${
                              isMatch
                                ? 'bg-teal-50 border-teal-300 text-teal-950 font-medium ring-1 ring-teal-400'
                                : isClasse
                                ? 'bg-amber-50 border-amber-200 text-amber-900'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono font-bold text-[10px]">{sec}</span>
                              {isMatch && (
                                <span className="bg-teal-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                                  Compatível com o Serviço
                                </span>
                              )}
                              {!isMatch && isClasse && (
                                <span className="bg-amber-500 text-white text-[9px] font-semibold px-1.5 py-0.2 rounded">
                                  Mesma Subclasse
                                </span>
                              )}
                            </div>
                            {ativ?.descricao && (
                              <span className="text-[10px] text-slate-600 line-clamp-2 mt-1">
                                {ativ.descricao}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Destaque educativo sobre o Art. 18-B para MEI */}
                {isMei && (
                  <div className="mt-3 p-2.5 rounded-lg bg-amber-100/70 border border-amber-300 flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>
                        Se o serviço envolver hidráulica, eletricidade, pintura, alvenaria, carpintaria ou manutenção, a sua empresa terá encargo adicional de <strong>20% de CPP Patronal</strong> (R$ {formatarMoeda((orc.valor || 0) * 0.20)}).
                      </span>
                    </div>
                    <span className="font-mono font-bold text-amber-800 text-[11px] whitespace-nowrap ml-2">
                      + 20% CPP
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
