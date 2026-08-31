import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Header } from './components/Header.tsx';
import { ThemeSwitcherBar } from './components/ThemeSwitcherBar.tsx';
import { ExemplosPraticosBar } from './components/ExemplosPraticosBar.tsx';
import { HistoricoAnalises } from './components/HistoricoAnalises.tsx';
import { CnpjCard } from './components/CnpjCard.tsx';
import { OperationForm } from './components/OperationForm.tsx';
import { AnalysisResultView } from './components/AnalysisResultView.tsx';
import { FiscalPrintReport } from './components/FiscalPrintReport.tsx';
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
import { AlertCircle, FileCheck } from 'lucide-react';

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
  const [theme, setTheme] = useState<AppTheme>('GOV_CLASSIC');
  const [showThemeBar, setShowThemeBar] = useState(false);
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
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao ler historico local:', e);
    }
    return [];
  });

  // Trigger initial analysis on mount
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
      // Remove item idêntico recente para evitar duplicatas consecutivas
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

  const runAnalysis = async (opToRun?: OperacaoComercial) => {
    const targetOp = opToRun || operacao;
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
        } else if (!res.ok) {
          if (contentType.includes('application/json')) {
            const errJson = await res.json();
            console.warn('[TAX ENGINE] API retornou erro:', errJson.error);
          } else {
            console.warn('[TAX ENGINE] Servidor retornou resposta não-JSON (status ' + res.status + '). Utilizando motor de análise local.');
          }
        }
      } catch (networkErr: any) {
        console.warn('[TAX ENGINE] Falha de rede ao acessar /api/analise-tributaria. Utilizando motor determinístico local:', networkErr?.message || networkErr);
      }

      // Se a API não respondeu com JSON válido, executa o motor determinístico SEFAZ/MT localmente
      if (!data) {
        data = computeConsolidatedNotaLocal(targetOp);
      }

      setResult(data);

      // Salva automaticamente no histórico local (máximo 5 análises)
      saveToHistory(targetOp, supplierData, data);
    } catch (err: any) {
      console.error('[TAX ENGINE] Erro inesperado na análise:', err);
      // Garante execução de fallback à prova de falhas
      try {
        const fallbackData = computeConsolidatedNotaLocal(targetOp);
        setResult(fallbackData);
        saveToHistory(targetOp, supplierData, fallbackData);
      } catch (finalErr: any) {
        setError('Não foi possível concluir a análise tributária: ' + (finalErr.message || 'Erro nos parâmetros'));
      }
    } finally {
      setLoading(false);
    }
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
    setSupplierData({
      cnpj: op.cnpj_fornecedor,
      razao_social: op.razao_social_fornecedor || 'Fornecedor de Exemplo',
      porte: op.porte_remetente || 'ME',
      optante_simples: Boolean(op.simples_remetente),
      optante_simei: false,
      uf: op.uf_origem,
      municipio: 'São Paulo',
      fonte_api: 'Caso Prático Pré-carregado'
    });
    runAnalysis(op);
  };

  const handleOperacaoChange = (updated: Partial<OperacaoComercial>) => {
    setOperacao(prev => {
      const nextOp = { ...prev, ...updated };
      // Se já temos um resultado na tela, recalcula a memória de cálculo instantaneamente em tempo real
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

      // Temporarily reveal offscreen for html2canvas rendering
      reportElement.classList.remove('hidden');
      reportElement.classList.add('block', 'fixed', 'top-0', 'left-[-9999px]', 'w-[800px]', 'z-[-9999]', 'bg-white');

      const canvas = await html2canvas(reportElement, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        onclone: (clonedDoc) => {
          // 1. Remove Tailwind stylesheet in cloned doc so html2canvas doesn't choke on oklch variables
          const styleElements = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styleElements.forEach((styleEl) => {
            if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
              styleEl.textContent = styleEl.textContent.replace(/oklch\([^)]+\)/g, 'transparent');
            }
          });

          // 2. Ensure cloned report element is cleanly positioned, visible and correctly sized
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

      // Restore original visibility classes
      reportElement.classList.add('hidden');
      reportElement.classList.remove('block', 'fixed', 'top-0', 'left-[-9999px]', 'w-[800px]', 'z-[-9999]', 'bg-white');

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Margens padrão A4 (8mm para máxima área útil)
      const marginX = 8;
      const marginY = 8;

      const imgWidth = pageWidth - (marginX * 2); // 194mm
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
      const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-'); // Formato DD-MM-AAAA

      pdf.save(`Parecer_Fiscal_MT_${cnpjLimpo}_${dataHoje}.pdf`);

    } catch (err) {
      console.error('Erro ao gerar PDF com jsPDF:', err);
      alert('Erro ao gerar arquivo PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Classes de fundo e estilo de acordo com o tema selecionado
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
    <div className={`min-h-screen font-sans antialiased flex flex-col transition-colors duration-300 ${getThemeWrapperClass()}`}>
      <Header
        onReset={handleReset}
        onPrint={handlePrint}
        onExportPdf={handleExportPdf}
        isExportingPdf={isExportingPdf}
        currentTheme={theme}
        onSelectTheme={setTheme}
        showThemeBar={showThemeBar}
        onToggleThemeBar={() => setShowThemeBar(!showThemeBar)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 print:hidden">
        {/* Barra de Seleção e Prévia de Temas */}
        {showThemeBar && (
          <ThemeSwitcherBar
            currentTheme={theme}
            onSelectTheme={(t) => setTheme(t)}
          />
        )}

        {/* Presets Toolbar */}
        <ExemplosPraticosBar onSelectExemplo={handleSelectExemplo} currentTheme={theme} />

        {/* Input Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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

        {/* Error message */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 text-xs shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <div>
              <strong className="block font-bold">Falha ao processar análise tributária:</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Histórico Local de Análises (localStorage com até 5 simulações) */}
        <HistoricoAnalises
          historico={historico}
          onRestore={handleRestoreHistory}
          onDelete={handleDeleteHistory}
          onClear={handleClearHistory}
          currentOperacao={operacao}
          currentResult={result}
          currentTheme={theme}
        />

        {/* Result view */}
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
      </main>

      {/* Printable Report for Browser Print (Ctrl+P / Command+P) */}
      {result && (
        <FiscalPrintReport
          data={result.jsonResponse}
          simulacao={result.simulacaoCalculo}
          operacao={operacao}
          consolidado={result.consolidado}
        />
      )}

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs py-5 mt-auto shadow-sm print:hidden backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Motor de Análise Tributária MT • Decreto nº 2.212/2014-MT
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Base legal: RICMS/MT, Anexo V, Anexo X, Estimativa Simplificada & LC 123/2006
          </p>
        </div>
      </footer>
    </div>
  );
}
