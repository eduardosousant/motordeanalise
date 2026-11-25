/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Document, Paragraph, TextRun, Packer, AlignmentType, HeadingLevel } from 'docx';
import { FiscalFormData, CalculoFiscalResultado } from '../types/fiscal';

/**
 * Converte uma linha com tags HTML básicas (<b>, <i>, <code>) em um array de TextRun do docx.
 */
function parseLineToTextRuns(lineText: string): TextRun[] {
  // Regex simples para capturar tags ou texto comum
  const tokens = lineText.split(/(<b>.*?<\/b>|<i>.*?<\/i>|<code>.*?<\/code>)/gi);
  const runs: TextRun[] = [];

  for (const token of tokens) {
    if (!token) continue;

    if (token.startsWith('<b>') && token.endsWith('</b>')) {
      const inner = token.slice(3, -4);
      runs.push(new TextRun({ text: inner, bold: true, font: 'Calibri' }));
    } else if (token.startsWith('<i>') && token.endsWith('</i>')) {
      const inner = token.slice(3, -4);
      runs.push(new TextRun({ text: inner, italics: true, font: 'Calibri' }));
    } else if (token.startsWith('<code>') && token.endsWith('</code>')) {
      const inner = token.slice(6, -7);
      runs.push(new TextRun({ text: inner, font: 'Consolas', shading: { fill: 'F1F5F9' } }));
    } else {
      runs.push(new TextRun({ text: token, font: 'Calibri' }));
    }
  }

  return runs;
}

export async function exportarDespachoDocx(
  htmlContent: string,
  formData: FiscalFormData,
  _calc: CalculoFiscalResultado
): Promise<Blob> {
  // Dividir o conteúdo HTML por <br> ou quebras de linha
  const rawLines = htmlContent
    .replace(/\r\n/g, '\n')
    .split(/<br\s*[\/]?>|\n/gi);

  const paragraphs: Paragraph[] = [];

  // Cabeçalho do documento oficial
  paragraphs.push(
    new Paragraph({
      text: 'ESTADO DE MATO GROSSO / AUTARQUIA ESTADUAL',
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 100 },
    })
  );

  paragraphs.push(
    new Paragraph({
      text: 'DESPACHO DE ORIENTAÇÃO PARA FATURAMENTO E TRIBUTAÇÃO',
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_3,
      spacing: { after: 300 },
    })
  );

  for (const line of rawLines) {
    const cleanLine = line.trim();
    if (!cleanLine) {
      // Linha vazia de espaçamento
      paragraphs.push(new Paragraph({ spacing: { after: 120 } }));
      continue;
    }

    const runs = parseLineToTextRuns(cleanLine);
    paragraphs.push(
      new Paragraph({
        children: runs,
        spacing: { after: 100, line: 280 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 2.54 cm
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Dispara o download de um Blob no navegador com nome de arquivo
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
