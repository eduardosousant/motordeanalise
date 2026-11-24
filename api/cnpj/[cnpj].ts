import type { VercelRequest, VercelResponse } from '@vercel/node';
import { normalizarPorteFiscal } from '../../src/lib/porteFiscal.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Pega o CNPJ do caminho da URL e o provider dos parâmetros da busca
  const cnpjParam = req.query.cnpj as string;
  const provider = (req.query.provider as string) || 'AUTO';

  const cleanDigits = String(cnpjParam || '').replace(/\D/g, '');

  if (cleanDigits.length !== 14) {
    return res.status(400).json({ error: 'CNPJ inválido' });
  }

  try {
    let openCnpjFallback: Record<string, unknown> | null = null;

    // 1. Tenta OpenCNPJ
    if (provider === 'OPEN_CNPJ' || provider === 'AUTO') {
      try {
        const openRes = await fetch(`https://kitana.opencnpj.com/cnpj/${cleanDigits}`);
        if (openRes.ok) {
          const responseJson = await openRes.json();
          const data = responseJson.data || responseJson;

          const isSimei = data.opcaoMei === 'S' || data.opcaoMei === true;
          const isSimples = data.opcaoSimples === 'S' || data.opcaoSimples === true || isSimei;
          const porte = normalizarPorteFiscal(data.porte || data.porteFiscal, isSimei);
          const cnaePrincipal = Array.isArray(data.cnaes) && data.cnaes.length > 0 ? data.cnaes[0] : null;

          if (data.cnpj || data.razaoSocial || data.razao_social || data.nome) {
            openCnpjFallback = {
              cnpj: data.cnpj || cleanDigits,
              razao_social: data.razaoSocial || data.razao_social || data.nome,
              nome_fantasia: data.nomeFantasia || data.nome_fantasia || data.razaoSocial || data.nome,
              porte: porte || 'NÃO INFORMADO',
              optante_simples: isSimples,
              optante_simei: isSimei,
              uf: data.uf,
              municipio: data.municipio,
              cnae_principal_codigo: cnaePrincipal?.cnae,
              cnae_principal_descricao: cnaePrincipal?.descricao,
              situacao_cadastral: data.situacaoCadastral || data.situacao || 'ATIVA',
              fonte_api: 'OpenCNPJ'
            };

            if (porte) return res.status(200).json(openCnpjFallback);
          }
        }
      } catch (e) {
        if (provider !== 'AUTO') throw e;
      }
    }

    // 2. Fallback BrasilAPI
    let brasilRes: Response | null = null;
    try {
      brasilRes = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanDigits}`);
    } catch (error) {
      if (!openCnpjFallback) throw error;
    }

    if (brasilRes?.ok) {
      const data = await brasilRes.json();
      const isSimei = Boolean(data.opcao_pelo_mei);
      const porte = normalizarPorteFiscal(data.porte, isSimei);

      if (!data.cnpj && !data.razao_social && !data.nome_fantasia) {
        return res.status(502).json({ error: 'A API de CNPJ retornou uma resposta incompleta. Tente novamente.' });
      }

      return res.status(200).json({
        cnpj: data.cnpj,
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia || data.razao_social,
        porte: porte || 'NÃO INFORMADO',
        optante_simples: Boolean(data.opcao_pelo_simples) || isSimei,
        optante_simei: isSimei,
        uf: data.uf,
        municipio: data.municipio,
        cnae_principal_codigo: data.cnae_fiscal ? String(data.cnae_fiscal) : undefined,
        cnae_principal_descricao: data.cnae_fiscal_descricao,
        situacao_cadastral: data.descricao_situacao_cadastral || 'ATIVA',
        fonte_api: 'BrasilAPI'
      });
    }

    if (openCnpjFallback) return res.status(200).json(openCnpjFallback);

    if (brasilRes?.status === 404) {
      return res.status(404).json({ error: 'CNPJ não encontrado nas APIs consultadas.' });
    }

    return res.status(503).json({ error: 'As APIs de consulta de CNPJ estão temporariamente indisponíveis. Tente novamente.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao consultar CNPJ' });
  }
}
