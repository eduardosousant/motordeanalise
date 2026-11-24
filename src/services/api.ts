import { AnaliseFiscalResponse, OrcamentoInput, ServicoInput, ProvedorCNPJ, InfoProvedorCNPJ } from '../types/fiscal';
import type { CnpjApiResult } from '../types.js';

export const PROVEDORES_DISPONIVEIS: InfoProvedorCNPJ[] = [
  {
    id: 'auto',
    nome: 'Automático (Multi-Provedor)',
    descricao: 'Consulta centralizada no servidor com failover entre provedores',
    url: '/api/cnpj/',
    tipo: 'comercial_token',
    ativo: true,
  },
  {
    id: 'receitaws',
    nome: 'ReceitaWS',
    descricao: 'Provedor preferencial consultado pelo servidor',
    url: '/api/cnpj/',
    tipo: 'comercial_token',
    ativo: true,
  },
  {
    id: 'cnpja',
    nome: 'CNPJ Já',
    descricao: 'Provedor preferencial consultado pelo servidor',
    url: '/api/cnpj/',
    tipo: 'publica',
    ativo: true,
  },
  {
    id: 'brasilapi',
    nome: 'BrasilAPI (Pública)',
    descricao: 'Provedor preferencial consultado pelo servidor',
    url: '/api/cnpj/',
    tipo: 'publica',
    ativo: true,
  },
  {
    id: 'opencnpj',
    nome: 'OpenCNPJ (Pública)',
    descricao: 'Provedor preferencial consultado pelo servidor',
    url: '/api/cnpj/',
    tipo: 'publica',
    ativo: true,
  },
];

export async function enviarParaAnalise(
  servico: ServicoInput,
  orcamentos: OrcamentoInput[]
): Promise<AnaliseFiscalResponse> {
  const payload = {
    servico,
    orcamentos,
  };

  try {
    const response = await fetch('/api/analisar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const erroBody = await response.json().catch(() => null);
      throw new Error(erroBody?.erro || `Erro HTTP ${response.status} ao processar análise.`);
    }

    const data: AnaliseFiscalResponse = await response.json();
    return data;
  } catch (err: any) {
    console.warn('Falha na chamada /api/analisar, aplicando fallback do motor fiscal local:', err);
    // Fallback fiscal client-side calculation to guarantee zero downtime
    return processarAnaliseFiscalLocal(servico, orcamentos);
  }
}

export interface ConsultaCNPJResult {
  razaoSocial?: string;
  regimeTributario?: OrcamentoInput['regimeTributario'];
  porteFiscal: CnpjApiResult['porte'];
  cnaePrincipal?: string;
  descricaoCnae?: string;
  cnaesSecundarios?: string[];
  atividadesSecundarias?: Array<{ cnae: string; descricao: string }>;
  provedor?: string;
  msgProtecao?: string;
  failoverAcionado?: boolean;
}

function formatarCnae(codigo?: string): string | undefined {
  const digits = (codigo || '').replace(/\D/g, '');
  if (digits.length !== 7) return digits || undefined;
  return `${digits.slice(0, 4)}-${digits.slice(4, 5)}/${digits.slice(5, 7)}`;
}

const PROVEDOR_POR_FONTE: Record<string, ProvedorCNPJ> = {
  ReceitaWS: 'receitaws',
  'CNPJ Já': 'cnpja',
  BrasilAPI: 'brasilapi',
  OpenCNPJ: 'opencnpj',
};

