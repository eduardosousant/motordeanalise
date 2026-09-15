import { truncar, multiplicarETruncar } from './taxCalculations.js';

export interface ResultadoCalculoAluguelPF {
    tipoPessoa: 'PF';
    valorBruto: number;
    deducaoUtilizada: string;
    baseCalculo: number;
    aliquotaNominal: number;
    parcelaDeduzir: number;
    impostoAntesReducao: number;
    valorReducaoLei: number;
    detalheReducao: string;
    irrfRetido: number;
    aliquotaEfetiva: number;
    valorLiquido: number;
    dispensaMinimo: boolean;
}

export interface ResultadoCalculoAluguelPJ {
    tipoPessoa: 'PJ';
    valorBruto: number;
    optanteSimples: boolean;
    dispensadoSimples: boolean;
    codReceita: string;
    aliquotaIr: number;
    irrfRetido: number;
    valorLiquido: number;
    dispensaMinimo: boolean;
}

export type ResultadoCalculoAluguel = ResultadoCalculoAluguelPF | ResultadoCalculoAluguelPJ;

export function sanitizarDocumento(doc: string): string {
    return (doc || '').replace(/\D/g, '');
}

export function validarCpf(cpf: string): boolean {
    const c = sanitizarDocumento(cpf);
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(c.charAt(i)) * (10 - i);
    let d1 = (soma * 10) % 11;
    if (d1 === 10) d1 = 0;
    if (d1 !== parseInt(c.charAt(9))) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(c.charAt(i)) * (11 - i);
    let d2 = (soma * 10) % 11;
    if (d2 === 10) d2 = 0;
    return d2 === parseInt(c.charAt(10));
}

export function validarCnpj(cnpj: string): boolean {
    const c = sanitizarDocumento(cnpj);
    if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < 12; i++) soma += parseInt(c.charAt(i)) * pesos1[i];
    let resto = soma % 11;
    const d1 = resto < 2 ? 0 : 11 - resto;
    if (d1 !== parseInt(c.charAt(12))) return false;
    soma = 0;
    for (let i = 0; i < 13; i++) soma += parseInt(c.charAt(i)) * pesos2[i];
    resto = soma % 11;
    const d2 = resto < 2 ? 0 : 11 - resto;
    return d2 === parseInt(c.charAt(13));
}

export function identificarDocumento(doc: string): { tipo: 'CPF' | 'CNPJ' | 'INVALIDO'; limpo: string } {
    const limpo = sanitizarDocumento(doc);
    if (limpo.length === 11 && validarCpf(limpo)) return { tipo: 'CPF', limpo };
    if (limpo.length === 14 && validarCnpj(limpo)) return { tipo: 'CNPJ', limpo };
    return { tipo: 'INVALIDO', limpo };
}

