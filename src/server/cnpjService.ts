import { CnpjApiResult } from '../types.js';

const RECEITA_WS_TOKEN = '68dab6958a51c8587fc1d988fa86a7fef418f44d6202924befbc024661673606';

/**
 * Normaliza a resposta das APIs para a estrutura CnpjApiResult do projeto.
 */
function normalizeCnpjResult(data: any, fonte: string): CnpjApiResult {
  return {
    cnpj: data.cnpj ? String(data.cnpj).replace(/\D/g, '') : '',
    razao_social: data.razao_social || data.nome || 'Razão Social não informada',
    nome_fantasia: data.nome_fantasia || data.fantasia || data.razao_social || data.nome || '',
    porte: data.porte || 'ME',
    optante_simples: Boolean(
        data.opcao_pelo_simples ??
        data.optante_simples ??
        data.simples?.optante ??
        data.simples_nacional?.optante
    ),
    optante_simei: Boolean(
        data.opcao_pelo_mei ??
        data.optante_simei ??
        data.simei?.optante ??
        data.simples_nacional?.mei
    ),
    uf: data.uf || data.endereco?.uf || 'MT',
    municipio: data.municipio || data.endereco?.municipio || 'Cuiabá',
    cnae_principal_codigo: data.cnae_fiscal
        ? String(data.cnae_fiscal)
        : data.atividade_principal?.[0]?.code
            ? String(data.atividade_principal[0].code).replace(/\D/g, '')
            : data.cnae_principal || undefined,
    cnae_principal_descricao: data.cnae_fiscal_descricao || data.atividade_principal?.[0]?.text || data.cnae_descricao || undefined,
    situacao_cadastral: data.descricao_situacao_cadastral || data.situacao || data.situacao_cadastral || 'ATIVA',
    fonte_api: fonte
  };
}

/**
 * Consulta CNPJ no backend aplicando fallback sequencial:
 * BrasilAPI -> OpenCNPJ -> ReceitaWS -> CNPJ.ws -> Mock Local (se todas falharem)
 */
export async function fetchCnpjData(cnpjInput: string): Promise<CnpjApiResult> {
  const cleanDigits = cnpjInput.replace(/\D/g, '');

  if (cleanDigits.length !== 14) {
    throw new Error('CNPJ deve conter exatamente 14 dígitos numéricos.');
  }

  // 1. BrasilAPI
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanDigits}`);
    if (res.ok) {
      const data = await res.json();
      return normalizeCnpjResult(data, 'BrasilAPI');
    }
  } catch (err) {
    console.warn('[CNPJ Backend] BrasilAPI indisponível. Tentando OpenCNPJ...');
  }

  // 2. OpenCNPJ
  try {
    const res = await fetch(`https://api.opencnpj.org/${cleanDigits}`);
    if (res.ok) {
      const data = await res.json();
      return normalizeCnpjResult(data, 'OpenCNPJ');
    }
  } catch (err) {
    console.warn('[CNPJ Backend] OpenCNPJ indisponível. Tentando ReceitaWS...');
  }

  // 3. ReceitaWS (Com Token)
  try {
    const res = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanDigits}`, {
      headers: {
        'Authorization': `Bearer ${RECEITA_WS_TOKEN}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status !== 'ERROR') {
        return normalizeCnpjResult(data, 'ReceitaWS');
      }
    }
  } catch (err) {
    console.warn('[CNPJ Backend] ReceitaWS indisponível. Tentando CNPJ.ws...');
  }

  // 4. CNPJ.ws
  try {
    const res = await fetch(`https://publica.cnpj.ws/cnpj/${cleanDigits}`);
    if (res.ok) {
      const data = await res.json();
      return normalizeCnpjResult({
        cnpj: data.cnpj?.numero,
        razao_social: data.razao_social,
        nome_fantasia: data.estabelecimento?.nome_fantasia,
        porte: data.porte?.descricao,
        optante_simples: data.simples?.simples === 'Sim',
        optante_simei: data.simples?.mei === 'Sim',
        uf: data.estabelecimento?.estado?.sigla,
        municipio: data.estabelecimento?.cidade?.nome,
        cnae_fiscal: data.estabelecimento?.atividade_principal?.id,
        cnae_fiscal_descricao: data.estabelecimento?.atividade_principal?.descricao,
        situacao: data.estabelecimento?.situacao_cadastral
      }, 'CNPJ.ws');
    }
  } catch (err) {
    console.warn('[CNPJ Backend] CNPJ.ws indisponível. Gerando dados padrão de contingência...');
  }

  // 5. Fallback de Contingência
  return {
    cnpj: cleanDigits,
    razao_social: 'EMPRESA CONSULTADA (DADOS INDISPONÍVEIS NAS APIS)',
    nome_fantasia: 'Contingência Local',
    porte: 'ME',
    optante_simples: true,
    optante_simei: false,
    uf: 'MT',
    municipio: 'Cuiabá',
    situacao_cadastral: 'ATIVA',
    fonte_api: 'Contingência Interna'
  };
}