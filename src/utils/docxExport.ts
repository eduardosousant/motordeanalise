import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
} from 'docx';
import { AnaliseFiscalResponse } from '../types/fiscal';
import { formatarMoeda, formatarPercentual } from './formatters';

export async function gerarRelatorioDocx(analise: AnaliseFiscalResponse): Promise<Blob> {
  const dataFormatada = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const borderNone = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };

  const borderSubtle = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
  };

  // Build table rows for results
  const tableHeaderRow = new TableRow({
    children: [
      new TableCell({
        shading: { fill: '0F172A', type: ShadingType.CLEAR, color: 'auto' },
        width: { size: 1200, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'Rank', bold: true, color: 'FFFFFF' })] })],
      }),
      new TableCell({
        shading: { fill: '0F172A', type: ShadingType.CLEAR, color: 'auto' },
        width: { size: 2800, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'Fornecedor / CNPJ', bold: true, color: 'FFFFFF' })] })],
      }),
      new TableCell({
        shading: { fill: '0F172A', type: ShadingType.CLEAR, color: 'auto' },
        width: { size: 1500, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'Regime', bold: true, color: 'FFFFFF' })] })],
      }),
      new TableCell({
        shading: { fill: '0F172A', type: ShadingType.CLEAR, color: 'auto' },
        width: { size: 1600, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'Valor Nominal', bold: true, color: 'FFFFFF' })] })],
      }),
      new TableCell({
        shading: { fill: '0F172A', type: ShadingType.CLEAR, color: 'auto' },
        width: { size: 1600, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'CPP (Art. 18-B)', bold: true, color: 'FFFFFF' })] })],
      }),
      new TableCell({
        shading: { fill: '0F172A', type: ShadingType.CLEAR, color: 'auto' },
        width: { size: 1800, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'Custo Efetivo', bold: true, color: 'FFFFFF' })] })],
      }),
      new TableCell({
        shading: { fill: '0F172A', type: ShadingType.CLEAR, color: 'auto' },
        width: { size: 1500, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: 'CNAE', bold: true, color: 'FFFFFF' })] })],
      }),
    ],
  });

  const tableDataRows = analise.resultados.map((orc, index) => {
    const isFirst = index === 0;
    const bgFill = isFirst ? 'F0FDF4' : index % 2 === 0 ? 'F8FAFC' : 'FFFFFF';
    return new TableRow({
      children: [
        new TableCell({
          borders: borderSubtle,
          shading: { fill: bgFill, type: ShadingType.CLEAR, color: 'auto' },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: isFirst ? '1º (Recomendado)' : `${orc.posicaoRanking}º`,
                  bold: isFirst,
                  color: isFirst ? '15803D' : '0F172A',
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          borders: borderSubtle,
          shading: { fill: bgFill, type: ShadingType.CLEAR, color: 'auto' },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: orc.razaoSocial, bold: isFirst }),
                new TextRun({ text: `\nCNPJ: ${orc.cnpj}`, size: 18, color: '64748B' }),
              ],
            }),
          ],
        }),
        new TableCell({
          borders: borderSubtle,
          shading: { fill: bgFill, type: ShadingType.CLEAR, color: 'auto' },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: orc.regimeTributario === 'MEI' ? 'MEI' : orc.regimeTributario.replace('_', ' '),
                  bold: orc.regimeTributario === 'MEI',
                  color: orc.regimeTributario === 'MEI' ? 'D97706' : '334155',
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          borders: borderSubtle,
          shading: { fill: bgFill, type: ShadingType.CLEAR, color: 'auto' },
          children: [new Paragraph({ children: [new TextRun({ text: formatarMoeda(orc.valorNominal) })] })],
        }),
        new TableCell({
          borders: borderSubtle,
          shading: { fill: bgFill, type: ShadingType.CLEAR, color: 'auto' },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: orc.incideCPP18B ? `+${formatarMoeda(orc.valorCPP)} (20%)` : 'R$ 0,00 (Não incide)',
                  bold: orc.incideCPP18B,
                  color: orc.incideCPP18B ? 'DC2626' : '64748B',
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          borders: borderSubtle,
          shading: { fill: bgFill, type: ShadingType.CLEAR, color: 'auto' },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: formatarMoeda(orc.custoEfetivoTotal),
                  bold: true,
                  color: isFirst ? '15803D' : '0F172A',
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          borders: borderSubtle,
          shading: { fill: bgFill, type: ShadingType.CLEAR, color: 'auto' },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: orc.compatibilidadeCNAE === 'compativel'
                    ? (orc.origemCompatibilidade === 'secundario' ? 'Compatível (Secundário)' : 'Compatível (Principal)')
                    : orc.compatibilidadeCNAE === 'parcial' ? 'Parcial' : 'Incompatível',
                  bold: true,
                  color: orc.compatibilidadeCNAE === 'compativel' ? '15803D' : orc.compatibilidadeCNAE === 'parcial' ? 'D97706' : 'DC2626',
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Titulo
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: 'PARECER TÉCNICO DE CONFORMIDADE FISCAL',
                bold: true,
                size: 32,
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: 'Processo de Adiantamento / Suprimento de Fundos',
                italics: true,
                size: 22,
                color: '475569',
              }),
            ],
          }),

          // Dados Gerais do Processo
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: '1. Identificação do Adiantamento', bold: true, size: 24, color: '1E293B' })],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'Nº do Processo / Adiantamento: ', bold: true }),
              new TextRun({ text: analise.servico.numeroAdiantamento || 'ADV-2026/SISTEMA' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'Data da Análise: ', bold: true }),
              new TextRun({ text: dataFormatada }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'Solicitante: ', bold: true }),
              new TextRun({ text: analise.servico.solicitante || 'Equipe Solicitante' }),
              new TextRun({ text: '  |  Departamento: ', bold: true }),
              new TextRun({ text: analise.servico.departamento || 'Geral' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'Descrição do Serviço Contratado: ', bold: true }),
              new TextRun({ text: analise.servico.descricao }),
            ],
          }),
          new Paragraph({
            spacing: { after: 250 },
            children: [
              new TextRun({ text: 'CNAE de Referência do Serviço: ', bold: true }),
              new TextRun({ text: `${analise.servico.cnae} - ${analise.descricaoCnaeServico}` }),
            ],
          }),

          // Quadro Comparativo
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 },
            children: [new TextRun({ text: '2. Quadro Comparativo e Custo Efetivo Fiscal', bold: true, size: 24, color: '1E293B' })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [tableHeaderRow, ...tableDataRows],
          }),

          // Seção 3: Parecer e Análise
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 120 },
            children: [new TextRun({ text: '3. Parecer Técnico Conclusivo', bold: true, size: 24, color: '1E293B' })],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: analise.parecerConclusivo,
                size: 22,
                color: '1E293B',
              }),
            ],
          }),

          // Seção 4: Verificação de CNAE (Principal e Secundários)
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 250, after: 120 },
            children: [new TextRun({ text: '4. Análise de Compatibilidade de CNAE (Principal e Secundários)', bold: true, size: 24, color: '1E293B' })],
          }),
          ...analise.resultados.map(r => {
            return new Paragraph({
              spacing: { after: 80 },
              bullet: { level: 0 },
              children: [
                new TextRun({ text: `${r.razaoSocial}: `, bold: true }),
                new TextRun({
                  text: r.justificativaCnae,
                  color: r.compatibilidadeCNAE === 'compativel' ? '15803D' : r.compatibilidadeCNAE === 'parcial' ? 'D97706' : 'B91C1C',
                }),
                new TextRun({
                  text: r.origemCompatibilidade === 'secundario'
                    ? ` [Identificado no CNAE Secundário: ${r.cnaeCompativelEncontrado}]`
                    : r.origemCompatibilidade === 'principal'
                    ? ` [Identificado no CNAE Principal: ${r.cnaePrestador}]`
                    : '',
                  italics: true,
                  size: 18,
                  color: '64748B',
                }),
              ],
            });
          }),

          // Seção 5: Alertas e Incidência do Artigo 18-B
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 },
            children: [new TextRun({ text: '5. Análise de Incidência do Art. 18-B (LC 123/2006)', bold: true, size: 24, color: '1E293B' })],
          }),
          ...analise.resultados.map(r => {
            return new Paragraph({
              spacing: { after: 80 },
              bullet: { level: 0 },
              children: [
                new TextRun({ text: `${r.razaoSocial} (${r.cnpj}): `, bold: true }),
                new TextRun({
                  text: r.incideCPP18B
                    ? `Incide CPP Patronal de 20% (R$ ${formatarMoeda(r.valorCPP)}). A contratante deverá recolher a guia previdenciária patronal (DCTFWeb), elevando o custo efetivo para ${formatarMoeda(r.custoEfetivoTotal)}.`
                    : `Não incide CPP patronal pelo Art. 18-B (Regime ${r.regimeTributario.replace('_', ' ')} ou atividade isenta). Custo efetivo mantido em ${formatarMoeda(r.custoEfetivoTotal)}.`,
                  color: r.incideCPP18B ? 'B91C1C' : '15803D',
                }),
              ],
            });
          }),

          // Seção 6: Fundamentação Legal
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 250, after: 120 },
            children: [new TextRun({ text: '6. Fundamentação Legal e Normativa', bold: true, size: 24, color: '1E293B' })],
          }),
          ...analise.fundamentacaoLegal.map(f => {
            return new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({ text: `• ${f.artigo} - ${f.titulo}: `, bold: true }),
                new TextRun({ text: f.resumo, color: '475569' }),
              ],
            });
          }),

          // Assinaturas
          new Paragraph({
            spacing: { before: 500, after: 300 },
            children: [
              new TextRun({
                text: 'Conclusão emitida de acordo com as normas tributárias federais e municipais vigentes.',
                italics: true,
                size: 18,
                color: '64748B',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: borderNone,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: '_______________________________________\n' }),
                          new TextRun({ text: 'Analista de Conformidade Fiscal\n', bold: true }),
                          new TextRun({ text: 'Controladoria / Tributário', size: 18, color: '64748B' }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: borderNone,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: '_______________________________________\n' }),
                          new TextRun({ text: 'Gestor Responsável pelo Adiantamento\n', bold: true }),
                          new TextRun({ text: 'Aprovação de Despesa', size: 18, color: '64748B' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
