import type { PorteEmpresa } from '../types.js';

export function normalizarPorteFiscal(porte: unknown, isSimei: boolean): PorteEmpresa | undefined {
  if (isSimei) return 'MEI';
  if (typeof porte !== 'string' && typeof porte !== 'number') return undefined;

  const valor = String(porte).toUpperCase().trim();
  const codigo = /^\d$/.test(valor) ? valor.padStart(2, '0') : valor;
  if (['01', 'ME', 'MICRO EMPRESA', 'MICROEMPRESA'].includes(codigo)) return 'ME';
  if (['03', 'EPP', 'EMPRESA DE PEQUENO PORTE'].includes(codigo)) return 'EPP';
  if (['05', 'DEMAIS', 'DEMAIS/OUTROS', 'OUTROS'].includes(codigo)) return 'DEMAIS';

  return undefined;
}
