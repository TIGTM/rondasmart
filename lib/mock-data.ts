import {
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  Radio,
  ShieldAlert,
  UserCheck
} from "lucide-react";

export const kpis = [
  { label: "Rondas Hoje", value: "0", icon: Radio, tone: "blue", detail: "Dados do banco" },
  { label: "Concluidas", value: "0", icon: CheckCircle2, tone: "green", detail: "Dados do banco" },
  { label: "Atrasadas", value: "0", icon: Clock, tone: "amber", detail: "Dados do banco" },
  { label: "Ocorrencias", value: "0", icon: ShieldAlert, tone: "red", detail: "Dados do banco" },
  { label: "Vigilantes Ativos", value: "0", icon: UserCheck, tone: "slate", detail: "Dados do banco" }
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
