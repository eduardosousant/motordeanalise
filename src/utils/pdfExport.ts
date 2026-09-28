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
      0: { cellWidth: (pageWidth - marginX * 2) / 3 },
      1: { cellWidth: (pageWidth - marginX * 2) / 3 },
      2: { cellWidth: (pageWidth - marginX * 2) / 3 },
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
  const larguraCaixa = pageWidth - marginX * 2;
  const paddingX = 3.5;
  const larguraTexto = larguraCaixa - paddingX * 2;

  // IMPORTANTE: Definir fontes e tamanhos antes de calcular a quebra de linha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  const prefixoRecomendacao = 'PROPOSTA RECOMENDADA: ';
  const nomeFornecedor = analise.melhorOrcamento.razaoSocial;
  const textoRecomendacao = `${prefixoRecomendacao}${nomeFornecedor}`;
  const linhasRecomendacao = doc.splitTextToSize(textoRecomendacao, larguraTexto);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const textoParecer = doc.splitTextToSize(analise.parecerConclusivo, larguraTexto);

  const alturaCabecalho = 8;
  const alturaLinhaRecomendacao = 4.2;
  const alturaLinhaParecer = 3.6;
  const alturaCaixa = Math.max(
      34,
      alturaCabecalho + 5 + linhasRecomendacao.length * alturaLinhaRecomendacao
      + 3 + textoParecer.length * alturaLinhaParecer + 4
  );

  const inicioQuadroConclusao = currentY;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(marginX, inicioQuadroConclusao, larguraCaixa, alturaCaixa, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, inicioQuadroConclusao, larguraCaixa, alturaCaixa, 2, 2, 'D');
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(marginX, inicioQuadroConclusao, larguraCaixa, alturaCabecalho, 2, 2, 'F');
  doc.rect(marginX, inicioQuadroConclusao + 4, larguraCaixa, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 78, 59);
  doc.text('2. PARECER CONCLUSIVO E RECOMENDAÇÃO TÉCNICA', marginX + 4, inicioQuadroConclusao + 5.3);

  // Renderização da Recomendação com cor diferenciada no nome
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  const posYRecomendacao = inicioQuadroConclusao + alturaCabecalho + 5;
  const larguraPrefixo = doc.getTextWidth(prefixoRecomendacao);

  // 1. Prefixo em cinzento-escuro neutro
  doc.setTextColor(30, 41, 59);
  doc.text(prefixoRecomendacao, marginX + paddingX, posYRecomendacao);

  // 2. Razão Social com cor de destaque (ex.: Azul Royal Intenso [2, 132, 199])
  // Outras sugestões: Verde Esmeralda [4, 120, 87] ou Âmbar/Dourado [217, 119, 6]
  doc.setTextColor(2, 132, 199);
  doc.text(nomeFornecedor, marginX + paddingX + larguraPrefixo, posYRecomendacao);

  // Renderização do Parecer (distribuído até o limite direito)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const inicioTextoParecer = inicioQuadroConclusao
      + alturaCabecalho
      + 6
      + linhasRecomendacao.length * alturaLinhaRecomendacao;
  textoParecer.forEach((linha, index) => {
    doc.text(linha, marginX + paddingX, inicioTextoParecer + index * alturaLinhaParecer);
  });

  currentY += alturaCaixa + 6;

