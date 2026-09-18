import React, { useState, useMemo } from 'react';
import {
  Mail,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Send,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { AnaliseFiscalResponse } from '../types/fiscal';
import { formatarMoeda } from '../utils/formatters';

interface EmailResumoCardProps {
  analise: AnaliseFiscalResponse;
}

export const EmailResumoCard: React.FC<EmailResumoCardProps> = ({ analise }) => {
  const [copiado, setCopiado] = useState(false);
  const [copiadoAssunto, setCopiadoAssunto] = useState(false);

  const { servico, melhorOrcamento, resultados, economiaEmRelacaoAoMaior } = analise;

  // Montagem do texto em linguagem super simples, humana e sem juridiquês
  const textoEmail = useMemo(() => {
    const nomeServico = servico.descricao || 'prestação de serviços';
    const numAdiantamento = servico.numeroAdiantamento ? ` (Adiantamento nº ${servico.numeroAdiantamento})` : '';
    const melhor = melhorOrcamento;

    // Verifica se algum MEI parecia mais barato no papel mas ficou mais caro no total
    const meiSuperado = resultados.find(
      r => r.regimeTributario === 'MEI' && r.incideCPP18B && r.valorNominal < melhor.valorNominal
    );

    let explicacaoImposto = '';
    if (meiSuperado) {
      explicacaoImposto = `• Sobre os valores:\nTalvez você repare que o orçamento da empresa "${meiSuperado.razaoSocial}" parecia mais barato à primeira vista (estava por ${formatarMoeda(meiSuperado.valorNominal)}). Porém, como eles são MEI para esse tipo de serviço, a lei manda a nossa empresa recolher mais 20% de imposto previdenciário à parte (${formatarMoeda(meiSuperado.valorCPP)}). Então, o custo real dessa proposta subiria para ${formatarMoeda(meiSuperado.custoEfetivoTotal)}, ficando mais cara que a da ${melhor.razaoSocial}.\n`;
    } else if (melhor.incideCPP18B) {
      explicacaoImposto = `• Sobre os valores:\nO fornecedor escolhido é MEI. Mesmo somando os 20% de imposto que a nossa empresa terá que pagar à parte para a Receita (${formatarMoeda(melhor.valorCPP)}), o custo final de ${formatarMoeda(melhor.custoEfetivoTotal)} ainda é o menor e mais vantajoso entre todas as cotações que recebemos.\n`;
    } else {
      explicacaoImposto = `• Sobre os valores:\nEssa proposta não tem pegadinhas de impostos extras para a nossa empresa pagar por fora, mantendo o menor custo final real.\n`;
    }

    // Explicação simples sobre CNAE
    let explicacaoCnae = '';
    if (melhor.compatibilidadeCNAE === 'compativel') {
      const onde = melhor.origemCompatibilidade === 'secundario'
        ? 'nas atividades secundárias registradas do CNPJ'
        : 'na atividade principal do CNPJ';
      explicacaoCnae = `• Checagem do CNPJ:\nJá conferimos o cadastro deles na Receita Federal e a atividade exigida para o serviço consta formalmente ${onde}. A nota fiscal virá 100% certa e não teremos nenhum problema na prestação de contas.\n`;
    } else {
      explicacaoCnae = `• Checagem do CNPJ:\nA atividade cadastrada foi conferida junto à Receita Federal para assegurar a conformidade fiscal.\n`;
    }

    // Comparativo rápido e resumido
    const listaOrcamentos = resultados
      .map(
        (r, idx) =>
          `  ${idx + 1}º) ${r.razaoSocial}: ${formatarMoeda(r.custoEfetivoTotal)}${
            r.incideCPP18B ? ` (com imposto patronal incluso)` : ''
          }`
      )
      .join('\n');

    let economiaTexto = '';
    if (economiaEmRelacaoAoMaior > 0) {
      economiaTexto = `Fechando com essa opção, economizamos ${formatarMoeda(economiaEmRelacaoAoMaior)} em comparação com o orçamento mais caro.\n\n`;
    }

    return (
      `Olá!\n\n` +
      `Fizemos a análise dos orçamentos recebidos para o serviço de "${nomeServico}"${numAdiantamento}.\n\n` +
      `A melhor opção para o DETRAN/MT é a proposta da empresa:\n` +
      `👉 ${melhor.razaoSocial} (CNPJ: ${melhor.cnpj})\n` +
      `💰 Valor total final: ${formatarMoeda(melhor.custoEfetivoTotal)}\n\n` +
      `Por que essa é a escolha certa?\n` +
      `${explicacaoImposto}\n` +
      `${explicacaoCnae}\n` +
      `Comparativo de custos reais:\n` +
      `${listaOrcamentos}\n\n` +
      `${economiaTexto}` +

      `Se tiver qualquer dúvida, estou à disposição!`
    );
  }, [analise, servico, melhorOrcamento, resultados, economiaEmRelacaoAoMaior]);

  const assuntoEmail = useMemo(() => {
    const num = servico.numeroAdiantamento ? ` [${servico.numeroAdiantamento}]` : '';
    return `Orçamentos e indicação de fornecedor: ${servico.descricao || 'Serviço'}${num}`;
  }, [servico]);

  const handleCopiarTexto = async () => {
    try {
      await navigator.clipboard.writeText(textoEmail);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleCopiarAssunto = async () => {
    try {
      await navigator.clipboard.writeText(assuntoEmail);
      setCopiadoAssunto(true);
      setTimeout(() => setCopiadoAssunto(false), 2500);
    } catch (err) {
      console.error('Erro ao copiar assunto:', err);
    }
  };

  const handleAbrirEmail = () => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(assuntoEmail)}&body=${encodeURIComponent(textoEmail)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div
      id="secao-email-resumo"
      className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-5"
    >
      {/* Cabeçalho do Card de E-mail */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Texto para Envio por E-mail (Linguagem Direta e Acessível)
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                Pronto para Enviar
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Mensagem explicativa sem jargões fiscais, ideal para solicitar aprovação do gestor ou orientar o solicitante
            </p>
          </div>
        </div>

        {/* Botão de Copiar E-mail Principal */}
        <button
          type="button"
          id="btn-copiar-email"
          onClick={handleCopiarTexto}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg shadow-xs transition-all ${
            copiado
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950'
          }`}
        >
          {copiado ? (
            <>
              <Check className="w-4 h-4 text-emerald-200" />
              <span>Texto Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copiar Texto do E-mail</span>
            </>
          )}
        </button>
      </div>

      {/* Campo: Assunto Sugerido */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="input-assunto-email"
            className="text-[11px] font-bold uppercase tracking-wider text-slate-600"
          >
            Assunto Sugerido
          </label>
          <button
            type="button"
            onClick={handleCopiarAssunto}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition-colors"
          >
            {copiadoAssunto ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700">Assunto Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copiar Assunto</span>
              </>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="input-assunto-email"
            type="text"
            readOnly
            value={assuntoEmail}
            className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none select-all"
          />
        </div>
      </div>

      {/* Campo: Corpo do E-mail (Área de Texto Formatada) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="textarea-corpo-email"
            className="text-[11px] font-bold uppercase tracking-wider text-slate-600"
          >
            Corpo da Mensagem (Campo &ldquo;E-mail&rdquo;)
          </label>
          <span className="text-[11px] text-slate-400">
            Você pode copiar diretamente ou abrir no seu cliente de correio
          </span>
        </div>
        <div className="relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <textarea
            id="textarea-corpo-email"
            readOnly
            rows={13}
            value={textoEmail}
            className="w-full p-4 text-xs font-sans text-slate-800 bg-transparent border-none focus:outline-none resize-y leading-relaxed"
          />
        </div>
      </div>

      {/* Ações Rápidas no Rodapé do E-mail */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Explicado de forma simples: o imposto patronal de 20% do MEI e a compatibilidade do CNAE ficam claros para qualquer pessoa.
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleAbrirEmail}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Abrir no Aplicativo de E-mail</span>
          </button>

          <button
            type="button"
            onClick={handleCopiarTexto}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg shadow-2xs transition-colors ${
              copiado
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {copiado ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Mensagem</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
