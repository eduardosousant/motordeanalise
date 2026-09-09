import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Header } from './components/Header.tsx';
import { ThemeSwitcherBar } from './components/ThemeSwitcherBar.tsx';
//import { ExemplosPraticosBar } from './components/ExemplosPraticosBar.tsx';
import { HistoricoAnalises } from './components/HistoricoAnalises.tsx';
import { CnpjCard } from './components/CnpjCard.tsx';
import { OperationForm } from './components/OperationForm.tsx';
import { AnalysisResultView } from './components/AnalysisResultView.tsx';
import { FiscalPrintReport } from './components/FiscalPrintReport.tsx';
import { Sidebar, ActiveModule } from './components/Sidebar.tsx';
import { AluguelModule } from './components/AluguelModule.tsx';
import {
    OperacaoComercial,
    AnaliseTributariaJSON,
    SimulacaoMemoriaCalculo,
    CnpjApiResult,
    AppTheme,
    HistoricoAnaliseItem,
    AnaliseConsolidadaNota
} from './types.js';
import { computeClientSimulation, computeConsolidatedNotaLocal } from './lib/taxCalculations.js';
import { parseNfeXml } from './lib/nfeXmlParser.js';
import { AlertCircle, FileCheck, CheckCircle2, FileText } from 'lucide-react';

const LOCAL_STORAGE_HISTORY_KEY = 'ricms_mt_historico_analises_v1';

const INITIAL_OPERACAO: OperacaoComercial = {
    cnpj_fornecedor: '60701190000104',
    razao_social_fornecedor: 'TINTAS & TINTURAS PAULISTA S/A',
    uf_origem: 'SP',
    uf_destino: 'MT',
    ncm: '3209.10.00',
    descricao_produto: 'Tinta acrílica fosca para exteriores galao 18L',
    finalidade_compra: 'ORGAO_PUBLICO_CONSUMO',
    tipo_adquirente: 'ORGAO_PUBLICO_ESTADUAL',
    valor_operacao: 15000,
    valor_frete: 0,
    valor_despesas: 0,
    icms_proprio_destacado: 0,
    simples_remetente: true,
    porte_remetente: 'EPP'
};

