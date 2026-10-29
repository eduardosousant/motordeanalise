# Motor de Análise Tributária ICMS-MT & Auditoria Fiscal

Sistema especialista em análise tributária, equalização de orçamentos e auditoria fiscal em conformidade com o **Regulamento do ICMS de Mato Grosso (Decreto nº 2.212/2014-MT)**, **Orientação Técnica CGE-MT nº 03/2026**, **IN RFB nº 1.234/2012** (retenções federais e municipais), **LC 123/2006** e **Tema 1130 do STF**.

---

## 📌 Principais Funcionalidades

### 1. ⚖️ Análise Tributária de Mercadorias (ICMS-MT)
- **Regras SEFAZ-MT**: Apuração de Substituição Tributária (Anexo X), Redução de Base de Cálculo / Cesta Básica (Anexo V), Estimativa Simplificada (Carga Média) e DIFAL (Uso/Consumo ou Ativo Imobilizado).
- **Compras Públicas (OT CGE-MT nº 03/2026)**:
  - **Simples Nacional**: Reconhece que optantes pelo Simples faturam pelo valor integral sem desconto de isenção estadual de ICMS (LC 123/2006).
  - **Regime Normal**: Exige a isenção compulsória com destaque no campo `vICMSDeson` (17% interno MT) para itens fora de ST e veda a isenção para itens com Substituição Tributária (Art. 65, § 3º, Anexo IV).
  - **Retenções de IRRF (IN RFB 1.234/2012)**: Cálculo por código de retenção (0,24%, 1,20%, 2,40%, 4,80%), com dispensa para Simples Nacional e dispensa operacional para valores inferiores a R$ 10,00.
- **Importação Direta de XML de NF-e**: Leitura automática de produtos, CST, CSOSN, NCM, desoneração e impostos para auditoria imediata.
- **Múltiplos Itens por Nota Fiscal**: Suporte à adição em lote com consolidação e cálculo item a item.

### 2. 🏢 Módulo de Locação de Imóveis (Aluguel)
- Apuração de retenções para locações contratadas pela administração pública ou empresas privadas.
- Cálculo de IRRF (Tabela Progressiva RFB com dedução legal), IRPJ e contribuições aplicáveis conforme a natureza jurídica do locador (Pessoa Física ou Jurídica).

### 3. 🛠️ Análise de Tomada de Serviços & Suprimento de Fundos
- Auditoria de retenções de ISSQN, IRRF e contribuições em serviços tomados.
- Análise de compatibilidade de CNAE do prestador com o objeto contratado.

### 4. 📊 Comparador de Orçamentos (Equalização Fiscal & Previdenciária)
- Comparação de propostas com equalização tributária real:
  - Incidência de **CPP Patronal de 20% (Art. 18-B da LC 123/2006)** na contratação de MEI para serviços de hidráulica, elétrica, pintura, alvenaria e manutenção.
  - Demonstração do custo efetivo global para a Administração, evitando distorções em propostas com valor facial menor.
- Geração de parecer fiscal conclusivo com fundamentação legal.

### 5. 🔍 Consulta Inteligente de CNPJ com Failover
- Consulta automática com cadeia de redundância (*fallback*):
  - **ReceitaWS** ➔ **CNPJ Já** ➔ **BrasilAPI** ➔ **OpenCNPJ**
- Identificação de Regime Tributário (Simples Nacional, MEI, Lucro Presumido, Lucro Real), Porte (ME, EPP, DEMAIS), CNAE Principal e CNAEs Secundários.

### 6. 📄 Exportação de Documentos Oficiais
- Emissão de relatórios em **PDF** formatados para prestação de contas e instrução processual.
- Exportação de pareceres em **DOCX (Word)** e impressão direta em padrão A4.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion.
- **Backend**: Node.js 22, Express.js, TypeScript (`tsx`).
- **Exportação & Relatórios**: jsPDF, jsPDF-AutoTable, docx, html2canvas.
- **Inteligência Artificial (Opcional)**: Google Gemini API via SDK `@google/genai` com cache persistido local (`tax_cache.json`) e motor determinístico local como fallback autônomo.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js** (versão 20 ou 22 recomendada)
- **npm**

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/eduardosousant/motordeanalise.git
cd motordeanalise
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto (use [.env.example](.env.example) como modelo):
```env
PORT=3000
GEMINI_API_KEY=sua_chave_gemini_opcional
RECEITA_WS_TOKEN=seu_token_opcional
```

> **Nota**: O sistema possui **motor determinístico fiscal 100% autônomo**. Ele funciona e calcula todas as regras de MT perfeitamente mesmo sem a chave da API do Gemini ou sem o token da ReceitaWS.

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse a aplicação no navegador em:
```
http://localhost:3000
```

---

## 📦 Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Executa o servidor backend Express integrado ao Vite em modo de desenvolvimento |
| `npm run build` | Compila os assets do frontend e empacota o backend para produção |
| `npm start` | Inicia o servidor em modo produção após o build |
| `npm run lint` | Executa a verificação estática de tipos TypeScript (`tsc --noEmit`) |
| `npm run clean` | Remove o diretório de build `dist/` |

---

## 📂 Estrutura de Pastas

```
├── api/                       # Rotas auxiliares / serverless stubs
├── public/                    # Arquivos e imagens estáticas
├── src/
│   ├── components/            # Componentes visuais React (Formulários, Relatórios, Tabelas, Modais)
│   ├── data/                  # Tabelas fiscais de MT, CNAEs, NCMs e Anexo X
│   ├── lib/                   # Motores de cálculo fiscal, IRRF, Aluguel e parser de XML de NF-e
│   ├── server/                # Serviços de backend (integração CNPJ, motor Gemini e cache de NCM)
│   ├── services/              # Chamadas de API do cliente e contingência local
│   ├── types/                 # Tipagens TypeScript de modelos fiscais e dados tributários
│   └── utils/                 # Exportação para PDF e DOCX, formatações monetárias e fiscais
├── server.ts                  # Servidor principal Express (API + Middleware Vite)
├── tax_cache.json             # Base local em cache de enquadramentos fiscais
└── package.json
```

---

## 📜 Legislação e Referências Normativas

- **Decreto nº 2.212/2014-MT** (Regulamento do ICMS de Mato Grosso - Anexos I, IV, V e X).
- **Orientação Técnica CGE-MT nº 03/2026** (Diretrizes para aquisições públicas e retenções tributárias no Estado de Mato Grosso).
- **Instrução Normativa RFB nº 1.234/2012** (Retenção de tributos em pagamentos efetuados por órgãos públicos).
- **Tema 1130 do STF (RE 1.293.453)** (Competência dos Estados e Municípios para retenção de IRRF).
- **Lei Complementar nº 123/2006** (Estatuto Nacional da Microempresa e Empresa de Pequeno Porte).
- **Convênio ICMS nº 73/2004** (Isenção nas operações com órgãos da administração pública).
