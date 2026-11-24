import { normalizarPorteFiscal } from '../lib/porteFiscal.js';
import type { PorteEmpresa } from '../types.js';

export interface CnpjApiResult {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  porte: PorteEmpresa;
  optante_simples: boolean;
  optante_simei: boolean;
  uf?: string;
  municipio?: string;
  cnae_principal_codigo?: string;
  cnae_principal_descricao?: string;
  cnaes_secundarios?: Array<{ codigo: string; descricao?: string }>;
  situacao_cadastral: string;
  fonte_api: string;
}

export type CnpjApiProvider = 'AUTO' | 'BRASIL_API' | 'OPEN_CNPJ' | 'RECEITA_WS' | 'CNPJA';

type ProviderFailureKind = 'not_found' | 'unavailable';
type JsonRecord = Record<string, unknown>;

const PROVIDER_ORDER: Exclude<CnpjApiProvider, 'AUTO'>[] = [
  'RECEITA_WS',
  'CNPJA',
  'BRASIL_API',
  'OPEN_CNPJ',
];

export class CnpjConsultationError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 503,
    readonly code: 'INVALID_CNPJ' | 'INVALID_PROVIDER' | 'CNPJ_NOT_FOUND' | 'PROVIDERS_UNAVAILABLE',
  ) {
    super(message);
    this.name = 'CnpjConsultationError';
  }
}

class ProviderFailure extends Error {
  constructor(
    readonly provider: Exclude<CnpjApiProvider, 'AUTO'>,
    readonly kind: ProviderFailureKind,
    message: string,
  ) {
    super(message);
    this.name = 'ProviderFailure';
  }
}

export function parseCnpjProvider(value: unknown): CnpjApiProvider {
  if (value === undefined || value === null || value === '') return 'AUTO';
  if (typeof value !== 'string') {
    throw new CnpjConsultationError('Provedor de consulta inválido.', 400, 'INVALID_PROVIDER');
  }

  const provider = value.trim().toUpperCase().replace(/[\s-]+/g, '_');
  switch (provider) {
    case 'AUTO':
      return 'AUTO';
    case 'BRASIL_API':
    case 'BRASILAPI':
      return 'BRASIL_API';
    case 'OPEN_CNPJ':
    case 'OPENCNPJ':
      return 'OPEN_CNPJ';
    case 'RECEITA_WS':
    case 'RECEITAWS':
      return 'RECEITA_WS';
    case 'CNPJA':
    case 'CNPJ_JA':
      return 'CNPJA';
    default:
      throw new CnpjConsultationError('Provedor de consulta inválido.', 400, 'INVALID_PROVIDER');
  }
}

function asRecord(value: unknown): JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function getPath(value: unknown, ...path: string[]): unknown {
  return path.reduce<unknown>((current, key) => asRecord(current)[key], value);
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function isTrue(...values: unknown[]): boolean {
  return values.some(value =>
    value === true ||
    value === 1 ||
    (typeof value === 'string' && ['S', 'SIM', 'TRUE', 'YES', '1'].includes(value.trim().toUpperCase())),
  );
}

function normalizeCnae(value: unknown): string | undefined {
  const cnae = firstString(value)?.replace(/\D/g, '');
  return cnae || undefined;
}

function normalizeSecondaryCnaes(value: unknown): Array<{ codigo: string; descricao?: string }> | undefined {
  if (!Array.isArray(value)) return undefined;
  const cnaes = value.flatMap(item => {
    const data = asRecord(item);
    const codigo = normalizeCnae(data.codigo ?? data.cnae ?? data.code ?? data.id);
    return codigo
      ? [{ codigo, descricao: firstString(data.descricao, data.text, data.description) }]
      : [];
  });
  return cnaes.length ? cnaes : undefined;
}

function buildResult(
  provider: Exclude<CnpjApiProvider, 'AUTO'>,
  cleanDigits: string,
  data: {
    cnpj?: unknown;
    razaoSocial?: unknown;
    nomeFantasia?: unknown;
    porte?: unknown;
    isSimei: boolean;
    isSimples: boolean;
    uf?: unknown;
    municipio?: unknown;
    cnaeCodigo?: unknown;
    cnaeDescricao?: unknown;
    cnaesSecundarios?: unknown;
    situacao?: unknown;
  },
): CnpjApiResult {
  const razaoSocial = firstString(data.razaoSocial, data.nomeFantasia);
  if (!razaoSocial) {
    throw new ProviderFailure(provider, 'unavailable', 'O provedor retornou dados cadastrais incompletos.');
  }

  const sourceNames: Record<Exclude<CnpjApiProvider, 'AUTO'>, string> = {
    RECEITA_WS: 'ReceitaWS',
    CNPJA: 'CNPJ Já',
    BRASIL_API: 'BrasilAPI',
    OPEN_CNPJ: 'OpenCNPJ',
  };

  return {
    cnpj: firstString(data.cnpj) || cleanDigits,
    razao_social: razaoSocial,
    nome_fantasia: firstString(data.nomeFantasia) || undefined,
    porte: normalizarPorteFiscal(data.porte, data.isSimei) || 'NÃO INFORMADO',
    optante_simples: data.isSimples || data.isSimei,
    optante_simei: data.isSimei,
    uf: firstString(data.uf),
    municipio: firstString(data.municipio),
    cnae_principal_codigo: normalizeCnae(data.cnaeCodigo),
    cnae_principal_descricao: firstString(data.cnaeDescricao),
    cnaes_secundarios: normalizeSecondaryCnaes(data.cnaesSecundarios),
    situacao_cadastral: firstString(data.situacao) || 'ATIVA',
    fonte_api: sourceNames[provider],
  };
}

async function fetchJson(
  provider: Exclude<CnpjApiProvider, 'AUTO'>,
  url: string,
  headers?: HeadersInit,
): Promise<JsonRecord> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ProviderFailure(provider, 'unavailable', `${provider} indisponível.`);
  }

  if (!response.ok) {
    const kind = response.status === 404 ? 'not_found' : 'unavailable';
    throw new ProviderFailure(provider, kind, `${provider} retornou HTTP ${response.status}.`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ProviderFailure(provider, 'unavailable', `${provider} retornou uma resposta inválida.`);
  }

  return asRecord(json);
}