// 4. Quadro Comparativo de Custos Efetivos e Riscos Fiscais (Seção 3 no PDF)
  const inicioQuadroSecao3 = currentY;

  // Cabeçalho estilizado do Quadro 3
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(marginX, inicioQuadroSecao3, pageWidth - marginX * 2, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 78, 59);
  doc.text('3. QUADRO DEMONSTRATIVO DE CUSTO EFETIVO GLOBAL', marginX + 4, inicioQuadroSecao3 + 4.7);

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
      `${r.razaoSocial}\nCNPJ: ${r.cnpj}\n(${r.regimeTributario.replace('_', ' ')}\)`,
      formatarMoeda(r.valorNominal),
      incideTexto,
      formatarMoeda(r.custoEfetivoTotal),
      diferencaTexto,
      compatTexto,
    ];
  });

  autoTable(doc, {
    startY: inicioQuadroSecao3 + 7,
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

  currentY = (doc as any).lastAutoTable.finalY;
  // Borda externa do Quadro 3 englobando a tabela
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, inicioQuadroSecao3, pageWidth - marginX * 2, currentY - inicioQuadroSecao3, 2, 2, 'D');

  currentY += 6;

  // 5. Análise de Compatibilidade de CNAE (Seção 4 no PDF)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  // Calcula altura necessária antes de desenhar o quadro para evitar quebra no meio
  let alturaSecao4 = 8; // Altura do cabeçalho
  const itensSecao4 = analise.resultados.map(r => {
    const texto = doc.splitTextToSize(r.justificativaCnae, pageWidth - marginX * 2 - 8);
    const alturaItem = 4 + 3.5 + (texto.length * 3.6); // margem topo + titulo + linhas
    alturaSecao4 += alturaItem;
    return { r, texto };
  });
  alturaSecao4 += 3; // padding do fundo

  if (currentY + alturaSecao4 > 270) {
    doc.addPage();
    currentY = 16;
  }

  const inicioQuadroSecao4 = currentY;
  // Fundo e borda do quadro
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(marginX, inicioQuadroSecao4, pageWidth - marginX * 2, alturaSecao4, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, inicioQuadroSecao4, pageWidth - marginX * 2, alturaSecao4, 2, 2, 'D');

  // Cabeçalho da Seção 4
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(marginX, inicioQuadroSecao4, pageWidth - marginX * 2, 8, 2, 2, 'F');
  doc.rect(marginX, inicioQuadroSecao4 + 4, pageWidth - marginX * 2, 4, 'F'); // Preenche canto inferior do header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 78, 59);
  doc.text('4. AUDITORIA DE COMPATIBILIDADE DE CNAE (PRINCIPAL E SECUNDÁRIOS)', marginX + 4, inicioQuadroSecao4 + 5.3);

  let currentYInside4 = inicioQuadroSecao4 + 8;

  itensSecao4.forEach(item => {
    currentYInside4 += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`• ${item.r.razaoSocial} (CNPJ: ${item.r.cnpj}) - CNAE: ${item.r.cnaeCompativelEncontrado || item.r.cnaePrestador}:`, marginX + 4, currentYInside4);

    currentYInside4 += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const isCompat = item.r.compatibilidadeCNAE === 'compativel';
    const isParcial = item.r.compatibilidadeCNAE === 'parcial';
    doc.setTextColor(isCompat ? 21 : isParcial ? 217 : 220, isCompat ? 128 : isParcial ? 119 : 38, isCompat ? 61 : isParcial ? 6 : 38);

    item.texto.forEach((linha: string, index: number) => {
      doc.text(linha, marginX + 6, currentYInside4 + index * 3.6);
    });
    currentYInside4 += item.texto.length * 3.6 - 1;
  });

  currentY = inicioQuadroSecao4 + alturaSecao4 + 6;

  // 6. Fundamentação Legal e Normativa (Seção 5 no PDF)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  // Calcula altura necessária
  let alturaSecao5 = 8;
  const itensSecao5 = analise.fundamentacaoLegal.map(f => {
    const texto = doc.splitTextToSize(f.resumo, pageWidth - marginX * 2 - 8);
    const alturaItem = 4 + 3.5 + (texto.length * 3.6);
    alturaSecao5 += alturaItem;
    return { f, texto };
  });
  alturaSecao5 += 3;

  if (currentY + alturaSecao5 > 270) {
    doc.addPage();
    currentY = 16;
  }

  const inicioQuadroSecao5 = currentY;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(marginX, inicioQuadroSecao5, pageWidth - marginX * 2, alturaSecao5, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, inicioQuadroSecao5, pageWidth - marginX * 2, alturaSecao5, 2, 2, 'D');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(marginX, inicioQuadroSecao5, pageWidth - marginX * 2, 8, 2, 2, 'F');
  doc.rect(marginX, inicioQuadroSecao5 + 4, pageWidth - marginX * 2, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 78, 59);
  doc.text('5. FUNDAMENTAÇÃO LEGAL E OBRIGAÇÕES ACESSÓRIAS', marginX + 4, inicioQuadroSecao5 + 5.3);

  let currentYInside5 = inicioQuadroSecao5 + 8;

  itensSecao5.forEach(item => {
    currentYInside5 += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(3, 105, 161);
    doc.text(`* ${item.f.artigo} - ${item.f.titulo}`, marginX + 4, currentYInside5);

    currentYInside5 += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    item.texto.forEach((linha: string, index: number) => {
      doc.text(linha, marginX + 6, currentYInside5 + index * 3.6);
    });
    currentYInside5 += item.texto.length * 3.6 - 1;
  });

  currentY = inicioQuadroSecao5 + alturaSecao5 + 6;

  // 7. Fechamento Pericial  // 7. Fechamento Pericial
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
  });

  return doc.output('blob');
}
