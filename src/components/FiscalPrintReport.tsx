import React from 'react';
import {
    AnaliseTributariaJSON,
    SimulacaoMemoriaCalculo,
    OperacaoComercial,
    AnaliseConsolidadaNota
} from '../types.js';
import { getCstInfo, checkProductSt } from '../lib/taxCalculations.js';

interface FiscalPrintReportProps {
    data: AnaliseTributariaJSON;
    simulacao: SimulacaoMemoriaCalculo;
    operacao: OperacaoComercial;
    consolidado?: AnaliseConsolidadaNota | null;
}

export const FiscalPrintReport: React.FC<FiscalPrintReportProps> = ({
                                                                        data,
                                                                        simulacao,
                                                                        operacao,
                                                                        consolidado
                                                                    }) => {
    const formatMoney = (val: number | undefined) => {
        return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const temMultiplosItens = Boolean(consolidado && consolidado.itensAnalise && consolidado.itensAnalise.length > 1);
    const dataEmissao = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const horaEmissao = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const isOptanteSimples = Boolean(data.resumo_fornecedor?.optante_simples || operacao.simples_remetente);
    const ncmAtual = data.enquadramento_produto?.ncm || operacao.ncm || '';
    const descAtual = data.enquadramento_produto?.descricao || operacao.descricao_produto || '';
    const regimeAtual = data.enquadramento_produto?.regime_tributario_aplicavel || '';
    const isSt = regimeAtual.includes('Substituição') || checkProductSt(ncmAtual, descAtual);

    const cstCalculado = getCstInfo(data, simulacao, isOptanteSimples);
    const valorBrutoTotal = simulacao.base_calculo_origem + (simulacao.valor_desconto_comercial || 0);

    // Texto de instrução e enquadramento formatado de forma dinâmica para Multi-Itens ou Item Único
    const textoOrientacaoConsolidado = temMultiplosItens && consolidado
        ? (isOptanteSimples
            ? `CONFORMIDADE FINANCEIRA DE COMPRAS PÚBLICAS (OT CGE-MT nº 03/2026): 1) FORNECEDOR SIMPLES NACIONAL (CSOSN 102/500): A isenção de ICMS do Art. 65 do Anexo IV NÃO se aplica. 2) A Nota Fiscal deve ser faturada pelo VALOR INTEGRAL da proposta sem desconto. 3) Dispensa de retenção de IRRF (Art. 4º, XI da IN RFB nº 1.234/2012).`
            : `CONFORMIDADE FINANCEIRA DE COMPRAS PÚBLICAS (IN RFB nº 1.234/2012 & OT CGE-MT nº 03/2026): 1) Operação com ${consolidado.itensAnalise.length} itens. Os produtos sob Substituição Tributária (CST 60) são faturados pelo valor integral e os produtos fora da ST (CST 40) exigem abatimento de 17% de ICMS desonerado. 2) Retenção na fonte de IRRF apurada ITEM A ITEM conforme enquadramento do Anexo I da IN RFB nº 1.234/2012 (incluindo 0,24% para combustíveis/GLP e 1,20% para mercadorias em geral), totalizando a retenção de ${formatMoney(consolidado.resumoConsolidado.total_irrf_retido)} no pagamento ao fornecedor.`)
        : data.orientacao_fiscal;

    // Quadro de fundamentação dinâmica para itens múltiplos
    const fundamentacaoExibicao = temMultiplosItens && consolidado
        ? [
            {
                artigo_anexo: "Orientação Técnica nº 03/2026 CGE-MT & RICMS/MT",
                dispositivo: "Decreto nº 2.212/2014-MT",
                resumo_regra: `Operação com ${consolidado.itensAnalise.length} itens: produtos enquadrados no Anexo X (ST) são faturados integralmente (CST 60) e itens fora da ST exigem abatimento obrigatório de 17% a título de ICMS desonerado (CST 40).`
            },
            {
                artigo_anexo: "IN RFB nº 1.234/2012 & STF Tema 1130 (RE 1.293.453)",
                dispositivo: "Instrução Normativa RFB nº 1.234/2012 (Anexo I)",
                resumo_regra: isOptanteSimples
                    ? "Dispensa de retenção na fonte do IRRF para fornecedor optante pelo Simples Nacional (Art. 4º, XI)."
                    : "Retenção na fonte de IRRF apurada item a item conforme alíquotas do Anexo I (0,24% para derivados de petróleo/GLP e 1,20% para bens em geral)."
            }
        ]
        : data.fundamentacao_legal;

    return (
        <div
            id="fiscal-print-report"
            className="hidden print:block"
            style={{
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif',
                padding: '28px 32px',
                lineHeight: 1.45,
                fontSize: '11px',
                boxSizing: 'border-box',
                width: '800px',
                maxWidth: '800px',
                margin: '0 auto'
            }}
        >
            {/* CABEÇALHO OFICIAL GOVERNAMENTAL */}
            <header
                style={{
                    borderBottom: '2px solid #064e3b',
                    paddingBottom: '14px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/*
                    <div
                        style={{
                            width: '44px',
                            height: '44px',
                            backgroundColor: '#064e3b',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            boxShadow: '0 2px 4px rgba(6, 78, 59, 0.2)'
                        }}
                    >
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="m9 12 2 2 4-4" />
                        </svg>
                    </div>
                    */}
                    {/* INSERÇÃO DO LOGOTIPO OFICIAL */}
                    <img
                        src="/detranmt.png"
                        alt="Logotipo Oficial"
                        style={{
                            height: '48px',
                            width: 'auto',
                            maxWidth: '120px',
                            objectFit: 'contain'
                        }}
                    />
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1px' }}>
              <span
                  style={{
                      color: '#000000',
                      fontSize: '9.5px',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                  }}
              >
                ESTADO DE MATO GROSSO
              </span>
                            <span style={{ color: '#cbd5e1' }}>•</span>
                            <span style={{ fontSize: '9px', color: '#000000', fontWeight: 700, letterSpacing: '0.2px' }}>
                 DETRAN-MT / Gerência de Execução Financeira
              </span>
                        </div>
                        <h1
                            style={{
                                fontSize: '13.5px',
                                fontWeight: 800,
                                color: '#000000',
                                textTransform: 'uppercase',
                                letterSpacing: '0.2px',
                                margin: '1px 0 0 0'
                            }}
                        >
                            Parecer Técnico de Enquadramento Tributário e Retenção
                        </h1>
                        <p style={{ fontSize: '8.5px', color: '#475569', margin: '0px 0 0 0', fontWeight: 500 }}>
                            Auditoria de ICMS (RICMS/MT Decreto nº 2.212/2014) • Retenção IRRF (IN RFB nº 1.234/2012) • Orientação CGE nº 03/2026
                        </p>
                    </div>
                </div>

                <div
                    style={{
                        textAlign: 'right',
                        minWidth: '150px'
                    }}
                >
                    <div style={{ fontSize: '8.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.4px' }}>
                        Data da Emissão
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', marginTop: '1px' }}>
                        {dataEmissao} às {horaEmissao}
                    </div>
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* 1. DADOS DO FORNECEDOR E DA OPERAÇÃO */}
                <section
                    style={{
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: '#ffffff'
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#f1f5f9',
                            padding: '6px 12px',
                            borderBottom: '1px solid #cbd5e1',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
            <span style={{ fontWeight: 800, fontSize: '10.5px', color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              1. Qualificação das Partes e Cadastro Fiscal
            </span>
                        <span style={{ fontSize: '9px', fontWeight: 600, color: '#475569' }}>
              Consulta Integrada RFB / SEFAZ-MT
            </span>
                    </div>

                    <div style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '8px 12px', fontSize: '10px' }}>
                            <div>
                <span style={{ color: '#64748b', fontSize: '8.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Razão Social do Fornecedor:
                </span>
                                <strong style={{ color: '#0f172a', fontSize: '11px', display: 'block', marginTop: '1px' }}>
                                    {data.resumo_fornecedor.razao_social || operacao.razao_social_fornecedor || 'Fornecedor Identificado'}
                                </strong>
                            </div>

                            <div>
                <span style={{ color: '#64748b', fontSize: '8.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  CNPJ do Estabelecimento:
                </span>
                                <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '11px', display: 'block', marginTop: '1px' }}>
                                    {data.resumo_fornecedor.cnpj || operacao.cnpj_fornecedor || '00.000.000/0000-00'}
                                </strong>
                            </div>

                            <div>
                <span style={{ color: '#64748b', fontSize: '8.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Regime Tributário Federal:
                </span>
                                <strong style={{ color: isOptanteSimples ? '#b45309' : '#065f46', fontSize: '11px', display: 'block', marginTop: '1px' }}>
                                    {isOptanteSimples ? 'Simples Nacional (LC 123/06)' : 'Regime Normal (Demais)'}
                                </strong>
                            </div>
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1.4fr 1fr 1fr',
                                gap: '8px 12px',
                                fontSize: '10px',
                                marginTop: '8px',
                                paddingTop: '8px',
                                borderTop: '1px solid #f1f5f9'
                            }}
                        >
                            <div>
                <span style={{ color: '#64748b', fontSize: '8.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Fluxo da Operação Interestadual:
                </span>
                                <strong style={{ color: '#0f172a', fontSize: '10px' }}>
                                    Origem: {operacao.uf_origem || 'MT'} ➔ Destino: MT
                                </strong>
                            </div>

                            <div>
                <span style={{ color: '#64748b', fontSize: '8.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Natureza do Adquirente:
                </span>
                                <strong style={{ color: '#0f172a', fontSize: '10px' }}>
                                    {operacao.tipo_adquirente === 'ORGAO_PUBLICO_ESTADUAL' ? 'Órgão Público Estadual de MT' : 'Contribuinte / Privado'}
                                </strong>
                            </div>

                            <div>
                <span style={{ color: '#64748b', fontSize: '8.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Finalidade da Compra:
                </span>
                                <strong style={{ color: '#0f172a', fontSize: '10px' }}>
                                    {operacao.finalidade_compra === 'ORGAO_PUBLICO_CONSUMO' ? 'Uso e Consumo Órgão Público' : 'Comercialização / Revenda'}
                                </strong>
                            </div>
                        </div>

                        <div
                            style={{
                                marginTop: '8px',
                                padding: '6px 10px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '4px',
                                fontSize: '9px',
                                color: '#334155',
                                borderLeft: '3.5px solid #064e3b',
                                lineHeight: 1.45,
                                textAlign: 'justify'
                            }}
                        >
                            <strong style={{ color: '#064e3b' }}>Enquadramento de Porte e Regime: </strong>
                            Fornecedor enquadrado no {operacao.porte_remetente || data.resumo_fornecedor.porte || 'EPP'} ({isOptanteSimples ? 'Optante pelo Simples Nacional' : 'Regime Normal'}). {textoOrientacaoConsolidado}
                        </div>
                    </div>
                </section>

                {/* 2. DISCRIMINAÇÃO DOS ITENS E ENQUADRAMENTO FISCAL */}
                {temMultiplosItens && consolidado ? (
                    <section
                        style={{
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff'
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: '#f1f5f9',
                                padding: '6px 12px',
                                borderBottom: '1px solid #cbd5e1',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
              <span style={{ fontWeight: 800, fontSize: '10.5px', color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                2. Discriminação dos Produtos e Enquadramento Fiscal ({consolidado.itensAnalise.length} itens)
              </span>
                            <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#065f46' }}>
                Total Bruto: {formatMoney(consolidado.resumoConsolidado.total_valor_bruto)}
              </span>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', tableLayout: 'auto' }}>
                            <thead>
                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#334155' }}>
                                <th style={{ padding: '6px 4px', width: '18px', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>#</th>
                                <th style={{ padding: '6px 6px', width: '68px', fontWeight: 700, whiteSpace: 'nowrap' }}>NCM</th>
                                <th style={{ padding: '6px 4px', width: '50px', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>CST/CSOSN</th>
                                <th style={{ padding: '6px 8px', fontWeight: 700 }}>Descrição da Mercadoria</th>
                                <th style={{ padding: '6px 4px', textAlign: 'center', width: '26px', fontWeight: 700, whiteSpace: 'nowrap' }}>Qtd</th>
                                <th style={{ padding: '6px 6px', textAlign: 'right', width: '70px', fontWeight: 700, whiteSpace: 'nowrap' }}>Valor Bruto</th>
                                <th style={{ padding: '6px 6px', textAlign: 'right', width: '72px', color: '#b45309', fontWeight: 700, whiteSpace: 'nowrap' }}>Desc. Com.</th>
                                <th style={{ padding: '6px 6px', width: '80px', fontWeight: 700 }}>Regime MT</th>
                                <th style={{ padding: '6px 6px', textAlign: 'right', width: '70px', fontWeight: 700, whiteSpace: 'nowrap' }}>Desc. Isenção</th>
                                <th style={{ padding: '6px 6px', textAlign: 'right', width: '65px', fontWeight: 700, whiteSpace: 'nowrap' }}>IRRF</th>
                                <th style={{ padding: '6px 8px', textAlign: 'right', width: '75px', fontWeight: 700, whiteSpace: 'nowrap' }}>Líquido Pagar</th>
                            </tr>
                            </thead>
                            <tbody>
                            {consolidado.itensAnalise.map((it, idx) => {
                                const cstInfo = getCstInfo(it.jsonResponse, it.simulacao, isOptanteSimples);
                                const valorBrutoItem = (it.item.quantidade || 1) * (it.item.valor_unitario || 0);
                                const liquidoItem = it.simulacao.valor_liquido_pagamento_fornecedor !== undefined
                                    ? it.simulacao.valor_liquido_pagamento_fornecedor
                                    : (it.simulacao.valor_liquido_com_desconto !== undefined ? it.simulacao.valor_liquido_com_desconto : valorBrutoItem);

                                return (
                                    <tr
                                        key={idx}
                                        style={{
                                            borderBottom: '1px solid #e2e8f0',
                                            backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                                        }}
                                    >
                                        <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>
                                            {idx + 1}
                                        </td>
                                        <td style={{ padding: '5px 6px', fontFamily: 'monospace', fontWeight: 700, color: '#047857', whiteSpace: 'nowrap' }}>
                                            {it.item.ncm}
                                        </td>
                                        <td style={{ padding: '5px 4px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, fontSize: '9px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                                            {cstInfo.codigo}
                                        </td>
                                        <td style={{ padding: '5px 8px', fontWeight: 500, color: '#0f172a', lineHeight: 1.25 }}>
                                            {it.item.descricao}
                                        </td>
                                        <td style={{ padding: '5px 4px', textAlign: 'center', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                            {it.item.quantidade}
                                        </td>
                                        <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                            {formatMoney(valorBrutoItem)}
                                        </td>
                                        <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: 'monospace', color: '#b45309', fontWeight: it.item.valor_desconto_comercial ? 700 : 400, whiteSpace: 'nowrap' }}>
                                            {it.item.valor_desconto_comercial ? `- ${formatMoney(it.item.valor_desconto_comercial)}` : '-'}
                                        </td>
                                        <td style={{ padding: '5px 6px', fontSize: '8px', color: '#475569', lineHeight: 1.2 }}>
                                            {it.jsonResponse.enquadramento_produto.regime_tributario_aplicavel}
                                        </td>
                                        <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: 'monospace', color: it.simulacao.desconto_isencao_orgao_publico ? '#b45309' : '#94a3b8', fontWeight: it.simulacao.desconto_isencao_orgao_publico ? 700 : 400, whiteSpace: 'nowrap' }}>
                                            {it.simulacao.desconto_isencao_orgao_publico ? `- ${formatMoney(it.simulacao.desconto_isencao_orgao_publico)}` : 'R$ 0,00'}
                                        </td>
                                        <td style={{ padding: '5px 6px', textAlign: 'right', fontFamily: 'monospace', color: it.simulacao.valor_irrf_retido ? '#b91c1c' : '#94a3b8', fontWeight: it.simulacao.valor_irrf_retido ? 700 : 400, whiteSpace: 'nowrap' }}>
                                            {it.simulacao.valor_irrf_retido ? `- ${formatMoney(it.simulacao.valor_irrf_retido)}` : 'R$ 0,00'}
                                        </td>
                                        <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#065f46', backgroundColor: '#f0fdf4', whiteSpace: 'nowrap' }}>
                                            {formatMoney(liquidoItem)}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                            <tfoot>
                            <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #cbd5e1', fontWeight: 700, fontSize: '9.5px' }}>
                                <td colSpan={5} style={{ padding: '6px 8px', textAlign: 'right', color: '#0f172a', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                                    TOTAIS CONSOLIDADOS DA NOTA:
                                </td>
                                <td style={{ padding: '6px 6px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a', whiteSpace: 'nowrap' }}>
                                    {formatMoney(consolidado.resumoConsolidado.total_valor_bruto)}
                                </td>
                                <td style={{ padding: '6px 6px', textAlign: 'right', fontFamily: 'monospace', color: '#b45309', whiteSpace: 'nowrap' }}>
                                    {consolidado.resumoConsolidado.total_desconto_comercial > 0 ? `- ${formatMoney(consolidado.resumoConsolidado.total_desconto_comercial)}` : '-'}
                                </td>
                                <td></td>
                                <td style={{ padding: '6px 6px', textAlign: 'right', fontFamily: 'monospace', color: '#b45309', whiteSpace: 'nowrap' }}>
                                    {consolidado.resumoConsolidado.total_desconto_isencao_icms > 0 ? `- ${formatMoney(consolidado.resumoConsolidado.total_desconto_isencao_icms)}` : 'R$ 0,00'}
                                </td>
                                <td style={{ padding: '6px 6px', textAlign: 'right', fontFamily: 'monospace', color: '#b91c1c', whiteSpace: 'nowrap' }}>
                                    {consolidado.resumoConsolidado.total_irrf_retido > 0 ? `- ${formatMoney(consolidado.resumoConsolidado.total_irrf_retido)}` : 'R$ 0,00'}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', color: '#065f46', backgroundColor: '#dcfce7', fontSize: '10px', whiteSpace: 'nowrap' }}>
                                    {formatMoney(consolidado.resumoConsolidado.total_liquido_pagar_fornecedor)}
                                </td>
                            </tr>
                            </tfoot>
                        </table>
                    </section>
                ) : (
                    /* PRODUTO ÚNICO */
                    <section
                        style={{
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff'
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: '#f1f5f9',
                                padding: '6px 12px',
                                borderBottom: '1px solid #cbd5e1',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
              <span style={{ fontWeight: 800, fontSize: '10.5px', color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                2. Enquadramento da Mercadoria e Dados do Item
              </span>
                            <span style={{ fontSize: '9.5px', fontFamily: 'monospace', fontWeight: 700, color: '#047857' }}>
                NCM: {ncmAtual}
              </span>
                        </div>

                        <div style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.2fr', gap: '8px 12px', fontSize: '10px' }}>
                                <div>
                  <span style={{ color: '#64748b', fontSize: '8.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                    Descrição do Produto / Mercadoria:
                  </span>
                                    <strong style={{ color: '#0f172a', fontSize: '11px', display: 'block', marginTop: '1px' }}>
                                        {descAtual || 'Mercadoria Adquirida'}
                                    </strong>
                                </div>

                                <div>
                  <span style={{ color: '#64748b', fontSize: '8.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                    Regime Tributário em MT:
                  </span>
                                    <strong style={{ color: '#0f172a', fontSize: '10.5px', display: 'block', marginTop: '1px' }}>
                                        {regimeAtual || 'Substituição Tributária'}
                                    </strong>
                                </div>

                                <div>
                  <span style={{ color: '#64748b', fontSize: '8.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                    Código CST / CSOSN Sugerido:
                  </span>
                                    <strong style={{ color: '#0f172a', fontSize: '11px', display: 'block', marginTop: '1px', fontFamily: 'monospace' }}>
                                        {cstCalculado.codigo} - {cstCalculado.descricao}
                                    </strong>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1.4fr 1fr 1.2fr',
                                    gap: '8px 12px',
                                    fontSize: '10px',
                                    marginTop: '8px',
                                    paddingTop: '8px',
                                    borderTop: '1px solid #f1f5f9'
                                }}
                            >
                                <div>
                  <span style={{ color: '#64748b', fontSize: '8.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                    Valor Total Bruto:
                  </span>
                                    <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '11px' }}>
                                        {formatMoney(valorBrutoTotal)}
                                    </strong>
                                </div>

                                <div>
                  <span style={{ color: '#64748b', fontSize: '8.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                    Desconto Comercial Incondicional:
                  </span>
                                    <strong style={{ color: simulacao.valor_desconto_comercial ? '#b45309' : '#0f172a', fontFamily: 'monospace', fontSize: '10.5px' }}>
                                        {simulacao.valor_desconto_comercial ? `- ${formatMoney(simulacao.valor_desconto_comercial)}` : 'R$ 0,00'}
                                    </strong>
                                </div>

                                <div>
                  <span style={{ color: '#64748b', fontSize: '8.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                    Base de Cálculo Efetiva (Líquida):
                  </span>
                                    <strong style={{ color: '#047857', fontFamily: 'monospace', fontSize: '10.5px' }}>
                                        {formatMoney(simulacao.base_calculo_origem)}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* 3. ALÍQUOTAS E QUADRO DE FUNDAMENTAÇÃO LEGAL */}
                <section
                    style={{
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: '#ffffff'
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#f1f5f9',
                            padding: '6px 12px',
                            borderBottom: '1px solid #cbd5e1',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
            <span style={{ fontWeight: 800, fontSize: '10.5px', color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              3. Alíquotas e Fundamentação Normativa (RICMS/MT Decreto nº 2.212/2014)
            </span>
                        <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 600 }}>
              Livro 27 SEFAZ/MT
            </span>
                    </div>

                    <div style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                            <div>
                <span style={{ color: '#64748b', fontSize: '8.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Alíquota Interestadual Origem:
                </span>
                                <strong style={{ color: '#0f172a', fontSize: '11px', fontFamily: 'monospace', display: 'block', marginTop: '2px' }}>
                                    {data.aliquotas.aliquota_origem || '0.0%'}
                                </strong>
                            </div>

                            <div>
                <span style={{ color: '#64748b', fontSize: '8.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Alíquota Interna MT:
                </span>
                                <strong style={{ color: '#0f172a', fontSize: '11px', fontFamily: 'monospace', display: 'block', marginTop: '2px' }}>
                                    {data.aliquotas.aliquota_interna_mt || '17.0%'}
                                </strong>
                            </div>

                            <div>
                <span style={{ color: '#64748b', fontSize: '8.5px', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  MVA / Pauta ST:
                </span>
                                <strong style={{ color: '#0f172a', fontSize: '11px', fontFamily: 'monospace', display: 'block', marginTop: '2px' }}>
                                    {data.aliquotas.mva_ou_pauta || 'Conforme Anexo X'}
                                </strong>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {fundamentacaoExibicao && fundamentacaoExibicao.map((f, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            paddingLeft: '8px',
                                            borderLeft: '2.5px solid #064e3b',
                                            fontSize: '9px',
                                            color: '#334155',
                                            lineHeight: 1.35
                                        }}
                                    >
                                        <strong style={{ color: '#0f172a' }}>{f.artigo_anexo} ({f.dispositivo}):</strong> {f.resumo_regra}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. DEMONSTRATIVO FINANCEIRO E FECHAMENTO DA NOTA FISCAL */}
                <section
                    style={{
                        border: '2px solid #064e3b',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: '#ffffff'
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#064e3b',
                            color: '#ffffff',
                            padding: '6px 12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
            <span style={{ fontWeight: 800, fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              4. Fechamento Financeiro e Memória de Cálculo da Despesa
            </span>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#a7f3d0' }}>
              Liquidação da Fatura & Arrecadação SEFAZ/MT
            </span>
                    </div>

                    <div style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '8px' }}>

                            {/* Coluna Esquerda: Demonstração da Liquidação do Fornecedor */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '10px',
                                        padding: '5px 8px',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: '4px',
                                        border: '1px solid #e2e8f0'
                                    }}
                                >
                                    <span style={{ color: '#475569', fontWeight: 600 }}>Total dos Produtos (Bruto):</span>
                                    <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '10.5px' }}>
                                        {formatMoney(valorBrutoTotal)}
                                    </strong>
                                </div>

                                {simulacao.valor_desconto_comercial !== undefined && simulacao.valor_desconto_comercial > 0 && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '10px',
                                            padding: '5px 8px',
                                            backgroundColor: '#fffbeb',
                                            borderRadius: '4px',
                                            border: '1px solid #fef3c7',
                                            color: '#b45309',
                                            fontWeight: 700
                                        }}
                                    >
                                        <span>(-) Desconto Comercial Incondicional:</span>
                                        <span style={{ fontFamily: 'monospace' }}>- {formatMoney(simulacao.valor_desconto_comercial)}</span>
                                    </div>
                                )}

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '10px',
                                        padding: '5px 8px',
                                        backgroundColor: '#f0fdf4',
                                        borderRadius: '4px',
                                        border: '1px solid #bbf7d0',
                                        color: '#047857',
                                        fontWeight: 700
                                    }}
                                >
                                    <span>(=) Base de Cálculo Líquida Faturada:</span>
                                    <span style={{ fontFamily: 'monospace' }}>{formatMoney(simulacao.base_calculo_origem)}</span>
                                </div>

                                {simulacao.desconto_isencao_orgao_publico !== undefined && simulacao.desconto_isencao_orgao_publico > 0 && !isOptanteSimples && !isSt ? (
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '10px',
                                            padding: '5px 8px',
                                            backgroundColor: '#fef3c7',
                                            borderRadius: '4px',
                                            border: '1px solid #fcd34d',
                                            color: '#92400e',
                                            fontWeight: 700
                                        }}
                                    >
                                        <span>(-) Desconto Isenção ICMS (Art. 2º Anexo I):</span>
                                        <span style={{ fontFamily: 'monospace' }}>- {formatMoney(simulacao.desconto_isencao_orgao_publico)}</span>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '9px',
                                            padding: '5px 8px',
                                            backgroundColor: '#f8fafc',
                                            borderRadius: '4px',
                                            border: '1px solid #e2e8f0',
                                            color: '#64748b'
                                        }}
                                    >
                                        <span>Isenção de ICMS no Preço:</span>
                                        <span>Inaplicável (Sem Dedução - {isOptanteSimples ? 'Simples Nacional' : 'Item sob ST'})</span>
                                    </div>
                                )}

                                {simulacao.valor_irrf_retido !== undefined && simulacao.valor_irrf_retido > 0 && !isOptanteSimples ? (
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '10px',
                                            padding: '5px 8px',
                                            backgroundColor: '#eff6ff',
                                            borderRadius: '4px',
                                            border: '1px solid #bfdbfe',
                                            color: '#1d4ed8',
                                            fontWeight: 700
                                        }}
                                    >
                                        <span>(-) Retenção IRRF (IN RFB nº 1.234/2012):</span>
                                        <span style={{ fontFamily: 'monospace' }}>- {formatMoney(simulacao.valor_irrf_retido)}</span>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '9px',
                                            padding: '5px 8px',
                                            backgroundColor: '#f8fafc',
                                            borderRadius: '4px',
                                            border: '1px solid #e2e8f0',
                                            color: '#64748b'
                                        }}
                                    >
                                        <span>Retenção IRRF na Fonte:</span>
                                        <span>Dispensada (Optante Simples Nacional)</span>
                                    </div>
                                )}

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '10.5px',
                                        fontWeight: 800,
                                        padding: '6px 8px',
                                        backgroundColor: '#ecfdf5',
                                        borderRadius: '4px',
                                        border: '1.5px solid #059669',
                                        color: '#065f46',
                                        marginTop: '2px'
                                    }}
                                >
                                    <span>VALOR LÍQUIDO A PAGAR AO FORNECEDOR:</span>
                                    <span style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>
                    {formatMoney(simulacao.valor_liquido_pagamento_fornecedor || (simulacao.base_calculo_origem - (simulacao.valor_irrf_retido || 0)))}
                  </span>
                                </div>
                            </div>

                            {/* Coluna Direita: Obrigações SEFAZ/MT */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div
                                    style={{
                                        backgroundColor: '#f8fafc',
                                        padding: '8px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid #cbd5e1',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <div>
                    <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', letterSpacing: '0.3px' }}>
                      Arrecadação Estadual SEFAZ/MT
                    </span>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', marginTop: '4px' }}>
                                            <span style={{ color: '#64748b' }}>ICMS Substituição Tributária (ST):</span>
                                            <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{formatMoney(simulacao.icms_st_recolher || 0)}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', marginTop: '3px' }}>
                                            <span style={{ color: '#64748b' }}>ICMS DIFAL MT:</span>
                                            <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{formatMoney(simulacao.valor_difal_mt || 0)}</strong>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            borderTop: '1px solid #cbd5e1',
                                            paddingTop: '6px',
                                            marginTop: '6px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#0f172a' }}>TOTAL ICMS MT A RECOLHER:</span>
                                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#064e3b', fontFamily: 'monospace' }}>
                      {formatMoney(simulacao.total_recolher_mt)}
                    </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Caixa de Orientação Conclusiva de Faturamento e Pagamento */}
                        <div
                            style={{
                                backgroundColor: '#f8fafc',
                                borderLeft: '3.5px solid #064e3b',
                                padding: '6px 10px',
                                fontSize: '9px',
                                color: '#1e293b',
                                borderRadius: '0 4px 4px 0',
                                lineHeight: 1.45,
                                textAlign: 'justify'
                            }}
                        >
                            <strong style={{ color: '#064e3b' }}>Instruções para Faturamento, Ateste e Liquidação: </strong>
                            {textoOrientacaoConsolidado}
                        </div>
                    </div>
                </section>

                {/* 🏛️ RODAPÉ INSTITUCIONAL */}
                <footer
                    style={{
                        paddingTop: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '8px',
                        color: '#64748b',
                        borderTop: '1px solid #e2e8f0'
                    }}
                >
                    <div>
                        Parecer fundamentado no RICMS/MT (Dec. 2.212/2014), IN RFB 1.234/2012 e Orientação Técnica CGE nº 03/2026.
                    </div>
                </footer>

            </div>
        </div>
    );
};