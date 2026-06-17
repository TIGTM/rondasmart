import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Siren,
  UserCheck
} from "lucide-react";

export const kpis = [
  { label: "Rondas Hoje", value: "18", icon: Radio, tone: "blue", detail: "+12% vs ontem" },
  { label: "Concluidas", value: "14", icon: CheckCircle2, tone: "green", detail: "78% do dia" },
  { label: "Atrasadas", value: "2", icon: Clock, tone: "amber", detail: "1 critica" },
  { label: "Ocorrencias", value: "5", icon: ShieldAlert, tone: "red", detail: "2 abertas" },
  { label: "Vigilantes Ativos", value: "8", icon: UserCheck, tone: "slate", detail: "2 offline" }
];

export const condominios = [
  { nome: "Condominio Jardim America", cidade: "Belo Horizonte/MG", bairro: "Sion", sindico: "Marina Duarte", vigilantes: 4, status: "Ativo" },
  { nome: "Residencial Monte Verde", cidade: "Nova Lima/MG", bairro: "Vila da Serra", sindico: "Rafael Mendes", vigilantes: 2, status: "Ativo" },
  { nome: "Edificio Solar das Palmeiras", cidade: "Contagem/MG", bairro: "Eldorado", sindico: "Claudia Rocha", vigilantes: 2, status: "Implantacao" }
];

export const vigilantes = [
  ["Joao Pereira", "31 99910-1010", "Condominio Jardim America", "07:00 - 19:00", "Em ronda"],
  ["Marcos Silva", "31 99920-2020", "Residencial Monte Verde", "19:00 - 07:00", "Disponivel"],
  ["Carlos Andrade", "31 99930-3030", "Solar das Palmeiras", "07:00 - 19:00", "Offline"],
  ["Fernanda Costa", "31 99940-4040", "Jardim America", "12:00 - 00:00", "Em alerta"],
  ["Roberto Lima", "31 99950-5050", "Monte Verde", "07:00 - 19:00", "Disponivel"],
  ["Ana Souza", "31 99960-6060", "Jardim America", "19:00 - 07:00", "Em ronda"],
  ["Paulo Henrique", "31 99970-7070", "Solar das Palmeiras", "07:00 - 19:00", "Disponivel"],
  ["Diego Martins", "31 99980-8080", "Jardim America", "19:00 - 07:00", "Offline"],
  ["Lucas Almeida", "31 99990-9090", "Monte Verde", "07:00 - 19:00", "Disponivel"],
  ["Rafael Gomes", "31 99900-0000", "Jardim America", "12:00 - 00:00", "Em ronda"]
].map(([nome, telefone, condominio, turno, status], index) => ({ nome, telefone, condominio, turno, status, id: index + 1 }));

export const pontos = [
  "Portaria Principal",
  "Bloco A",
  "Bloco B",
  "Piscina",
  "Salao de Festas",
  "Garagem G1",
  "Garagem G2",
  "Casa de Maquinas",
  "Area Gourmet",
  "Playground"
].map((nome, index) => ({
  nome,
  localizacao: index < 3 ? "Acesso e blocos" : index < 7 ? "Area comum" : "Area tecnica",
  status: index % 4 === 0 ? "Pendente" : "Operacional",
  ultimaVisita: `Hoje ${String(8 + Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "35" : "12"}`,
  codigo: `RS-${String(index + 1).padStart(3, "0")}`
}));

export const atividades = [
  "08:15 - Joao iniciou ronda no Condominio Jardim America",
  "08:23 - QR Code Portaria validado",
  "08:31 - Ocorrencia registrada na Garagem G2",
  "08:45 - Maria acionou botao de panico em teste",
  "08:55 - Ronda concluida com sucesso"
];

const tipos = ["Portao aberto", "Lampada queimada", "Pessoa suspeita", "Veiculo abandonado", "Vazamento", "Barulho excessivo", "Acesso nao autorizado", "Equipamento danificado"];
const statusOcorrencia = ["Aberta", "Em analise", "Resolvida"];

export const ocorrencias = Array.from({ length: 20 }, (_, index) => ({
  id: index + 1,
  tipo: index === 0 ? "Emergencia - botao de panico" : tipos[index % tipos.length],
  local: pontos[index % pontos.length].nome,
  descricao: index === 0 ? "Alerta enviado pelo vigilante Joao durante ronda em execucao." : "Registro demonstrativo com evidencia visual e rastreabilidade da ronda.",
  data: `17/06/2026 ${String(8 + (index % 10)).padStart(2, "0")}:${String((index * 7) % 60).padStart(2, "0")}`,
  responsavel: vigilantes[index % vigilantes.length].nome,
  status: index === 0 ? "Aberta" : statusOcorrencia[index % statusOcorrencia.length],
  prioridade: index === 0 ? "Emergencia" : index % 3 === 0 ? "Alta" : "Media"
}));

export const rondas = Array.from({ length: 50 }, (_, index) => ({
  data: `${String(11 + (index % 7)).padStart(2, "0")}/06/2026`,
  vigilante: vigilantes[index % vigilantes.length].nome,
  condominio: condominios[index % condominios.length].nome,
  ronda: `Ronda ${String(index + 1).padStart(2, "0")}`,
  inicio: `${String(7 + (index % 12)).padStart(2, "0")}:00`,
  fim: `${String(8 + (index % 12)).padStart(2, "0")}:05`,
  pontos: `${7 + (index % 4)}/10`,
  ocorrencias: index % 5,
  status: ["Finalizada", "Em andamento", "Atrasada", "Cancelada"][index % 4]
}));

export const timeline = [
  "08:00 - Ronda iniciada",
  "08:10 - Portaria Principal validada",
  "08:18 - Bloco A validado",
  "08:29 - Piscina validada",
  "08:40 - Garagem G1 validada",
  "08:52 - Ocorrencia registrada",
  "09:00 - Ronda finalizada"
];

export const weekly = [12, 16, 14, 18, 20, 15, 18];

export const alerts = [
  { title: "Panico acionado", text: "Joao Pereira enviou alerta de emergencia na Garagem G1.", icon: Siren },
  { title: "Ronda atrasada", text: "Bloco B esta pendente ha 18 minutos.", icon: AlertTriangle },
  { title: "Central online", text: "Todos os condominios com monitoramento ativo.", icon: ShieldCheck }
];

export const mobileChecklist = [
  { label: "Portaria Principal", done: true },
  { label: "Bloco A", done: true },
  { label: "Piscina", done: true },
  { label: "Garagem G1", done: false },
  { label: "Casa de Maquinas", done: false }
];

export const navAdmin = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Building2 },
  { href: "/admin/condominios", label: "Condominios", icon: Building2 },
  { href: "/admin/vigilantes", label: "Vigilantes", icon: UserCheck },
  { href: "/admin/pontos", label: "Pontos", icon: MapPin },
  { href: "/admin/rondas", label: "Rondas", icon: Radio },
  { href: "/admin/ocorrencias", label: "Ocorrencias", icon: Camera },
  { href: "/admin/relatorios", label: "Relatorios", icon: BadgeCheck }
];
