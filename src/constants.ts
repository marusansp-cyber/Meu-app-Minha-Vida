import { Stat, Activity, Project, Lead, Installation } from './types';

export const DASHBOARD_STATS: Stat[] = [
  { label: 'Vendas Totais', value: '$1.2M', change: '+12.5%', trend: 'up' },
  { label: 'Propostas Pendentes', value: '24', change: '+5.2%', trend: 'up' },
  { label: 'Instalações Ativas', value: '12', change: '-2.1%', trend: 'down' },
  { label: 'Geração Estimada', value: '450 kWh', change: '+18%', trend: 'up' },
];

export const RECENT_ACTIVITIES: Activity[] = [
  {
    id: '1',
    type: 'installation',
    title: 'Instalação Concluída',
    description: 'Residencial Greenway, Unidade 4B',
    time: 'há 2 horas',
  },
  {
    id: '2',
    type: 'proposal',
    title: 'Nova Proposta Enviada',
    description: 'Hub Logístico Global Fase 1',
    time: 'há 5 horas',
  },
  {
    id: '3',
    type: 'payment',
    title: 'Pagamento Recebido',
    description: 'Expansão da Fazenda Solar - $45.000',
    time: 'Ontem',
  },
  {
    id: '4',
    type: 'alert',
    title: 'Alerta de Manutenção',
    description: 'Inversor offline: Unidade Park Avenue',
    time: 'há 2 dias',
  },
];

export const ACTIVE_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Edifício Skyline',
    location: 'Centro Histórico',
    capacity: '120 kW',
    status: 'on-track',
    completion: 75,
  },
  {
    id: '2',
    name: 'Marina do Porto',
    location: 'Litoral Norte',
    capacity: '85 kW',
    status: 'planning',
    completion: 25,
  },
  {
    id: '3',
    name: 'Residencial Vale do Carvalho',
    location: 'Zona Leste',
    capacity: '45 kW',
    status: 'delayed',
    completion: 60,
  },
];

export const LEADS: Lead[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '(11) 98888-7777',
    whatsapp: '(11) 98888-7777',
    systemSize: 'Sistema de 5.2 kWp',
    value: 'R$ 12.500',
    status: 'new',
    urgent: true,
    time: 'há 2h',
    createdAt: '2026-03-12',
    representative: 'Ricardo Sales',
    history: [
      { date: '2026-03-12 10:00', action: 'Lead criado via formulário site', user: 'Sistema' },
      { date: '2026-03-12 11:30', action: 'Primeiro contato realizado', user: 'Ricardo Sales' }
    ]
  },
  {
    id: '2',
    name: 'Sara Oliveira',
    email: 'sara.oliveira@gmail.com',
    phone: '(21) 97777-6666',
    whatsapp: '(21) 97777-6666',
    systemSize: 'Sistema de 8.4 kWp',
    value: 'R$ 18.200',
    status: 'new',
    createdAt: '2026-03-10',
    representative: 'Ana Paula',
    history: [
      { date: '2026-03-10 09:00', action: 'Lead importado da planilha', user: 'Admin' }
    ]
  },
  {
    id: '3',
    name: 'Roberto Chen',
    email: 'roberto.chen@outlook.com',
    phone: '(31) 96666-5555',
    whatsapp: '(31) 96666-5555',
    systemSize: 'Sistema de 12.0 kWp',
    value: 'R$ 24.500',
    status: 'survey',
    scheduledDate: '2026-03-15',
    createdAt: '2026-03-05',
    representative: 'Ricardo Sales',
    history: [
      { date: '2026-03-05 14:00', action: 'Lead criado', user: 'Ricardo Sales' },
      { date: '2026-03-07 10:00', action: 'Vistoria agendada para dia 15', user: 'Ricardo Sales' }
    ]
  },
  {
    id: '4',
    name: 'Emília Watson',
    email: 'emilia.watson@yahoo.com',
    phone: '(41) 95555-4444',
    whatsapp: '(41) 95555-4444',
    systemSize: 'Sistema de 6.5 kWp',
    value: 'R$ 14.800',
    status: 'proposal',
    createdAt: '2026-03-08',
    representative: 'Ana Paula',
    history: [
      { date: '2026-03-08 11:00', action: 'Lead criado', user: 'Ana Paula' },
      { date: '2026-03-09 15:00', action: 'Proposta comercial enviada', user: 'Ana Paula' }
    ]
  },
  {
    id: '5',
    name: 'Miguel Ross',
    email: 'miguel.ross@empresa.com.br',
    phone: '(51) 94444-3333',
    whatsapp: '(51) 94444-3333',
    systemSize: 'Sistema de 10.0 kWp',
    value: 'R$ 21.000',
    status: 'proposal',
    createdAt: '2026-03-01',
    representative: 'Ricardo Sales',
    history: [
      { date: '2026-03-01 10:00', action: 'Lead criado', user: 'Ricardo Sales' }
    ]
  },
  {
    id: '6',
    name: 'Lisa Thompson',
    email: 'lisa.t@provider.net',
    phone: '(61) 93333-2222',
    whatsapp: '(61) 93333-2222',
    systemSize: 'Sistema de 7.2 kWp',
    value: 'R$ 15.900',
    status: 'closed',
    createdAt: '2026-02-28',
    representative: 'Ana Paula',
    history: [
      { date: '2026-02-28 16:00', action: 'Lead criado', user: 'Ana Paula' },
      { date: '2026-03-10 14:00', action: 'Contrato assinado', user: 'Ana Paula' }
    ]
  },
];