function dataForBrasilApi(data: JsonRecord, cnpj: string): CnpjApiResult {
  const isSimei = isTrue(data.opcao_pelo_mei, data.opcao_mei);
  return buildResult('BRASIL_API', cnpj, {
    cnpj: data.cnpj,
    razaoSocial: data.razao_social,
    nomeFantasia: data.nome_fantasia,
    porte: data.porte,
    isSimei,
    isSimples: isTrue(data.opcao_pelo_simples, data.opcao_simples),
    uf: data.uf,
    municipio: data.municipio,
    cnaeCodigo: data.cnae_fiscal,
    cnaeDescricao: data.cnae_fiscal_descricao,
    cnaesSecundarios: data.cnaes_secundarios,
    situacao: data.descricao_situacao_cadastral,
  });
}

function dataForOpenCnpj(response: JsonRecord, cnpj: string): CnpjApiResult {
  const data = asRecord(response.data ?? response);
  const cnaes = Array.isArray(data.cnaes) ? data.cnaes : [];
  const principal = cnaes.find(item => asRecord(item).is_principal === true) ?? cnaes[0];
  const principalData = asRecord(principal);
  const isSimei = isTrue(
    data.opcaoMei,
    data.opcao_mei,
    data.opcao_pelo_mei,
    data.optante_simei,
    data.optanteSimei,
    getPath(data, 'simples_nacional', 'mei'),
    getPath(data, 'simples', 'optante_simei'),
    getPath(data, 'simei', 'optante'),
    getPath(data, 'simei', 'optant'),
    data.porte === 'MEI',
  );
  const isSimples = isTrue(
    data.opcaoSimples,
    data.opcao_simples,
    data.opcao_pelo_simples,
    data.optante_simples,
    data.optanteSimples,
    getPath(data, 'simples_nacional', 'optante'),
    getPath(data, 'simples', 'optante'),
    getPath(data, 'simples', 'optant'),
  );

  return buildResult('OPEN_CNPJ', cnpj, {
    cnpj: data.cnpj,
    razaoSocial: data.razaoSocial ?? data.razao_social ?? data.nome,
    nomeFantasia: data.nomeFantasia ?? data.nome_fantasia,
    porte: data.porte ?? data.porteFiscal,
    isSimei,
    isSimples,
    uf: data.uf,
    municipio: data.municipio,
    cnaeCodigo: principalData.cnae ?? principalData.codigo ?? data.cnae_principal,
    cnaeDescricao: principalData.descricao ?? data.cnae_descricao,
    cnaesSecundarios: cnaes.filter(item => item !== principal),
    situacao: data.situacaoCadastral ?? data.situacao,
  });
}

