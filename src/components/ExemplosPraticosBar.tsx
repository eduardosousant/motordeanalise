import React from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { OperacaoComercial, AppTheme } from '../types.js';

interface ExemplosProps {
  onSelectExemplo: (operacao: OperacaoComercial) => void;
  currentTheme?: AppTheme;
}

const CASOS_DUMMY: { titulo: string; desc: string; op: OperacaoComercial }[] = [
  {
    titulo: 'Caso 1: Material de Construção (ST Anexo X)',
    desc: 'SP -> MT • Tintas 3209.10.00 • Simples Nacional EPP',
    op: {
      cnpj_fornecedor: '60701190000104',
      razao_social_fornecedor: 'TINTAS & TINTURAS PAULISTA S/A',
      uf_origem: 'SP',
      uf_destino: 'MT',
      ncm: '3209.10.00',
      descricao_produto: 'Tinta acrílica fosca para exteriores galao 18L',
      finalidade_compra: 'REVENDA',
      valor_operacao: 15000,
      valor_frete: 850,
      valor_despesas: 150,
      icms_proprio_destacado: 0,
      simples_remetente: true,
      porte_remetente: 'EPP'
    }
  },
  {
    titulo: 'Caso 2: Cesta Básica (Anexo V - Redução 7%)',
    desc: 'PR -> MT • Arroz 1006.30.21 • Lucro Presumido',
    op: {
      cnpj_fornecedor: '76535764000143',
      razao_social_fornecedor: 'MOINHO E CEREALISTA PARANAENSE S.A.',
      uf_origem: 'PR',
      uf_destino: 'MT',
      ncm: '1006.30.21',
      descricao_produto: 'Arroz polido tipo 1 - Fardo 30kg (Cesta Básica)',
      finalidade_compra: 'REVENDA',
      valor_operacao: 28000,
      valor_frete: 1400,
      valor_despesas: 0,
      icms_proprio_destacado: 2058, // 7%
      simples_remetente: false,
      porte_remetente: 'DEMAIS'
    }
  },
  {
    titulo: 'Caso 3: DIFAL Uso & Consumo (EC 87/15)',
    desc: 'RJ -> MT • Servidor TI 8471.50.10 • Regime Normal',
    op: {
      cnpj_fornecedor: '33000167000101',
      razao_social_fornecedor: 'SISTEMAS & TECNOLOGIA FLUMINENSE LTDA',
      uf_origem: 'RJ',
      uf_destino: 'MT',
      ncm: '8471.50.10',
      descricao_produto: 'Unidade de processamento digital para servidor corporativo',
      finalidade_compra: 'USO_CONSUMO',
      valor_operacao: 42000,
      valor_frete: 1200,
      valor_despesas: 300,
      icms_proprio_destacado: 3045, // 7%
      simples_remetente: false,
      porte_remetente: 'DEMAIS'
    }
  },
  {
    titulo: 'Caso 4: Compra Pública c/ Desconto Comercial',
    desc: 'MT -> MT • Água R$ 2.100 - R$ 375 Desc. • Base R$ 1.725',
    op: {
      cnpj_fornecedor: '13945317000142',
      razao_social_fornecedor: 'FONTE AGUA MINERAL PURA MT LTDA',
      uf_origem: 'MT',
      uf_destino: 'MT',
      ncm: '2201.10.00',
      descricao_produto: 'Agua mineral natural sem gas galao 20L',
      tipo_adquirente: 'ORGAO_PUBLICO_ESTADUAL',
      finalidade_compra: 'ORGAO_PUBLICO_CONSUMO',
      valor_operacao: 2100,
      valor_desconto_comercial: 375,
      valor_frete: 0,
      valor_despesas: 0,
      icms_proprio_destacado: 0,
      simples_remetente: false,
      porte_remetente: 'DEMAIS'
    }
  },
  {
    titulo: 'Caso 5: GLP / Combustíveis (IRRF 0,24% Cód 8730)',
    desc: 'MT -> MT • Gás GLP P13 Botijão • Alíquota Reduzida IN 1234',
    op: {
      cnpj_fornecedor: '02891395000188',
      razao_social_fornecedor: 'DISTRIBUIDORA DE GAS & ENERGIA MT LTDA',
      uf_origem: 'MT',
      uf_destino: 'MT',
      ncm: '2711.19.10',
      descricao_produto: 'Gas Liquefeito de Petroleo GLP Botijao P13',
      tipo_adquirente: 'ORGAO_PUBLICO_ESTADUAL',
      finalidade_compra: 'ORGAO_PUBLICO_CONSUMO',
      valor_operacao: 1220,
      valor_desconto_comercial: 0,
      valor_frete: 0,
      valor_despesas: 0,
      icms_proprio_destacado: 0,
      simples_remetente: false,
      porte_remetente: 'DEMAIS'
    }
  },
  {
    titulo: 'Caso 6: Pedido Multi-Itens (Grade Mista)',
    desc: 'SP -> MT • 6 Produtos: Thinners, Louças, Lâmpadas LED e Lanternas',
    op: {
      cnpj_fornecedor: '60701190000104',
      razao_social_fornecedor: 'COMERCIAL & DISTRIBUIDORA PAULISTA LTDA',
      uf_origem: 'SP',
      uf_destino: 'MT',
      ncm: '3814.00.90',
      descricao_produto: 'Grade de Produtos Mista (ST Anexo X + Isenção Art. 2º)',
      tipo_adquirente: 'ORGAO_PUBLICO_ESTADUAL',
      finalidade_compra: 'ORGAO_PUBLICO_CONSUMO',
      valor_operacao: 3855,
      valor_frete: 0,
      valor_despesas: 0,
      icms_proprio_destacado: 0,
      simples_remetente: false,
      porte_remetente: 'DEMAIS',
      itens: [
        {
          id: 'it_1',
          ncm: '3814.00.90',
          descricao: 'THINNER',
          quantidade: 36,
          valor_unitario: 21.90,
          valor_total: 788.40,
          valor_desconto_comercial: 0,
          valor_frete: 0,
          valor_despesas: 0,
          icms_proprio_destacado: 0
        },
        {
          id: 'it_2',
          ncm: '3922.90.00',
          descricao: 'MECANISMO COMPLETO',
          quantidade: 2,
          valor_unitario: 115.00,
          valor_total: 230.00,
          valor_desconto_comercial: 0,
          valor_frete: 0,
          valor_despesas: 0,
          icms_proprio_destacado: 0
        },
        {
          id: 'it_3',
          ncm: '3922.90.00',
          descricao: 'MECANISMO UNIVERSAL',
          quantidade: 1,
          valor_unitario: 115.00,
          valor_total: 115.00,
          valor_desconto_comercial: 0,
          valor_frete: 0,
          valor_despesas: 0,
          icms_proprio_destacado: 0
        },
        {
          id: 'it_4',
          ncm: '8539.52.00',
          descricao: 'LAMPADA LED',
          quantidade: 40,
          valor_unitario: 45.70,
          valor_total: 1828.00,
          valor_desconto_comercial: 0,
          valor_frete: 0,
          valor_despesas: 0,
          icms_proprio_destacado: 0
        },
        {
          id: 'it_5',
          ncm: '8513.10.10',
          descricao: 'LANTERNA RECARREGAVEL',
          quantidade: 4,
          valor_unitario: 48.90,
          valor_total: 195.60,
          valor_desconto_comercial: 0,
          valor_frete: 0,
          valor_despesas: 0,
          icms_proprio_destacado: 0
        },
        {
          id: 'it_6',
          ncm: '8539.31.20',
          descricao: 'LAMPADA TUBULAR',
          quantidade: 20,
          valor_unitario: 34.90,
          valor_total: 698.00,
          valor_desconto_comercial: 0,
          valor_frete: 0,
          valor_despesas: 0,
          icms_proprio_destacado: 0
        }
      ]
    }
  }
];

