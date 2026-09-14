import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { cnpj, provider } = req.query;
    const cleanDigits = String(cnpj || '').replace(/\D/g, '');

    if (cleanDigits.length !== 14) {
        return res.status(400).json({ error: 'CNPJ inválido. Informe 14 dígitos.' });
    }

    try {
        // Consulta direta à OpenCNPJ
        const apiRes = await fetch(`https://kitana.opencnpj.com/cnpj/${cleanDigits}`);
        if (apiRes.ok) {
            const responseJson = await apiRes.json();
            const data = responseJson.data || responseJson;

            const isSimei = data.opcaoMei === 'S' || data.opcaoMei === true;
            const isSimples = data.opcaoSimples === 'S' || data.opcaoSimples === true || isSimei;

            const cnaePrincipal = Array.isArray(data.cnaes) && data.cnaes.length > 0 ? data.cnaes[0] : null;

            return res.status(200).json({
                cnpj: data.cnpj || cleanDigits,
                razao_social: data.razaoSocial || data.razao_social || data.nome,
                nome_fantasia: data.nomeFantasia || data.nome_fantasia || data.razaoSocial,
                porte: isSimei ? 'MEI' : (data.porte || 'ME'),
                optante_simples: isSimples,
                optante_simei: isSimei,
                uf: data.uf || 'MT',
                municipio: data.municipio || 'Cuiabá',
                cnae_principal_codigo: cnaePrincipal?.cnae,
                cnae_principal_descricao: cnaePrincipal?.descricao,
                situacao_cadastral: data.situacaoCadastral || 'ATIVA',
                fonte_api: 'OpenCNPJ'
            });
        }

        // Fallback para a BrasilAPI caso OpenCNPJ falhe
        const brasilRes = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanDigits}`);
        if (brasilRes.ok) {
            const data = await brasilRes.json();
            const isSimei = Boolean(data.opcao_pelo_mei);

            return res.status(200).json({
                cnpj: data.cnpj,
                razao_social: data.razao_social,
                nome_fantasia: data.nome_fantasia || data.razao_social,
                porte: isSimei ? 'MEI' : (data.porte || 'ME'),
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

        return res.status(500).json({ error: 'Não foi possível obter dados do CNPJ.' });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Erro de conexão com o serviço CNPJ.' });
    }
}