export async function consultarCNPJ(
  cnpj: string,
  provedor: ProvedorCNPJ = 'auto',
): Promise<ConsultaCNPJResult | null> {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return null;

  const response = await fetch(`/api/cnpj/${digits}?provider=${encodeURIComponent(provedor)}`);
  const body: unknown = await response.json().catch(() => null);
  const responseData = body !== null && typeof body === 'object'
    ? body as Record<string, unknown>
    : {};

  if (!response.ok) {
    const message = typeof responseData.error === 'string'
      ? responseData.error
      : `Erro HTTP ${response.status} ao consultar CNPJ.`;
    throw new Error(message);
  }

  const data = body as CnpjApiResult;
  const atividadesSecundarias = (data.cnaes_secundarios || []).map(cnae => ({
    cnae: formatarCnae(cnae.codigo) || cnae.codigo,
    descricao: cnae.descricao || 'Atividade econômica secundária',
  }));
  const isMei = data.optante_simei;
  const regimeTributario: OrcamentoInput['regimeTributario'] = isMei
    ? 'MEI'
    : data.optante_simples
      ? 'SIMPLES_NACIONAL'
      : 'LUCRO_PRESUMIDO';
  const provedorOrigem = PROVEDOR_POR_FONTE[data.fonte_api] || provedor;
  const failoverAcionado = provedor === 'auto'
    ? data.fonte_api !== 'ReceitaWS'
    : provedorOrigem !== provedor;

  return {
    razaoSocial: data.razao_social,
    regimeTributario,
    porteFiscal: data.porte,
    cnaePrincipal: formatarCnae(data.cnae_principal_codigo),
    descricaoCnae: data.cnae_principal_descricao,
    cnaesSecundarios: atividadesSecundarias.map(atividade => atividade.cnae),
    atividadesSecundarias,
    provedor: provedorOrigem,
    failoverAcionado,
    msgProtecao: failoverAcionado
      ? provedor === 'auto'
        ? `Consulta automática concluída via ${data.fonte_api}.`
        : `O provedor preferencial não respondeu; consulta concluída via ${data.fonte_api}.`
      : undefined,
  };
}

