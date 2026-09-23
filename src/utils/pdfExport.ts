import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnaliseFiscalResponse } from '../types/fiscal';
import { formatarMoeda, formatarData } from './formatters';

const carregarLogoDataUrl = async (): Promise<string | null> => {
  try {
    const response = await fetch('/detranmt.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export async function gerarRelatorioPdf(analise: AnaliseFiscalResponse): Promise<Blob> {
  const logoDataUrl = await carregarLogoDataUrl();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  let currentY = 16;

  // 1. Cabeçalho Institucional
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', marginX, 4, 19, 14);
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('ESTADO DE MATO GROSSO • DETRAN-MT / GERÊNCIA DE EXECUÇÃO FINANCEIRA', marginX + 24, 7);
  doc.setFontSize(11);
  doc.text('PARECER TÉCNICO DE CONFORMIDADE FISCAL E PREVIDENCIÁRIA', marginX + 24, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Laudo pericial • Arts. 18-B da LC 123/2006 • IN RFB nº 2.110/2022 • Enquadramento de CNAE',
    marginX + 24,
    18
  );
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('DATA DA EMISSÃO', pageWidth - marginX, 7, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${formatarData(analise.dataAnalise)}`, pageWidth - marginX, 13, { align: 'right' });
  doc.setDrawColor(6, 78, 59);
  doc.setLineWidth(0.7);
  doc.line(marginX, 23, pageWidth - marginX, 23);

  currentY = 30;

  // 2. Metadados do Processo
  doc.setTextColor(6, 78, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. IDENTIFICAÇÃO DO PROCESSO DE ADIANTAMENTO', marginX, currentY);
  currentY += 4;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const numProc = analise.servico.numeroAdiantamento || 'N/A';
  const responsavel = analise.servico.solicitante || 'Não informado';
  const centroCusto = analise.servico.departamento || 'Geral';
  const dataFormatada = formatarData(analise.dataAnalise);

  const dadosIdentificacao = [
    [
      `Processo / Protocolo:\n${numProc}`,
      `Data do Parecer:\n${dataFormatada}`,
      `Identificador:\n${analise.idAnalise}`,
    ],
    [
      `Responsável / Solicitante:\n${responsavel}`,
      `Centro de Custos:\n${centroCusto}`,
      `CNAE do Serviço:\n${analise.servico.cnae || 'Não informado'}`,
    ],
    [
      `Objeto do Serviço:\n${analise.servico.descricao || 'Não informado'}`,
      '',
      `Descrição CNAE:\n${analise.descricaoCnaeServico || 'Não informado'}`,
    ],
  ];

  const inicioQuadroIdentificacao = currentY;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, inicioQuadroIdentificacao, pageWidth - marginX * 2, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 78, 59);
  doc.text('1. QUALIFICAÇÃO DO PROCESSO E DADOS DO ADIANTAMENTO', marginX + 4, inicioQuadroIdentificacao + 4.7);

  autoTable(doc, {
    startY: inicioQuadroIdentificacao + 7,
    body: dadosIdentificacao,
    theme: 'grid',
    styles: {
      fontSize: 7.8,
      cellPadding: 2.2,
      textColor: [51, 65, 85],
      valign: 'middle',
      lineColor: [226, 232, 240],
      lineWidth: 0.25,
    },
    columnStyles: {
      0: { cellWidth: 63 },
      1: { cellWidth: 58 },
      2: { cellWidth: 55 },
    },
    margin: { left: marginX, right: marginX },
    didParseCell: data => {
      if (data.cell.text.length > 0) {
        data.cell.text = data.cell.text.flatMap(line => {
          const separator = line.indexOf('\n');
          if (separator < 0) return [line];
          return [line.slice(0, separator), line.slice(separator + 1)];
        });
        data.cell.styles.fontStyle = 'normal';
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;
  doc.roundedRect(
    marginX,
    inicioQuadroIdentificacao,
    pageWidth - marginX * 2,
    (doc as any).lastAutoTable.finalY - inicioQuadroIdentificacao,
    2,
    2,
    'D'
  );

  // 3. Parecer Técnico Conclusivo e Fornecedor Indicado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(6, 78, 59);
  doc.text('2. PARECER CONCLUSIVO E RECOMENDAÇÃO TÉCNICA', marginX, currentY);
  currentY += 4;

  // Caixa de Destaque da Recomendação
  const larguraCaixa = pageWidth - marginX * 2;
  const larguraTexto = larguraCaixa - 8;
  const textoRecomendacao = `PROPOSTA RECOMENDADA: ${analise.melhorOrcamento.razaoSocial}`;
  const textoParecer = doc.splitTextToSize(analise.parecerConclusivo, larguraTexto);
  const linhasRecomendacao = doc.splitTextToSize(textoRecomendacao, larguraTexto);
  const alturaCaixa = Math.max(28, 12 + linhasRecomendacao.length * 3.5 + textoParecer.length * 3.5);

  const inicioQuadroConclusao = currentY;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(marginX, inicioQuadroConclusao, larguraCaixa, alturaCaixa, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, inicioQuadroConclusao, larguraCaixa, alturaCaixa, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(21, 128, 61); // emerald-700
  doc.text(linhasRecomendacao, marginX + 4, inicioQuadroConclusao + 6, {
    maxWidth: larguraTexto,
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);

  doc.text(textoParecer, marginX + 4, inicioQuadroConclusao + 8 + linhasRecomendacao.length * 3.5, {
    maxWidth: larguraTexto,
    align: 'justify',
    lineHeightFactor: 1.35,
  });

  currentY += alturaCaixa + 6;

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
      fillColor: [6, 78, 59],
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

  // 7. Fechamento Pericial
  if (currentY > 260) {
    doc.addPage();
    currentY = 16;
  } else {
    currentY += 6;
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const textoFechamento = doc.splitTextToSize(
    'Parecer emitido em conformidade com as instruções normativas da Receita Federal do Brasil e os princípios da economicidade, razoabilidade e estrita legalidade tributária.',
    pageWidth - marginX * 2
  );
  doc.text(textoFechamento, marginX, currentY, {
    maxWidth: pageWidth - marginX * 2,
    align: 'justify',
  });

  return doc.output('blob');
}
