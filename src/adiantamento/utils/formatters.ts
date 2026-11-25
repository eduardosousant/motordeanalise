/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formata um valor numérico para a moeda brasileira (ex: R$ 2.860,00).
 * Garante rigorosamente o espaço e símbolo R$ conforme padrão exigido.
 */
export function formatarMoeda(valor: number): string {
  if (isNaN(valor) || valor === null || valor === undefined) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/**
 * Aplica máscara de CNPJ (ex: 00.000.000/0000-00)
 */
export function formatarCNPJ(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Converte HTML básico com <b>, <i>, <br>, <code> em texto limpo com quebras de linha preservadas,
 * ideal para fallback de clipboard ou editores simples.
 */
export function htmlParaTextoLimpo(html: string): string {
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<b>(.*?)<\/b>/gi, '$1')
    .replace(/<strong>(.*?)<\/strong>/gi, '$1')
    .replace(/<i>(.*?)<\/i>/gi, '$1')
    .replace(/<em>(.*?)<\/em>/gi, '$1')
    .replace(/<code>(.*?)<\/code>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * Formata data e hora no padrão brasileiro (DD/MM/AAAA HH:mm)
 */
export function formatarDataHora(dataIso: string | Date): string {
  const d = typeof dataIso === 'string' ? new Date(dataIso) : dataIso;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
