import React, { useState } from 'react';

import { Header } from './Header';

import { ServicoForm } from './ServicoForm';

import { OrcamentosManager } from './OrcamentosManager';

import { AcaoAnalise } from './AcaoAnalise';

import { ResultadosTable } from './ResultadosTable';

import { ResultadosCards } from './ResultadosCards';

import { ParecerFiscalCard } from './ParecerFiscalCard';

import { EmailResumoCard } from './EmailResumoCard';

import {

  ServicoInput,

  OrcamentoInput,

  AnaliseFiscalResponse,

} from '../types/fiscal';

import { EXEMPLO_CENARIOS } from '../data/cnaes';

import { enviarParaAnalise } from '../services/api';

import { gerarRelatorioDocx } from '../utils/docxExport';

import { gerarRelatorioPdf } from '../utils/pdfExport';

import {

  FileDown,

  FileText,

  Table as TableIcon,

  LayoutGrid,

  Sparkles,

  AlertCircle,

  CheckCircle2,

  X,

} from 'lucide-react';



export interface ComparadorOrcamentosSectionProps {

  /** Se `true`, oculta a barra de cabeçalho padrão para embutir perfeitamente em layouts existentes com navbar própria */

  ocultarHeaderProprio?: boolean;

  /** Callback opcional quando uma análise é concluída */

  onAnaliseConcluida?: (resultado: AnaliseFiscalResponse) => void;

}