export default function App() {
    const [activeModule, setActiveModule] = useState<ActiveModule>('TRIBUTACAO_ICMS');
    const [operacao, setOperacao] = useState<OperacaoComercial>(INITIAL_OPERACAO);
    const [supplierData, setSupplierData] = useState<CnpjApiResult | null>({
        cnpj: '60701190000104',
        razao_social: 'TINTAS & TINTURAS PAULISTA S/A',
        nome_fantasia: 'Tintas Paulista',
        porte: 'EPP',
        optante_simples: true,
        optante_simei: false,
        uf: 'SP',
        municipio: 'São Paulo',
        cnae_principal_codigo: '2071-1/00',
        cnae_principal_descricao: 'Fabricação de tintas, vernizes, esmaltes e lacas',
        situacao_cadastral: 'ATIVA',
        fonte_api: 'CNPJa (Open)'
    });

    const [loading, setLoading] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [theme, setTheme] = useState<AppTheme>('INSTITUCIONAL');
    const [showThemeBar, setShowThemeBar] = useState(false);
    const [xmlSuccessMsg, setXmlSuccessMsg] = useState<string | null>(null);

    const [result, setResult] = useState<{
        jsonResponse: AnaliseTributariaJSON;
        simulacaoCalculo: SimulacaoMemoriaCalculo;
        fonteAnalise?: 'CACHE_AI_LOCAL' | 'GEMINI_AI_AO_VIVO' | 'MOTOR_DETERMINISTICO_LOCAL';
        consolidado?: AnaliseConsolidadaNota | null;
    } | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [historico, setHistorico] = useState<HistoricoAnaliseItem[]>(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error('Erro ao ler historico local:', e);
        }
        return [];
    });

    useEffect(() => {
        runAnalysis(INITIAL_OPERACAO);
    }, []);

    const saveToHistory = (
        targetOp: OperacaoComercial,
        targetSupplier: CnpjApiResult | null,
        analiseData: {
            jsonResponse: AnaliseTributariaJSON;
            simulacaoCalculo: SimulacaoMemoriaCalculo;
            fonteAnalise?: 'CACHE_AI_LOCAL' | 'GEMINI_AI_AO_VIVO' | 'MOTOR_DETERMINISTICO_LOCAL';
        }
    ) => {
        const newItem: HistoricoAnaliseItem = {
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: Date.now(),
            dataHoraFormatada: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
            cnpj_digitado: targetOp.cnpj_fornecedor,
            supplierData: targetSupplier,
            operacao: { ...targetOp },
            jsonResponse: analiseData.jsonResponse,
            simulacaoCalculo: analiseData.simulacaoCalculo,
            fonteAnalise: analiseData.fonteAnalise || 'CACHE_AI_LOCAL'
        };

        setHistorico(prev => {
            const filtered = prev.filter(item =>
                !(item.operacao.ncm === targetOp.ncm &&
                    item.operacao.cnpj_fornecedor === targetOp.cnpj_fornecedor &&
                    item.operacao.valor_operacao === targetOp.valor_operacao &&
                    item.operacao.finalidade_compra === targetOp.finalidade_compra &&
                    item.operacao.tipo_adquirente === targetOp.tipo_adquirente)
            );
            const updated = [newItem, ...filtered].slice(0, 5);
            try {
                localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
            } catch (err) {
                console.error('Erro ao persistir histórico no localStorage', err);
            }
            return updated;
        });
    };

    const runAnalysis = async (opToRun?: OperacaoComercial, customSupplier?: CnpjApiResult | null) => {
        const targetOp = opToRun || operacao;
        const currentSup = customSupplier !== undefined ? customSupplier : supplierData;
        setLoading(true);
        setError(null);

        try {
            let data: any = null;

            try {
                const res = await fetch('/api/analise-tributaria', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(targetOp)
                });

                const contentType = res.headers.get('content-type') || '';
                if (res.ok && contentType.includes('application/json')) {
                    data = await res.json();
                }
            } catch (networkErr: any) {
                console.warn('[TAX ENGINE] Utilizando motor determinístico local.');
            }

            if (!data) {
                data = computeConsolidatedNotaLocal(targetOp);
            }

            setResult(data);
            saveToHistory(targetOp, currentSup, data);
        } catch (err: any) {
            console.error('[TAX ENGINE] Erro inesperado:', err);
            try {
                const fallbackData = computeConsolidatedNotaLocal(targetOp);
                setResult(fallbackData);
                saveToHistory(targetOp, currentSup, fallbackData);
            } catch (finalErr: any) {
                setError('Não foi possível concluir a análise tributária: ' + (finalErr.message || 'Erro nos parâmetros'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleXmlSelected = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const xmlContent = e.target?.result as string;
                const { operacao: opParsed, supplierData: supParsed } = parseNfeXml(xmlContent);

                setOperacao(opParsed);
                setSupplierData(supParsed);
                setXmlSuccessMsg(`XML importado com sucesso: ${file.name} (${opParsed.itens?.length || 1} itens apurados)`);
                setError(null);

                runAnalysis(opParsed, supParsed);

                setTimeout(() => setXmlSuccessMsg(null), 6000);
            } catch (err: any) {
                setError(err.message || 'Erro ao processar o arquivo XML da NF-e.');
                setXmlSuccessMsg(null);
            }
        };
        reader.readAsText(file);
    };

    const handleRestoreHistory = (item: HistoricoAnaliseItem) => {
        setOperacao(item.operacao);
        setSupplierData(item.supplierData);
        setResult({
            jsonResponse: item.jsonResponse,
            simulacaoCalculo: item.simulacaoCalculo,
            fonteAnalise: item.fonteAnalise
        });
        setError(null);
    };

    const handleDeleteHistory = (id: string) => {
        setHistorico(prev => {
            const updated = prev.filter(item => item.id !== id);
            try {
                localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
            } catch (e) {
                console.error('Erro ao atualizar localStorage após delete', e);
            }
            return updated;
        });
    };

    const handleClearHistory = () => {
        if (window.confirm('Deseja realmente limpar o histórico de análises salvas?')) {
            setHistorico([]);
            try {
                localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
            } catch (e) {
                console.error('Erro ao limpar localStorage', e);
            }
        }
    };

    const handleSupplierLoaded = (data: CnpjApiResult) => {
        setSupplierData(data);
        setOperacao(prev => ({
            ...prev,
            cnpj_fornecedor: data.cnpj,
            razao_social_fornecedor: data.razao_social,
            uf_origem: data.uf || prev.uf_origem,
            simples_remetente: data.optante_simples,
            porte_remetente: data.porte
        }));
    };

    const handleSelectExemplo = (op: OperacaoComercial) => {
        setOperacao(op);
        const newSup: CnpjApiResult = {
            cnpj: op.cnpj_fornecedor,
            razao_social: op.razao_social_fornecedor || 'Fornecedor de Exemplo',
            porte: op.porte_remetente || 'ME',
            optante_simples: Boolean(op.simples_remetente),
            optante_simei: false,
            uf: op.uf_origem,
            municipio: 'São Paulo',
            fonte_api: 'Caso Prático Pré-carregado'
        };
        setSupplierData(newSup);
        runAnalysis(op, newSup);
    };

    const handleOperacaoChange = (updated: Partial<OperacaoComercial>) => {
        setOperacao(prev => {
            const nextOp = { ...prev, ...updated };
            if (result?.jsonResponse) {
                const nextSimulacao = computeClientSimulation(nextOp, result.jsonResponse);
                setResult(rPrev => rPrev ? { ...rPrev, simulacaoCalculo: nextSimulacao } : null);
            }
            return nextOp;
        });
    };

    const handleReset = () => {
        setOperacao(INITIAL_OPERACAO);
        setResult(null);
        setError(null);
        setXmlSuccessMsg(null);
        runAnalysis(INITIAL_OPERACAO);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportPdf = async () => {
        if (!result) {
            alert('Nenhuma análise tributária disponível para exportação.');
            return;
        }
        setIsExportingPdf(true);

        try {
            const reportElement = document.getElementById('fiscal-print-report');
            if (!reportElement) {
                alert('Elemento do parecer tributário não foi localizado.');
                return;
            }

            reportElement.classList.remove('hidden');
            reportElement.classList.add('block', 'fixed', 'top-0', 'left-[-9999px]', 'w-[800px]', 'z-[-9999]', 'bg-white');

            const canvas = await html2canvas(reportElement, {
                scale: 2.5,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 800,
                onclone: (clonedDoc) => {
                    const styleElements = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
                    styleElements.forEach((styleEl) => {
                        if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
                            styleEl.textContent = styleEl.textContent.replace(/oklch\([^)]+\)/g, 'transparent');
                        }
                    });

                    const clonedReport = clonedDoc.getElementById('fiscal-print-report');
                    if (clonedReport) {
                        clonedReport.style.display = 'block';
                        clonedReport.style.position = 'relative';
                        clonedReport.style.left = '0';
                        clonedReport.style.top = '0';
                        clonedReport.style.width = '800px';
                        clonedReport.style.visibility = 'visible';
                        clonedReport.style.backgroundColor = '#ffffff';
                        clonedReport.style.color = '#0f172a';
                    }
                }
            });

            reportElement.classList.add('hidden');
            reportElement.classList.remove('block', 'fixed', 'top-0', 'left-[-9999px]', 'w-[800px]', 'z-[-9999]', 'bg-white');

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const marginX = 8;
            const marginY = 8;
            const imgWidth = pageWidth - (marginX * 2);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = marginY;

            pdf.addImage(imgData, 'PNG', marginX, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= (pageHeight - (marginY * 2));

            while (heightLeft > 0) {
                position = heightLeft - imgHeight + marginY;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', marginX, position, imgWidth, imgHeight, undefined, 'FAST');
                heightLeft -= (pageHeight - (marginY * 2));
            }

            const cnpjLimpo = operacao.cnpj_fornecedor ? operacao.cnpj_fornecedor.replace(/\D/g, '') : 'FORNECEDOR';
            const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

            pdf.save(`Parecer_Fiscal_MT_${cnpjLimpo}_${dataHoje}.pdf`);

        } catch (err) {
            console.error('Erro ao gerar PDF com jsPDF:', err);
            alert('Erro ao gerar arquivo PDF.');
        } finally {
            setIsExportingPdf(false);
        }
    };

    const getThemeWrapperClass = () => {
        switch (theme) {
            case 'FINTECH_PRO':
                return 'bg-gradient-to-b from-slate-50 via-slate-100/90 to-slate-200/50 text-slate-900 selection:bg-indigo-600 selection:text-white';
            case 'DARK_AUDITOR':
                return 'dark bg-[#0b0f19] text-slate-100 selection:bg-cyan-500 selection:text-black';
            case 'GOV_CLASSIC':
                return 'bg-[#f4f7f4] text-stone-900 selection:bg-emerald-700 selection:text-white';
            case 'INSTITUCIONAL':
            default:
                return 'bg-slate-50 text-slate-800 selection:bg-teal-600 selection:text-white';
        }
    };

    return (
        <div className={`min-h-screen font-sans antialiased flex flex-row transition-colors duration-300 ${getThemeWrapperClass()}`}>
            {/* 1. Sidebar de Navegação Lateral */}
            <Sidebar currentModule={activeModule} onSelectModule={setActiveModule} currentTheme={theme}/>

            {/* 2. Área Central de Conteúdo */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                <Header
                    onReset={handleReset}
                    onPrint={handlePrint}
                    onExportPdf={handleExportPdf}
                    isExportingPdf={isExportingPdf}
                    currentTheme={theme}
                    onSelectTheme={setTheme}
                    showThemeBar={showThemeBar}
                    onToggleThemeBar={() => setShowThemeBar(!showThemeBar)}
                    onXmlSelected={handleXmlSelected}
                />

                <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 print:hidden">
                    {/* Barra de Seleção de Temas */}
                    {showThemeBar && (
                        <ThemeSwitcherBar
                            currentTheme={theme}
                            onSelectTheme={(t) => setTheme(t)}
                        />
                    )}

                    {/* RENDERIZAÇÃO DO MÓDULO 1: MOTOR DE TRIBUTAÇÃO ICMS (BENS) */}
                    {activeModule === 'TRIBUTACAO_ICMS' && (
                        <>
                            {/*<ExemplosPraticosBar onSelectExemplo={handleSelectExemplo} currentTheme={theme} />*/}

                            {xmlSuccessMsg && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-xl flex items-center gap-2.5 text-xs shadow-xs">
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                                    <span className="font-semibold">{xmlSuccessMsg}</span>
                                </div>
                            )}

                            <div className="flex flex-col gap-6">
                                <CnpjCard
                                    onSupplierLoaded={handleSupplierLoaded}
                                    currentSupplier={supplierData}
                                    currentTheme={theme}
                                />

                                <OperationForm
                                    operacao={operacao}
                                    onChange={handleOperacaoChange}
                                    onSubmit={() => runAnalysis()}
                                    loading={loading}
                                    supplier={supplierData}
                                    currentTheme={theme}
                                />
                            </div>

                            {error && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 text-xs shadow-xs">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                                    <div>
                                        <strong className="block font-bold">Falha ao processar análise tributária:</strong>
                                        <span>{error}</span>
                                    </div>
                                </div>
                            )}

                            <HistoricoAnalises
                                historico={historico}
                                onRestore={handleRestoreHistory}
                                onDelete={handleDeleteHistory}
                                onClear={handleClearHistory}
                                currentOperacao={operacao}
                                currentResult={result}
                                currentTheme={theme}
                            />

                            {result && (
                                <div className="pt-2">
                                    <AnalysisResultView
                                        data={result.jsonResponse}
                                        simulacao={result.simulacaoCalculo}
                                        fonteAnalise={result.fonteAnalise}
                                        currentTheme={theme}
                                        consolidado={result.consolidado}
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* RENDERIZAÇÃO DO MÓDULO 2: ALUGUEL PREDIAL (PF/PJ 2026) */}
                    {activeModule === 'ALUGUEL' && (
                        <AluguelModule />
                    )}

                    {/* RENDERIZAÇÃO DO MÓDULO 3: NOTAS DE SERVIÇOS */}
                    {activeModule === 'SERVICOS' && (
                        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-4 shadow-sm max-w-2xl mx-auto my-12">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl mx-auto flex items-center justify-center">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 font-serif">Módulo de Notas de Serviços em Estruturação</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Este módulo processará a retenção de <strong>ISSQN Municipal</strong> (conforme local da prestação e Código Tributário de Cuiabá/MT) e a retenção ampla de tributos na fonte com base no <strong>Anexo I da IN RFB nº 1.234/2012</strong> (alíquotas de 1,20%, 2,40% e 4,80%).
                            </p>
                            <span className="inline-block px-3 py-1 bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold rounded-full uppercase tracking-wider">
                                Em Desenvolvimento
                            </span>
                        </div>
                    )}
                </main>

                {/* Relatório Impresso de ICMS/Bens */}
                {result && activeModule === 'TRIBUTACAO_ICMS' && (
                    <FiscalPrintReport
                        data={result.jsonResponse}
                        simulacao={result.simulacaoCalculo}
                        operacao={operacao}
                        consolidado={result.consolidado}
                    />
                )}

                {/* Footer */}
                <footer className="bg-white/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs py-5 mt-auto shadow-xs print:hidden backdrop-blur-xs">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center space-x-2">
                            <FileCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                Sistema Integrado de Auditoria & Execução Financeira MT
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">
                            Base normativa: RICMS/MT (Decreto 2.212/2014) • IN RFB 1.234/2012 • Lei 15.270/2025
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}