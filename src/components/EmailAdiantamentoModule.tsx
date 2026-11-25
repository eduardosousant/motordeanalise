import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { DispatchHistory } from '../adiantamento/components/DispatchHistory.tsx';
import { DispatchPreview } from '../adiantamento/components/DispatchPreview.tsx';
import { FinancialSummaryCards } from '../adiantamento/components/FinancialSummaryCards.tsx';
import { FiscalForm } from '../adiantamento/components/FiscalForm.tsx';
import { Header } from '../adiantamento/components/Header.tsx';
import { CalculoFiscalResultado, DespachoGerado, FiscalFormData } from '../adiantamento/types/fiscal.js';
import { aplicarSuprimentoFundos, adicionarTextoSuprimentoFundos } from '../adiantamento/utils/suprimentoFundos.js';
import { calcularFiscal } from '../adiantamento/utils/fiscalCalculations.js';
import { gerarTextoDespacho } from '../adiantamento/utils/dispatchGenerator.js';

const DEFAULT_FORM_DATA: FiscalFormData = {
  fornecedor: 'Tech Soluções e Informática Ltda',
  cnpj: '12.345.678/0001-90',
  responsavel: 'Carlos Eduardo Mendes',
  valorSolicitado: 3000,
  custoEstimado: 3000,
  tipoObjeto: 'servico',
  regimeTributario: 'simples',
  valorTotal: 2860,
  suprimentoFundos: false,
  metodoIrrf: 'aliquota',
  aliquotaIrrf: 4.8,
  valorIrrfFixo: 0,
  statusCadastro: 'regular',
  cnaeCodigo: '9521-5/00',
  cnaeDescricao: 'Reparação e manutenção de equipamentos de informática e periféricos',
  itemLc: '14.01',
  lcDescricao: 'Conserto, manutenção e conservação de máquinas e equipamentos',
  municipioIss: 'Vila Rica',
  retemIss: true,
  valorIss: 0,
  retemInss: false,
  servicoSujeitoCppMei: false,
  possuiSt: true,
  valorDescontoIcms: 0
};

const STORAGE_KEY_HISTORY = 'despacho_fiscal_history_v1';