export const ComparadorOrcamentosSection: React.FC<ComparadorOrcamentosSectionProps> = ({

                                                                                          ocultarHeaderProprio = false,

                                                                                          onAnaliseConcluida,

                                                                                        }) => {

// Estado do Formulário inicializado com o Cenário 1 (Manutenção Elétrica com incidência de Art. 18-B)

  const [servico, setServico] = useState<ServicoInput>(EXEMPLO_CENARIOS[0].servico);

  const [orcamentos, setOrcamentos] = useState<OrcamentoInput[]>(EXEMPLO_CENARIOS[0].orcamentos);



// Estados de análise e requisições

  const [carregando, setCarregando] = useState<boolean>(false);

  const [analise, setAnalise] = useState<AnaliseFiscalResponse | null>(null);

  const [erro, setErro] = useState<string | null>(null);

  const [gerandoDocx, setGerandoDocx] = useState<boolean>(false);

  const [gerandoPdf, setGerandoPdf] = useState<boolean>(false);

  const [notificacao, setNotificacao] = useState<{

    tipo: 'sucesso' | 'erro' | 'info';

    mensagem: string;

  } | null>(null);



// Modo de visualização dos resultados

  const [visualizacao, setVisualizacao] = useState<'tabela' | 'cards' | 'ambos'>('ambos');



// Handlers do formulário de serviço

  const handleAtualizarServico = (campo: keyof ServicoInput, valor: string) => {

    setServico(prev => ({ ...prev, [campo]: valor }));

    if (analise) setAnalise(null);

  };



// Handlers dos orçamentos

  const handleAdicionarOrcamento = () => {

    const novoId = String(Date.now());

    const novo: OrcamentoInput = {

      id: novoId,

      cnpj: '',

      razaoSocial: '',

      regimeTributario: 'SIMPLES_NACIONAL',

      valor: 0,

      cnaePrincipal: servico.cnae || '',

      observacao: '',

    };

    setOrcamentos(prev => [...prev, novo]);

    if (analise) setAnalise(null);

  };



  const handleRemoverOrcamento = (id: string) => {

    if (orcamentos.length <= 1) return;

    setOrcamentos(prev => prev.filter(o => o.id !== id));

    if (analise) setAnalise(null);

  };



  const handleAtualizarOrcamento = (id: string, campo: keyof OrcamentoInput, valor: any) => {

    setOrcamentos(prev =>

        prev.map(o => (o.id === id ? { ...o, [campo]: valor } : o))

    );

    if (analise) setAnalise(null);

  };



// Carregar Cenários de Teste

  const handleCarregarCenario = (novoServico: ServicoInput, novosOrcamentos: OrcamentoInput[]) => {

    setServico(novoServico);

    setOrcamentos(novosOrcamentos);

    setAnalise(null);

    setErro(null);

    setNotificacao({

      tipo: 'info',

      mensagem: `Cenário carregado com sucesso. Clique em "Executar Análise de Conformidade" para processar.`,

    });

  };



// Limpar dados

  const handleLimpar = () => {

    setServico({

      descricao: '',

      cnae: '',

      solicitante: '',

      departamento: '',

      numeroAdiantamento: '',

    });

    setOrcamentos([

      {

        id: '1',

        cnpj: '',

        razaoSocial: '',

        regimeTributario: 'SIMPLES_NACIONAL',

        valor: 0,

        cnaePrincipal: '',

      },

    ]);

    setAnalise(null);

    setErro(null);

  };



// Ação de Análise Fiscal (POST /api/analisar com fallback direto)

  const handleExecutarAnalise = async () => {

    setCarregando(true);

    setErro(null);

    try {

      const resultado = await enviarParaAnalise(servico, orcamentos);

      setAnalise(resultado);

      if (onAnaliseConcluida) {

        onAnaliseConcluida(resultado);

      }

      setNotificacao({

        tipo: 'sucesso',

        mensagem: `Análise fiscal concluída com sucesso! Menor custo efetivo identificado para ${resultado.melhorOrcamento.razaoSocial}.`,

      });



// Rola suavemente até os resultados

      setTimeout(() => {

        const el = document.getElementById('secao-resultados-comparador');

        if (el) el.scrollIntoView({ behavior: 'smooth' });

      }, 100);

    } catch (err: any) {

      console.error(err);

      setErro(err.message || 'Falha ao executar análise fiscal.');

      setNotificacao({

        tipo: 'erro',

        mensagem: 'Erro ao processar análise. Verifique os dados inseridos.',

      });

    } finally {

      setCarregando(false);

    }

  };



// Ação de Download em DOCX

  const handleDownloadDocx = async () => {

    if (!analise) return;

    setGerandoDocx(true);

    try {

      const blob = await gerarRelatorioDocx(analise);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;

      const numProc = servico.numeroAdiantamento ? servico.numeroAdiantamento.replace(/\W/g, '_') : 'ADIANTAMENTO';

      link.download = `Parecer_Fiscal_${numProc}_${new Date().toISOString().slice(0, 10)}.docx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);



      setNotificacao({

        tipo: 'sucesso',

        mensagem: 'Relatório emitido em DOCX baixado com sucesso!',

      });

    } catch (err: any) {

      console.error('Erro ao gerar DOCX:', err);

      setNotificacao({

        tipo: 'erro',

        mensagem: 'Falha ao gerar arquivo DOCX. Tente novamente.',

      });

    } finally {

      setGerandoDocx(false);

    }

  };



// Ação de Download do Parecer Técnico em PDF

  const handleDownloadPdf = async () => {

    if (!analise) return;

    setGerandoPdf(true);

    try {

      const blob = await gerarRelatorioPdf(analise);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const numProc = servico.numeroAdiantamento
        ? servico.numeroAdiantamento.replace(/\W/g, '_')
        : 'ADIANTAMENTO';
      link.href = url;
      link.download = `Parecer_Fiscal_${numProc}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);

      setNotificacao({

        tipo: 'sucesso',

        mensagem: 'Parecer técnico pericial em PDF gerado e baixado com sucesso!',

      });

    } catch (err: any) {

      console.error('Erro ao gerar PDF:', err);

      setNotificacao({

        tipo: 'erro',

        mensagem: 'Falha ao gerar o parecer técnico em PDF. Tente novamente.',

      });

    } finally {

      setGerandoPdf(false);

    }

  };



  return (

      <div className="w-full flex flex-col font-sans text-slate-900">

        {/* Cabeçalho condicional */}

        {!ocultarHeaderProprio && (

            <Header
                modo="comparador"
                onCarregarCenario={handleCarregarCenario}
                onLimpar={handleLimpar}
            />
        )}



        {/* Notificação Toast */}

        {notificacao && (

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">

              <div

                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all shadow-xs ${

                      notificacao.tipo === 'sucesso'

                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'

                          : notificacao.tipo === 'erro'

                              ? 'bg-rose-50 border-rose-200 text-rose-900'

                              : 'bg-blue-50 border-blue-200 text-blue-900'

                  }`}

              >

                <div className="flex items-center gap-2">

                  {notificacao.tipo === 'sucesso' ? (

                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />

                  ) : notificacao.tipo === 'erro' ? (

                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />

                  ) : (

                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />

                  )}

                  <span>{notificacao.mensagem}</span>

                </div>

                <button

                    type="button"

                    onClick={() => setNotificacao(null)}

                    className="p-1 hover:opacity-75 rounded transition-opacity"

                >

                  <X className="w-3.5 h-3.5" />

                </button>

              </div>

            </div>

        )}



        {/* Conteúdo Principal */}

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* Banner Informativo do Sistema */}

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">

            <div className="flex items-center gap-2 text-slate-700">

              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />

              <span>

<strong>Regra Tributária Chave:</strong> Contratações de MEI para serviços de hidráulica, eletricidade, pintura, alvenaria, carpintaria e manutenção geram <strong>CPP Patronal de 20% (Art. 18-B da LC 123/2006)</strong> devida pela tomadora.

</span>

            </div>

            <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 font-mono text-[11px] font-medium whitespace-nowrap">

Auditoria DCTFWeb & eSocial

</span>

          </div>



          {/* 1. Formulário de Descrição do Serviço e CNAE */}

          <ServicoForm servico={servico} onChange={handleAtualizarServico} />



          {/* 2. Área para Adicionar Múltiplos Orçamentos */}

          <OrcamentosManager

              orcamentos={orcamentos}

              onAdicionar={handleAdicionarOrcamento}

              onRemover={handleRemoverOrcamento}

              onAtualizar={handleAtualizarOrcamento}

              cnaeServico={servico.cnae}

          />



          {/* 3. Botão para Acionar a Análise (/api/analisar) */}

          <AcaoAnalise

              servico={servico}

              orcamentos={orcamentos}

              carregando={carregando}

              onAnalisar={handleExecutarAnalise}

          />



          {/* Mensagem de Erro (se houver) */}

          {erro && (

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">

                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />

                <span>{erro}</span>

              </div>

          )}



          {/* 4. Tabela / Cards com os Resultados Ordenados por Menor Custo Efetivo */}

          {analise && (

              <section id="secao-resultados-comparador" className="space-y-6 pt-4 border-t border-slate-200">

                {/* Controles de Visualização e Título da Seção */}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                  <div>

                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">

                      Resultados da Análise de Conformidade Fiscal

                    </h2>

                    <p className="text-xs text-slate-500">

                      Propostas ordenadas pelo Menor Custo Efetivo Global (incluindo encargos fiscais e previdenciários)

                    </p>

                  </div>



                  {/* Seletor de Tabela / Cards */}

                  <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg border border-slate-300/60 self-start sm:self-auto">

                    <button

                        type="button"

                        onClick={() => setVisualizacao('ambos')}

                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${

                            visualizacao === 'ambos'

                                ? 'bg-white text-slate-900 shadow-xs'

                                : 'text-slate-600 hover:text-slate-900'

                        }`}

                    >

                      Visão Completa

                    </button>

                    <button

                        type="button"

                        onClick={() => setVisualizacao('tabela')}

                        className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors ${

                            visualizacao === 'tabela'

                                ? 'bg-white text-slate-900 shadow-xs'

                                : 'text-slate-600 hover:text-slate-900'

                        }`}

                    >

                      <TableIcon className="w-3.5 h-3.5" />

                      Tabela

                    </button>

                    <button

                        type="button"

                        onClick={() => setVisualizacao('cards')}

                        className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors ${

                            visualizacao === 'cards'

                                ? 'bg-white text-slate-900 shadow-xs'

                                : 'text-slate-600 hover:text-slate-900'

                        }`}

                    >

                      <LayoutGrid className="w-3.5 h-3.5" />

                      Cards

                    </button>

                  </div>

                </div>



                {/* Visualização dos Resultados */}

                {visualizacao === 'ambos' && (

                    <>

                      <ResultadosTable
                          analise={analise}
                          onDownloadDocx={handleDownloadDocx}
                          gerandoDocx={gerandoDocx}
                          onDownloadPdf={handleDownloadPdf}
                          gerandoPdf={gerandoPdf}
                      />

                      <ResultadosCards
                          analise={analise}
                          onDownloadDocx={handleDownloadDocx}
                          gerandoDocx={gerandoDocx}
                          onDownloadPdf={handleDownloadPdf}
                          gerandoPdf={gerandoPdf}
                      />

                    </>

                )}



                {visualizacao === 'tabela' && (

                    <ResultadosTable
                        analise={analise}
                        onDownloadDocx={handleDownloadDocx}
                        gerandoDocx={gerandoDocx}
                        onDownloadPdf={handleDownloadPdf}
                        gerandoPdf={gerandoPdf}
                    />

                )}



                {visualizacao === 'cards' && (

                    <ResultadosCards
                        analise={analise}
                        onDownloadDocx={handleDownloadDocx}
                        gerandoDocx={gerandoDocx}
                        onDownloadPdf={handleDownloadPdf}
                        gerandoPdf={gerandoPdf}
                    />

                )}



                {/* Parecer do Auditor Técnico & Fiscal (IA) */}

                <ParecerFiscalCard

                    analise={analise}

                    onDownloadDocx={handleDownloadDocx}

                    onDownloadPdf={handleDownloadPdf}

                    gerandoDocx={gerandoDocx}

                    gerandoPdf={gerandoPdf}

                />



                {/* Modelo de E-mail Executivo para Aprovação de Despesa */}

                <EmailResumoCard analise={analise} servico={servico} />

              </section>

          )}

        </main>

      </div>

  );

};

export default ComparadorOrcamentosSection;
