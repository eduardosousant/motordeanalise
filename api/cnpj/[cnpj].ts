import { CnpjConsultationError, fetchCnpjData } from '../../src/server/cnpjService.js';

interface CnpjRequest {
  query: Record<string, string | string[] | undefined>;
}

interface CnpjResponse {
  status(code: number): CnpjResponse;
  json(body: unknown): CnpjResponse;
}

export default async function handler(req: CnpjRequest, res: CnpjResponse) {
  const cnpj = req.query.cnpj;
  const provider = req.query.provider ?? req.query.provedor;

  try {
    const data = await fetchCnpjData(Array.isArray(cnpj) ? cnpj[0] || '' : cnpj || '', provider);
    return res.status(200).json(data);
  } catch (error) {
    if (error instanceof CnpjConsultationError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }

    console.error('Erro na consulta CNPJ:', error);
    return res.status(503).json({
      error: 'Erro temporário ao consultar CNPJ.',
      code: 'PROVIDERS_UNAVAILABLE',
    });
  }
}
