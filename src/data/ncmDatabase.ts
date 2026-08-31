// Base Oficial de Enquadramento NCM / Anexo X - SEFAZ-MT & IN RFB 1.234/2012
import ncmFullMapData from './ncm_full_map.json';

export interface NcmRecordMT {
  ncm: string; // 8 dígitos limpos
  ncmFormatado: string;
  descricao: string;
  statusSt: 'ST' | 'NAO_ST' | 'REVOGADO';
  statusDesc: string;
  tabelaAnexoX?: string;
  segmento?: string;
  cest?: string;
  irrf?: number;
  darf?: string;
}

export interface NcmEntryMT {
  statusSt: 'ST' | 'NAO_ST' | 'REVOGADO';
  tabela: string;
  segmento: string;
  cest: string;
  descricao: string;
  irrf: number;
  darf: string;
}

// 10.515 NCMs carregados da base oficial
export const NCM_ANEXO_X_MAP: Record<string, NcmEntryMT> = ncmFullMapData as Record<string, NcmEntryMT>;

/**
 * Função de higienização e formatação de NCM
 */
export function sanitizarOuSugerirNcm(ncmInput: string, descricaoInput?: string): {
  ncmLimpo: string;
  ncmFormatado: string;
  valido: boolean;
  foiAjustado: boolean;
  motivoAjuste?: string;
} {
  const clean = (ncmInput || '').replace(/\D/g, '');
  const desc = (descricaoInput || '').toUpperCase();

  // Desdobramento de NCMs genéricos (ex: 8539.31)
  if (clean === '85393100' || clean === '853931') {
    if (desc.includes('LED') || desc.includes('DIODO')) {
      return {
        ncmLimpo: '85395200',
        ncmFormatado: '8539.52.00',
        valido: true,
        foiAjustado: true,
        motivoAjuste: 'NCM 8539.31.00 ajustado para Lâmpadas LED: 8539.52.00'
      };
    }
    return {
      ncmLimpo: '85393120',
      ncmFormatado: '8539.31.20',
      valido: true,
      foiAjustado: true,
      motivoAjuste: 'NCM genérico 8539.31.00 desdobrado para subposição de 8 dígitos: 8539.31.20'
    };
  }

  let finalClean = clean;
  let foiAjustado = false;
  let motivoAjuste: string | undefined = undefined;

  if (finalClean.length === 6) {
    finalClean = `${finalClean}00`;
    foiAjustado = true;
    motivoAjuste = `NCM de 6 dígitos completado para 8 dígitos (${formatarNcm(finalClean)})`;
  } else if (finalClean.length === 7) {
    finalClean = `${finalClean}0`;
    foiAjustado = true;
    motivoAjuste = `NCM de 7 dígitos completado para 8 dígitos (${formatarNcm(finalClean)})`;
  }

  const formatado = formatarNcm(finalClean);
  const valido = finalClean.length === 8;

  return {
    ncmLimpo: finalClean,
    ncmFormatado: formatado,
    valido,
    foiAjustado,
    motivoAjuste
  };
}

export function formatarNcm(ncmLimpo: string): string {
  const clean = (ncmLimpo || '').replace(/\D/g, '');
  if (clean.length === 8) {
    return `${clean.substring(0, 4)}.${clean.substring(4, 6)}.${clean.substring(6, 8)}`;
  }
  return ncmLimpo;
}

export function verificarNcmNoAnexoX(ncmInput: string): boolean {
  const sanitizado = sanitizarOuSugerirNcm(ncmInput);
  const clean = sanitizado.ncmLimpo;

  if (!clean || clean.length < 4) return false;

  // 1. Busca exata no Mapa completo (O(1))
  if (clean.length === 8 && NCM_ANEXO_X_MAP[clean]) {
    return NCM_ANEXO_X_MAP[clean].statusSt === 'ST';
  }

  // 2. Busca por prefixo de 6 dígitos
  if (clean.length >= 6) {
    const prefix6 = clean.substring(0, 6);
    for (const [key, val] of Object.entries(NCM_ANEXO_X_MAP)) {
      if (key.startsWith(prefix6)) {
        return val.statusSt === 'ST';
      }
    }
  }

  return false;
}

export function consultarNcmOficialMT(ncmInput: string, descricao?: string): {
  isSt: boolean;
  tabelaAnexoX?: string;
  segmento?: string;
  cest?: string;
  irrf?: number;
  darf?: string;
  descricao?: string;
  statusTexto: string;
} {
  const sanitizado = sanitizarOuSugerirNcm(ncmInput, descricao);
  const clean = sanitizado.ncmLimpo;

  // 1. Busca exata no Mapa completo de 10.515 NCMs
  if (clean.length === 8 && NCM_ANEXO_X_MAP[clean]) {
    const item = NCM_ANEXO_X_MAP[clean];
    const isSt = item.statusSt === 'ST';

    let statusTexto = 'Não Consta no Anexo X';
    if (item.statusSt === 'ST') {
      statusTexto = `Sujeito à ST (Anexo X - ${item.tabela})`;
    } else if (item.statusSt === 'REVOGADO') {
      statusTexto = `Excluído da ST: ${item.descricao}`;
    }

    return {
      isSt,
      tabelaAnexoX: item.tabela,
      segmento: item.segmento,
      cest: item.cest,
      irrf: item.irrf,
      darf: item.darf,
      descricao: item.descricao,
      statusTexto
    };
  }

  // 2. Busca por prefixo de 6 dígitos
  if (clean.length >= 6) {
    const prefix6 = clean.substring(0, 6);
    for (const [key, item] of Object.entries(NCM_ANEXO_X_MAP)) {
      if (key.startsWith(prefix6)) {
        const isSt = item.statusSt === 'ST';
        return {
          isSt,
          tabelaAnexoX: item.tabela,
          segmento: item.segmento,
          cest: item.cest,
          irrf: item.irrf,
          darf: item.darf,
          descricao: item.descricao,
          statusTexto: isSt ? `Sujeito à ST (Anexo X - ${item.tabela})` : 'Não Consta no Anexo X'
        };
      }
    }
  }

  const isSt = verificarNcmNoAnexoX(clean);
  return {
    isSt,
    irrf: 1.20,
    darf: '6147',
    statusTexto: isSt ? 'Sujeito à ST (Anexo X)' : 'Não Consta no Anexo X'
  };
}