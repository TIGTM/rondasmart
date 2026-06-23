"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Camera,
  Check,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Home,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  Plus,
  QrCode,
  Radio,
  ScanLine,
  Search,
  Shield,
  ShieldAlert,
  Siren,
  Smartphone,
  User,
  UserCheck,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/form";
import {
  atividades,
  alerts,
  condominios,
  kpis,
  mobileChecklist,
  navAdmin,
  ocorrencias,
  pontos,
  rondas,
  timeline,
  vigilantes,
  weekly
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Toast = { title: string; text: string };
type FormValues = Record<string, string>;
type MobileCheckpoint = {
  id: string;
  name: string;
  location?: string | null;
  qrToken: string;
  status: string;
  lastVisitAt?: string | null;
  visitedAt?: string | null;
};
type MobileRondaData = {
  patrol: { id: string; name: string; status: string; condominiumName?: string | null; startedAt?: string | null } | null;
  checkpoints: MobileCheckpoint[];
};

async function apiJson<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Nao foi possivel concluir a operacao.");
  return data as T;
}

function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const show = (next: Toast) => {
    setToast(next);
    window.setTimeout(() => setToast(null), 2600);
  };
  return { toast, show };
}

function ToastView({ toast }: { toast: Toast | null }) {
  if (!toast) return null;
  return (
    <div className="fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex gap-3">
        <div className="mt-0.5 rounded-full bg-green-100 p-1 text-green-600">
          <Check size={16} />
        </div>
        <div>
          <p className="font-semibold text-slate-950">{toast.title}</p>
          <p className="text-sm text-slate-500">{toast.text}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Ativo: "bg-green-100 text-green-700",
    Implantacao: "bg-blue-100 text-blue-700",
    "Em ronda": "bg-blue-100 text-blue-700",
    Disponivel: "bg-green-100 text-green-700",
    Offline: "bg-slate-100 text-slate-600",
    "Em alerta": "bg-red-100 text-red-700",
    Operacional: "bg-green-100 text-green-700",
    Pendente: "bg-amber-100 text-amber-700",
    Aberta: "bg-red-100 text-red-700",
    "Em analise": "bg-amber-100 text-amber-700",
    Resolvida: "bg-green-100 text-green-700",
    Finalizada: "bg-green-100 text-green-700",
    "Em andamento": "bg-blue-100 text-blue-700",
    Atrasada: "bg-amber-100 text-amber-700",
    Cancelada: "bg-slate-100 text-slate-600"
  };
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", styles[status] ?? "bg-slate-100 text-slate-700")}>{status}</span>;
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-600 text-white shadow-sm">
        <Shield size={24} />
      </div>
      <div>
        <p className="text-lg font-black leading-5 tracking-tight">Ronda Smart</p>
        <p className="text-xs font-medium text-slate-500">Monitoramento inteligente</p>
      </div>
    </div>
  );
}

function InstallBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setVisible(mobile && !standalone);
  }, []);
  if (!visible) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 rounded-lg bg-slate-950 p-3 text-white shadow-soft md:hidden">
      <div className="flex items-center gap-3">
        <Smartphone className="text-blue-300" size={22} />
        <p className="flex-1 text-sm">Adicione o Ronda Smart a Tela Inicial para usar como aplicativo.</p>
        <button onClick={() => setVisible(false)} aria-label="Fechar"><X size={18} /></button>
      </div>
    </div>
  );
}

export function LoginPage() {
  const router = useRouter();
  const { toast, show } = useToast();
  const [profile, setProfile] = useState<"admin" | "vigilante">("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const email = profile === "admin" ? "admin@rondasmart.com.br" : "vigilante@rondasmart.com.br";

  async function enter() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "rondasmart-demo" })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao entrar.");
      router.push(data.user.role === "GUARD" ? "/mobile/home" : "/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
        <section className="flex items-center bg-white px-5 py-8 md:px-10">
          <div className="mx-auto w-full max-w-md space-y-7">
            <Logo />
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">Seguranca monitorada em tempo real.</h1>
              <p className="mt-3 text-slate-500">Painel web, aplicativo PWA e monitoramento operacional em tempo real.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
              <button onClick={() => setProfile("admin")} className={cn("rounded-md px-3 py-2 text-sm font-semibold", profile === "admin" && "bg-white shadow-sm")}>Administrador</button>
              <button onClick={() => setProfile("vigilante")} className={cn("rounded-md px-3 py-2 text-sm font-semibold", profile === "vigilante" && "bg-white shadow-sm")}>Vigilante</button>
            </div>
            <div className="space-y-3">
              <Input value={email} readOnly aria-label="E-mail" />
              <Input value="rondasmart-demo" readOnly type="password" aria-label="Senha" />
              <Button className="w-full" size="lg" onClick={enter}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
                Entrar
              </Button>
              {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
              <Button className="w-full" variant="outline" onClick={() => show({ title: "Instalacao pronta", text: "Use o menu do navegador para adicionar a Tela Inicial." })}>
                <Smartphone size={18} />
                Instalar App
              </Button>
            </div>
            <div className="flex justify-between text-sm font-medium text-blue-600">
              <a href="#">Esqueci minha senha</a>
              <a href="#">Solicitar acesso</a>
            </div>
          </div>
        </section>
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(37,99,235,.32),transparent_32%),linear-gradient(135deg,#0F172A,#1E293B)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex justify-end gap-3">
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm">PWA standalone</span>
              <span className="rounded-full bg-green-400/20 px-4 py-2 text-sm text-green-100">Central online</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur">
                <Radio className="text-blue-300" />
                <p className="mt-8 text-4xl font-black">18</p>
                <p className="text-sm text-slate-300">rondas hoje</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur">
                <MapPin className="text-green-300" />
                <p className="mt-8 text-4xl font-black">96%</p>
                <p className="text-sm text-slate-300">pontos validados</p>
              </div>
              <div className="col-span-2 rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur">
                <MockMap dark />
              </div>
            </div>
          </div>
        </section>
      </div>
      <ToastView toast={toast} />
      <InstallBanner />
    </main>
  );
}

function AdminLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const adminLinks = (
    <nav className="mt-8 space-y-1">
      {navAdmin.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100", pathname === item.href && "bg-slate-950 text-white hover:bg-slate-950")}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white p-5 lg:block">
        <Logo />
        {adminLinks}
      </aside>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Fechar menu" className="absolute inset-0 bg-slate-950/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative h-full w-80 max-w-[86vw] border-r border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Logo />
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu">
                <X size={20} />
              </Button>
            </div>
            {adminLinks}
            <LogoutButton mobileMenuClose={() => setMobileMenuOpen(false)} className="mt-6 w-full justify-start" />
          </aside>
        </div>
      )}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menu"><Menu size={18} /></Button>
              <div>
                <p className="text-xs font-bold uppercase text-blue-600">Painel administrativo</p>
                <h1 className="text-xl font-black tracking-tight md:text-2xl">{title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon"><Bell size={18} /></Button>
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="p-4 md:p-7">{children}</main>
      </div>
    </div>
  );
}

function KpiCard({ item }: { item: (typeof kpis)[number] }) {
  const Icon = item.icon;
  const tone = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    amber: "bg-amber-100 text-amber-600",
    red: "bg-red-100 text-red-600",
    slate: "bg-slate-100 text-slate-700"
  }[item.tone];
  return (
    <Card>
      <CardContent className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{item.label}</p>
          <p className="mt-2 text-3xl font-black">{item.value}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">{item.detail}</p>
        </div>
        <div className={cn("rounded-lg p-3", tone)}><Icon size={22} /></div>
      </CardContent>
    </Card>
  );
}

function SimpleChart() {
  return (
    <div className="flex h-56 items-end gap-3">
      {weekly.map((value, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-2">
          <div className="w-full rounded-t-md bg-blue-600" style={{ height: `${value * 8}px` }} />
          <span className="text-xs font-semibold text-slate-400">{["S", "T", "Q", "Q", "S", "S", "D"][index]}</span>
        </div>
      ))}
    </div>
  );
}

function MockMap({ dark = false }: { dark?: boolean }) {
  return (
    <div className={cn("relative h-64 overflow-hidden rounded-lg border", dark ? "border-white/10 bg-slate-900" : "border-slate-200 bg-slate-100")}>
      <div className={cn("absolute left-8 top-8 h-28 w-36 rounded-lg border-2", dark ? "border-white/15" : "border-slate-300")} />
      <div className={cn("absolute bottom-7 right-8 h-32 w-48 rounded-lg border-2", dark ? "border-white/15" : "border-slate-300")} />
      <div className={cn("absolute left-20 top-36 h-1 w-56 rotate-12 rounded-full", dark ? "bg-white/15" : "bg-slate-300")} />
      {[["20%", "22%"], ["58%", "34%"], ["72%", "72%"], ["34%", "66%"], ["48%", "52%"]].map(([left, top], i) => (
        <div key={i} className="absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-blue-600 text-white ring-4 ring-blue-600/20" style={{ left, top }}>
          <MapPin size={14} />
        </div>
      ))}
    </div>
  );
}

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<{
    kpis?: {
      todayPatrols: number;
      completedPatrols: number;
      delayedPatrols: number;
      incidents: number;
      activeGuards: number;
    };
    activities?: Array<{ title: string; location: string; status: string }>;
  } | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setDashboard(data))
      .catch(() => setDashboard(null));
  }, []);

  const dashboardKpis = kpis.map((item) => {
    const values = dashboard?.kpis;
    if (!values) return item;
    const valueByLabel: Record<string, number> = {
      "Rondas Hoje": values.todayPatrols,
      Concluidas: values.completedPatrols,
      Atrasadas: values.delayedPatrols,
      Ocorrencias: values.incidents,
      "Vigilantes Ativos": values.activeGuards
    };
    return { ...item, value: String(valueByLabel[item.label] ?? item.value), detail: "Dados do banco" };
  });

  const recentActivities = dashboard?.activities?.length
    ? dashboard.activities.map((item) => `${item.title} - ${item.location ?? "Sem local"} (${item.status})`)
    : atividades;

  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{dashboardKpis.map((item) => <KpiCard key={item.label} item={item} />)}</div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <Card>
          <CardHeader><h2 className="font-black">Rondas da semana</h2></CardHeader>
          <CardContent><SimpleChart /></CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-red-500 p-3 text-white"><Siren /></div>
              <div>
                <p className="text-sm font-black uppercase text-red-600">Alerta em destaque</p>
                <h2 className="mt-2 text-2xl font-black">Emergencia ativa</h2>
                <p className="mt-2 text-sm text-red-700">Botao de panico acionado na Garagem G1. Central notificada para atendimento.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader><h2 className="font-black">Status operacional</h2></CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert) => {
              const Icon = alert.icon;
              return <div key={alert.title} className="flex gap-3"><Icon className="text-blue-600" size={20} /><div><p className="font-bold">{alert.title}</p><p className="text-sm text-slate-500">{alert.text}</p></div></div>;
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="font-black">Ultimas atividades</h2></CardHeader>
          <CardContent className="space-y-3">{recentActivities.map((activity) => <p key={activity} className="rounded-lg bg-slate-50 p-3 text-sm font-medium text-slate-600">{activity}</p>)}</CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="font-black">Mapa de pontos</h2></CardHeader>
          <CardContent><MockMap /></CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function FormModal({
  title,
  button,
  submitLabel = "Salvar",
  children,
  onSubmit
}: {
  title: string;
  button: string;
  submitLabel?: string;
  children: React.ReactNode;
  onSubmit: (values: FormValues) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData(event.currentTarget);
      const values = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)]));
      await onSubmit(values);
      setOpen(false);
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus size={16} />{button}</Button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <form onSubmit={submit} className="w-full max-w-xl rounded-lg bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="text-xl font-black">{title}</h2>
              <button type="button" onClick={() => setOpen(false)}><X /></button>
            </div>
            <div className="grid gap-3 p-5">{children}</div>
            {error && <p className="mx-5 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 border-t border-slate-100 p-5">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                {submitLabel}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export function CondominiosPage() {
  const [dbCondominios, setDbCondominios] = useState<any[] | null>(null);
  async function loadCondominios() {
    try {
      const data = await apiJson<{ condominiums: any[] }>("/api/condominiums");
      setDbCondominios(data.condominiums);
    } catch {
      setDbCondominios(null);
    }
  }
  useEffect(() => { void loadCondominios(); }, []);
  async function createCondominium(values: FormValues) {
    await apiJson("/api/condominiums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        document: values.document,
        address: values.address,
        city: values.city,
        district: values.district,
        managerName: values.managerName,
        managerPhone: values.managerPhone,
        managerEmail: values.managerEmail
      })
    });
    await loadCondominios();
  }
  const rows = dbCondominios?.map((c) => ({
    nome: c.name,
    cidade: c.city,
    bairro: c.district,
    sindico: c.managerName,
    vigilantes: c.guardsCount,
    status: c.status
  })) ?? condominios;
  return (
    <AdminLayout title="Condominios">
      <div className="mb-4 flex justify-end">
        <FormModal title="Novo condominio" button="Novo Condominio" submitLabel="Salvar condominio" onSubmit={createCondominium}>
          <Input name="name" placeholder="Nome" required />
          <Input name="document" placeholder="CNPJ" />
          <Input name="address" placeholder="Endereco" />
          <Input name="city" placeholder="Cidade" required />
          <Input name="district" placeholder="Bairro" />
          <Input name="managerName" placeholder="Nome do sindico" />
          <Input name="managerPhone" placeholder="Telefone" />
          <Input name="managerEmail" placeholder="E-mail" type="email" />
        </FormModal>
      </div>
      <Card><Table headers={["Nome", "Cidade", "Bairro", "Sindico", "Vigilantes", "Status"]} rows={rows.map((c) => [c.nome, c.cidade, c.bairro, c.sindico, c.vigilantes, <StatusBadge key={c.nome} status={c.status} />])} /></Card>
    </AdminLayout>
  );
}