export const ExemplosPraticosBar: React.FC<ExemplosProps> = ({ onSelectExemplo, currentTheme = 'GOV_CLASSIC' }) => {
  const getThemeStyles = () => {
    switch (currentTheme) {
      case 'GOV_CLASSIC':
        return {
          headerText: 'text-emerald-900',
          iconColor: 'text-emerald-700',
          cardHover: 'hover:bg-emerald-50/80 hover:border-emerald-300 hover:text-emerald-950',
          arrowColor: 'text-emerald-700'
        };
      case 'FINTECH_PRO':
        return {
          headerText: 'text-indigo-900',
          iconColor: 'text-indigo-600',
          cardHover: 'hover:bg-indigo-50/80 hover:border-indigo-300 hover:text-indigo-950',
          arrowColor: 'text-indigo-600'
        };
      case 'DARK_AUDITOR':
        return {
          headerText: 'text-cyan-400',
          iconColor: 'text-cyan-400',
          cardHover: 'hover:bg-cyan-950/40 hover:border-cyan-500 hover:text-cyan-200',
          arrowColor: 'text-cyan-400'
        };
      case 'INSTITUCIONAL':
      default:
        return {
          headerText: 'text-teal-800',
          iconColor: 'text-teal-600',
          cardHover: 'hover:bg-teal-50/70 hover:border-teal-300 hover:text-teal-900',
          arrowColor: 'text-teal-600'
        };
    }
  };

  const themeStyle = getThemeStyles();

  return (
      <div className="bg-white text-slate-800 rounded-xl p-4 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className={`flex items-center space-x-2 text-xs font-bold ${themeStyle.headerText}`}>
            <BookOpen className={`w-4 h-4 ${themeStyle.iconColor}`} />
            <span>Casos Práticos da Legislação de MT (Clique para Carregar & Simular)</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">RICMS/MT 2.212</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {CASOS_DUMMY.map((item, i) => (
              <button
                  key={i}
                  type="button"
                  onClick={() => onSelectExemplo(item.op)}
                  className={`text-left p-3 rounded-lg bg-slate-50 border border-slate-200 transition cursor-pointer group shadow-2xs ${themeStyle.cardHover}`}
              >
                <div className="font-semibold text-xs text-slate-800 group-hover:text-inherit flex items-center justify-between">
                  <span>{item.titulo}</span>
                  <ArrowRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition ${themeStyle.arrowColor}`} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 font-mono">{item.desc}</p>
              </button>
          ))}
        </div>
      </div>
  );
};