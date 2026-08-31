import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fetchCnpjData } from './src/server/cnpjService.js';
import { processTaxAnalysis, getTaxCacheStats } from './src/server/taxEngine.js';
import { calcularEnquadramentoItem, computeConsolidatedSimulation } from './src/lib/taxCalculations.js';
import { OperacaoComercial } from './src/types.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // API Routes FIRST
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      engine: 'Motor de Análise Tributária ICMS-MT (Decreto nº 2.212/2014-MT)',
      timestamp: new Date().toISOString()
    });
  });

  // Estatísticas da Base de Conhecimento Local (Cache de NCMs aprendidos pela IA)
  app.get('/api/tax-cache-stats', (_req, res) => {
    try {
      const stats = getTaxCacheStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao buscar estatísticas do cache' });
    }
  });

  // Consulta CNPJ com Fallback (CNPJa -> CNPJ.ws -> BrasilAPI -> MinhaReceita -> Internal Engine)
  app.get('/api/cnpj/:cnpj', async (req, res) => {
    try {
      const cnpjParam = req.params.cnpj;
      const data = await fetchCnpjData(cnpjParam);
      res.json(data);
    } catch (error: any) {
      console.error('Erro na consulta CNPJ:', error);
      res.status(400).json({ error: error.message || 'Erro ao consultar CNPJ' });
    }
  });

  // Análise Tributária MT (Decreto 2.212/2014-MT + Gemini AI - Suporte a 1 ou Múltiplos Itens)
  app.post('/api/analise-tributaria', async (req, res) => {
    try {
      const operacao: OperacaoComercial = req.body;

      if (!operacao.cnpj_fornecedor) {
        return res.status(400).json({
          error: 'Informe o CNPJ do fornecedor para análise.'
        });
      }

      // Se a operação contiver múltiplos itens na grade:
      if (operacao.itens && operacao.itens.length > 0) {
        const isSimples = Boolean(operacao.simples_remetente);
        const tipoAdquirente = operacao.tipo_adquirente || (operacao.finalidade_compra === 'ORGAO_PUBLICO_CONSUMO' ? 'ORGAO_PUBLICO_ESTADUAL' : 'PRIVADO');
        const itensAnalise = [];

        for (const item of operacao.itens) {
          const valorBrutoItem = (item.quantidade || 1) * (item.valor_unitario || 0);
          const descontoComercialItem = Number(item.valor_desconto_comercial) || 0;
          const freteDespesasItem = (Number(item.valor_frete) || 0) + (Number(item.valor_despesas) || 0);

          // Base líquida após o desconto comercial:
          const valorLiquidoBaseItem = Math.max(0, valorBrutoItem - descontoComercialItem) + freteDespesasItem;

          const enq = calcularEnquadramentoItem(
              { ncm: item.ncm, valorTotal: valorLiquidoBaseItem, descricao: item.descricao },
              { isSimplesNacional: isSimples },
              { tipo: tipoAdquirente }
          );

          const itemOp: OperacaoComercial = {
            ...operacao,
            ncm: item.ncm,
            descricao_produto: item.descricao,
            valor_operacao: valorBrutoItem,
            valor_desconto_comercial: descontoComercialItem,
            valor_frete: item.valor_frete || 0,
            valor_despesas: item.valor_despesas || 0,
            icms_proprio_destacado: item.icms_proprio_destacado || 0,
            itens: undefined
          };

          const singleResult = await processTaxAnalysis(itemOp);

          // Atualiza JSON e Simulação de cada item com o enquadramento determinístico
          const jsonAtualizado = {
            ...singleResult.jsonResponse,
            enquadramento_produto: {
              ...singleResult.jsonResponse.enquadramento_produto,
              regime_tributario_aplicavel: enq.regimeMt,
              cst_codigo: enq.cst
            }
          };

          const simulacaoAtualizada = {
            ...singleResult.simulacaoCalculo,
            base_calculo_origem: valorLiquidoBaseItem,
            valor_desconto_comercial: descontoComercialItem > 0 ? descontoComercialItem : undefined,
            desconto_isencao_orgao_publico: enq.descIsencao > 0 ? enq.descIsencao : undefined,
            valor_liquido_com_desconto: enq.descIsencao > 0 ? (valorLiquidoBaseItem - enq.descIsencao) : undefined,
            valor_irrf_retido: enq.irrf,
            aliquota_irrf_in1234: enq.aliquotaIrrf,
            valor_liquido_pagamento_fornecedor: enq.liquidoItem,
            total_recolher_mt: enq.totalRecolherMt
          };

          itensAnalise.push({
            item: {
              ...item,
              valor_total: valorBrutoItem,
              valor_desconto_comercial: descontoComercialItem
            },
            jsonResponse: jsonAtualizado,
            simulacao: simulacaoAtualizada
          });
        }

        const resumoConsolidado = computeConsolidatedSimulation(itensAnalise);
        const primeiro = itensAnalise[0];

        return res.json({
          jsonResponse: primeiro.jsonResponse,
          simulacaoCalculo: {
            ...primeiro.simulacao,
            base_calculo_origem: resumoConsolidado.total_base_calculo,
            icms_origem_destacado: resumoConsolidado.total_icms_origem_destacado,
            valor_desconto_comercial: resumoConsolidado.total_desconto_comercial > 0 ? resumoConsolidado.total_desconto_comercial : undefined,
            desconto_isencao_orgao_publico: resumoConsolidado.total_desconto_isencao_icms > 0 ? resumoConsolidado.total_desconto_isencao_icms : undefined,
            desconto_reducao_bc_anexo_v: resumoConsolidado.total_economia_reducao_bc > 0 ? resumoConsolidado.total_economia_reducao_bc : undefined,
            economia_tributaria_total: resumoConsolidado.total_economia_tributaria > 0 ? resumoConsolidado.total_economia_tributaria : undefined,
            valor_liquido_com_desconto: resumoConsolidado.total_base_calculo - resumoConsolidado.total_desconto_isencao_icms,
            valor_irrf_retido: resumoConsolidado.total_irrf_retido > 0 ? resumoConsolidado.total_irrf_retido : 0,
            valor_liquido_pagamento_fornecedor: resumoConsolidado.total_liquido_pagar_fornecedor,
            total_recolher_mt: resumoConsolidado.total_icms_recolher_mt
          },
          fonteAnalise: 'CACHE_AI_LOCAL',
          consolidado: {
            itensAnalise,
            resumoConsolidado
          }
        });
      }

      if (!operacao.ncm || !operacao.descricao_produto) {
        return res.status(400).json({
          error: 'Dados incompletos. Informe pelo menos NCM e descrição do produto.'
        });
      }

      const result = await processTaxAnalysis(operacao);
      res.json(result);
    } catch (error: any) {
      console.error('Erro no processamento da análise tributária:', error);
      res.status(500).json({ error: error.message || 'Erro interno no motor tributário.' });
    }
  });

  // Exemplos Práticos Pré-carregados para Testes Rápidos em MT
  app.get('/api/exemplos-praticos', (_req, res) => {
    const exemplos: { titulo: string; descricao: string; operacao: OperacaoComercial }[] = [
      {
        titulo: "Casos Prático 1: Material de Construção (SP -> MT)",
        descricao: "Fornecedor Simples Nacional de SP vendendo Tintas/Ferragens para Revendedor em MT (Anexo X ST)",
        operacao: {
          cnpj_fornecedor: "60701190000104",
          razao_social_fornecedor: "Itaú Unibanco S.A. / Tintas & Metais Paulista",
          uf_origem: "SP",
          uf_destino: "MT",
          ncm: "3209.10.00",
          descricao_produto: "Tinta acrílica para parede externa - Galao 18L",
          finalidade_compra: "REVENDA",
          valor_operacao: 15000.00,
          valor_frete: 850.00,
          valor_despesas: 150.00,
          icms_proprio_destacado: 0.00,
          simples_remetente: true,
          porte_remetente: "EPP"
        }
      },
      {
        titulo: "Caso Prático 2: Alimento Cesta Básica (PR -> MT)",
        descricao: "Fornecedor Lucro Presumido no PR vendendo Arroz/Feijão para Supermercado em MT (Anexo V - Redução BC)",
        operacao: {
          cnpj_fornecedor: "76535764000143",
          razao_social_fornecedor: "Moinho e Cerealista Paranaense S.A.",
          uf_origem: "PR",
          uf_destino: "MT",
          ncm: "1006.30.21",
          descricao_produto: "Arroz polido tipo 1 - Pacote 5kg (Cesta Básica)",
          finalidade_compra: "REVENDA",
          valor_operacao: 28000.00,
          valor_frete: 1400.00,
          valor_despesas: 0.00,
          icms_proprio_destacado: 2058.00,
          simples_remetente: false,
          porte_remetente: "DEMAIS"
        }
      },
      {
        titulo: "Caso Prático 3: DIFAL Uso e Consumo Eletrônico (RJ -> MT)",
        descricao: "Fornecedor de Equipamentos de TI do RJ vendendo Servidores para Uso e Consumo de Empresa em MT",
        operacao: {
          cnpj_fornecedor: "33000167000101",
          razao_social_fornecedor: "Sistemas & Tecnologia Fluminense Ltda",
          uf_origem: "RJ",
          uf_destino: "MT",
          ncm: "8471.50.10",
          descricao_produto: "Unidade de processamento digital para servidor corporativo",
          finalidade_compra: "USO_CONSUMO",
          valor_operacao: 42000.00,
          valor_frete: 1200.00,
          valor_despesas: 300.00,
          icms_proprio_destacado: 3045.00,
          simples_remetente: false,
          porte_remetente: "DEMAIS"
        }
      },
      {
        titulo: "Caso Prático 4: Autopeças de Importado (SC 4% -> MT)",
        descricao: "Distribuidora de SC vendendo autopeças importadas (Alíquota Res. 13/12 de 4%) para Distribuidor em Cuiabá/MT",
        operacao: {
          cnpj_fornecedor: "83891283000130",
          razao_social_fornecedor: "Autopeças Catarina Importadora Ltda",
          uf_origem: "SC",
          uf_destino: "MT",
          ncm: "8708.29.99",
          descricao_produto: "Amortecedor hidráulico reforçado para veículos comerciais",
          finalidade_compra: "REVENDA",
          valor_operacao: 18500.00,
          valor_frete: 900.00,
          valor_despesas: 100.00,
          icms_proprio_destacado: 780.00,
          simples_remetente: false,
          porte_remetente: "DEMAIS"
        }
      }
    ];

    res.json(exemplos);
  });

  // Catch-all 404 handler for API routes to always return JSON (not HTML fallback)
  app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Endpoint da API não encontrado.' });
  });

  // Global error handler for API routes
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[SERVER ERROR]', err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({ error: err?.message || 'Erro interno no servidor.' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Motor de Análise Tributária rodando na porta ${PORT}`);
  });
}

startServer();