function LogoutButton({ mobileMenuClose, className }: { mobileMenuClose?: () => void; className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    mobileMenuClose?.();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" className={className} onClick={logout} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}
      Sair
    </Button>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">{headers.map((h) => <th key={h} className="px-4 py-3 font-black">{h}</th>)}</thead>
        <tbody className="divide-y divide-slate-100">{rows.map((row, i) => <tr key={i} className="hover:bg-slate-50">{row.map((cell, j) => <td key={j} className="px-4 py-4 font-medium text-slate-700">{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function VigilantesPage() {
  const [dbVigilantes, setDbVigilantes] = useState<any[] | null>(null);
  const [dbCondominios, setDbCondominios] = useState<any[]>([]);
  async function loadVigilantes() {
    try {
      const data = await apiJson<{ guards: any[] }>("/api/guards");
      setDbVigilantes(data.guards);
    } catch {
      setDbVigilantes(null);
    }
  }
  useEffect(() => {
    void loadVigilantes();
    apiJson<{ condominiums: any[] }>("/api/condominiums").then((data) => setDbCondominios(data.condominiums)).catch(() => setDbCondominios([]));
  }, []);
  async function createGuard(values: FormValues) {
    await apiJson("/api/guards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        phone: values.phone,
        registration: values.registration,
        shift: values.shift,
        condominiumId: values.condominiumId || null,
        password: values.password || "rondasmart-demo"
      })
    });
    await loadVigilantes();
  }
  const rows = dbVigilantes?.map((v, index) => ({
    id: index + 1,
    nome: v.name,
    telefone: v.phone,
    condominio: v.condominiumName,
    turno: v.shift,
    status: v.status
  })) ?? vigilantes;
  return (
    <AdminLayout title="Vigilantes">
      <div className="mb-4 flex justify-end">
        <FormModal title="Cadastrar vigilante" button="Cadastrar Vigilante" submitLabel="Salvar vigilante" onSubmit={createGuard}>
          <Input name="name" placeholder="Nome" required />
          <Input name="email" placeholder="E-mail de acesso" type="email" required />
          <Input name="phone" placeholder="Telefone" />
          <Input name="registration" placeholder="Matricula" />
          <Select name="condominiumId" required>
            <option value="">Selecione o condominio</option>
            {dbCondominios.map((condominium) => <option key={condominium.id} value={condominium.id}>{condominium.name}</option>)}
          </Select>
          <Select name="shift">
            <option>07:00 - 19:00</option>
            <option>19:00 - 07:00</option>
          </Select>
          <Input name="password" placeholder="Senha inicial" defaultValue="rondasmart-demo" />
        </FormModal>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((v) => <Card key={v.nome}><CardContent><div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-full bg-slate-950 font-black text-white">{v.nome.split(" ").map((p: string) => p[0]).slice(0, 2)}</div><div className="flex-1"><p className="font-black">{v.nome}</p><p className="text-sm text-slate-500">{v.condominio}</p></div><StatusBadge status={v.status} /></div><div className="mt-4 grid gap-2 text-sm text-slate-500"><span className="flex gap-2"><Phone size={16} />{v.telefone}</span><span className="flex gap-2"><Radio size={16} />{v.turno}</span></div></CardContent></Card>)}
      </div>
    </AdminLayout>
  );
}

function QRPattern({ code = "RS-001", large = false }: { code?: string; large?: boolean }) {
  const size = large ? 224 : 96;
  return (
    <div className={cn("grid place-items-center rounded-lg bg-white p-2 ring-1 ring-slate-200", large ? "h-56 w-56" : "h-24 w-24")}>
      <QRCodeSVG value={code} size={size - 16} level="M" includeMargin bgColor="#ffffff" fgColor="#020617" />
    </div>
  );
}

export function PontosPage() {
  const [selectedQr, setSelectedQr] = useState<any | null>(null);
  const [dbPontos, setDbPontos] = useState<any[] | null>(null);
  const [dbCondominios, setDbCondominios] = useState<any[]>([]);
  async function loadPontos() {
    try {
      const data = await apiJson<{ checkpoints: any[] }>("/api/checkpoints");
      setDbPontos(data.checkpoints);
    } catch {
      setDbPontos(null);
    }
  }
  useEffect(() => {
    void loadPontos();
    apiJson<{ condominiums: any[] }>("/api/condominiums").then((data) => setDbCondominios(data.condominiums)).catch(() => setDbCondominios([]));
  }, []);
  async function createCheckpoint(values: FormValues) {
    await apiJson("/api/checkpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        condominiumId: values.condominiumId,
        name: values.name,
        location: values.location,
        qrToken: values.qrToken || undefined
      })
    });
    await loadPontos();
  }
  const rows = dbPontos?.map((p) => ({
    nome: p.name,
    localizacao: p.location,
    status: p.status,
    ultimaVisita: p.lastVisitAt ? new Date(p.lastVisitAt).toLocaleString("pt-BR") : "Sem visita",
    codigo: p.qrToken
  })) ?? pontos;
  return (
    <AdminLayout title="Pontos de ronda">
      <div className="mb-4 flex justify-end">
        <FormModal title="Novo ponto de ronda" button="Novo Ponto" submitLabel="Salvar ponto" onSubmit={createCheckpoint}>
          <Select name="condominiumId" required>
            <option value="">Selecione o condominio</option>
            {dbCondominios.map((condominium) => <option key={condominium.id} value={condominium.id}>{condominium.name}</option>)}
          </Select>
          <Input name="name" placeholder="Nome do ponto" required />
          <Input name="location" placeholder="Localizacao" required />
          <Input name="qrToken" placeholder="Codigo QR opcional, ex: RS-011" />
        </FormModal>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((p) => <Card key={p.nome}><CardContent><div className="flex gap-4"><QRPattern code={p.codigo} /><div className="flex-1"><p className="font-black">{p.nome}</p><p className="text-sm text-slate-500">{p.localizacao}</p><div className="mt-3"><StatusBadge status={p.status} /></div><p className="mt-2 text-xs font-semibold text-slate-400">Ultima visita: {p.ultimaVisita}</p><p className="mt-1 text-xs font-black text-blue-600">{p.codigo}</p></div></div><div className="mt-4 flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setSelectedQr(p)}>Ver detalhes</Button><Button className="flex-1" onClick={() => setSelectedQr(p)}><QrCode size={16} />Gerar QR</Button></div></CardContent></Card>)}
      </div>
      {selectedQr && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-soft">
            <div className="mx-auto flex justify-center"><QRPattern code={selectedQr.codigo} large /></div>
            <h2 className="mt-5 text-2xl font-black">{selectedQr.nome}</h2>
            <p className="mt-1 text-sm text-slate-500">QR Code demonstrativo gerado para o ponto de ronda.</p>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 font-mono text-sm font-black text-blue-600">{selectedQr.codigo}</div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setSelectedQr(null)}>Fechar</Button>
              <Button onClick={() => window.print()}>Imprimir QR</Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export function RondasPage() {
  const [dbRondas, setDbRondas] = useState<any[] | null>(null);
  useEffect(() => {
    fetch("/api/patrols").then((r) => (r.ok ? r.json() : null)).then((d) => setDbRondas(d?.patrols ?? null)).catch(() => setDbRondas(null));
  }, []);
  const rows = dbRondas?.map((r) => ({
    data: r.createdAt ? new Date(r.createdAt).toLocaleDateString("pt-BR") : "-",
    vigilante: r.guardName ?? "-",
    condominio: r.condominiumName,
    ronda: r.name,
    inicio: r.startedAt ? new Date(r.startedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "-",
    fim: r.finishedAt ? new Date(r.finishedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "-",
    pontos: String(r.completedCheckpoints ?? 0),
    ocorrencias: 0,
    status: r.status
  })) ?? rondas.slice(0, 12);
  return (
    <AdminLayout title="Monitoramento de rondas">
      <Filters labels={["Condominio", "Vigilante", "Status", "Data"]} />
      <div className="mt-5 grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <Card><CardHeader><h2 className="font-black">Timeline da ronda</h2></CardHeader><CardContent><Timeline items={timeline} /></CardContent></Card>
        <Card><CardHeader><h2 className="font-black">Tempo real</h2></CardHeader><CardContent><MockMap /><div className="mt-4 grid gap-3 md:grid-cols-4"><MiniStat label="Vigilante" value="Joao" /><MiniStat label="Tempo" value="52 min" /><MiniStat label="Visitados" value="7" /><MiniStat label="Pendentes" value="3" /></div></CardContent></Card>
      </div>
      <Card className="mt-5"><Table headers={["Data", "Vigilante", "Condominio", "Ronda", "Inicio", "Fim", "Pontos", "Ocorrencias", "Status"]} rows={rows.map((r) => [r.data, r.vigilante, r.condominio, r.ronda, r.inicio, r.fim, r.pontos, r.ocorrencias, <StatusBadge key={r.ronda} status={r.status} />])} /></Card>
    </AdminLayout>
  );
}

function Timeline({ items }: { items: string[] }) {
  return <div className="space-y-4">{items.map((item, index) => <div key={item} className="flex gap-3"><div className="mt-1 h-4 w-4 rounded-full bg-blue-600 ring-4 ring-blue-100" /><p className="text-sm font-semibold text-slate-600">{item}</p></div>)}</div>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>;
}

function Filters({ labels }: { labels: string[] }) {
  return <Card><CardContent className="grid gap-3 md:grid-cols-4">{labels.map((label) => <Select key={label}><option>{label}</option></Select>)}</CardContent></Card>;
}

export function OcorrenciasPage() {
  const [dbOcorrencias, setDbOcorrencias] = useState<any[] | null>(null);
  useEffect(() => {
    fetch("/api/incidents").then((r) => (r.ok ? r.json() : null)).then((d) => setDbOcorrencias(d?.incidents ?? null)).catch(() => setDbOcorrencias(null));
  }, []);
  const rows = dbOcorrencias?.map((o) => ({
    id: o.id,
    tipo: o.type,
    local: o.location,
    descricao: o.description,
    data: o.createdAt ? new Date(o.createdAt).toLocaleString("pt-BR") : "-",
    responsavel: o.guardName ?? "-",
    status: o.status
  })) ?? ocorrencias;
  return (
    <AdminLayout title="Ocorrencias">
      <Filters labels={["Condominio", "Tipo", "Status", "Data"]} />
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((o) => <Card key={o.id} className={o.tipo.includes("Emergencia") ? "border-red-200" : ""}><div className="h-36 rounded-t-lg bg-[linear-gradient(135deg,#e2e8f0,#f8fafc)]"><div className="flex h-full items-center justify-center text-slate-400"><Camera size={34} /></div></div><CardContent><div className="flex items-start justify-between gap-2"><h3 className="font-black">{o.tipo}</h3><StatusBadge status={o.status} /></div><p className="mt-2 text-sm text-slate-500">{o.descricao}</p><div className="mt-4 space-y-1 text-sm font-medium text-slate-600"><p>{o.local}</p><p>{o.data}</p><p>{o.responsavel}</p></div></CardContent></Card>)}
      </div>
    </AdminLayout>
  );
}

export function RelatoriosPage() {
  const { toast, show } = useToast();
  return (
    <AdminLayout title="Relatorios">
      <ToastView toast={toast} />
      <Card><CardContent className="grid gap-3 md:grid-cols-5"><Select><option>Condominio</option></Select><Select><option>Vigilante</option></Select><Input type="date" /><Input type="date" /><Select><option>Status da ronda</option></Select></CardContent></Card>
      <div className="mt-5 grid gap-4 md:grid-cols-4"><MiniStat label="Total de rondas" value="50" /><MiniStat label="Media de duracao" value="58 min" /><MiniStat label="Pontos verificados" value="438" /><MiniStat label="Ocorrencias abertas" value="7" /></div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={() => show({ title: "Relatorio gerado", text: "Relatorio gerado com sucesso para demonstracao." })}><Download size={16} />Exportar PDF</Button>
        <Button variant="outline" onClick={() => show({ title: "Relatorio gerado", text: "Relatorio gerado com sucesso para demonstracao." })}><FileSpreadsheet size={16} />Exportar Excel</Button>
        <Button variant="outline" onClick={() => show({ title: "Relatorio enviado", text: "Relatorio gerado com sucesso para demonstracao." })}><Mail size={16} />Enviar por e-mail</Button>
      </div>
      <Card className="mt-5"><Table headers={["Data", "Vigilante", "Condominio", "Ronda", "Inicio", "Fim", "Pontos concluidos", "Ocorrencias", "Status"]} rows={rondas.slice(0, 14).map((r) => [r.data, r.vigilante, r.condominio, r.ronda, r.inicio, r.fim, r.pontos, r.ocorrencias, <StatusBadge key={r.ronda} status={r.status} />])} /></Card>
    </AdminLayout>
  );
}

function MobileShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const items = [
    { href: "/mobile/home", label: "Inicio", icon: Home },
    { href: "/mobile/ronda", label: "Rondas", icon: Radio },
    { href: "/mobile/ocorrencia", label: "Ocorrencias", icon: ShieldAlert },
    { href: "/mobile/perfil", label: "Perfil", icon: User }
  ];
  return (
    <main className="min-h-screen bg-slate-950 py-0 text-slate-950 sm:py-6">
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-slate-50 shadow-2xl sm:min-h-[860px] sm:overflow-hidden sm:rounded-[32px]">
        <header className="bg-slate-950 px-5 pb-5 pt-8 text-white">
          <div className="flex items-center justify-between">
            <Link href="/login"><ArrowLeft size={20} /></Link>
            <p className="font-black">{title}</p>
            <Bell size={20} />
          </div>
        </header>
        <section className="px-4 py-5 pb-24">{children}</section>
        <nav className="fixed inset-x-0 bottom-0 mx-auto grid max-w-[430px] grid-cols-4 border-t border-slate-200 bg-white px-2 py-2 sm:absolute">
          {items.map((item) => {
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-bold text-slate-400", pathname === item.href && "bg-blue-50 text-blue-600")}><Icon size={20} />{item.label}</Link>;
          })}
        </nav>
      </div>
      <InstallBanner />
    </main>
  );
}

export function MobileHome() {
  const router = useRouter();
  const { toast, show } = useToast();
  const [starting, setStarting] = useState(false);

  async function startPatrol() {
    setStarting(true);
    try {
      await apiJson("/api/patrols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Ronda iniciada pelo app" })
      });
      localStorage.removeItem("ronda-smart-scanned");
      router.push("/mobile/ronda");
    } catch (err) {
      show({ title: "Falha ao iniciar", text: err instanceof Error ? err.message : "Tente novamente." });
    } finally {
      setStarting(false);
    }
  }

  return (
    <MobileShell title="Inicio">
      <ToastView toast={toast} />
      <div className="space-y-4">
        <div><p className="text-sm font-bold text-blue-600">Ola, Joao</p><h1 className="text-2xl font-black">Status: Em Servico</h1></div>
        <Card><CardContent><p className="text-sm text-slate-500">Condominio atual</p><p className="text-xl font-black">Condominio Jardim America</p><p className="mt-3 text-sm font-semibold text-slate-500">Turno: 07:00 as 19:00</p><p className="text-sm font-semibold text-blue-600">Proxima ronda: 09:00</p></CardContent></Card>
        <Button size="lg" className="w-full py-6 text-lg" onClick={startPatrol} disabled={starting}>
          {starting ? <Loader2 className="animate-spin" /> : <Radio />}
          Iniciar Ronda
        </Button>
        <Card><CardContent><p className="font-black">Escala do dia</p><p className="mt-2 text-sm text-slate-500">Portaria, blocos, garagem e areas comuns a cada 60 minutos.</p></CardContent></Card>
        <Card><CardContent><p className="font-black">Avisos</p><p className="mt-2 text-sm text-slate-500">Teste mensal do botao de panico liberado para demonstracao.</p></CardContent></Card>
      </div>
    </MobileShell>
  );
}

export function MobileRonda() {
  const { toast, show } = useToast();
  const router = useRouter();
  const [scanned, setScanned] = useState<string[]>([]);
  const [rondaData, setRondaData] = useState<MobileRondaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  async function loadRonda() {
    setLoading(true);
    try {
      const data = await apiJson<MobileRondaData>("/api/mobile/ronda");
      setRondaData(data);
      const visited = data.checkpoints.filter((item) => item.visitedAt).map((item) => item.name);
      localStorage.setItem("ronda-smart-scanned", JSON.stringify(visited));
      setScanned(visited);
    } catch {
      setScanned(JSON.parse(localStorage.getItem("ronda-smart-scanned") ?? "[]") as string[]);
      setRondaData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadRonda(); }, []);

  async function finishPatrol() {
    setFinishing(true);
    try {
      await apiJson("/api/patrols/finish", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      localStorage.removeItem("ronda-smart-scanned");
      setScanned([]);
      setRondaData((current) => current ? { ...current, patrol: current.patrol ? { ...current.patrol, status: "Finalizada" } : null } : current);
      show({ title: "Ronda finalizada", text: "Status sincronizado com a central." });
    } catch (err) {
      show({ title: "Nao foi possivel finalizar", text: err instanceof Error ? err.message : "Tente novamente." });
    } finally {
      setFinishing(false);
    }
  }

  const checklist = rondaData?.checkpoints.length
    ? rondaData.checkpoints.map((item) => ({
        label: item.name,
        location: item.location,
        qrToken: item.qrToken,
        done: Boolean(item.visitedAt) || scanned.includes(item.name)
      }))
    : mobileChecklist.map((item) => ({ ...item, location: null, qrToken: "", done: item.done || scanned.includes(item.label) }));
  const doneCount = checklist.filter((item) => item.done).length;
  const progress = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0;
  const currentPatrol = rondaData?.patrol;
  return (
    <MobileShell title="Ronda em execucao">
      <ToastView toast={toast} />
      <div className="space-y-4">
        <Card><CardContent><div className="flex justify-between gap-3"><div><p className="text-sm text-slate-500">{currentPatrol?.condominiumName ?? "Condominio Jardim America"}</p><h1 className="text-2xl font-black">{currentPatrol?.name ?? "Ronda em andamento"}</h1></div><StatusBadge status={currentPatrol?.status ?? "Em andamento"} /></div><div className="mt-4 h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-sm font-semibold text-slate-500">{loading ? "Carregando pontos..." : `${doneCount} concluidos, ${checklist.length - doneCount} pendentes`}</p></CardContent></Card>
        <Card><CardContent className="space-y-3">{checklist.map((item) => <div key={item.label} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 font-semibold"><span className={cn("grid h-6 w-6 place-items-center rounded-full", item.done ? "bg-green-500 text-white" : "bg-white text-slate-400 ring-1 ring-slate-200")}>{item.done ? <Check size={14} /> : "o"}</span><span className="flex-1"><span className="block">{item.label}</span>{item.qrToken && <span className="block text-xs font-bold text-blue-600">{item.qrToken}</span>}</span></div>)}</CardContent></Card>
        <div className="grid grid-cols-2 gap-3"><Link href="/mobile/scanner"><Button className="w-full"><ScanLine size={16} />Escanear QR</Button></Link><Link href="/mobile/foto"><Button variant="outline" className="w-full"><Camera size={16} />Foto</Button></Link><Link href="/mobile/ocorrencia"><Button variant="outline" className="w-full"><ShieldAlert size={16} />Ocorrencia</Button></Link><Button variant="secondary" onClick={finishPatrol} disabled={finishing || !currentPatrol}>{finishing ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}Finalizar</Button></div>
        {!currentPatrol && !loading && <Button className="w-full" onClick={() => router.push("/mobile/home")}><Radio size={16} />Iniciar nova ronda</Button>}
        <Link href="/mobile/panico"><Button variant="danger" className="w-full"><Siren size={18} />Botao de panico</Button></Link>
      </div>
    </MobileShell>
  );
}

function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraState, setCameraState] = useState<"idle" | "loading" | "on" | "fallback">("idle");
  const [cameraError, setCameraError] = useState("");

  async function startCamera() {
    setCameraState("loading");
    setCameraError("");
    try {
      if (!window.isSecureContext) {
        throw new Error("A camera em tempo real exige HTTPS no celular. Use o campo manual ou uma foto do QR Code por enquanto.");
      }
      const stream = await navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      if (!stream || !videoRef.current) throw new Error("Camera indisponivel");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraState("on");
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : "Nao foi possivel abrir a camera neste navegador.");
      setCameraState("fallback");
    }
  }

  function stopCamera() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
  }

  useEffect(() => stopCamera, []);
  return { videoRef, cameraState, cameraError, startCamera };
}

export function MobileScanner() {
  const { toast, show } = useToast();
  const router = useRouter();
  const { videoRef, cameraState, cameraError, startCamera } = useCamera();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerCanvasRef = useRef<HTMLCanvasElement>(null);
  const scanningRef = useRef(false);
  const [qrToken, setQrToken] = useState("RS-006");
  const [validating, setValidating] = useState(false);
  const [lastScan, setLastScan] = useState<{ checkpointName: string; completed: number; total: number; patrolId: string } | null>(null);

  async function validateQr(nextToken = qrToken) {
    const token = nextToken.trim().toUpperCase();
    if (!token) {
      show({ title: "Informe o QR Code", text: "Digite ou capture o codigo do ponto de ronda." });
      return;
    }
    try {
      setValidating(true);
      const response = await fetch("/api/mobile/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: token, notes: "Leitura registrada pelo scanner mobile" })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao validar QR Code.");
      }
      const data = await response.json();
      const checkpointName = data.checkpoint?.name ?? "Garagem G1";
      const visitedNames = Array.isArray(data.visits)
        ? data.visits.filter((visit: any) => visit.visitedAt).map((visit: any) => String(visit.name))
        : [checkpointName];
      const next = Array.from(new Set(visitedNames));
      localStorage.setItem("ronda-smart-scanned", JSON.stringify(next));
      scanningRef.current = true;
      setLastScan({
        checkpointName,
        completed: next.length,
        total: Array.isArray(data.visits) ? data.visits.length : next.length,
        patrolId: data.patrolId
      });
      show({ title: "QR Code validado", text: `${checkpointName} concluido e sincronizado com a central.` });
    } catch (err) {
      scanningRef.current = false;
      show({ title: "Leitura nao enviada", text: err instanceof Error ? err.message : "Tente novamente." });
    } finally {
      setValidating(false);
    }
  }

  useEffect(() => {
    if (cameraState !== "on") return;
    let active = true;

    async function scanFrame() {
      if (!active || scanningRef.current || !videoRef.current || !scannerCanvasRef.current) return;
      try {
        const video = videoRef.current;
        const canvas = scannerCanvasRef.current;
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (width < 80 || height < 80) {
          window.requestAnimationFrame(scanFrame);
          return;
        }

        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context?.drawImage(video, 0, 0, width, height);
        const imageData = context?.getImageData(0, 0, width, height);
        const rawValue = imageData ? String(jsQR(imageData.data, width, height)?.data ?? "").trim() : "";
        if (rawValue) {
          scanningRef.current = true;
          setQrToken(rawValue);
          await validateQr(rawValue);
          window.setTimeout(() => { scanningRef.current = false; }, 1800);
        }
      } catch {
        // O proximo frame tenta novamente; isso evita travar a camera em leituras ruins.
      }
      if (active) window.requestAnimationFrame(scanFrame);
    }

    window.requestAnimationFrame(scanFrame);
    return () => { active = false; };
  }, [cameraState]);

  async function readQrFromFile(file: File) {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Nao foi possivel abrir a imagem."));
        reader.readAsDataURL(file);
      });
      const rawValue = await new Promise<string>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          context?.drawImage(image, 0, 0);
          const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);
          const value = imageData ? String(jsQR(imageData.data, canvas.width, canvas.height)?.data ?? "").trim() : "";
          resolve(value);
        };
        image.onerror = () => reject(new Error("Nao foi possivel ler a foto."));
        image.src = dataUrl;
      });
      if (!rawValue) throw new Error("Nenhum QR Code encontrado na imagem.");
      setQrToken(rawValue);
      await validateQr(rawValue);
    } catch (err) {
      show({ title: "QR nao encontrado", text: err instanceof Error ? err.message : "Tente outra foto ou digite o codigo." });
    }
  }

  return (
    <MobileShell title="Scanner QR Code">
      <ToastView toast={toast} />
      <div className="space-y-4">
        <div className="relative h-80 overflow-hidden rounded-lg bg-slate-900">
          <video ref={videoRef} muted playsInline className={cn("absolute inset-0 h-full w-full object-cover", cameraState !== "on" && "hidden")} />
          {cameraState !== "on" && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(37,99,235,.35),transparent_36%),linear-gradient(135deg,#020617,#1e293b)]" />}
          <div className="absolute inset-8 rounded-lg border-2 border-blue-400" />
          {cameraState === "on" && <div className="scan-line absolute left-10 right-10 top-10 h-1 rounded-full bg-blue-400" />}
          <div className="absolute inset-x-6 bottom-8 text-center text-sm font-semibold text-white">{cameraState === "on" ? "Aponte para o QR Code do ponto de ronda" : "Abra a camera ou informe o codigo do QR Code"}</div>
          <div className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">{cameraState === "on" ? "Camera ativa" : cameraState === "loading" ? "Abrindo camera" : "Leitura manual"}</div>
        </div>
        {cameraError && <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-700">{cameraError}</p>}
        {lastScan && (
          <Card className="border-green-200 bg-green-50">
            <CardContent>
              <div className="flex gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500 text-white"><Check size={20} /></div>
                <div className="flex-1">
                  <p className="font-black text-green-900">{lastScan.checkpointName} validado</p>
                  <p className="mt-1 text-sm font-semibold text-green-700">{lastScan.completed} de {lastScan.total} pontos concluidos nesta ronda.</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => { setLastScan(null); scanningRef.current = false; }}>Ler outro</Button>
                <Button onClick={() => router.push("/mobile/ronda")}>Continuar</Button>
              </div>
            </CardContent>
          </Card>
        )}
        <Input value={qrToken} onChange={(event) => setQrToken(event.target.value.toUpperCase())} placeholder="Codigo QR, ex: RS-006" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void readQrFromFile(file);
            event.currentTarget.value = "";
          }}
        />
        <canvas ref={scannerCanvasRef} className="hidden" />
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={startCamera} disabled={cameraState === "loading"}>{cameraState === "loading" ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}Abrir camera</Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Camera size={16} />Foto do QR</Button>
          <Button className="col-span-2" onClick={() => validateQr()} disabled={validating}>{validating ? <Loader2 className="animate-spin" size={16} /> : <QrCode size={16} />}Validar codigo</Button>
        </div>
        <Link href="/mobile/ronda"><Button variant="secondary" className="w-full">Voltar para checklist</Button></Link>
      </div>
    </MobileShell>
  );
}

