import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { CnpjConsultationError, fetchCnpjData } from './cnpjService.js';
import { consultarCNPJ } from '../services/api.js';

const originalFetch = globalThis.fetch;
const originalReceitaToken = process.env.RECEITAWS_TOKEN;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalReceitaToken === undefined) {
    delete process.env.RECEITAWS_TOKEN;
  } else {
    process.env.RECEITAWS_TOKEN = originalReceitaToken;
  }
});

test('uses the selected provider first and normalizes its fiscal size', async () => {
  delete process.env.RECEITAWS_TOKEN;
  const requestedUrls: string[] = [];
  globalThis.fetch = async input => {
    const url = String(input);
    requestedUrls.push(url);
    return new Response(JSON.stringify({
      cnpj: '11222333000181',
      razao_social: 'Empresa exemplo',
      porte: '03',
      cnae_fiscal: 4321500,
    }), { status: 200 });
  };

  const result = await fetchCnpjData('11.222.333/0001-81', 'brasilapi');

  assert.equal(requestedUrls.length, 1);
  assert.match(requestedUrls[0], /brasilapi\.com\.br/);
  assert.equal(result.porte, 'EPP');
  assert.equal(result.fonte_api, 'BrasilAPI');
});

test('fails over from transient provider failure to a succeeding provider', async () => {
  delete process.env.RECEITAWS_TOKEN;
  const requestedUrls: string[] = [];
  globalThis.fetch = async input => {
    const url = String(input);
    requestedUrls.push(url);
    if (url.includes('open.cnpja.com')) return new Response('', { status: 503 });
    return new Response(JSON.stringify({
      cnpj: '11222333000181',
      razao_social: 'Empresa exemplo',
      porte: 'Micro Empresa',
    }), { status: 200 });
  };

  const result = await fetchCnpjData('11222333000181', 'auto');

  assert.deepEqual(requestedUrls.map(url => new URL(url).hostname), [
    'open.cnpja.com',
    'brasilapi.com.br',
  ]);
  assert.equal(result.fonte_api, 'BrasilAPI');
  assert.equal(result.porte, 'ME');
});

test('normalizes the CNPJ Já response shape including fiscal size', async () => {
  delete process.env.RECEITAWS_TOKEN;
  globalThis.fetch = async () => new Response(JSON.stringify({
    taxId: '11222333000181',
    alias: 'Fantasia exemplo',
    company: {
      name: 'Empresa exemplo',
      size: { id: '03', text: 'Empresa de Pequeno Porte' },
    },
    address: { state: 'MT', city: 'Cuiabá' },
    mainActivity: { id: '4321500', text: 'Instalação elétrica' },
    sideActivities: [{ id: '4322301', text: 'Instalações hidráulicas' }],
    simples: { optant: true },
    simei: { optant: false },
  }), { status: 200 });

  const result = await fetchCnpjData('11222333000181', 'cnpja');

  assert.equal(result.fonte_api, 'CNPJ Já');
  assert.equal(result.porte, 'EPP');
  assert.equal(result.razao_social, 'Empresa exemplo');
  assert.equal(result.cnae_principal_codigo, '4321500');
  assert.equal(result.cnaes_secundarios?.[0].codigo, '4322301');
});

test('does not infer ME when the provider omits fiscal size', async () => {
  delete process.env.RECEITAWS_TOKEN;
  globalThis.fetch = async () => new Response(JSON.stringify({
    cnpj: '11222333000181',
    razao_social: 'Empresa exemplo',
    opcao_pelo_mei: false,
  }), { status: 200 });

  const result = await fetchCnpjData('11222333000181', 'BRASIL_API');

  assert.equal(result.porte, 'NÃO INFORMADO');
});

test('the Conformidade client uses the shared endpoint and preserves the fiscal size', async () => {
  let requestUrl = '';
  globalThis.fetch = async input => {
    requestUrl = String(input);
    return new Response(JSON.stringify({
      cnpj: '11222333000181',
      razao_social: 'Empresa exemplo',
      porte: 'NÃO INFORMADO',
      optante_simples: false,
      optante_simei: false,
      fonte_api: 'CNPJ Já',
      situacao_cadastral: 'ATIVA',
    }), { status: 200 });
  };

  const result = await consultarCNPJ('11222333000181', 'cnpja');

  assert.equal(requestUrl, '/api/cnpj/11222333000181?provider=cnpja');
  assert.equal(result?.porteFiscal, 'NÃO INFORMADO');
  assert.equal(result?.provedor, 'cnpja');
});

test('distinguishes a not-found result from provider unavailability', async () => {
  process.env.RECEITAWS_TOKEN = 'test-token';
  globalThis.fetch = async () => new Response('', { status: 404 });

  await assert.rejects(
    fetchCnpjData('11222333000181'),
    error => error instanceof CnpjConsultationError && error.status === 404 && error.code === 'CNPJ_NOT_FOUND',
  );

  globalThis.fetch = async () => new Response('', { status: 503 });
  await assert.rejects(
    fetchCnpjData('11222333000181'),
    error => error instanceof CnpjConsultationError && error.status === 503 && error.code === 'PROVIDERS_UNAVAILABLE',
  );
});