export const INSTALLATIONS: Installation[] = [
  {
    id: '1',
    name: 'Residência - Smith',
    projectId: 'SOL-9821',
    stage: 'Aprovação de Engenharia',
    technician: {
      name: 'Sara Connor',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCduVQH7SkGxslxjuGHpKevNccd0GWnqid0DlMlvN64_VX7WhEcjDCmfBPP-yJy5Cd7SpkBUS0wDQA1GUr2yhLQqv2lpntWSo6kXoBfQCgl8XE8yplI6zQkUJrO3fLPhfgYOLOxbNPyFcCWOSL7_HqwjolITS6iO9dYtTyu1Dxy9J6sP22mQvCMywKM1Adk7ZkaLga0SlBn2UbNYRapTHC51RzZTj9ftjrSwwTh7zGNqGP0Y38a1aWI08lbO3_zxJS93Npb3UI4CHwk',
    },
    progress: 25,
    lastUpdated: '24 Out, 2023',
    type: 'residence',
    startDate: '15 Out, 2023',
    estimatedDeadline: '10 Nov, 2023',
    stages: [
      { name: 'Engenharia', status: 'in-progress' },
      { name: 'Materiais', status: 'pending' },
      { name: 'Instalação', status: 'pending' },
      { name: 'Inspeção', status: 'pending' },
    ]
  },
  {
    id: '2',
    name: 'Parque Industrial A',
    projectId: 'SOL-4423',
    stage: 'Entrega de Materiais',
    technician: {
      name: 'Marcos Wright',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDY3T3I94_u3MVd7lJn3uBvxAsy3McHBLSQf353KQfMzkoRFOFqeA3PyaJbR3huAI0o5XDnW5l9vzholRC-dqXMF8KlcUNN-cyd8sG5vmW1R3qDihoEFjwzFzpJZlqF_gY0RHYEmSb5yDHBtr4NqOOLrf0xKV6taOW3mifWnsokyUPenWzYSENnmQ535lMWbH9K0eDKqfoU3mI9Vlgsw5vp0N1EqiASBObl7eqJtEnAXlZryJ4ta3nut_VKXuOtY2ue_1e_uSbH1AL0',
    },
    progress: 45,
    lastUpdated: '23 Out, 2023',
    type: 'industrial',
    startDate: '10 Out, 2023',
    estimatedDeadline: '20 Nov, 2023',
    stages: [
      { name: 'Engenharia', status: 'completed' },
      { name: 'Materiais', status: 'in-progress' },
      { name: 'Instalação', status: 'pending' },
      { name: 'Inspeção', status: 'pending' },
    ]
  },
  {
    id: '3',
    name: 'Casa Vale Verde',
    projectId: 'SOL-1109',
    stage: 'Instalação',
    technician: {
      name: 'Kyle Reese',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0LWDVDXuCpOPwfUiCiAdCvs9JWxkrdYX6rgj5D8DEWWPJly6wbY1rbCKbGwCEo1zAa-oxIDuVh8lV0lNL5XUHb4_FDy3zlsR8mm5TkOSW2HfsB6uSm_9eiy07rU9jOeZACwj1mPo2lfbz9YnY4JysVd6U-pnfQdNs2frYsh452B6seGKAJZpu8AiK8R3awMte2afcWt9e6XstS_5wQiEb47vmZ4eT2tXRlJIZZn6QHYA320of5QD2zyRXhpe-4ByMjrvO4xy-Su55',
    },
    progress: 75,
    lastUpdated: '25 Out, 2023',
    type: 'home',
    startDate: '05 Out, 2023',
    estimatedDeadline: '30 Out, 2023',
    stages: [
      { name: 'Engenharia', status: 'completed' },
      { name: 'Materiais', status: 'completed' },
      { name: 'Instalação', status: 'in-progress' },
      { name: 'Inspeção', status: 'pending' },
    ]
  },
  {
    id: '4',
    name: 'Apartamentos Sunset',
    projectId: 'SOL-7754',
    stage: 'Inspeção da Concessionária',
    technician: {
      name: 'Ellen Ripley',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1Zrwsv-pRvZ_2VE-mAimc-F6ll_skZJLY-BtSkIYcySB1HcIRwCU1yKcxu-ZyvMFvXxO1CEuo44VftRxSRhruO-ZKm474MEVPV_7p4QzqdODjnIrC5aSHJBpmcahDr07S2w4uzKOzfm-3y4rHFfVT6mcHdLs4Fb6voQoV-m9ur9izlUitJfZEUwX9Nqnv23NDOitZA9XiHIMFx5KWHxDy-iFAAbMhsGwd4neRID-9YjtTwYlbSzOVqHDnU3AW2kpU8_NqHxyHbjaa',
    },
    progress: 90,
    lastUpdated: '25 Out, 2023',
    type: 'apartment',
    startDate: '01 Out, 2023',
    estimatedDeadline: '28 Out, 2023',
    stages: [
      { name: 'Engenharia', status: 'completed' },
      { name: 'Materiais', status: 'completed' },
      { name: 'Instalação', status: 'completed' },
      { name: 'Inspeção', status: 'in-progress' },
    ]
  },
  {
    id: '5',
    name: 'Residencial Pinheiros',
    projectId: 'SOL-2234',
    stage: 'Aprovação de Engenharia',
    technician: {
      name: 'Sara Connor',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCduVQH7SkGxslxjuGHpKevNccd0GWnqid0DlMlvN64_VX7WhEcjDCmfBPP-yJy5Cd7SpkBUS0wDQA1GUr2yhLQqv2lpntWSo6kXoBfQCgl8XE8yplI6zQkUJrO3fLPhfgYOLOxbNPyFcCWOSL7_HqwjolITS6iO9dYtTyu1Dxy9J6sP22mQvCMywKM1Adk7ZkaLga0SlBn2UbNYRapTHC51RzZTj9ftjrSwwTh7zGNqGP0Y38a1aWI08lbO3_zxJS93Npb3UI4CHwk',
    },
    progress: 15,
    lastUpdated: '26 Out, 2023',
    type: 'residence',
    startDate: '20 Out, 2023',
    estimatedDeadline: '15 Nov, 2023',
    stages: [
      { name: 'Engenharia', status: 'in-progress' },
      { name: 'Materiais', status: 'pending' },
      { name: 'Instalação', status: 'pending' },
      { name: 'Inspeção', status: 'pending' },
    ]
  },
  {
    id: '6',
    name: 'Loja Centro',
    projectId: 'SOL-5567',
    stage: 'Entrega de Materiais',
    technician: {
      name: 'Marcos Wright',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDY3T3I94_u3MVd7lJn3uBvxAsy3McHBLSQf353KQfMzkoRFOFqeA3PyaJbR3huAI0o5XDnW5l9vzholRC-dqXMF8KlcUNN-cyd8sG5vmW1R3qDihoEFjwzFzpJZlqF_gY0RHYEmSb5yDHBtr4NqOOLrf0xKV6taOW3mifWnsokyUPenWzYSENnmQ535lMWbH9K0eDKqfoU3mI9Vlgsw5vp0N1EqiASBObl7eqJtEnAXlZryJ4ta3nut_VKXuOtY2ue_1e_uSbH1AL0',
    },
    progress: 40,
    lastUpdated: '26 Out, 2023',
    type: 'industrial',
    startDate: '18 Out, 2023',
    estimatedDeadline: '10 Nov, 2023',
    stages: [
      { name: 'Engenharia', status: 'completed' },
      { name: 'Materiais', status: 'in-progress' },
      { name: 'Instalação', status: 'pending' },
      { name: 'Inspeção', status: 'pending' },
    ]
  },
  {
    id: '7',
    name: 'Condomínio Alpha',
    projectId: 'SOL-8890',
    stage: 'Instalação',
    technician: {
      name: 'Kyle Reese',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0LWDVDXuCpOPwfUiCiAdCvs9JWxkrdYX6rgj5D8DEWWPJly6wbY1rbCKbGwCEo1zAa-oxIDuVh8lV0lNL5XUHb4_FDy3zlsR8mm5TkOSW2HfsB6uSm_9eiy07rU9jOeZACwj1mPo2lfbz9YnY4JysVd6U-pnfQdNs2frYsh452B6seGKAJZpu8AiK8R3awMte2afcWt9e6XstS_5wQiEb47vmZ4eT2tXRlJIZZn6QHYA320of5QD2zyRXhpe-4ByMjrvO4xy-Su55',
    },
    progress: 65,
    lastUpdated: '26 Out, 2023',
    type: 'apartment',
    startDate: '12 Out, 2023',
    estimatedDeadline: '05 Nov, 2023',
    stages: [
      { name: 'Engenharia', status: 'completed' },
      { name: 'Materiais', status: 'completed' },
      { name: 'Instalação', status: 'in-progress' },
      { name: 'Inspeção', status: 'pending' },
    ]
  },
  {
    id: '8',
    name: 'Fazenda Sol',
    projectId: 'SOL-3345',
    stage: 'Inspeção da Concessionária',
    technician: {
      name: 'Ellen Ripley',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1Zrwsv-pRvZ_2VE-mAimc-F6ll_skZJLY-BtSkIYcySB1HcIRwCU1yKcxu-ZyvMFvXxO1CEuo44VftRxSRhruO-ZKm474MEVPV_7p4QzqdODjnIrC5aSHJBpmcahDr07S2w4uzKOzfm-3y4rHFfVT6mcHdLs4Fb6voQoV-m9ur9izlUitJfZEUwX9Nqnv23NDOitZA9XiHIMFx5KWHxDy-iFAAbMhsGwd4neRID-9YjtTwYlbSzOVqHDnU3AW2kpU8_NqHxyHbjaa',
    },
    progress: 95,
    lastUpdated: '26 Out, 2023',
    type: 'industrial',
    startDate: '01 Out, 2023',
    estimatedDeadline: '25 Out, 2023',
    stages: [
      { name: 'Engenharia', status: 'completed' },
      { name: 'Materiais', status: 'completed' },
      { name: 'Instalação', status: 'completed' },
      { name: 'Inspeção', status: 'in-progress' },
    ]
  },
];