function dataForCnpja(data: JsonRecord, cnpj: string): CnpjApiResult {
  const company = asRecord(data.company);
  const address = asRecord(data.address);
  const mainActivity = asRecord(data.mainActivity ?? data.main_activity);
  const size = asRecord(company.size ?? data.size);
  const status = asRecord(data.status);
  const simples = asRecord(data.simples);
  const simei = asRecord(data.simei);

  return buildResult('CNPJA', cnpj, {
    cnpj: data.taxId ?? data.cnpj,
    razaoSocial: company.name ?? data.name ?? data.razao_social,
    nomeFantasia: data.alias ?? data.nome_fantasia,
    porte: size.text ?? size.name ?? size.id ?? data.porte,
    isSimei: isTrue(
      simei.optant,
      simei.optante,
      getPath(data, 'simples', 'optante_simei'),
      data.opcao_pelo_mei,
    ),
    isSimples: isTrue(simples.optant, simples.optante, data.opcao_pelo_simples),
    uf: address.state ?? data.uf,
    municipio: address.city ?? data.municipio,
    cnaeCodigo: mainActivity.id ?? mainActivity.code ?? data.cnae_fiscal,
    cnaeDescricao: mainActivity.text ?? mainActivity.description ?? data.cnae_fiscal_descricao,
    cnaesSecundarios: data.sideActivities ?? data.cnaes_secundarios,
    situacao: status.text ?? data.situacao,
  });
}

function dataForReceitaWs(data: JsonRecord, cnpj: string): CnpjApiResult {
  if (String(data.status || '').toUpperCase() === 'ERROR') {
    const message = firstString(data.message) || 'ReceitaWS não conseguiu consultar o CNPJ.';
    const kind = /não encontrado|nao encontrado|not found/i.test(message) ? 'not_found' : 'unavailable';
    throw new ProviderFailure('RECEITA_WS', kind, message);
  }

  const activity = Array.isArray(data.atividade_principal) ? asRecord(data.atividade_principal[0]) : {};
  const simei = asRecord(data.simei);
  const simples = asRecord(data.simples);
  return buildResult('RECEITA_WS', cnpj, {
    cnpj,
    razaoSocial: data.nome,
    nomeFantasia: data.fantasia,
    porte: data.porte,
    isSimei: isTrue(simei.optante),
    isSimples: isTrue(simples.optante),
    uf: data.uf,
    municipio: data.municipio,
    cnaeCodigo: activity.code,
    cnaeDescricao: activity.text,
    cnaesSecundarios: data.atividade_secundaria,
    situacao: data.situacao,
  });
}

async function fetchFromProvider(
  provider: Exclude<CnpjApiProvider, 'AUTO'>,
  cnpj: string,
): Promise<CnpjApiResult> {
  switch (provider) {
    case 'RECEITA_WS': {
      const token = process.env.RECEITAWS_TOKEN;
      if (!token) {
        throw new ProviderFailure('RECEITA_WS', 'unavailable', 'Credencial da ReceitaWS não configurada.');
      }
      const data = await fetchJson(
        provider,
        `https://receitaws.com.br/v1/cnpj/${cnpj}`,
        { Authorization: `Bearer ${token}` },
      );
      return dataForReceitaWs(data, cnpj);
    }
    case 'CNPJA':
      return dataForCnpja(await fetchJson(provider, `https://open.cnpja.com/office/${cnpj}`), cnpj);
    case 'BRASIL_API':
      return dataForBrasilApi(await fetchJson(provider, `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`), cnpj);
    case 'OPEN_CNPJ':
      return dataForOpenCnpj(await fetchJson(provider, `https://api.opencnpj.org/${cnpj}`), cnpj);
  }
}

export async function fetchCnpjData(
  cnpj: string,
  preferredProvider: unknown = 'AUTO',
): Promise<CnpjApiResult> {
  const cleanDigits = cnpj.replace(/\D/g, '');
  if (cleanDigits.length !== 14) {
    throw new CnpjConsultationError('CNPJ inválido. Informe 14 dígitos numéricos.', 400, 'INVALID_CNPJ');
  }

  const provider = parseCnpjProvider(preferredProvider);
  const providers = provider === 'AUTO'
    ? PROVIDER_ORDER
    : [provider, ...PROVIDER_ORDER.filter(candidate => candidate !== provider)];
  const failures: ProviderFailure[] = [];

  for (const candidate of providers) {
    try {
      return await fetchFromProvider(candidate, cleanDigits);
    } catch (error) {
      const failure = error instanceof ProviderFailure
        ? error
        : new ProviderFailure(candidate, 'unavailable', `${candidate} retornou uma resposta inválida.`);
      failures.push(failure);
      console.warn(`[CNPJ Backend] ${failure.message}`);
    }
  }

  if (failures.length > 0 && failures.every(failure => failure.kind === 'not_found')) {
    throw new CnpjConsultationError(
      'CNPJ não encontrado nas APIs consultadas.',
      404,
      'CNPJ_NOT_FOUND',
    );
  }

  throw new CnpjConsultationError(
    'As APIs de consulta de CNPJ estão temporariamente indisponíveis. Tente novamente.',
    503,
    'PROVIDERS_UNAVAILABLE',
  );
}