export function MobileFoto() {
  const [captured, setCaptured] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const { toast, show } = useToast();
  const { videoRef, cameraState, cameraError, startCamera } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  function capturePhoto() {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video && cameraState === "on") {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      setPhoto(canvas.toDataURL("image/png"));
      setCaptured(true);
      return;
    }
    show({ title: "Camera nao ativa", text: "Abra a camera primeiro ou use HTTPS para permitir captura em tempo real." });
  }
  return (
    <MobileShell title="Registro de foto">
      <ToastView toast={toast} />
      <div className="space-y-4 text-center">
        <div className={cn("relative grid h-80 overflow-hidden rounded-lg", captured ? "bg-[linear-gradient(135deg,#bfdbfe,#f8fafc)]" : "bg-slate-900 text-white")}>
          {photo ? <img src={photo} alt="Foto capturada" className="h-full w-full object-cover" /> : <video ref={videoRef} muted playsInline className={cn("h-full w-full object-cover", cameraState !== "on" && "hidden")} />}
          {!photo && cameraState !== "on" && <div className="grid place-items-center"><div><Camera className="mx-auto" size={48} /><p className="mt-3 font-semibold">Capture uma evidencia do local</p><p className="mt-2 text-xs text-slate-300">A camera em tempo real pode exigir HTTPS no celular.</p></div></div>}
        </div>
        {cameraError && <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-700">{cameraError}</p>}
        <canvas ref={canvasRef} className="hidden" />
        <Button variant="outline" className="w-full" onClick={startCamera} disabled={cameraState === "loading"}>{cameraState === "loading" ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}Abrir camera</Button>
        <button onClick={capturePhoto} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white ring-8 ring-slate-200"><span className="h-14 w-14 rounded-full bg-blue-600" /></button>
        <Button className="w-full" disabled={!captured} onClick={() => show({ title: "Foto anexada", text: "Foto anexada a ronda." })}>Usar Foto</Button>
      </div>
    </MobileShell>
  );
}

