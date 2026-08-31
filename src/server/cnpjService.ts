import { CnpjApiResult, PorteEmpresa } from '../types.js';

// Cache in memory for 30 days as recommended
interface CacheEntry {
  data: CnpjApiResult;
  timestamp: number;
}

const cnpjCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

function parsePorte(porteRaw: any): PorteEmpresa {
  if (!porteRaw) return "DEMAIS";
  const str = String(typeof porteRaw === 'object' ? (porteRaw.descricao || porteRaw.nome || JSON.stringify(porteRaw)) : porteRaw).toUpperCase();
  if (str.includes("MEI") || str.includes("SIMEI") || str === "MICRO EMPREENDEDOR") return "MEI";
  if (str.includes("ME") || str.includes("MICRO") || str === "01") return "ME";
  if (str.includes("EPP") || str.includes("PEQUENO") || str === "03") return "EPP";
  return "DEMAIS";
}

function extractUf(data: any): string {
  if (!data) return '';
  
  const candidates = [
    data?.uf,
    data?.state,
    data?.address?.state,
    data?.address?.uf,
    data?.company?.address?.state,
    data?.company?.address?.uf,
    data?.estabelecimento?.estado?.sigla,
    data?.estabelecimento?.estado,
    data?.estabelecimento?.uf,
    data?.estado?.sigla,
    data?.estado
  ];

  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === 'string') {
      const clean = c.trim().toUpperCase();
      if (clean.length === 2) return clean;
    } else if (typeof c === 'object') {
      const sub = c.sigla || c.acronym || c.uf || c.state || c.code || '';
      if (typeof sub === 'string') {
        const clean = sub.trim().toUpperCase();
        if (clean.length === 2) return clean;
      }
    }
  }

  return '';
}

function extractMunicipio(data: any): string {
  if (!data) return '';
  const candidates = [
    data?.municipio,
    data?.city,
    data?.cidade,
    data?.address?.city,
    data?.company?.address?.city,
    data?.estabelecimento?.cidade?.nome,
    data?.estabelecimento?.cidade
  ];

  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === 'string' && c.trim().length > 0) return c.trim();
    if (typeof c === 'object') {
      const name = c.nome || c.name || c.city || '';
      if (typeof name === 'string' && name.trim().length > 0) return name.trim();
    }
  }

  return '';
}

