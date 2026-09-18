import { CnaeItem, OrcamentoInput, ServicoInput } from '../types/fiscal';

export const CNAES_SERVICOS: CnaeItem[] = [
  {
    codigo: '4321-5/00',
    descricao: 'Instalação e manutenção elétrica',
    sujeitoArt18B: true,
    categoria: 'Instalações e Manutenção',
  },
  {
    codigo: '4322-3/01',
    descricao: 'Instalações hidráulicas, sanitárias e de gás',
    sujeitoArt18B: true,
    categoria: 'Instalações e Manutenção',
  },
  {
    codigo: '4330-4/04',
    descricao: 'Serviços de pintura de edifícios em geral',
    sujeitoArt18B: true,
    categoria: 'Construção e Reformas',
  },
  {
    codigo: '4330-4/01',
    descricao: 'Impermeabilização e serviços de carpintaria em obras',
    sujeitoArt18B: true,
    categoria: 'Construção e Reformas',
  },
  {
    codigo: '4399-1/03',
    descricao: 'Obras de alvenaria e reparos prediais',
    sujeitoArt18B: true,
    categoria: 'Construção e Reformas',
  },
  {
    codigo: '4520-0/01',
    descricao: 'Serviços de manutenção e reparação mecânica de veículos automotores',
    sujeitoArt18B: true,
    categoria: 'Manutenção Veicular',
  },
  {
    codigo: '3314-7/10',
    descricao: 'Manutenção e reparação de máquinas e equipamentos para uso geral',
    sujeitoArt18B: true,
    categoria: 'Manutenção de Equipamentos',
  },
  {
    codigo: '3313-9/01',
    descricao: 'Manutenção e reparação de geradores, transformadores e motores elétricos',
    sujeitoArt18B: true,
    categoria: 'Manutenção de Equipamentos',
  },
  {
    codigo: '6202-3/00',
    descricao: 'Desenvolvimento e licenciamento de programas de computador customizáveis',
    sujeitoArt18B: false,
    categoria: 'Tecnologia da Informação',
  },
  {
    codigo: '6209-1/00',
    descricao: 'Suporte técnico, manutenção e outros serviços em tecnologia da informação',
    sujeitoArt18B: false,
    categoria: 'Tecnologia da Informação',
  },
  {
    codigo: '8219-9/99',
    descricao: 'Preparação de documentos e serviços especializados de apoio administrativo',
    sujeitoArt18B: false,
    categoria: 'Serviços Administrativos',
  },
  {
    codigo: '7319-0/02',
    descricao: 'Promoção de vendas e publicidade no local de prestação',
    sujeitoArt18B: false,
    categoria: 'Publicidade e Eventos',
  },
  {
    codigo: '8599-6/04',
    descricao: 'Treinamento em desenvolvimento profissional e gerencial',
    sujeitoArt18B: false,
    categoria: 'Educação e Treinamento',
  },
  {
    codigo: '8020-0/01',
    descricao: 'Atividades de monitoramento de sistemas de segurança eletrônica',
    sujeitoArt18B: false,
    categoria: 'Segurança',
  },
];

export const EXEMPLO_CENARIOS: {
  titulo: string;
  descricao: string;
  servico: ServicoInput;
  orcamentos: OrcamentoInput[];
}[] = [
  {
    titulo: 'Cenário 1: Manutenção Elétrica Emergencial (Impacto Art. 18-B)',
    descricao: 'Demonstra como um MEI aparentemente mais barato torna-se mais caro devido à CPP patronal de 20%.',
    servico: {
      descricao: 'Serviço de reparo na rede elétrica e substituição do quadro de distribuição da filial.',
      cnae: '4321-5/00',
      solicitante: 'Carlos Mendes (Facilities)',
      departamento: 'Operações e Infraestrutura',
      numeroAdiantamento: 'ADV-2026/084',
    },
    orcamentos: [
      {
        id: '1',
        cnpj: '45.123.890/0001-44',
        razaoSocial: 'João Silva Instalações Elétricas MEI',
        regimeTributario: 'MEI',
        valor: 4800,
        cnaePrincipal: '4321-5/00',
        observacao: 'Proposta inicial mais baixa em valor nominal.',
      },
      {
        id: '2',
        cnpj: '18.945.678/0001-12',
        razaoSocial: 'Voltz Engenharia e Instalações EPP',
        regimeTributario: 'SIMPLES_NACIONAL',
        valor: 5200,
        cnaePrincipal: '4321-5/00',
        observacao: 'Simples Nacional (Anexo III) - Sem CPP tomador.',
      },
      {
        id: '3',
        cnpj: '03.882.119/0001-90',
        razaoSocial: 'Comercial ABC Materiais de Construção Ltda',
        regimeTributario: 'LUCRO_PRESUMIDO',
        valor: 5900,
        cnaePrincipal: '4744-0/99', // CNAE de comércio! Incompatível
        observacao: 'CNAE principal é comércio varejista, sem autorização para serviço elétrico.',
      },
    ],
  },
  {
    titulo: 'Cenário 2: Suporte em TI e Cabeamento Estruturado (Sem Art. 18-B)',
    descricao: 'Serviço de TI onde MEI não incide CPP de 20%, focado em compatibilidade de CNAE e menor valor.',
    servico: {
      descricao: 'Configuração de switches e reestruturação do cabeamento de rede da sala de reuniões.',
      cnae: '6209-1/00',
      solicitante: 'Mariana Duarte',
      departamento: 'Tecnologia da Informação',
      numeroAdiantamento: 'ADV-2026/092',
    },
    orcamentos: [
      {
        id: '1',
        cnpj: '38.991.002/0001-55',
        razaoSocial: 'TechNet Soluções em Rede MEI',
        regimeTributario: 'MEI',
        valor: 2400,
        cnaePrincipal: '6209-1/00',
        observacao: 'Serviço de TI (não incide Art. 18-B). Custo efetivo idêntico ao nominal.',
      },
      {
        id: '2',
        cnpj: '22.341.789/0001-30',
        razaoSocial: 'Conecta Telecom & TI Ltda',
        regimeTributario: 'SIMPLES_NACIONAL',
        valor: 2750,
        cnaePrincipal: '6209-1/00',
        observacao: 'Proposta competitiva com equipe certificada.',
      },
      {
        id: '3',
        cnpj: '11.890.432/0001-09',
        razaoSocial: 'Alpha Consultoria Empresarial Ltda',
        regimeTributario: 'LUCRO_PRESUMIDO',
        valor: 3100,
        cnaePrincipal: '7020-4/00',
        observacao: 'CNAE divergente para serviço de redes.',
      },
    ],
  },
];