export function MobileOcorrencia() {
  const { toast, show } = useToast();
  const [type, setType] = useState("Portao aberto");
  const [location, setLocation] = useState("Garagem G1");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Media");
  const [loading, setLoading] = useState(false);

  async function registerIncident() {
    setLoading(true);
    try {
      await apiJson("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, location, description, priority })
      });
      setDescription("");
      show({ title: "Ocorrencia enviada", text: "Ocorrencia registrada e enviada para a central." });
    } catch (err) {
      show({ title: "Falha no envio", text: err instanceof Error ? err.message : "Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell title="Registrar ocorrencia">
      <ToastView toast={toast} />
      <div className="space-y-3">
        <Select value={type} onChange={(event) => setType(event.target.value)}>
          <option>Portao aberto</option>
          <option>Pessoa suspeita</option>
          <option>Equipamento danificado</option>
          <option>Lampada queimada</option>
          <option>Vazamento</option>
        </Select>
        <Input placeholder="Local" value={location} onChange={(event) => setLocation(event.target.value)} />
        <Textarea placeholder="Descricao" value={description} onChange={(event) => setDescription(event.target.value)} />
        <Button variant="outline" className="w-full" onClick={() => show({ title: "Foto pronta", text: "Use a tela Foto para capturar evidencia antes de registrar." })}><Camera size={16} />Anexar foto</Button>
        <Select value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option>Baixa</option>
          <option>Media</option>
          <option>Alta</option>
          <option>Emergencia</option>
        </Select>
        <Button className="w-full" size="lg" onClick={registerIncident} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldAlert size={18} />}
          Registrar Ocorrencia
        </Button>
      </div>
    </MobileShell>
  );
}

export function MobilePanico() {
  const { toast, show } = useToast();
  const [confirm, setConfirm] = useState(false);
  return (
    <MobileShell title="Emergencia">
      <ToastView toast={toast} />
      <div className="space-y-5 text-center">
        <AlertTriangle className="mx-auto text-red-500" size={42} />
        <p className="text-sm font-semibold text-slate-500">Use apenas em situacoes reais de risco.</p>
        <button onClick={() => setConfirm(true)} className="pulse-soft mx-auto grid h-56 w-56 place-items-center rounded-full bg-red-500 text-2xl font-black text-white shadow-soft">ACIONAR<br />EMERGENCIA</button>
        {confirm && <Card><CardContent><p className="font-black">Confirmar envio?</p><p className="mt-2 text-sm text-slate-500">A central de monitoramento sera avisada imediatamente.</p><div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setConfirm(false)}>Cancelar</Button><Button variant="danger" onClick={async () => { setConfirm(false); const response = await fetch("/api/mobile/panic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "Garagem G1" }) }); show(response.ok ? { title: "Alerta enviado", text: "Alerta enviado para a central de monitoramento." } : { title: "Falha no alerta", text: "Nao foi possivel enviar para a central." }); }}>Enviar</Button></div></CardContent></Card>}
      </div>
    </MobileShell>
  );
}

export function MobilePerfil() {
  return (
    <MobileShell title="Perfil">
      <div className="space-y-4 text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-slate-950 text-3xl font-black text-white">JP</div>
        <div><h1 className="text-2xl font-black">Joao Pereira</h1><p className="text-sm text-slate-500">Matricula RS-0042</p></div>
        <Card><CardContent className="space-y-3 text-left text-sm font-semibold text-slate-600"><p>Telefone: 31 99910-1010</p><p>Condominio atual: Jardim America</p><p>Turno: 07:00 as 19:00</p><p>Status: Em Servico</p></CardContent></Card>
        <LogoutButton className="w-full" />
      </div>
    </MobileShell>
  );
}