// Motor de contingência fiscal caso haja interrupção temporária de rede
function processarAnaliseFiscalLocal(servico: ServicoInput, orcamentos: OrcamentoInput[]): AnaliseFiscalResponse {
  const cnaesArt18B = ['4321-5/00', '4322-3/01', '4330-4/04', '4330-4/01', '4399-1/03', '4520-0/01', '3314-7/10'];
  const palavras18B = ['eletric', 'hidraul', 'pintur', 'alvenar', 'carpin', 'veicul', 'manutencao', 'ar condicionado'];
  const descLower = (servico.descricao || '').toLowerCase();

  const sNormFull = (servico.cnae || '').replace(/\D/g, '');

  const resultados = orcamentos.map((orc, idx) => {
    const valorNominal = Number(orc.valor) || 0;
    const regime = orc.regimeTributario || 'SIMPLES_NACIONAL';
    const cnaePrestador = orc.cnaePrincipal || servico.cnae;
    const cnaesSecundarios = orc.cnaesSecundarios || [];

    const isArt18B =
      regime === 'MEI' &&
      (cnaesArt18B.some(c => servico.cnae.includes(c)) || palavras18B.some(p => descLower.includes(p)));

    const aliquotaCPP = isArt18B ? 0.20 : 0.0;
    const valorCPP = isArt18B ? Number((valorNominal * 0.20).toFixed(2)) : 0;
    const custoEfetivoTotal = Number((valorNominal + valorCPP).toFixed(2));

    const pNormFull = cnaePrestador.replace(/\D/g, '');
    const secNorms = cnaesSecundarios.map(c => ({
      orig: c,
      norm: c.replace(/\D/g, ''),
    }));

    let compativel: 'compativel' | 'parcial' | 'incompativel' = 'incompativel';
    let origemCompatibilidade: 'principal' | 'secundario' | 'subclasse' | 'divisao' | 'nenhuma' = 'nenhuma';
    let cnaeCompativelEncontrado: string | undefined = undefined;
    let justificativaCnae = '';

    if (sNormFull && pNormFull && sNormFull === pNormFull) {
      compativel = 'compativel';
      origemCompatibilidade = 'principal';
      cnaeCompativelEncontrado = cnaePrestador;
      justificativaCnae = 'CNAE do serviço incluso na Atividade Econômica Principal do prestador.';
    } else {
      const matchSec = secNorms.find(s => s.norm === sNormFull);
      if (matchSec) {
        compativel = 'compativel';
        origemCompatibilidade = 'secundario';
        cnaeCompativelEncontrado = matchSec.orig;
        justificativaCnae = `CNAE do serviço (${servico.cnae}) incluso e autorizado entre as Atividades Secundárias do CNPJ (${matchSec.orig}).`;
      } else if (sNormFull.slice(0, 4) === pNormFull.slice(0, 4)) {
        compativel = 'compativel';
        origemCompatibilidade = 'subclasse';
        cnaeCompativelEncontrado = cnaePrestador;
        justificativaCnae = 'CNAE do serviço pertence à mesma classe/grupo da Atividade Principal.';
      } else {
        const matchSecSub = secNorms.find(s => s.norm.slice(0, 4) === sNormFull.slice(0, 4));
        if (matchSecSub) {
          compativel = 'compativel';
          origemCompatibilidade = 'subclasse';
          cnaeCompativelEncontrado = matchSecSub.orig;
          justificativaCnae = `CNAE do serviço pertence à mesma classe da Atividade Secundária (${matchSecSub.orig}).`;
        } else if (sNormFull.slice(0, 2) === pNormFull.slice(0, 2) || secNorms.some(s => s.norm.slice(0, 2) === sNormFull.slice(0, 2))) {
          compativel = 'parcial';
          origemCompatibilidade = 'divisao';
          justificativaCnae = 'Pertence à mesma divisão econômica, mas difere na especialidade.';
        } else {
          compativel = 'incompativel';
          origemCompatibilidade = 'nenhuma';
          justificativaCnae = `Incompatível: O CNAE do serviço (${servico.cnae}) NÃO consta no CNAE Principal e nem nas Atividades Secundárias do CNPJ.`;
        }
      }
    }

    const alertas: string[] = [];
    if (isArt18B) {
      alertas.push(`Incidência de CPP Patronal (Art. 18-B da LC 123/2006): Contratação de MEI exige recolhimento de 20% (R$ ${valorCPP.toFixed(2)}) de CPP.`);
    }
    if (compativel === 'incompativel') {
      alertas.push(`Incompatibilidade de CNAE: Serviço não consta no CNAE Principal nem nos secundários.`);
    } else if (origemCompatibilidade === 'secundario') {
      alertas.push(`Conformidade via CNAE Secundário (${cnaeCompativelEncontrado}).`);
    }

    return {
      id: orc.id || String(idx + 1),
      cnpj: orc.cnpj,
      razaoSocial: orc.razaoSocial || `Fornecedor ${idx + 1}`,
      regimeTributario: regime,
      valorNominal,
      incideCPP18B: isArt18B,
      aliquotaCPP,
      valorCPP,
      baseCalculoCPP: valorNominal,
      compatibilidadeCNAE: compativel,
      origemCompatibilidade,
      cnaeCompativelEncontrado,
      cnaePrestador,
      descricaoCnaePrestador: orc.descricaoCnaePrincipal || 'Atividade cadastrada',
      cnaesSecundarios,
      atividadesSecundarias: orc.atividadesSecundarias || [],
      justificativaCnae,
      custoEfetivoTotal,
      posicaoRanking: idx + 1,
      diferencaParaMelhor: 0,
      diferencaPercentual: 0,
      alertasFiscais: alertas,
      status: compativel === 'incompativel' ? 'incompativel' : ('viavel' as any),
    };
  });

  resultados.sort((a, b) => a.custoEfetivoTotal - b.custoEfetivoTotal);
  const menor = resultados[0].custoEfetivoTotal;
  const maior = resultados[resultados.length - 1].custoEfetivoTotal;

  resultados.forEach((r, i) => {
    r.posicaoRanking = i + 1;
    r.diferencaParaMelhor = Number((r.custoEfetivoTotal - menor).toFixed(2));
    r.diferencaPercentual = menor > 0 ? (r.custoEfetivoTotal - menor) / menor : 0;
    if (i === 0 && r.compatibilidadeCNAE !== 'incompativel') r.status = 'recomendado';
  });

  const melhorProposta = resultados[0];
  let parecer = `Trata-se de procedimento de tomada de contas e auditoria de conformidade fiscal e previdenciária para contratação referente ao objeto "${servico.descricao}", vinculado ao processo de adiantamento ${servico.numeroAdiantamento || 'interno'}. `;
  parecer += `Procedeu-se à equalização econômico-fiscal das ${resultados.length} propostas apresentadas mediante o cômputo dos encargos patronais diretos e verificação da aptidão cadastral perante a Receita Federal do Brasil. `;

  if (melhorProposta.incideCPP18B) {
    parecer += `Conclui-se pela indicação da empresa ${melhorProposta.razaoSocial} (CNPJ: ${melhorProposta.cnpj}), que perfaz o menor custo efetivo global de R$ ${melhorProposta.custoEfetivoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, compreendendo o valor contratual de R$ ${melhorProposta.valorNominal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} acrescido do recolhimento compulsório de Contribuição Previdenciária Patronal (CPP) de 20% (R$ ${melhorProposta.valorCPP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) disciplinado pelo Art. 18-B da LC 123/2006 c/c Art. 201 da IN RFB nº 2.110/2022. `;
  } else {
    parecer += `Conclui-se pela indicação da empresa ${melhorProposta.razaoSocial} (CNPJ: ${melhorProposta.cnpj}), a qual consolidou o menor custo efetivo global de R$ ${melhorProposta.custoEfetivoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, não se sujeitando a contratante a encargos previdenciários patronais em virtude do regime tributário (${melhorProposta.regimeTributario.replace('_', ' ')}). `;
  }

  if (melhorProposta.compatibilidadeCNAE === 'compativel') {
    const origemDesc = melhorProposta.origemCompatibilidade === 'secundario'
      ? `nas Atividades Econômicas Secundárias (CNAE ${melhorProposta.cnaeCompativelEncontrado})`
      : `na Atividade Econômica Principal (CNAE ${melhorProposta.cnaePrestador})`;
    parecer += `Ressalta-se que o fornecedor atende plenamente ao requisito de pertinência temática perante o Cadastro Nacional da Pessoa Jurídica, constando a autorização para a prestação do serviço ${origemDesc}, conferindo plena regularidade formal à emissão da respectiva Nota Fiscal de Serviços Eletrônica (NFS-e) e afastando o risco de glosa de despesa por desvio de objeto social. `;
  }

  const meiSuperado = resultados.find(
    r => r.regimeTributario === 'MEI' && r.incideCPP18B && r.valorNominal < melhorProposta.valorNominal
  );
  if (meiSuperado) {
    parecer += `Evidencia-se distorção tributária relevante: o fornecedor MEI (${meiSuperado.razaoSocial}) apresentou valor facial aparente inferior (R$ ${meiSuperado.valorNominal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}), todavia, ex vi legis, a incidência compulsória de 20% de CPP Patronal devida pela tomadora (+ R$ ${meiSuperado.valorCPP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) elevou seu dispêndio financeiro total para R$ ${meiSuperado.custoEfetivoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, corroborando a maior economicidade, higidez jurídica e segurança orçamentária da proposta vencedora.`;
  }

  return {
    idAnalise: `ANALISE-${Date.now()}`,
    dataAnalise: new Date().toISOString(),
    servico,
    descricaoCnaeServico: 'Serviço sob demanda',
    resultados,
    melhorOrcamento: melhorProposta,
    economiaEmRelacaoAoMaior: maior - menor,
    alertasGerais: resultados.flatMap(r => r.alertasFiscais),
    parecerConclusivo: parecer,
    fundamentacaoLegal: [
      {
        artigo: 'Art. 18-B da Lei Complementar nº 123/2006',
        titulo: 'Contribuição Previdenciária Patronal sobre MEI',
        resumo:
          'Determina que a empresa contratante de MEI para serviços de hidráulica, eletricidade, pintura, alvenaria, carpintaria e manutenção em geral deve recolher compulsoriamente a CPP patronal de 20% sobre a remuneração paga, sob pena de autuação fiscal.',
      },
      {
        artigo: 'Instrução Normativa RFB nº 2.110/2022 (Arts. 201 e 202)',
        titulo: 'Obrigações Acessórias, eSocial e DCTFWeb',
        resumo:
          'Normatiza a escrituração da contratação de MEI sujeito à CPP no eSocial (Evento S-1200) e a consequente emissão da guia DARF Previdenciária gerada na DCTFWeb da tomadora de serviços.',
      },
      {
        artigo: 'Lei nº 8.212/1991 (Art. 22, Inciso III)',
        titulo: 'Custeio da Seguridade Social e Contribuição a Cargo da Empresa',
        resumo:
          'Fixa a contribuição compulsória de 20% a cargo da empresa tomadora calculada sobre o total das remunerações pagas ou creditadas a pessoas físicas ou contribuintes equiparados que lhe prestem serviços.',
      },
      {
        artigo: 'Lei Federal nº 4.320/1964 c/c Decreto Federal nº 93.872/1986',
        titulo: 'Regularidade da Liquidação da Despesa em Suprimento de Fundos',
        resumo:
          'Impõe que a prestação de contas de adiantamentos observe a idoneidade fiscal dos comprovantes e a conformidade do objeto executado com as atividades econômicas autorizadas do emitente (CNAE).',
      },
    ],
  };
}