export function calcularAluguelPF2026(
    valorBrutoInput: number,
    inssRetidoInput: number = 0,
    numDependentes: number = 0,
    usarSimplificado: boolean = true,
    dispensarMinimo: boolean = true
): ResultadoCalculoAluguelPF {
    const valorBruto = truncar(Number(valorBrutoInput) || 0, 2);
    const inssRetido = truncar(Number(inssRetidoInput) || 0, 2);

    const deducaoPorDep = 189.59;
    const descontoSimplificadoPadrao = 607.20;

    const deducoesLegais = truncar(inssRetido + (numDependentes * deducaoPorDep), 2);
    let deducaoAplicada = deducoesLegais;
    let tipoDeducao = `Deduções Legais (INSS R$ ${inssRetido.toFixed(2)} + ${numDependentes} dep.)`;

    if (usarSimplificado && descontoSimplificadoPadrao > deducoesLegais) {
        deducaoAplicada = descontoSimplificadoPadrao;
        tipoDeducao = 'Desconto Simplificado (R$ 607,20)';
    }

    const baseCalculo = truncar(Math.max(0, valorBruto - deducaoAplicada), 2);

    let aliquota = 0;
    let parcelaDeduzir = 0;

    if (baseCalculo <= 2428.80) {
        aliquota = 0;
        parcelaDeduzir = 0;
    } else if (baseCalculo <= 2826.65) {
        aliquota = 7.5;
        parcelaDeduzir = 182.16;
    } else if (baseCalculo <= 3751.05) {
        aliquota = 15.0;
        parcelaDeduzir = 394.16;
    } else if (baseCalculo <= 4664.68) {
        aliquota = 22.5;
        parcelaDeduzir = 675.49;
    } else {
        aliquota = 27.5;
        parcelaDeduzir = 908.73;
    }

    const impostoBrutoCalculado = multiplicarETruncar(baseCalculo, aliquota / 100, 2);
    const impostoTabela = truncar(Math.max(0, impostoBrutoCalculado - parcelaDeduzir), 2);

    const fatorReducao = 0.133145;
    let descontoAdicional = 0;
    let detalheReducao = 'R$ 0,00 (Sem redução - Rendimento >= R$ 7.350,00)';

    if (valorBruto <= 5000.00) {
        descontoAdicional = impostoTabela;
        detalheReducao = 'Redução integral (Isenção efetiva até R$ 5.000,00)';
    } else if (valorBruto <= 7350.00) {
        const parcelaReducao = truncar(fatorReducao * valorBruto, 2);
        descontoAdicional = truncar(Math.max(0, 978.62 - parcelaReducao), 2);
        detalheReducao = `Redução parcial aplicada: -R$ ${descontoAdicional.toFixed(2)}`;
    }

    let irrfFinal = truncar(Math.max(0, impostoTabela - descontoAdicional), 2);
    let dispensaAplicada = false;

    if (dispensarMinimo && irrfFinal <= 10.00) {
        dispensaAplicada = true;
        irrfFinal = 0.00;
    }

    const valorLiquido = truncar(valorBruto - inssRetido - irrfFinal, 2);
    const aliquotaEfetiva = valorBruto > 0 ? truncar((irrfFinal / valorBruto) * 100, 2) : 0;

    return {
        tipoPessoa: 'PF',
        valorBruto,
        deducaoUtilizada: tipoDeducao,
        baseCalculo,
        aliquotaNominal: aliquota,
        parcelaDeduzir,
        impostoAntesReducao: impostoTabela,
        valorReducaoLei: descontoAdicional,
        detalheReducao,
        irrfRetido: irrfFinal,
        aliquotaEfetiva,
        valorLiquido,
        dispensaMinimo: dispensaAplicada
    };
}

export function calcularAluguelPJ(
    valorBrutoInput: number,
    optanteSimples: boolean,
    dispensarMinimo: boolean = true
): ResultadoCalculoAluguelPJ {
    const valorBruto = truncar(Number(valorBrutoInput) || 0, 2);
    const codReceita = '6190';
    const aliquotaIr = 4.80; // Anexo I IN RFB 1.234/2012 - Locação de Imóveis

    if (optanteSimples) {
        return {
            tipoPessoa: 'PJ',
            valorBruto,
            optanteSimples: true,
            dispensadoSimples: true,
            codReceita,
            aliquotaIr: 0,
            irrfRetido: 0.00,
            valorLiquido: valorBruto,
            dispensaMinimo: false
        };
    }

    let irrf = multiplicarETruncar(valorBruto, aliquotaIr / 100, 2);
    let dispensaAplicada = false;

    if (dispensarMinimo && irrf <= 10.00) {
        dispensaAplicada = true;
        irrf = 0.00;
    }

    const valorLiquido = truncar(valorBruto - irrf, 2);

    return {
        tipoPessoa: 'PJ',
        valorBruto,
        optanteSimples: false,
        dispensadoSimples: false,
        codReceita,
        aliquotaIr,
        irrfRetido: irrf,
        valorLiquido,
        dispensaMinimo: dispensaAplicada
    };
}