export const EmailAdiantamentoModule: React.FC = () => {
  const [formData, setFormData] = useState<FiscalFormData>(DEFAULT_FORM_DATA);
  const [despachoGerado, setDespachoGerado] = useState<{ html: string; plainText: string } | null>(null);
  const [historico, setHistorico] = useState<DespachoGerado[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) as DespachoGerado[] : [];
    } catch (error) {
      console.error('Erro ao carregar histórico de despachos:', error);
      return [];
    }
  });
  const [isSavedInSession, setIsSavedInSession] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const calculoBase = useMemo(() => calcularFiscal(formData), [formData]);
  const calculo = useMemo(
    () => aplicarSuprimentoFundos(formData, calculoBase),
    [formData, calculoBase]
  );

  const gerarDespachoAtual = (data: FiscalFormData, calculoAtual: CalculoFiscalResultado) => {
    const resultado = gerarTextoDespacho(data, calculoAtual);
    return adicionarTextoSuprimentoFundos(data, resultado.html, resultado.plainText);
  };

  useEffect(() => {
    setDespachoGerado(gerarDespachoAtual(formData, calculo));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(historico));
    } catch (error) {
      console.warn('Erro ao salvar histórico de despachos:', error);
    }
  }, [historico]);

  const handleFormChange = (updated: Partial<FiscalFormData>) => {
    setFormData((previous) => {
      const next = { ...previous, ...updated };
      if (updated.tipoObjeto && updated.tipoObjeto !== previous.tipoObjeto) {
        if (updated.tipoObjeto === 'servico') {
          next.cnaeCodigo = next.cnaeCodigo === '4751-2/01' ? '9521-5/00' : next.cnaeCodigo;
          next.cnaeDescricao = next.cnaeDescricao === 'Comércio varejista especializado de equipamentos e suprimentos de informática'
            ? 'Reparação e manutenção de equipamentos de informática e periféricos'
            : next.cnaeDescricao;
          next.aliquotaIrrf = 4.8;
        } else {
          next.cnaeCodigo = next.cnaeCodigo === '9521-5/00' ? '4751-2/01' : next.cnaeCodigo;
          next.cnaeDescricao = next.cnaeDescricao === 'Reparação e manutenção de equipamentos de informática e periféricos'
            ? 'Comércio varejista especializado de equipamentos e suprimentos de informática'
            : next.cnaeDescricao;
          next.aliquotaIrrf = 1.2;
        }
      }
      setIsSavedInSession(false);
      return next;
    });
  };

  const handleGerarDespacho = () => {
    const calculoAtual = aplicarSuprimentoFundos(formData, calcularFiscal(formData));
    setDespachoGerado(gerarDespachoAtual(formData, calculoAtual));
    setIsSavedInSession(false);
    window.setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleReset = () => {
    setFormData({
      fornecedor: '', cnpj: '', responsavel: '', valorSolicitado: 0, custoEstimado: 0,
      tipoObjeto: 'servico', regimeTributario: 'simples', valorTotal: 0,
      suprimentoFundos: false, metodoIrrf: 'aliquota', aliquotaIrrf: 4.8, valorIrrfFixo: 0,
      statusCadastro: 'regular', cnaeCodigo: '9521-5/00', cnaeDescricao: 'Reparação e manutenção de equipamentos',
      itemLc: '14.01', lcDescricao: 'Conserto, manutenção e conservação de máquinas e equipamentos',
      municipioIss: '', retemIss: false, valorIss: 0, retemInss: false,
      servicoSujeitoCppMei: false, possuiSt: true, valorDescontoIcms: 0
    });
    setDespachoGerado(null);
    setIsSavedInSession(false);
  };

  const handleSaveToSession = () => {
    if (!despachoGerado) return;
    const novoItem: DespachoGerado = {
      id: Date.now().toString(),
      criadoEm: new Date().toISOString(),
      formData,
      calculo,
      htmlContent: despachoGerado.html,
      plainTextContent: despachoGerado.plainText
    };
    setHistorico((previous) => [novoItem, ...previous.slice(0, 19)]);
    setIsSavedInSession(true);
  };

  const handleLoadFromHistory = (item: DespachoGerado) => {
    setFormData(item.formData);
    setDespachoGerado({ html: item.htmlContent, plainText: item.plainTextContent });
    setIsSavedInSession(true);
    window.setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handlePrint = () => {
    const clearPrintMode = () => document.body.classList.remove('print-adiantamento');
    document.body.classList.add('print-adiantamento');
    window.addEventListener('afterprint', clearPrintMode, { once: true });
    window.print();
  };

  return (
    <div className="adiantamento-module -mx-4 -my-6 min-h-screen bg-slate-50 text-slate-900">
      <Header onGerarClick={handleGerarDespacho} onPrintClick={handlePrint} hasDespacho={!!despachoGerado} />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="print:hidden">
          <FinancialSummaryCards calculo={calculo} />
        </div>

        <div className="print:hidden bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <input
            type="checkbox"
            checked={!!formData.suprimentoFundos}
            onChange={(event) => handleFormChange({ suprimentoFundos: event.target.checked })}
            className="mt-0.5 rounded text-blue-900 focus:ring-blue-900"
          />
          <div>
            <div className="text-xs font-bold text-blue-950">Aquisição por Suprimento de Fundos</div>
            <div className="text-[11.5px] text-blue-900 mt-1">
              Quando selecionado, o IRRF é dispensado e o texto obrigatório da IN RFB nº 1.234/2012 é inserido nos dados adicionais da NF-e/NFS-e.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start w-full">
          <div className="xl:col-span-5 space-y-6 print:hidden">
            <FiscalForm formData={formData} onChange={handleFormChange} onReset={handleReset} />
          </div>
          <div className="xl:col-span-7 space-y-6" ref={previewRef}>
            {despachoGerado ? (
              <DispatchPreview
                htmlContent={despachoGerado.html}
                plainTextContent={despachoGerado.plainText}
                formData={formData}
                calculo={calculo}
                onSaveSession={handleSaveToSession}
                isSaved={isSavedInSession}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-900">Nenhum Despacho Gerado</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Preencha os dados do fornecedor e clique em “Gerar Despacho Oficial”.</p>
                <button type="button" onClick={handleGerarDespacho} className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg">
                  Gerar Agora
                </button>
              </div>
            )}
            <DispatchHistory
              historico={historico}
              onLoadDespacho={handleLoadFromHistory}
              onDeleteDespacho={(id) => setHistorico((previous) => previous.filter((item) => item.id !== id))}
              onClearHistorico={() => setHistorico([])}
            />
          </div>
        </div>
      </div>
      <footer className="no-print bg-white border-t border-slate-200 py-4 mt-8 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>Autarquia Estadual · Sistema de Orientação de Faturamento e Despachos</span>
          <div className="flex items-center gap-4">
            <span>IN RFB nº 1.234/2012</span><span>·</span><span>IN RFB nº 2.145/2023</span><span>·</span><span>LC nº 123/2006</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
