import * as XLSX from '@e965/xlsx';
import { ItemNotaFiscal } from '../types.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_IMPORT_ROWS = 2000;

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function parseHeaderIndexes(header: unknown[]): {
  ncm: number;
  descricao: number;
  quantidade: number;
  valorUnitario: number;
  valorUnitarioAlternativo?: number;
} | null {
  const headers = header.map(normalizeHeader);
  const find = (aliases: string[]) => headers.findIndex((value) => aliases.includes(value));
  const valorUnitarioHeader = find(['valorunitario', 'precounitario', 'vun', 'valorun']);
  const valorHeader = find(['valor']);
  const unitarioHeader = find(['unitario']);
  const temValorUnitarioEmDuasColunas = valorHeader >= 0 && unitarioHeader === valorHeader + 1;
  const indexes = {
    ncm: find(['ncm', 'codigoncm']),
    descricao: find(['produto', 'descricao', 'descricaoproduto', 'mercadoria', 'item']),
    quantidade: find(['quantidade', 'qtd', 'qtde', 'quant']),
    valorUnitario: valorUnitarioHeader >= 0
      ? valorUnitarioHeader
      : temValorUnitarioEmDuasColunas
        ? valorHeader
        : find(['precounitario', 'unitario']),
    ...(temValorUnitarioEmDuasColunas ? { valorUnitarioAlternativo: unitarioHeader } : {})
  };

  return Object.values(indexes).every((index) => index >= 0) ? indexes : null;
}

function parseNumber(value: unknown, rowNumber: number, label: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const input = String(value ?? '').trim().replace(/^R\$\s*/i, '').replace(/\s/g, '');
  const normalized = input.includes(',')
    ? input.replace(/\./g, '').replace(',', '.')
    : /^\d{1,3}(?:\.\d{3})+$/.test(input)
      ? input.replace(/\./g, '')
      : input;
  const parsed = Number(normalized);

  if (!input || !Number.isFinite(parsed)) {
    throw new Error(`Linha ${rowNumber}: ${label} vazio ou inválido.`);
  }
  return parsed;
}

function parseNcm(value: unknown, rowNumber: number): string {
  let digits: string;

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (!Number.isInteger(value)) {
      throw new Error(`Linha ${rowNumber}: o NCM deve conter oito dígitos.`);
    }
    digits = String(value).padStart(8, '0');
  } else {
    digits = String(value ?? '').replace(/\D/g, '');
  }

  if (digits.length !== 8) {
    throw new Error(`Linha ${rowNumber}: NCM inválido. Informe um código com oito dígitos.`);
  }

  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
}

export async function parseSpreadsheetItems(file: File): Promise<ItemNotaFiscal[]> {
  if (!/\.(xlsx|xls)$/i.test(file.name)) {
    throw new Error('Selecione uma planilha do Excel no formato .xls ou .xlsx.');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('A planilha excede o limite de 10 MB.');
  }

  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('A planilha não contém abas para importar.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false
  });
  const headerRowIndex = rows.findIndex((row) => parseHeaderIndexes(row) !== null);

  if (headerRowIndex < 0) {
    throw new Error('Não encontrei as colunas NCM, Produto, Quantidade e Valor Unitário na primeira aba.');
  }

  const indexes = parseHeaderIndexes(rows[headerRowIndex])!;
  const dataRows = rows.slice(headerRowIndex + 1);
  if (dataRows.length > MAX_IMPORT_ROWS) {
    throw new Error(`A planilha tem mais de ${MAX_IMPORT_ROWS} linhas de dados; divida-a em arquivos menores.`);
  }

  const items: ItemNotaFiscal[] = [];

  for (const [index, row] of dataRows.entries()) {
    const values = [row[indexes.ncm], row[indexes.descricao], row[indexes.quantidade], row[indexes.valorUnitario]];
    if (values.every((value) => value === null || value === undefined || String(value).trim() === '')) continue;

    const rowNumber = headerRowIndex + index + 2;
    const descricao = String(row[indexes.descricao] ?? '').trim();
    if (/^(subtotal|total(?:geral|dosprodutos|produtos|danota)?)$/i.test(normalizeHeader(descricao))) continue;
    if (!descricao) {
      throw new Error(`Linha ${rowNumber}: informe a descrição do produto.`);
    }

    const quantidade = parseNumber(row[indexes.quantidade], rowNumber, 'Quantidade');
    let valorUnitario: number;
    try {
      valorUnitario = parseNumber(row[indexes.valorUnitario], rowNumber, 'Valor Unitário');
    } catch (error) {
      if (indexes.valorUnitarioAlternativo === undefined) throw error;
      valorUnitario = parseNumber(row[indexes.valorUnitarioAlternativo], rowNumber, 'Valor Unitário');
    }
    if (quantidade <= 0) {
      throw new Error(`Linha ${rowNumber}: a quantidade deve ser maior que zero.`);
    }
    if (valorUnitario < 0) {
      throw new Error(`Linha ${rowNumber}: o valor unitário não pode ser negativo.`);
    }

    items.push({
      id: `planilha_${items.length + 1}`,
      item_numero: items.length + 1,
      ncm: parseNcm(row[indexes.ncm], rowNumber),
      descricao,
      quantidade,
      valor_unitario: valorUnitario,
      valor_total: quantidade * valorUnitario,
      valor_desconto_comercial: 0,
      valor_frete: 0,
      valor_despesas: 0,
      icms_proprio_destacado: 0
    });
  }

  if (items.length === 0) {
    throw new Error('A planilha não contém linhas de produtos preenchidas após o cabeçalho.');
  }

  return items;
}
