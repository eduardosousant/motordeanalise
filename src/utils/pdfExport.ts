import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnaliseFiscalResponse } from '../types/fiscal';
import { formatarMoeda, formatarData } from './formatters';

export function gerarRelatorioPdf(analise: AnaliseFiscalResponse): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  let currentY = 16;

  // 1. Cabeçalho Institucional
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PARECER TÉCNICO DE CONFORMIDADE FISCAL E PREVIDENCIÁRIA', marginX, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    'Auditoria de Adiantamentos • Suprimento de Fundos • Análise de Custo Efetivo Global & Art. 18-B (LC 123/2006)',
    marginX,
    16
  );

  currentY = 32;

  // 2. Metadados do Processo
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. IDENTIFICAÇÃO DO PROCESSO DE ADIANTAMENTO', marginX, currentY);
  currentY += 5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const numProc = analise.servico.numeroAdiantamento || 'N/A';
  const responsavel = analise.servico.solicitante || 'Não informado';
  const centroCusto = analise.servico.departamento || 'Geral';
  const dataFormatada = formatarData(analise.dataAnalise);

  const dadosIdentificacao = [
    [
      `Processo / Protocolo: ${numProc}`,
      `Data do Parecer: ${dataFormatada}`,
      `Identificador: ${analise.idAnalise}`,
    ],
    [
      `Responsável / Solicitante: ${responsavel}`,
      `Centro de Custos: ${centroCusto}`,
      `CNAE do Serviço: ${analise.servico.cnae}`,
    ],
    [
      `Objeto do Serviço: ${analise.servico.descricao}`,
      '',
      `Descrição CNAE: ${analise.descricaoCnaeServico}`,
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    body: dadosIdentificacao,
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 1.5,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { cellWidth: 60 },
      2: { cellWidth: 50 },
    },
    margin: { left: marginX, right: marginX },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 3. Parecer Técnico Conclusivo e Fornecedor Indicado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. PARECER CONCLUSIVO E RECOMENDAÇÃO TÉCNICA', marginX, currentY);
  currentY += 4;

  // Caixa de Destaque da Recomendação
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(marginX, currentY, pageWidth - marginX * 2, 28, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, currentY, pageWidth - marginX * 2, 28, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(21, 128, 61); // emerald-700
  doc.text(`PROPOSTA RECOMENDADA: ${analise.melhorOrcamento.razaoSocial}`, marginX + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);

  const textoParecer = doc.splitTextToSize(analise.parecerConclusivo, pageWidth - marginX * 2 - 8);
  doc.text(textoParecer, marginX + 4, currentY + 12);

  currentY += 34;

  // 4. Quadro Comparativo de Custos Efetivos e Riscos Fiscais
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. QUADRO DEMONSTRATIVO DE CUSTO EFETIVO GLOBAL', marginX, currentY);
  currentY += 3;

  const tableRows = analise.resultados.map((r, idx) => {
    let compatTexto = 'Incompatível';
    if (r.compatibilidadeCNAE === 'compativel') {
      compatTexto = r.origemCompatibilidade === 'secundario'
        ? `Compatível (Secundário)\n[${r.cnaeCompativelEncontrado}]`
        : `Compatível (Principal)\n[${r.cnaePrestador}]`;
    } else if (r.compatibilidadeCNAE === 'parcial') {
      compatTexto = `Subclasse\n[${r.cnaePrestador}]`;
    }

    const incideTexto = r.incideCPP18B
      ? `Sim (20%)\n+${formatarMoeda(r.valorCPP)}`
      : 'Não (0%)';

    const diferencaTexto = r.diferencaParaMelhor === 0
      ? 'MENOR CUSTO'
      : `+${formatarMoeda(r.diferencaParaMelhor)}\n(+${((r.diferencaPercentual || 0) * 100).toFixed(1)}%)`;

    return [
      String(idx + 1),
      `${r.razaoSocial}\nCNPJ: ${r.cnpj}\n(${r.regimeTributario.replace('_', ' ')})`,
      formatarMoeda(r.valorNominal),
      incideTexto,
      formatarMoeda(r.custoEfetivoTotal),
      diferencaTexto,
      compatTexto,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'Pos.',
        'Razão Social / CNPJ / Regime',
        'Valor Proposta (Nominal)',
        'CPP Patronal (Art. 18-B)',
        'Custo Efetivo Total',
        'Diferença p/ Menor',
        'CNAE e Conformidade',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 },
      1: { cellWidth: 50 },
      2: { halign: 'right', cellWidth: 24 },
      3: { halign: 'center', cellWidth: 24 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 26 },
      5: { halign: 'center', cellWidth: 23 },
      6: { halign: 'center', cellWidth: 26 },
    },
    margin: { left: marginX, right: marginX },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 5. Análise de Compatibilidade de CNAE
  if (currentY > 230) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('4. AUDITORIA DE COMPATIBILIDADE DE CNAE (PRINCIPAL E SECUNDÁRIOS)', marginX, currentY);
  currentY += 4;

  analise.resultados.forEach(r => {
    if (currentY > 260) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`• ${r.razaoSocial} (CNPJ: ${r.cnpj}) - CNAE: ${r.cnaeCompativelEncontrado || r.cnaePrestador}:`, marginX + 2, currentY);
    currentY += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(r.compatibilidadeCNAE === 'compativel' ? 21 : r.compatibilidadeCNAE === 'parcial' ? 217 : 220, r.compatibilidadeCNAE === 'compativel' ? 128 : r.compatibilidadeCNAE === 'parcial' ? 119 : 38, r.compatibilidadeCNAE === 'compativel' ? 61 : r.compatibilidadeCNAE === 'parcial' ? 6 : 38);

    const splitJust = doc.splitTextToSize(r.justificativaCnae, pageWidth - marginX * 2 - 6);
    doc.text(splitJust, marginX + 4, currentY);
    currentY += splitJust.length * 3.5 + 2;
  });

  // 6. Fundamentação Legal e Normativa
  if (currentY > 220) {
    doc.addPage();
    currentY = 16;
  }

  currentY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('5. FUNDAMENTAÇÃO LEGAL E OBRIGAÇÕES ACESSÓRIAS', marginX, currentY);
  currentY += 4;

  analise.fundamentacaoLegal.forEach(f => {
    if (currentY > 260) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(3, 105, 161);
    doc.text(`[Norma] ${f.artigo} - ${f.titulo}`, marginX + 2, currentY);
    currentY += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const splitNorma = doc.splitTextToSize(f.resumo, pageWidth - marginX * 2 - 6);
    doc.text(splitNorma, marginX + 4, currentY);
    currentY += splitNorma.length * 3.5 + 2.5;
  });

  // 7. Bloco de Assinaturas e Fechamento Pericial
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY += 8;
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Parecer emitido em conformidade com as instruções normativas da Receita Federal do Brasil e os princípios da economicidade, razoabilidade e estrita legalidade tributária.',
    marginX,
    currentY
  );

  currentY += 16;

  // Linhas de Assinatura
  const colWidth = (pageWidth - marginX * 2) / 2;

  doc.setDrawColor(148, 163, 184);
  doc.line(marginX + 10, currentY, marginX + colWidth - 10, currentY);
  doc.line(marginX + colWidth + 10, currentY, pageWidth - marginX - 10, currentY);

  currentY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Analista de Conformidade Fiscal / Tributária', marginX + colWidth / 2, currentY, { align: 'center' });
  doc.text('Responsável pela Tomada de Contas do Adiantamento', marginX + colWidth + colWidth / 2, currentY, { align: 'center' });

  currentY += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Controladoria Interna • CRC / OAB', marginX + colWidth / 2, currentY, { align: 'center' });
  doc.text(`${responsavel} • Matrícula / Protocolo`, marginX + colWidth + colWidth / 2, currentY, { align: 'center' });

  return doc.output('blob');
}
