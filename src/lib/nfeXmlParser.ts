import { OperacaoComercial, ItemNotaFiscal, CnpjApiResult } from '../types.js';

export interface ParsedNfeData {
    operacao: OperacaoComercial;
    supplierData: CnpjApiResult;
}

export function parseNfeXml(xmlString: string): ParsedNfeData {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
        throw new Error('Arquivo XML corrompido ou formato inválido de NF-e.');
    }

    const getTag = (parent: Element | Document, tagName: string): Element | null => {
        const direct = parent.querySelector(tagName);
        if (direct) return direct;
        const elements = parent.getElementsByTagName(tagName);
        return elements.length > 0 ? elements[0] : null;
    };

    const getText = (parent: Element | Document, tagName: string): string => {
        const el = getTag(parent, tagName);
        return el?.textContent?.trim() || '';
    };

    // 1. Dados do Emitente (Fornecedor)
    const emit = getTag(xmlDoc, 'emit');
    if (!emit) {
        throw new Error('Tag <emit> do fornecedor não foi localizada na NF-e.');
    }

    const cnpjFornecedor = getText(emit, 'CNPJ');
    const razaoSocial = getText(emit, 'xNome') || 'Fornecedor Identificado no XML';
    const nomeFantasia = getText(emit, 'xFant') || razaoSocial;
    const ufOrigem = getText(emit, 'UF') || 'MT';
    const municipio = getText(emit, 'xMun') || '';
    const crt = getText(emit, 'CRT') || '3'; // 1 = Simples Nacional
    const isSimples = crt === '1';

    // 2. Extração dos Itens da NF-e (<det>)
    const detList = xmlDoc.getElementsByTagName('det');
    const itens: ItemNotaFiscal[] = [];

    for (let i = 0; i < detList.length; i++) {
        const det = detList[i];
        const prod = getTag(det, 'prod');
        if (!prod) continue;

        const descricao = getText(prod, 'xProd') || `Item ${i + 1}`;
        const rawNcm = getText(prod, 'NCM').replace(/\D/g, '');
        const ncm = rawNcm.length === 8 ? `${rawNcm.slice(0, 4)}.${rawNcm.slice(4, 6)}.${rawNcm.slice(6, 8)}` : rawNcm;
        const quantidade = parseFloat(getText(prod, 'qCom')) || 1;
        const valorUnitario = parseFloat(getText(prod, 'vUnCom')) || 0;
        const valorDesconto = parseFloat(getText(prod, 'vDesc')) || 0;
        const valorFrete = parseFloat(getText(prod, 'vFrete')) || 0;
        const valorDespesas = parseFloat(getText(prod, 'vOutro')) || 0;

        // Tributação de ICMS
        const icmsTag = getTag(det, 'ICMS');
        const vICMS = parseFloat(getText(icmsTag || det, 'vICMS')) || 0;
        const vICMSDeson = parseFloat(getText(icmsTag || det, 'vICMSDeson')) || 0;
        const motDesICMS = getText(icmsTag || det, 'motDesICMS');
        const cst = getText(icmsTag || det, 'CST');
        const csosn = getText(icmsTag || det, 'CSOSN');

        itens.push({
            item_numero: i + 1,
            descricao,
            ncm,
            quantidade,
            valor_unitario: valorUnitario,
            valor_total: quantidade * valorUnitario,
            valor_desconto_comercial: valorDesconto,
            valor_frete: valorFrete,
            valor_despesas: valorDespesas,
            icms_proprio_destacado: vICMS,
            valor_icms_desonerado: vICMSDeson,
            motivo_desoneracao: motDesICMS,
            cst: cst || undefined,
            csosn: csosn || undefined
        });
    }

    if (itens.length === 0) {
        throw new Error('Nenhum item de mercadoria (<det>) foi encontrado no XML.');
    }

    const primeiroItem = itens[0];
    const valorTotalProdutos = itens.reduce((acc, it) => acc + (it.quantidade * it.valor_unitario), 0);

    const operacao: OperacaoComercial = {
        cnpj_fornecedor: cnpjFornecedor,
        razao_social_fornecedor: razaoSocial,
        uf_origem: ufOrigem,
        uf_destino: 'MT',
        simples_remetente: isSimples,
        porte_remetente: isSimples ? 'EPP' : 'DEMAIS',
        tipo_adquirente: 'ORGAO_PUBLICO_ESTADUAL',
        finalidade_compra: 'ORGAO_PUBLICO_CONSUMO',
        itens: itens,
        ncm: primeiroItem.ncm,
        descricao_produto: itens.length > 1 ? `${primeiroItem.descricao} (+ ${itens.length - 1} itens)` : primeiroItem.descricao,
        valor_operacao: valorTotalProdutos,
        valor_frete: itens.reduce((acc, it) => acc + (it.valor_frete || 0), 0),
        valor_despesas: itens.reduce((acc, it) => acc + (it.valor_despesas || 0), 0),
        valor_desconto_comercial: itens.reduce((acc, it) => acc + (it.valor_desconto_comercial || 0), 0),
        icms_proprio_destacado: itens.reduce((acc, it) => acc + (it.icms_proprio_destacado || 0), 0)
    };

    const supplierData: CnpjApiResult = {
        cnpj: cnpjFornecedor,
        razao_social: razaoSocial,
        nome_fantasia: nomeFantasia,
        porte: isSimples ? 'EPP / ME' : 'DEMAIS (Regime Normal)',
        optante_simples: isSimples,
        optante_simei: false,
        uf: ufOrigem,
        municipio: municipio,
        cnae_principal_codigo: 'N/D',
        cnae_principal_descricao: 'Extraído diretamente do XML da NF-e',
        situacao_cadastral: 'ATIVA',
        fonte_api: 'XML NF-e Oficial (Chave de Acesso)'
    };

    return { operacao, supplierData };
}