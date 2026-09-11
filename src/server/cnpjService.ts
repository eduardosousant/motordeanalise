import fetch from 'node-fetch';

export interface CnpjApiResult {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  porte: string;
  optante_simples: boolean;
  optante_simei: boolean;
  uf?: string;
  municipio?: string;
  cnae_principal_codigo?: string;
  cnae_principal_descricao?: string;
  situacao_cadastral: string;
  fonte_api: string;
}

export type CnpjApiProvider = 'AUTO' | 'BRASIL_API' | 'OPEN_CNPJ' | 'RECEITA_WS';

const RECEITA_WS_TOKEN = '68dab6958a51c8587fc1d988fa86a7fef418f44d6202924befbc024661673606';

/**
 * Função auxiliar para padronizar e corrigir o Porte Fiscal caso a empresa seja MEI/SIMEI
 */
function resolvePorte(porteBruto: string | undefined, isSimei: boolean): string {
  if (isSimei) return 'MEI';
  if (!porteBruto) return 'ME';

  const p = porteBruto.toUpperCase().trim();
  if (p === 'MICRO EMPRESA' || p === 'MICROEMPRESA' || p === 'ME') return 'ME';
  if (p === 'EMPRESA DE PEQUENO PORTE' || p === 'EPP') return 'EPP';
  if (p === 'DEMAIS' || p === 'DEMAIS/OUTROS') return 'DEMAIS';

  return porteBruto;
}

async function fetchFromBrasilApi(cleanDigits: string): Promise<CnpjApiResult> {
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanDigits}`);
  if (!res.ok) throw new Error('BrasilAPI retornou erro HTTP ' + res.status);

  const data: any = await res.json();
  const isSimei = Boolean(data.opcao_pelo_mei);
  const isSimples = Boolean(data.opcao_pelo_simples) || isSimei;

  return {
    cnpj: data.cnpj || cleanDigits,
    razao_social: data.razao_social,
    nome_fantasia: data.nome_fantasia || data.razao_social,
    porte: resolvePorte(data.porte, isSimei),
    optante_simples: isSimples,
    optante_simei: isSimei,
    uf: data.uf,
    municipio: data.municipio,
    cnae_principal_codigo: data.cnae_fiscal ? String(data.cnae_fiscal) : undefined,
    cnae_principal_descricao: data.cnae_fiscal_descricao,
    situacao_cadastral: data.descricao_situacao_cadastral || 'ATIVA',
    fonte_api: 'BrasilAPI'
  };
}

async function fetchFromOpenCnpj(cleanDigits: string): Promise<CnpjApiResult> {
  const res = await fetch(`https://kitana.opencnpj.com/cnpj/${cleanDigits}`);
  if (!res.ok) throw new Error('OpenCNPJ retornou erro HTTP ' + res.status);

  const responseJson: any = await res.json();
  const data = responseJson.data || responseJson;

  const isSimei =
      data.opcaoMei === 'S' ||
      data.opcaoMei === true ||
      data.simples_nacional?.mei === true ||
      String(data.mei).toLowerCase() === 'sim';

  const isSimples =
      data.opcaoSimples === 'S' ||
      data.opcaoSimples === true ||
      data.simples_nacional?.optante === true ||
      String(data.simples).toLowerCase() === 'sim' ||
      isSimei;

  const cnaePrincipal = Array.isArray(data.cnaes) && data.cnaes.length > 0
      ? data.cnaes[0]
      : null;

  return {
    cnpj: data.cnpj || cleanDigits,
    razao_social: data.razaoSocial || data.razao_social || data.nome,
    nome_fantasia: data.nomeFantasia || data.nome_fantasia || data.razaoSocial || data.nome,
    porte: resolvePorte(data.porte || data.porteFiscal, isSimei),
    optante_simples: isSimples,
    optante_simei: isSimei,
    uf: data.uf || 'MT',
    municipio: data.municipio || 'Cuiabá',
    cnae_principal_codigo: cnaePrincipal?.cnae || data.cnae_principal,
    cnae_principal_descricao: cnaePrincipal?.descricao || data.cnae_descricao,
    situacao_cadastral: data.situacaoCadastral || data.situacao || 'ATIVA',
    fonte_api: 'OpenCNPJ'
  };
}

async function fetchFromReceitaWs(cleanDigits: string): Promise<CnpjApiResult> {
  const res = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanDigits}`, {
    headers: {
      'Authorization': `Bearer ${RECEITA_WS_TOKEN}`
    }
  });

  if (!res.ok) throw new Error('ReceitaWS retornou erro HTTP ' + res.status);

  const data: any = await res.json();
  if (data.status === 'ERROR') {
    throw new Error(data.message || 'CNPJ não encontrado na ReceitaWS');
  }

  const isSimei = Boolean(data.simei?.optante);
  const isSimples = Boolean(data.simples?.optante) || isSimei;

  return {
    cnpj: cleanDigits,
    razao_social: data.nome,
    nome_fantasia: data.fantasia || data.nome,
    porte: resolvePorte(data.porte, isSimei),
    optante_simples: isSimples,
    optante_simei: isSimei,
    uf: data.uf,
    municipio: data.municipio,
    cnae_principal_codigo: data.atividade_principal?.[0]?.code ? String(data.atividade_principal[0].code).replace(/\D/g, '') : undefined,
    cnae_principal_descricao: data.atividade_principal?.[0]?.text,
    situacao_cadastral: data.situacao || 'ATIVA',
    fonte_api: 'ReceitaWS'
  };
}

export async function fetchCnpjData(cnpj: string, provider: CnpjApiProvider = 'AUTO'): Promise<CnpjApiResult> {
  const cleanDigits = cnpj.replace(/\D/g, '');

  if (cleanDigits.length !== 14) {
    throw new Error('CNPJ inválido. Informe 14 dígitos numéricos.');
  }

  // 1. Execução direta quando o usuário fixa um provedor específico
  if (provider === 'BRASIL_API') return await fetchFromBrasilApi(cleanDigits);
  if (provider === 'OPEN_CNPJ') return await fetchFromOpenCnpj(cleanDigits);
  if (provider === 'RECEITA_WS') return await fetchFromReceitaWs(cleanDigits);

  // 2. Execução 'AUTO' (Mecanismo de Fallback em cadeia)
  try {
    return await fetchFromBrasilApi(cleanDigits);
  } catch (err) {
    console.warn('[CNPJ Backend] BrasilAPI falhou. Tentando OpenCNPJ...', err);
  }

  try {
    return await fetchFromOpenCnpj(cleanDigits);
  } catch (err) {
    console.warn('[CNPJ Backend] OpenCNPJ falhou. Tentando ReceitaWS...', err);
  }

  try {
    return await fetchFromReceitaWs(cleanDigits);
  } catch (err) {
    console.error('[CNPJ Backend] ReceitaWS falhou:', err);
  }

  throw new Error('Não foi possível obter os dados do CNPJ em nenhuma das APIs parceiras.');
}