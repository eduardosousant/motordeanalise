/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { htmlParaTextoLimpo } from './formatters';

/**
 * Copia conteúdo formatado (HTML e Texto Puro) para a Área de Transferência.
 * Quando colado no Microsoft Word, Google Docs ou Outlook, preserva rigorosamente
 * negritos (<b>), itálicos (<i>) e quebras de linha limpas sem exibir tags brutas.
 */
export async function copiarFormatadoParaWord(htmlContent: string): Promise<boolean> {
  // Envelopamento com estilos inline otimizados para o Microsoft Word
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    font-family: Calibri, 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.4;
    color: #0f172a;
  }
  b, strong {
    font-weight: bold;
    color: #000000;
  }
  i, em {
    font-style: italic;
  }
  code {
    font-family: Consolas, 'Courier New', monospace;
    background-color: #f1f5f9;
    padding: 2px 4px;
    font-size: 10pt;
  }
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;

  const plainText = htmlParaTextoLimpo(htmlContent);

  // Tentativa 1: API moderna navigator.clipboard.write com ClipboardItem (suporte a text/html)
  if (navigator.clipboard && window.ClipboardItem) {
    try {
      const htmlBlob = new Blob([fullHtml], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        }),
      ]);
      return true;
    } catch (err) {
      console.warn('Falha no navigator.clipboard.write, acionando fallback DOM:', err);
    }
  }

  // Tentativa 2: Fallback via seleção em elemento DOM temporário (execCommand 'copy')
  try {
    const container = document.createElement('div');
    container.setAttribute('contenteditable', 'true');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.opacity = '0';
    container.innerHTML = fullHtml;
    document.body.appendChild(container);

    const range = document.createRange();
    range.selectNodeContents(container);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
      const success = document.execCommand('copy');
      selection.removeAllRanges();
      document.body.removeChild(container);
      if (success) return true;
    }
  } catch (err2) {
    console.warn('Falha no fallback de cópia rica:', err2);
  }

  // Tentativa 3: Cópia padrão de texto plano
  try {
    await navigator.clipboard.writeText(plainText);
    return true;
  } catch (err3) {
    console.error('Falha em todos os métodos de cópia:', err3);
    return false;
  }
}