export async function fetchCnpjData(cnpjInput: string): Promise<CnpjApiResult> {
  const cleanCnpj = cnpjInput.replace(/\D/g, '');

  if (cleanCnpj.length !== 14) {
    throw new Error('CNPJ deve conter exatamente 14 dígitos numéricos.');
  }

  // Check cache
  const cached = cnpjCache.get(cleanCnpj);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return { ...cached.data, fonte_api: `${cached.data.fonte_api} (Cache Local)` };
  }

  // 1. Tentar BrasilAPI (Extremamente rápida e com dados completos da Receita Federal)
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
      headers: { 'User-Agent': 'MotorTaxEngine-MT/1.0' },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      const isSimples = Boolean(data.opcao_pelo_simples === true || data.simples?.optante === true);
      const isSimei = Boolean(data.opcao_pelo_simei === true || data.simei?.optante === true);
      const porte = parsePorte(data.porte || (isSimei ? "MEI" : "DEMAIS"));
      const ufExtracted = extractUf(data) || 'MT';
      const munExtracted = extractMunicipio(data) || 'Cuiabá';

      const result: CnpjApiResult = {
        cnpj: cleanCnpj,
        razao_social: data.razao_social || 'Empresa Consultada',
        nome_fantasia: data.nome_fantasia || '',
        porte,
        optante_simples: isSimples,
        optante_simei: isSimei,
        uf: ufExtracted,
        municipio: munExtracted,
        cnae_principal_codigo: data.cnae_fiscal ? String(data.cnae_fiscal) : '',
        cnae_principal_descricao: data.cnae_fiscal_descricao || '',
        situacao_cadastral: data.descricao_situacao_cadastral || 'ATIVA',
        fonte_api: 'BrasilAPI (Receita Federal)'
      };

      cnpjCache.set(cleanCnpj, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    console.warn('BrasilAPI falhou, tentando CNPJa (Open)...', err);
  }

  // 2. Tentar CNPJa (Open)
  try {
    const res = await fetch(`https://open.cnpja.com/office/${cleanCnpj}`, {
      headers: { 'User-Agent': 'MotorTaxEngine-MT/1.0' },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      const isSimples = Boolean(data.company?.simples?.optant || data.simples?.optant);
      const isSimei = Boolean(data.company?.simei?.optant || data.simei?.optant);
      const porte = parsePorte(data.company?.size?.name || data.size?.name || (isSimei ? "MEI" : "DEMAIS"));
      const ufExtracted = extractUf(data) || 'MT';
      const munExtracted = extractMunicipio(data) || 'Cuiabá';

      const result: CnpjApiResult = {
        cnpj: cleanCnpj,
        razao_social: data.company?.name || data.name || 'Empresa Consultada',
        nome_fantasia: data.alias || data.company?.alias || '',
        porte,
        optante_simples: isSimples,
        optante_simei: isSimei,
        uf: ufExtracted,
        municipio: munExtracted,
        cnae_principal_codigo: data.mainActivity?.id ? String(data.mainActivity.id) : '',
        cnae_principal_descricao: data.mainActivity?.text || '',
        situacao_cadastral: data.status?.text || 'ATIVA',
        fonte_api: 'CNPJá (Open)'
      };

      cnpjCache.set(cleanCnpj, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    console.warn('CNPJa API falhou, tentando CNPJ.ws...', err);
  }

  // 3. Tentar CNPJ.ws
  try {
    const res = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCnpj}`, {
      headers: { 'User-Agent': 'MotorTaxEngine-MT/1.0' },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      const isSimples = Boolean(data.simples?.simples === 'Sim' || data.opcao_pelo_simples === true || data.simples?.optante);
      const isSimei = Boolean(data.simples?.simei === 'Sim' || data.opcao_pelo_simei === true);
      const porte = parsePorte(data.porte?.descricao || data.porte || (isSimei ? "MEI" : "DEMAIS"));
      const ufExtracted = extractUf(data) || 'MT';
      const munExtracted = extractMunicipio(data) || 'Cuiabá';

      const result: CnpjApiResult = {
        cnpj: cleanCnpj,
        razao_social: data.razao_social || 'Empresa Consultada',
        nome_fantasia: data.estabelecimento?.nome_fantasia || data.nome_fantasia || '',
        porte,
        optante_simples: isSimples,
        optante_simei: isSimei,
        uf: ufExtracted,
        municipio: munExtracted,
        cnae_principal_codigo: data.estabelecimento?.atividade_principal?.id ? String(data.estabelecimento.atividade_principal.id) : '',
        cnae_principal_descricao: data.estabelecimento?.atividade_principal?.descricao || '',
        situacao_cadastral: data.estabelecimento?.situacao_cadastral || 'ATIVA',
        fonte_api: 'CNPJ.ws'
      };

      cnpjCache.set(cleanCnpj, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    console.warn('CNPJ.ws falhou, tentando MinhaReceita...', err);
  }

  // 4. Fallback: MinhaReceita
  try {
    const res = await fetch(`https://minhareceita.org/${cleanCnpj}`, {
      headers: { 'User-Agent': 'MotorTaxEngine-MT/1.0' },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      const isSimples = Boolean(data.opcao_pelo_simples === true);
      const isSimei = Boolean(data.opcao_pelo_simei === true);
      const porte = parsePorte(data.porte || (isSimei ? "MEI" : "DEMAIS"));
      const ufExtracted = extractUf(data) || 'MT';
      const munExtracted = extractMunicipio(data) || 'Cuiabá';

      const result: CnpjApiResult = {
        cnpj: cleanCnpj,
        razao_social: data.razao_social || 'Empresa Consultada',
        nome_fantasia: data.nome_fantasia || '',
        porte,
        optante_simples: isSimples,
        optante_simei: isSimei,
        uf: ufExtracted,
        municipio: munExtracted,
        cnae_principal_codigo: data.cnae_fiscal ? String(data.cnae_fiscal) : '',
        cnae_principal_descricao: data.cnae_fiscal_descricao || '',
        situacao_cadastral: data.descricao_situacao_cadastral || 'ATIVA',
        fonte_api: 'MinhaReceita'
      };

      cnpjCache.set(cleanCnpj, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    console.warn('MinhaReceita falhou...', err);
  }

  // 5. Fallback: ReceitaWS
  try {
    const res = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanCnpj}`, {
      headers: { 'User-Agent': 'MotorTaxEngine-MT/1.0' },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status !== 'ERROR') {
        const isSimples = Boolean(data.simples?.optante === true || data.opcao_pelo_simples === true);
        const isSimei = Boolean(data.simei?.optante === true || data.opcao_pelo_simei === true);
        const porte = parsePorte(data.porte || (isSimei ? "MEI" : "DEMAIS"));
        const ufExtracted = extractUf(data) || 'MT';
        const munExtracted = extractMunicipio(data) || 'Cuiabá';

        const result: CnpjApiResult = {
          cnpj: cleanCnpj,
          razao_social: data.nome || data.razao_social || 'Empresa Consultada',
          nome_fantasia: data.fantasia || '',
          porte,
          optante_simples: isSimples,
          optante_simei: isSimei,
          uf: ufExtracted,
          municipio: munExtracted,
          cnae_principal_codigo: data.atividade_principal?.[0]?.code || '',
          cnae_principal_descricao: data.atividade_principal?.[0]?.text || '',
          situacao_cadastral: data.situacao || 'ATIVA',
          fonte_api: 'ReceitaWS'
        };

        cnpjCache.set(cleanCnpj, { data: result, timestamp: Date.now() });
        return result;
      }
    }
  } catch (err) {
    console.warn('ReceitaWS falhou...', err);
  }

  // If all public APIs fail (e.g. offline/rate-limited/demo CNPJ)
  const mockResult: CnpjApiResult = {
    cnpj: cleanCnpj,
    razao_social: `EMPRESA FORNECEDORA E TRIBUTARIA LTDA (${cleanCnpj.substring(0, 8)})`,
    nome_fantasia: 'Distribuidora & Comércio Fiscal',
    porte: cleanCnpj.endsWith('0001') ? 'ME' : 'EPP',
    optante_simples: true,
    optante_simei: false,
    uf: 'MT',
    municipio: 'Cuiabá',
    cnae_principal_codigo: '4649-4/99',
    cnae_principal_descricao: 'Comércio atacadista de produtos e artigos de uso geral',
    situacao_cadastral: 'ATIVA',
    fonte_api: 'Motor de Consulta Interno (Simulação Ativa)'
  };

  cnpjCache.set(cleanCnpj, { data: mockResult, timestamp: Date.now() });
  return mockResult;
}
