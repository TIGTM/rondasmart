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
  FileSignature,
  Home,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  Plus,
  Printer,
  QrCode,
  Radio,
  ScanLine,
  Search,
  Shield,
  ShieldAlert,
  Siren,
  Smartphone,
  User,
  UserCog,
  UserCheck,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/form";
import {
  kpis,
  navAdmin,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Toast = { title: string; text: string; tone?: "success" | "error" | "warning" };
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
const PENDING_PHOTO_KEY = "ronda-smart-pending-photo";
type PatrolRow = {
  id: string;
  createdAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  guardName?: string | null;
  condominiumName: string;
  name: string;
  status: string;
  completedCheckpoints: number;
  totalCheckpoints: number;
  incidentsCount: number;
  visitEvents?: Array<{ visitedAt: string; checkpointName: string }>;
  incidentEvents?: Array<{ createdAt: string; type: string; location?: string | null }>;
};

async function apiJson<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Nao foi possivel concluir a operacao.");
  return data as T;
}

function normalizeQrCode(value: string) {
  let clean = String(value ?? "").trim();
  try {
    const url = new URL(clean);
    clean = url.searchParams.get("qr") ?? url.searchParams.get("code") ?? url.searchParams.get("token") ?? url.pathname.split("/").filter(Boolean).pop() ?? clean;
  } catch {
    // O valor normal geralmente e o proprio codigo impresso no QR.
  }
  return clean.replace(/\s+/g, "").toUpperCase();
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
  const error = toast.tone === "error";
  const warning = toast.tone === "warning";
  const Icon = error || warning ? AlertTriangle : Check;
  return (
    <div className={cn("fixed left-3 right-3 top-4 z-50 mx-auto max-w-sm rounded-lg border bg-white p-4 shadow-soft", error ? "border-red-200" : warning ? "border-amber-200" : "border-slate-200")}>
      <div className="flex gap-3">
        <div className={cn("mt-0.5 rounded-full p-1", error ? "bg-red-100 text-red-600" : warning ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600")}>
          <Icon size={16} />
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

function InstallBanner({ aboveNavigation = false }: { aboveNavigation?: boolean }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setVisible(mobile && !standalone);
  }, []);
  if (!visible) return null;
  return (
    <div className={cn("fixed inset-x-3 z-40 rounded-lg bg-slate-950 p-3 text-white shadow-soft md:hidden", aboveNavigation ? "bottom-24" : "bottom-3")}>
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function enter() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao entrar.");
      router.push(data.user.role === "GUARD" ? "/mobile/home" : data.user.role === "SUPER_ADMIN" ? "/master/clientes" : "/admin/dashboard");
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
            <div className="space-y-3">
              <Input value={email} onChange={(event) => setEmail(event.target.value)} aria-label="E-mail" autoComplete="email" />
              <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" aria-label="Senha" autoComplete="current-password" />
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
            <div className="flex justify-between gap-4 text-sm font-medium text-blue-600">
              <button type="button" onClick={() => show({ title: "Recuperacao de acesso", text: "Solicite a redefinicao ao administrador da sua empresa." })}>Esqueci minha senha</button>
              <button type="button" onClick={() => show({ title: "Solicitacao de acesso", text: "Peça ao administrador da sua empresa para criar seu usuario." })}>Solicitar acesso</button>
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
                <p className="mt-8 text-2xl font-black">Operacao online</p>
                <p className="text-sm text-slate-300">rondas sincronizadas</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur">
                <MapPin className="text-green-300" />
                <p className="mt-8 text-2xl font-black">QR seguro</p>
                <p className="text-sm text-slate-300">pontos rastreaveis</p>
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

export function AdminLayout({ title, children }: { title: string; children: React.ReactNode }) {
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
          <aside className="relative h-full w-80 max-w-[86vw] overflow-y-auto border-r border-slate-200 bg-white p-5 shadow-2xl">
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
              <Link href="/admin/ocorrencias"><Button variant="outline" size="icon" aria-label="Ver ocorrencias"><Bell size={18} /></Button></Link>
              <LogoutButton className="hidden sm:inline-flex" />
              <LogoutButton compact className="sm:hidden" />
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

function SimpleChart({ values }: { values: Array<{ label: string; total: number }> }) {
  const maximum = Math.max(1, ...values.map((item) => item.total));
  return (
    <div className="flex h-56 items-end gap-3">
      {values.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-black text-slate-600">{item.total}</span>
          <div className="min-h-1 w-full rounded-t-md bg-blue-600" style={{ height: `${Math.max(4, (item.total / maximum) * 160)}px` }} />
          <span className="text-xs font-semibold text-slate-400">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="grid min-h-32 place-items-center rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-400">{text}</div>;
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
      checkpoints: number;
    };
    weekly?: Array<{ label: string; total: number }>;
    activities?: Array<{ title: string; location: string; status: string }>;
    alerts?: Array<{ title: string; text?: string | null; priority: string; status: string }>;
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

  const recentActivities = dashboard?.activities ?? [];
  const activeAlerts = dashboard?.alerts ?? [];
  const featuredAlert = activeAlerts[0];
  const weeklyValues = dashboard?.weekly ?? Array.from({ length: 7 }, (_, index) => ({ label: String(index + 1), total: 0 }));

  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{dashboardKpis.map((item) => <KpiCard key={item.label} item={item} />)}</div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <Card>
          <CardHeader><h2 className="font-black">Rondas da semana</h2></CardHeader>
          <CardContent><SimpleChart values={weeklyValues} /></CardContent>
        </Card>
        <Card className={featuredAlert ? "border-red-200 bg-red-50" : ""}>
          <CardContent>
            {featuredAlert ? (
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-red-500 p-3 text-white"><Siren /></div>
                <div>
                  <p className="text-sm font-black uppercase text-red-600">Alerta em destaque</p>
                  <h2 className="mt-2 text-2xl font-black">{featuredAlert.title}</h2>
                  <p className="mt-2 text-sm text-red-700">{featuredAlert.text || `Status: ${featuredAlert.status}`}</p>
                </div>
              </div>
            ) : <EmptyState text="Nenhum alerta aberto para esta empresa." />}
          </CardContent>
        </Card>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader><h2 className="font-black">Status operacional</h2></CardHeader>
          <CardContent className="space-y-4">
            {activeAlerts.length ? activeAlerts.map((alert) => (
              <div key={`${alert.title}-${alert.status}`} className="flex gap-3">
                <AlertTriangle className="text-amber-600" size={20} />
                <div><p className="font-bold">{alert.title}</p><p className="text-sm text-slate-500">{alert.text || `Prioridade ${alert.priority} - ${alert.status}`}</p></div>
              </div>
            )) : <EmptyState text="Operacao sem alertas abertos." />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="font-black">Ultimas atividades</h2></CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.length ? recentActivities.map((activity, index) => <p key={`${activity.title}-${index}`} className="rounded-lg bg-slate-50 p-3 text-sm font-medium text-slate-600">{activity.title} - {activity.location || "Sem local"} ({activity.status})</p>) : <EmptyState text="Nenhuma atividade registrada." />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="font-black">Pontos cadastrados</h2></CardHeader>
          <CardContent><div className="grid min-h-64 place-items-center rounded-lg bg-slate-50 text-center"><div><MapPin className="mx-auto text-blue-600" size={36} /><p className="mt-3 text-4xl font-black">{dashboard?.kpis?.checkpoints ?? 0}</p><p className="mt-1 text-sm font-semibold text-slate-500">pontos de ronda nesta operacao</p></div></div></CardContent>
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
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-4">
          <form onSubmit={submit} className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-soft">
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

export function MasterLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const masterLinks = [
    { href: "/master/clientes", label: "Clientes", icon: BuildingIcon },
    { href: "/master/contratos", label: "Contratos", icon: FileSignature },
    { href: "/master/usuarios", label: "Usuarios", icon: UserCog },
    { href: "/admin/dashboard", label: "Operacao", icon: Radio }
  ];
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white p-5 lg:block">
        <Logo />
        <nav className="mt-8 space-y-1">
          {masterLinks.map((item) => {
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold", pathname === item.href ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100")}><Icon size={18} />{item.label}</Link>;
          })}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-blue-600">Painel master</p>
              <h1 className="text-xl font-black tracking-tight md:text-2xl">{title}</h1>
            </div>
            <LogoutButton className="hidden sm:inline-flex" />
            <LogoutButton compact className="sm:hidden" />
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {masterLinks.map((item) => <Link key={item.href} href={item.href} className={cn("whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold", pathname === item.href ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600")}>{item.label}</Link>)}
          </nav>
        </header>
        <main className="p-4 md:p-7">{children}</main>
      </div>
    </div>
  );
}

function BuildingIcon({ size = 18 }: { size?: number }) {
  return <Home size={size} />;
}

export function MasterClientesPage() {
  const { toast, show } = useToast();
  const [companies, setCompanies] = useState<any[]>([]);

  async function loadCompanies() {
    const data = await apiJson<{ companies: any[] }>("/api/platform/companies");
    setCompanies(data.companies);
  }

  useEffect(() => { void loadCompanies().catch(() => setCompanies([])); }, []);

  async function createCompany(values: FormValues) {
    await apiJson("/api/platform/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        document: values.document,
        contactName: values.contactName,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        plan: values.plan,
        adminName: values.adminName,
        adminEmail: values.adminEmail,
        adminPassword: values.adminPassword
      })
    });
    show({ title: "Cliente cadastrado", text: "Cliente e usuario administrador criados com sucesso." });
    await loadCompanies();
  }

  return (
    <MasterLayout title="Clientes da plataforma">
      <ToastView toast={toast} />
      <div className="mb-4 flex justify-end">
        <FormModal title="Novo cliente SaaS" button="Cadastrar Cliente" submitLabel="Salvar cliente" onSubmit={createCompany}>
          <Input name="name" placeholder="Nome da empresa cliente" required />
          <Input name="document" placeholder="CNPJ/Documento" />
          <Input name="contactName" placeholder="Contato principal" />
          <Input name="contactEmail" placeholder="E-mail do contato" type="email" />
          <Input name="contactPhone" placeholder="Telefone" />
          <Select name="plan" defaultValue="Profissional">
            <option>Essencial</option>
            <option>Profissional</option>
            <option>Enterprise</option>
          </Select>
          <div className="my-2 border-t border-slate-100 pt-3 text-sm font-black text-slate-500">Administrador do cliente</div>
          <Input name="adminName" placeholder="Nome do admin do cliente" required />
          <Input name="adminEmail" placeholder="E-mail de acesso" type="email" required />
          <Input name="adminPassword" placeholder="Senha inicial (minimo 8 caracteres)" type="password" minLength={8} required />
        </FormModal>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {companies.map((company) => (
          <Card key={company.id}>
            <CardContent>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">{company.name}</h2>
                  <p className="text-sm font-semibold text-slate-500">{company.document ?? "Sem documento"}</p>
                </div>
                <StatusBadge status={company.status} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniStat label="Plano" value={company.plan} />
                <MiniStat label="Condom." value={String(company.condominiumsCount ?? 0)} />
                <MiniStat label="Vigias" value={String(company.guardsCount ?? 0)} />
              </div>
              <div className="mt-4 space-y-1 text-sm font-semibold text-slate-500">
                <p>{company.contactName ?? "Contato nao informado"}</p>
                <p>{company.contactEmail ?? "E-mail nao informado"}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MasterLayout>
  );
}

export function CondominiosPage() {
  const [dbCondominios, setDbCondominios] = useState<any[]>([]);
  const [error, setError] = useState("");
  async function loadCondominios() {
    try {
      const data = await apiJson<{ condominiums: any[] }>("/api/condominiums");
      setDbCondominios(data.condominiums);
      setError("");
    } catch (err) {
      setDbCondominios([]);
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar os condominios.");
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
  const rows = dbCondominios.map((c) => ({
    nome: c.name,
    cidade: c.city,
    bairro: c.district,
    sindico: c.managerName,
    vigilantes: c.guardsCount,
    status: c.status
  }));
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
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
      <Card>{rows.length ? <Table headers={["Nome", "Cidade", "Bairro", "Sindico", "Vigilantes", "Status"]} rows={rows.map((c) => [c.nome, c.cidade, c.bairro, c.sindico, c.vigilantes, <StatusBadge key={c.nome} status={c.status} />])} /> : <CardContent><EmptyState text="Nenhum condominio cadastrado para esta empresa." /></CardContent>}</Card>
    </AdminLayout>
  );
}

function LogoutButton({ mobileMenuClose, className, compact = false }: { mobileMenuClose?: () => void; className?: string; compact?: boolean }) {
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
    <Button variant="outline" size={compact ? "icon" : "md"} className={className} onClick={logout} disabled={loading} aria-label={compact ? "Sair" : undefined}>
      {loading ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}
      {!compact && "Sair"}
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
  const [dbVigilantes, setDbVigilantes] = useState<any[]>([]);
  const [dbCondominios, setDbCondominios] = useState<any[]>([]);
  const [error, setError] = useState("");
  async function loadVigilantes() {
    try {
      const data = await apiJson<{ guards: any[] }>("/api/guards");
      setDbVigilantes(data.guards);
      setError("");
    } catch (err) {
      setDbVigilantes([]);
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar os vigilantes.");
    }
  }
  useEffect(() => {
    void loadVigilantes();
    apiJson<{ condominiums: any[] }>("/api/condominiums").then((data) => setDbCondominios(data.condominiums)).catch(() => setDbCondominios([]));
  }, []);
  async function createGuard(values: FormValues) {
    const role = values.role === "MANAGER" ? "MANAGER" : "GUARD";
    await apiJson("/api/guards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        role,
        phone: values.phone,
        registration: values.registration,
        shift: role === "MANAGER" ? "Supervisor" : values.shift,
        condominiumId: values.condominiumId || null,
        password: values.password
      })
    });
    await loadVigilantes();
  }
  const rows = dbVigilantes.map((v, index) => ({
    id: index + 1,
    nome: v.name,
    telefone: v.phone,
    perfil: v.role === "MANAGER" ? "Supervisor" : "Vigilante",
    condominio: v.condominiumName,
    turno: v.shift,
    status: v.status
  }));
  return (
    <AdminLayout title="Equipe operacional">
      <div className="mb-4 flex justify-end">
        <FormModal title="Cadastrar usuario operacional" button="Cadastrar Usuario" submitLabel="Salvar usuario" onSubmit={createGuard}>
          <Select name="role" required>
            <option value="GUARD">Vigilante</option>
            <option value="MANAGER">Supervisor</option>
          </Select>
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
          <Input name="password" placeholder="Senha inicial (minimo 8 caracteres)" type="password" minLength={8} required />
        </FormModal>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((v) => <Card key={v.nome}><CardContent><div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-full bg-slate-950 font-black text-white">{v.nome.split(" ").map((p: string) => p[0]).slice(0, 2)}</div><div className="flex-1"><p className="font-black">{v.nome}</p><p className="text-sm text-slate-500">{v.perfil}{v.condominio ? ` - ${v.condominio}` : ""}</p></div><StatusBadge status={v.status} /></div><div className="mt-4 grid gap-2 text-sm text-slate-500"><span className="flex gap-2"><Phone size={16} />{v.telefone || "Sem telefone"}</span><span className="flex gap-2"><Radio size={16} />{v.turno}</span></div></CardContent></Card>)}
        {!rows.length && <div className="md:col-span-2 xl:col-span-3"><EmptyState text="Nenhum usuario operacional cadastrado para esta empresa." /></div>}
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
  const [dbPontos, setDbPontos] = useState<any[]>([]);
  const [dbCondominios, setDbCondominios] = useState<any[]>([]);
  const [error, setError] = useState("");
  async function loadPontos() {
    try {
      const data = await apiJson<{ checkpoints: any[] }>("/api/checkpoints");
      setDbPontos(data.checkpoints);
      setError("");
    } catch (err) {
      setDbPontos([]);
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar os pontos.");
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
  const rows = dbPontos.map((p) => ({
    nome: p.name,
    localizacao: p.location,
    condominio: p.condominiumName,
    status: p.status,
    ultimaVisita: p.lastVisitAt ? new Date(p.lastVisitAt).toLocaleString("pt-BR") : "Sem visita",
    codigo: p.qrToken
  }));

  function printQr(point: { nome: string; localizacao?: string | null; condominio?: string | null; codigo: string }) {
    const svg = document.querySelector("[data-printable-qr] svg")?.outerHTML;
    if (!svg) return;
    const escape = (value?: string | null) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
    const popup = window.open("", "_blank", "width=720,height=900");
    if (!popup) return;
    popup.document.write(`<!doctype html>
      <html lang="pt-BR"><head><meta charset="utf-8"><title>QR ${escape(point.codigo)}</title>
      <style>
        @page{size:A4;margin:18mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#0f172a}
        .sheet{min-height:240mm;display:grid;place-items:center}.label{width:125mm;border:2px solid #0f172a;border-radius:8px;padding:12mm;text-align:center}
        .brand{font-size:15px;font-weight:700;color:#2563eb;text-transform:uppercase}.name{font-size:28px;font-weight:800;margin:8px 0}
        .meta{font-size:15px;color:#475569;margin:5px 0}.qr{display:flex;justify-content:center;margin:12mm 0}.qr svg{width:78mm;height:78mm}
        .code{font:700 20px monospace;letter-spacing:2px;background:#f1f5f9;padding:10px;border-radius:6px}
        .hint{font-size:12px;color:#64748b;margin-top:10px}
      </style></head><body><main class="sheet"><section class="label">
      <div class="brand">Ronda Smart</div><div class="name">${escape(point.nome)}</div>
      <div class="meta">${escape(point.condominio)}</div><div class="meta">${escape(point.localizacao)}</div>
      <div class="qr">${svg}</div><div class="code">${escape(point.codigo)}</div>
      <div class="hint">Aponte a camera do aplicativo Ronda Smart para validar este ponto.</div>
      </section></main><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
    popup.document.close();
  }

  function printAllQrs() {
    const qrNodes = Array.from(document.querySelectorAll("[data-qr-card] svg"));
    if (!rows.length || qrNodes.length < rows.length) return;
    const escape = (value?: string | null) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
    const labels = rows.map((point, index) => `<section class="label"><div class="brand">Ronda Smart</div><div class="name">${escape(point.nome)}</div><div class="meta">${escape(point.condominio)}</div><div class="meta">${escape(point.localizacao)}</div><div class="qr">${qrNodes[index].outerHTML}</div><div class="code">${escape(point.codigo)}</div></section>`).join("");
    const popup = window.open("", "_blank", "width=900,height=900");
    if (!popup) return;
    popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>QR Codes Ronda Smart</title>
      <style>@page{size:A4;margin:10mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#0f172a}.sheet{display:grid;grid-template-columns:1fr 1fr;gap:8mm}.label{min-height:132mm;border:1.5px solid #0f172a;border-radius:6px;padding:7mm;text-align:center;break-inside:avoid}.brand{font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase}.name{font-size:19px;font-weight:800;margin:5px 0}.meta{font-size:11px;color:#475569;margin:3px 0}.qr{display:flex;justify-content:center;margin:5mm 0}.qr svg{width:57mm;height:57mm}.code{font:700 15px monospace;letter-spacing:1px;background:#f1f5f9;padding:7px;border-radius:5px}</style>
      </head><body><main class="sheet">${labels}</main><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
    popup.document.close();
  }
  return (
    <AdminLayout title="Pontos de ronda">
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        {rows.length > 0 && <Button variant="outline" onClick={printAllQrs}><Printer size={16} />Imprimir todos</Button>}
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
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((p) => <Card key={p.nome}><CardContent><div className="flex gap-4"><div data-qr-card><QRPattern code={p.codigo} /></div><div className="flex-1"><p className="font-black">{p.nome}</p><p className="text-sm text-slate-500">{p.localizacao}</p><div className="mt-3"><StatusBadge status={p.status} /></div><p className="mt-2 text-xs font-semibold text-slate-400">Ultima visita: {p.ultimaVisita}</p><p className="mt-1 text-xs font-black text-blue-600">{p.codigo}</p></div></div><div className="mt-4 flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setSelectedQr(p)}>Ver detalhes</Button><Button className="flex-1" onClick={() => setSelectedQr(p)}><QrCode size={16} />Gerar QR</Button></div></CardContent></Card>)}
        {!rows.length && <div className="md:col-span-2 xl:col-span-3"><EmptyState text="Nenhum ponto de ronda cadastrado para esta empresa." /></div>}
      </div>
      {selectedQr && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-soft">
            <div data-printable-qr className="mx-auto flex justify-center"><QRPattern code={selectedQr.codigo} large /></div>
            <h2 className="mt-5 text-2xl font-black">{selectedQr.nome}</h2>
            <p className="mt-1 text-sm text-slate-500">QR Code exclusivo deste ponto de ronda.</p>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 font-mono text-sm font-black text-blue-600">{selectedQr.codigo}</div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setSelectedQr(null)}>Fechar</Button>
              <Button onClick={() => printQr(selectedQr)}>Imprimir QR</Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export function RondasPage() {
  const [dbRondas, setDbRondas] = useState<PatrolRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [filters, setFilters] = useState({ condominium: "", guard: "", status: "", date: "" });
  const [error, setError] = useState("");
  useEffect(() => {
    apiJson<{ patrols: PatrolRow[] }>("/api/patrols")
      .then((data) => {
        setDbRondas(data.patrols);
        setSelectedId(data.patrols[0]?.id ?? "");
      })
      .catch((err) => {
        setDbRondas([]);
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar as rondas.");
      });
  }, []);
  const filtered = dbRondas.filter((patrol) =>
    (!filters.condominium || patrol.condominiumName === filters.condominium) &&
    (!filters.guard || patrol.guardName === filters.guard) &&
    (!filters.status || patrol.status === filters.status) &&
    (!filters.date || patrol.createdAt?.slice(0, 10) === filters.date)
  );
  const selected = filtered.find((patrol) => patrol.id === selectedId) ?? filtered[0] ?? null;
  const timelineItems = selected ? buildPatrolTimeline(selected) : [];
  const duration = selected ? formatDuration(selected.startedAt, selected.finishedAt) : "-";
  const condominiums = Array.from(new Set(dbRondas.map((item) => item.condominiumName))).sort();
  const guards = Array.from(new Set(dbRondas.map((item) => item.guardName).filter(Boolean) as string[])).sort();
  const statuses = Array.from(new Set(dbRondas.map((item) => item.status))).sort();
  return (
    <AdminLayout title="Monitoramento de rondas">
      <Card><CardContent className="grid gap-3 md:grid-cols-4">
        <Select value={filters.condominium} onChange={(event) => setFilters({ ...filters, condominium: event.target.value })}><option value="">Todos os condominios</option>{condominiums.map((value) => <option key={value}>{value}</option>)}</Select>
        <Select value={filters.guard} onChange={(event) => setFilters({ ...filters, guard: event.target.value })}><option value="">Todos os vigilantes</option>{guards.map((value) => <option key={value}>{value}</option>)}</Select>
        <Select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Todos os status</option>{statuses.map((value) => <option key={value}>{value}</option>)}</Select>
        <Input type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} />
      </CardContent></Card>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
      <div className="mt-5 grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-black">Timeline da ronda</h2><Select className="max-w-xs" value={selected?.id ?? ""} onChange={(event) => setSelectedId(event.target.value)}><option value="">Selecione uma ronda</option>{filtered.map((patrol) => <option key={patrol.id} value={patrol.id}>{patrol.name} - {patrol.condominiumName}</option>)}</Select></div></CardHeader><CardContent>{timelineItems.length ? <Timeline items={timelineItems} /> : <EmptyState text="Nenhuma ronda selecionada ou registrada." />}</CardContent></Card>
        <Card><CardHeader><h2 className="font-black">Resumo da ronda</h2></CardHeader><CardContent>{selected ? <><div className="rounded-lg bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-500">{selected.condominiumName}</p><p className="mt-1 text-2xl font-black">{selected.name}</p><div className="mt-3"><StatusBadge status={selected.status} /></div></div><div className="mt-4 grid gap-3 md:grid-cols-4"><MiniStat label="Vigilante" value={selected.guardName ?? "-"} /><MiniStat label="Duracao" value={duration} /><MiniStat label="Visitados" value={String(selected.completedCheckpoints)} /><MiniStat label="Pendentes" value={String(Math.max(0, selected.totalCheckpoints - selected.completedCheckpoints))} /></div></> : <EmptyState text="Os dados da ronda aparecerao aqui quando a operacao for iniciada." />}</CardContent></Card>
      </div>
      <Card className="mt-5">{filtered.length ? <Table headers={["Data", "Vigilante", "Condominio", "Ronda", "Inicio", "Fim", "Pontos", "Ocorrencias", "Status"]} rows={filtered.map((r) => patrolCells(r))} /> : <CardContent><EmptyState text="Nenhuma ronda encontrada para os filtros selecionados." /></CardContent>}</Card>
    </AdminLayout>
  );
}

function formatDateTime(value?: string | null, mode: "date" | "time" = "time") {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", mode === "date" ? { dateStyle: "short" } : { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(startedAt?: string | null, finishedAt?: string | null) {
  if (!startedAt) return "-";
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  const minutes = Math.max(0, Math.round((end - new Date(startedAt).getTime()) / 60000));
  return `${minutes} min`;
}

function patrolCells(patrol: PatrolRow): React.ReactNode[] {
  return [
    formatDateTime(patrol.createdAt, "date"),
    patrol.guardName ?? "-",
    patrol.condominiumName,
    patrol.name,
    formatDateTime(patrol.startedAt),
    formatDateTime(patrol.finishedAt),
    `${patrol.completedCheckpoints}/${patrol.totalCheckpoints}`,
    patrol.incidentsCount,
    <StatusBadge key={patrol.id} status={patrol.status} />
  ];
}

function buildPatrolTimeline(patrol: PatrolRow) {
  const events: Array<{ date: Date; text: string }> = [];
  if (patrol.startedAt) events.push({ date: new Date(patrol.startedAt), text: `${formatDateTime(patrol.startedAt)} - Ronda iniciada` });
  for (const visit of patrol.visitEvents ?? []) {
    events.push({ date: new Date(visit.visitedAt), text: `${formatDateTime(visit.visitedAt)} - ${visit.checkpointName} validado` });
  }
  for (const incident of patrol.incidentEvents ?? []) {
    events.push({ date: new Date(incident.createdAt), text: `${formatDateTime(incident.createdAt)} - ${incident.type}${incident.location ? ` em ${incident.location}` : ""}` });
  }
  if (patrol.finishedAt) events.push({ date: new Date(patrol.finishedAt), text: `${formatDateTime(patrol.finishedAt)} - Ronda finalizada` });
  return events.sort((a, b) => a.date.getTime() - b.date.getTime()).map((event) => event.text);
}

function Timeline({ items }: { items: string[] }) {
  return <div className="space-y-4">{items.map((item) => <div key={item} className="flex gap-3"><div className="mt-1 h-4 w-4 rounded-full bg-blue-600 ring-4 ring-blue-100" /><p className="text-sm font-semibold text-slate-600">{item}</p></div>)}</div>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 break-words text-base font-black sm:text-xl">{value}</p></div>;
}

export function OcorrenciasPage() {
  const [dbOcorrencias, setDbOcorrencias] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ condominium: "", type: "", status: "", date: "" });
  async function loadIncidents() {
    await apiJson<{ incidents: any[] }>("/api/incidents").then((data) => setDbOcorrencias(data.incidents)).catch((err) => {
      setDbOcorrencias([]);
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar as ocorrencias.");
    });
  }
  useEffect(() => { void loadIncidents(); }, []);
  async function updateIncident(id: string, status: string) {
    try {
      await apiJson(`/api/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      await loadIncidents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel atualizar a ocorrencia.");
    }
  }
  const rows = dbOcorrencias.map((o) => ({
    id: o.id,
    tipo: o.type,
    condominio: o.condominiumName ?? "Sem condominio",
    local: o.location,
    descricao: o.description,
    data: o.createdAt ? new Date(o.createdAt).toLocaleString("pt-BR") : "-",
    dataIso: o.createdAt ? String(o.createdAt).slice(0, 10) : "",
    responsavel: o.guardName ?? "-",
    status: o.status,
    foto: o.photoUrl
  })).filter((incident) =>
    (!filters.condominium || incident.condominio === filters.condominium) &&
    (!filters.type || incident.tipo === filters.type) &&
    (!filters.status || incident.status === filters.status) &&
    (!filters.date || incident.dataIso === filters.date)
  );
  const condominiums = Array.from(new Set(dbOcorrencias.map((item) => item.condominiumName ?? "Sem condominio"))).sort();
  const types = Array.from(new Set(dbOcorrencias.map((item) => item.type))).sort();
  const statuses = Array.from(new Set(dbOcorrencias.map((item) => item.status))).sort();
  return (
    <AdminLayout title="Ocorrencias">
      <Card><CardContent className="grid gap-3 md:grid-cols-4">
        <Select value={filters.condominium} onChange={(event) => setFilters({ ...filters, condominium: event.target.value })}><option value="">Todos os condominios</option>{condominiums.map((value) => <option key={value}>{value}</option>)}</Select>
        <Select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="">Todos os tipos</option>{types.map((value) => <option key={value}>{value}</option>)}</Select>
        <Select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Todos os status</option>{statuses.map((value) => <option key={value}>{value}</option>)}</Select>
        <Input type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} />
      </CardContent></Card>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((o) => <Card key={o.id} className={o.tipo.includes("Emergencia") ? "border-red-200" : ""}><div className="h-36 overflow-hidden rounded-t-lg bg-[linear-gradient(135deg,#e2e8f0,#f8fafc)]">{o.foto ? <img src={o.foto} alt={`Evidencia de ${o.tipo}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><Camera size={34} /></div>}</div><CardContent><div className="flex items-start justify-between gap-2"><h3 className="font-black">{o.tipo}</h3><StatusBadge status={o.status} /></div><p className="mt-2 text-sm text-slate-500">{o.descricao}</p><div className="mt-4 space-y-1 text-sm font-medium text-slate-600"><p>{o.condominio} - {o.local}</p><p>{o.data}</p><p>{o.responsavel}</p></div><div className="mt-4 flex flex-wrap gap-2">{o.status === "Aberta" && <Button size="sm" variant="outline" onClick={() => updateIncident(o.id, "Em analise")}>Iniciar analise</Button>}{o.status !== "Resolvida" && <Button size="sm" onClick={() => updateIncident(o.id, "Resolvida")}><Check size={14} />Resolver</Button>}{o.status === "Resolvida" && <Button size="sm" variant="outline" onClick={() => updateIncident(o.id, "Aberta")}>Reabrir</Button>}</div></CardContent></Card>)}
        {!rows.length && <div className="md:col-span-2 xl:col-span-3"><EmptyState text="Nenhuma ocorrencia registrada para esta empresa." /></div>}
      </div>
    </AdminLayout>
  );
}

export function RelatoriosPage() {
  const { toast, show } = useToast();
  const [patrols, setPatrols] = useState<PatrolRow[]>([]);
  const [openIncidents, setOpenIncidents] = useState(0);
  const [filters, setFilters] = useState({ condominium: "", guard: "", start: "", end: "", status: "" });
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      apiJson<{ patrols: PatrolRow[] }>("/api/patrols"),
      apiJson<{ incidents: Array<{ status: string }> }>("/api/incidents")
    ]).then(([patrolData, incidentData]) => {
      setPatrols(patrolData.patrols);
      setOpenIncidents(incidentData.incidents.filter((incident) => incident.status !== "Resolvida").length);
    }).catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar o relatorio."));
  }, []);
  const filtered = patrols.filter((patrol) => {
    const date = patrol.createdAt?.slice(0, 10) ?? "";
    return (!filters.condominium || patrol.condominiumName === filters.condominium) &&
      (!filters.guard || patrol.guardName === filters.guard) &&
      (!filters.status || patrol.status === filters.status) &&
      (!filters.start || date >= filters.start) &&
      (!filters.end || date <= filters.end);
  });
  const completedWithDuration = filtered.filter((patrol) => patrol.startedAt && patrol.finishedAt);
  const averageMinutes = completedWithDuration.length
    ? Math.round(completedWithDuration.reduce((sum, patrol) => sum + (new Date(patrol.finishedAt!).getTime() - new Date(patrol.startedAt!).getTime()) / 60000, 0) / completedWithDuration.length)
    : 0;
  const verifiedPoints = filtered.reduce((sum, patrol) => sum + patrol.completedCheckpoints, 0);
  const condominiums = Array.from(new Set(patrols.map((item) => item.condominiumName))).sort();
  const guards = Array.from(new Set(patrols.map((item) => item.guardName).filter(Boolean) as string[])).sort();
  const statuses = Array.from(new Set(patrols.map((item) => item.status))).sort();

  function exportCsv() {
    const header = ["Data", "Vigilante", "Condominio", "Ronda", "Inicio", "Fim", "Pontos", "Ocorrencias", "Status"];
    const lines = filtered.map((patrol) => [
      formatDateTime(patrol.createdAt, "date"), patrol.guardName ?? "", patrol.condominiumName, patrol.name,
      formatDateTime(patrol.startedAt), formatDateTime(patrol.finishedAt),
      `${patrol.completedCheckpoints}/${patrol.totalCheckpoints}`, String(patrol.incidentsCount), patrol.status
    ]);
    const csv = [header, ...lines].map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `rondas-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    show({ title: "Planilha exportada", text: `${filtered.length} rondas incluidas no arquivo.` });
  }

  function sendEmail() {
    const subject = encodeURIComponent("Relatorio Ronda Smart");
    const body = encodeURIComponent(`Total de rondas: ${filtered.length}\nMedia de duracao: ${averageMinutes} min\nPontos verificados: ${verifiedPoints}\nOcorrencias abertas: ${openIncidents}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }
  return (
    <AdminLayout title="Relatorios">
      <ToastView toast={toast} />
      <Card><CardContent className="grid gap-3 md:grid-cols-5"><Select value={filters.condominium} onChange={(event) => setFilters({ ...filters, condominium: event.target.value })}><option value="">Todos os condominios</option>{condominiums.map((value) => <option key={value}>{value}</option>)}</Select><Select value={filters.guard} onChange={(event) => setFilters({ ...filters, guard: event.target.value })}><option value="">Todos os vigilantes</option>{guards.map((value) => <option key={value}>{value}</option>)}</Select><Input type="date" value={filters.start} onChange={(event) => setFilters({ ...filters, start: event.target.value })} /><Input type="date" value={filters.end} onChange={(event) => setFilters({ ...filters, end: event.target.value })} /><Select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Todos os status</option>{statuses.map((value) => <option key={value}>{value}</option>)}</Select></CardContent></Card>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
      <div className="mt-5 grid gap-4 md:grid-cols-4"><MiniStat label="Total de rondas" value={String(filtered.length)} /><MiniStat label="Media de duracao" value={`${averageMinutes} min`} /><MiniStat label="Pontos verificados" value={String(verifiedPoints)} /><MiniStat label="Ocorrencias abertas" value={String(openIncidents)} /></div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={() => window.print()}><Download size={16} />Exportar PDF</Button>
        <Button variant="outline" onClick={exportCsv}><FileSpreadsheet size={16} />Exportar Excel</Button>
        <Button variant="outline" onClick={sendEmail}><Mail size={16} />Enviar por e-mail</Button>
      </div>
      <Card className="mt-5">{filtered.length ? <Table headers={["Data", "Vigilante", "Condominio", "Ronda", "Inicio", "Fim", "Pontos concluidos", "Ocorrencias", "Status"]} rows={filtered.map((patrol) => patrolCells(patrol))} /> : <CardContent><EmptyState text="Nenhuma ronda encontrada no periodo selecionado." /></CardContent>}</Card>
    </AdminLayout>
  );
}

function MobileShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
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
            {pathname === "/mobile/home" ? <Shield size={20} aria-hidden="true" /> : <button type="button" onClick={() => router.back()} aria-label="Voltar"><ArrowLeft size={20} /></button>}
            <p className="font-black">{title}</p>
            <Link href="/mobile/perfil" aria-label="Abrir perfil"><User size={20} /></Link>
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
    </main>
  );
}

export function MobileHome() {
  const router = useRouter();
  const { toast, show } = useToast();
  const [userName, setUserName] = useState("Usuario");
  const [userStatus, setUserStatus] = useState("Disponivel");
  const [operation, setOperation] = useState<MobileRondaData | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    apiJson<{ user: { name: string; status?: string | null } | null }>("/api/auth/me")
      .then((data) => {
        setUserName(data.user?.name ?? "Usuario");
        setUserStatus(data.user?.status ?? "Disponivel");
      })
      .catch(() => setUserName("Usuario"));
    apiJson<MobileRondaData>("/api/mobile/ronda").then(setOperation).catch(() => setOperation(null));
  }, []);

  async function startPatrol() {
    if (operation?.patrol) {
      router.push("/mobile/ronda");
      return;
    }
    setStarting(true);
    try {
      await apiJson("/api/patrols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Ronda iniciada pelo app" })
      });
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
        <div><p className="text-sm font-bold text-blue-600">Ola, {userName}</p><h1 className="text-2xl font-black">Status: {userStatus}</h1></div>
        <Card><CardContent><p className="text-sm text-slate-500">Execucao atual</p><p className="text-xl font-black">{operation?.patrol?.name ?? "Nenhuma ronda em andamento"}</p><p className="mt-3 text-sm font-semibold text-slate-500">{operation?.patrol?.condominiumName ?? "Condominio conforme seu cadastro"}</p><p className="text-sm font-semibold text-blue-600">{operation?.patrol ? `${operation.checkpoints.filter((item) => item.visitedAt).length} de ${operation.checkpoints.length} visitas desta ronda validadas` : "Inicie uma nova execucao para carregar os pontos pendentes"}</p></CardContent></Card>
        <Button size="lg" className="w-full py-6 text-lg" onClick={startPatrol} disabled={starting}>
          {starting ? <Loader2 className="animate-spin" /> : <Radio />}
          {operation?.patrol ? "Continuar Ronda" : "Iniciar Ronda"}
        </Button>
        <Card><CardContent><p className="font-black">Pontos da ronda</p><p className="mt-2 text-sm text-slate-500">{operation?.checkpoints.length ? `${operation.checkpoints.length} pontos cadastrados. Eles voltam a ficar pendentes em cada nova execucao de ronda.` : "Nenhum ponto cadastrado para este vigilante."}</p></CardContent></Card>
      </div>
    </MobileShell>
  );
}

export function MobileRonda() {
  const { toast, show } = useToast();
  const router = useRouter();
  const [rondaData, setRondaData] = useState<MobileRondaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  async function loadRonda() {
    setLoading(true);
    try {
      const data = await apiJson<MobileRondaData>("/api/mobile/ronda");
      setRondaData(data);
    } catch {
      setRondaData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadRonda(); }, []);

  async function finishPatrol() {
    const pending = checklist.filter((item) => !item.done).length;
    if (pending > 0 && !window.confirm(`Ainda existem ${pending} ponto(s) pendente(s). Deseja finalizar mesmo assim?`)) return;
    setFinishing(true);
    try {
      await apiJson("/api/patrols/finish", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      setRondaData((current) => current ? { ...current, patrol: null, checkpoints: current.checkpoints.map((item) => ({ ...item, visitedAt: null, photoUrl: null, notes: null })) } : current);
      show({ title: "Ronda finalizada", text: "Esta execucao foi encerrada. A proxima ronda comeca com os pontos pendentes novamente." });
    } catch (err) {
      show({ title: "Nao foi possivel finalizar", text: err instanceof Error ? err.message : "Tente novamente." });
    } finally {
      setFinishing(false);
    }
  }

  const checklist = rondaData?.checkpoints.map((item) => ({
        label: item.name,
        location: item.location,
        qrToken: item.qrToken,
        done: Boolean(item.visitedAt),
        visitedAt: item.visitedAt
      })) ?? [];
  const doneCount = checklist.filter((item) => item.done).length;
  const progress = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0;
  const currentPatrol = rondaData?.patrol;
  return (
    <MobileShell title="Ronda em execucao">
      <ToastView toast={toast} />
      <div className="space-y-4">
        <Card><CardContent><div className="flex justify-between gap-3"><div><p className="text-sm text-slate-500">{currentPatrol?.condominiumName ?? "Sem condominio vinculado"}</p><h1 className="text-2xl font-black">{currentPatrol?.name ?? "Nenhuma ronda em andamento"}</h1></div>{currentPatrol && <StatusBadge status={currentPatrol.status} />}</div><div className="mt-4 h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-sm font-semibold text-slate-500">{loading ? "Carregando pontos..." : `${doneCount} visitas validadas nesta execucao, ${checklist.length - doneCount} pendentes`}</p></CardContent></Card>
        {checklist.length ? <Card><CardContent className="space-y-3">{checklist.map((item) => <div key={item.label} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 font-semibold"><span className={cn("grid h-6 w-6 place-items-center rounded-full", item.done ? "bg-green-500 text-white" : "bg-white text-slate-400 ring-1 ring-slate-200")}>{item.done ? <Check size={14} /> : "o"}</span><span className="flex-1"><span className="block">{item.label}</span>{item.qrToken && <span className="block text-xs font-bold text-blue-600">{item.qrToken}</span>}{item.visitedAt && <span className="block text-xs font-semibold text-green-700">Validado nesta ronda</span>}</span></div>)}</CardContent></Card> : !loading && <EmptyState text="Nenhum ponto cadastrado para esta operacao." />}
        <div className="grid grid-cols-2 gap-3"><Link href="/mobile/scanner"><Button className="w-full"><ScanLine size={16} />Escanear QR</Button></Link><Link href="/mobile/foto"><Button variant="outline" className="w-full"><Camera size={16} />Foto</Button></Link><Link href="/mobile/ocorrencia"><Button variant="outline" className="w-full"><ShieldAlert size={16} />Ocorrencia</Button></Link><Button variant="secondary" onClick={finishPatrol} disabled={finishing || !currentPatrol}>{finishing ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}Finalizar</Button></div>
        {!currentPatrol && !loading && <Button className="w-full" onClick={() => router.push("/mobile/home")}><Radio size={16} />Iniciar nova ronda</Button>}
        <Link href="/mobile/panico"><Button variant="danger" className="w-full"><Siren size={18} />Botao de panico</Button></Link>
      </div>
    </MobileShell>
  );
}

function useCamera(autoStart = false) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const startingRef = useRef(false);
  const cameraStateRef = useRef<"idle" | "loading" | "on" | "fallback">(autoStart ? "loading" : "idle");
  const [cameraState, setCameraState] = useState<"idle" | "loading" | "on" | "fallback">(autoStart ? "loading" : "idle");
  const [cameraError, setCameraError] = useState("");

  async function startCamera() {
    if (startingRef.current) return;
    startingRef.current = true;
    stopCamera();
    setCameraState("loading");
    setCameraError("");
    try {
      if (!window.isSecureContext) {
        throw new Error("A camera em tempo real exige HTTPS no celular. Use o campo manual ou uma foto do QR Code por enquanto.");
      }
      const stream = await navigator.mediaDevices?.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      if (!stream || !videoRef.current) throw new Error("Camera indisponivel");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraState("on");
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : "Nao foi possivel abrir a camera neste navegador.");
      setCameraState("fallback");
    } finally {
      startingRef.current = false;
    }
  }

  function stopCamera() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
  }

  useEffect(() => {
    cameraStateRef.current = cameraState;
  }, [cameraState]);

  useEffect(() => {
    if (!autoStart) return;
    let cancelled = false;
    const open = () => {
      if (!cancelled && cameraStateRef.current !== "on") void startCamera();
    };
    const timer = window.setTimeout(open, 120);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") open();
    };
    window.addEventListener("focus", open);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("focus", open);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [autoStart]);

  useEffect(() => stopCamera, []);
  return { videoRef, cameraState, cameraError, startCamera, stopCamera };
}

export function MobileScanner() {
  const { toast, show } = useToast();
  const router = useRouter();
  const { videoRef, cameraState, cameraError, startCamera } = useCamera(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerCanvasRef = useRef<HTMLCanvasElement>(null);
  const scanningRef = useRef(false);
  const lastReadRef = useRef<{ token: string; at: number } | null>(null);
  const [qrToken, setQrToken] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState(false);
  const [validating, setValidating] = useState(false);
  const [lastScan, setLastScan] = useState<{ checkpointName: string; completed: number; total: number; patrolId: string } | null>(null);

  useEffect(() => {
    setPendingPhoto(Boolean(sessionStorage.getItem(PENDING_PHOTO_KEY)));
  }, []);

  async function validateQr(nextToken = qrToken) {
    const token = normalizeQrCode(nextToken);
    if (!token) {
      show({ title: "Informe o QR Code", text: "Digite ou capture o codigo do ponto de ronda.", tone: "warning" });
      return;
    }
    try {
      setValidating(true);
      setQrToken(token);
      const response = await fetch("/api/mobile/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrToken: token,
          notes: "Leitura registrada pelo scanner mobile",
          photoUrl: sessionStorage.getItem(PENDING_PHOTO_KEY) || null
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao validar QR Code.");
      }
      const data = await response.json();
      const checkpointName = data.checkpoint?.name ?? "Garagem G1";
      const completed = Array.isArray(data.visits) ? data.visits.filter((visit: any) => visit.visitedAt).length : 1;
      const total = Array.isArray(data.visits) ? data.visits.length : completed;
      sessionStorage.removeItem(PENDING_PHOTO_KEY);
      setPendingPhoto(false);
      scanningRef.current = true;
      setLastScan({
        checkpointName,
        completed,
        total,
        patrolId: data.patrolId
      });
      show({ title: "Visita validada", text: `${checkpointName} foi registrado nesta execucao de ronda.` });
    } catch (err) {
      scanningRef.current = false;
      show({ title: "Leitura nao enviada", text: err instanceof Error ? err.message : "Tente novamente.", tone: "error" });
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
        const rawValue = imageData ? String(jsQR(imageData.data, width, height, { inversionAttempts: "attemptBoth" })?.data ?? "").trim() : "";
        if (rawValue) {
          const token = normalizeQrCode(rawValue);
          const last = lastReadRef.current;
          if (last?.token === token && Date.now() - last.at < 3500) {
            if (active) window.requestAnimationFrame(scanFrame);
            return;
          }
          lastReadRef.current = { token, at: Date.now() };
          scanningRef.current = true;
          setQrToken(token);
          await validateQr(token);
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
          const value = imageData ? String(jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: "attemptBoth" })?.data ?? "").trim() : "";
          resolve(value);
        };
        image.onerror = () => reject(new Error("Nao foi possivel ler a foto."));
        image.src = dataUrl;
      });
      if (!rawValue) throw new Error("Nenhum QR Code encontrado na imagem.");
      const token = normalizeQrCode(rawValue);
      setQrToken(token);
      await validateQr(token);
    } catch (err) {
      show({ title: "QR nao encontrado", text: err instanceof Error ? err.message : "Tente outra foto ou digite o codigo.", tone: "error" });
    }
  }

  return (
    <MobileShell title="Scanner QR Code">
      <ToastView toast={toast} />
      <div className="space-y-4">
        <div className="relative h-80 overflow-hidden rounded-lg bg-slate-900">
          <video ref={videoRef} muted playsInline className={cn("absolute inset-0 h-full w-full object-cover", cameraState !== "on" && "hidden")} />
          {cameraState !== "on" && <div className="absolute inset-0 grid place-items-center bg-slate-950 text-center text-white"><div className="px-8"><ScanLine className="mx-auto mb-3 text-blue-300" size={38} /><p className="font-black">Camera pronta para abrir</p><p className="mt-2 text-sm text-slate-300">Use a camera em tempo real, uma foto do QR ou digite o codigo impresso.</p></div></div>}
          <div className="absolute inset-8 rounded-lg border-2 border-blue-400" />
          {cameraState === "on" && <div className="scan-line absolute left-10 right-10 top-10 h-1 rounded-full bg-blue-400" />}
          <div className="absolute inset-x-6 bottom-8 text-center text-sm font-semibold text-white">{cameraState === "on" ? "Aponte para o QR Code do ponto de ronda" : "Abra a camera ou informe o codigo do QR Code"}</div>
          <div className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">{cameraState === "on" ? "Camera ativa" : cameraState === "loading" ? "Abrindo camera" : "Codigo manual"}</div>
        </div>
        {cameraError && <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-700">{cameraError}</p>}
        {pendingPhoto && <p className="rounded-lg bg-blue-50 p-3 text-sm font-semibold text-blue-700">A foto capturada sera anexada a esta leitura.</p>}
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
        <Input value={qrToken} onChange={(event) => setQrToken(normalizeQrCode(event.target.value))} placeholder="Codigo QR, ex: RS-006" />
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
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Camera size={16} />Ler foto do QR</Button>
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
  const router = useRouter();
  const { videoRef, cameraState, cameraError, startCamera, stopCamera } = useCamera(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function setCompressedPhotoFromCanvas(canvas: HTMLCanvasElement) {
    const maximum = 1280;
    const scale = Math.min(1, maximum / Math.max(canvas.width, canvas.height));
    if (scale < 1) {
      const resized = document.createElement("canvas");
      resized.width = Math.round(canvas.width * scale);
      resized.height = Math.round(canvas.height * scale);
      resized.getContext("2d")?.drawImage(canvas, 0, 0, resized.width, resized.height);
      setPhoto(resized.toDataURL("image/jpeg", 0.72));
    } else {
      setPhoto(canvas.toDataURL("image/jpeg", 0.72));
    }
    setCaptured(true);
  }

  async function readPhotoFromFile(file: File) {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Nao foi possivel abrir a foto."));
        reader.readAsDataURL(file);
      });
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth || 1280;
          canvas.height = image.naturalHeight || 720;
          canvas.getContext("2d")?.drawImage(image, 0, 0);
          setCompressedPhotoFromCanvas(canvas);
          stopCamera();
          resolve();
        };
        image.onerror = () => reject(new Error("Nao foi possivel processar a foto."));
        image.src = dataUrl;
      });
    } catch (err) {
      show({ title: "Foto nao carregada", text: err instanceof Error ? err.message : "Tente novamente.", tone: "error" });
    }
  }

  function capturePhoto() {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video && cameraState === "on") {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      setCompressedPhotoFromCanvas(canvas);
      stopCamera();
      return;
    }
    fileInputRef.current?.click();
  }
  return (
    <MobileShell title="Registro de foto">
      <ToastView toast={toast} />
      <div className="space-y-4 text-center">
        <div className={cn("relative grid h-80 overflow-hidden rounded-lg", captured ? "bg-[linear-gradient(135deg,#bfdbfe,#f8fafc)]" : "bg-slate-900 text-white")}>
          {photo ? <img src={photo} alt="Foto capturada" className="h-full w-full object-cover" /> : <video ref={videoRef} muted playsInline className={cn("h-full w-full object-cover", cameraState !== "on" && "hidden")} />}
          {!photo && cameraState !== "on" && <div className="grid place-items-center"><div className="px-8"><Camera className="mx-auto" size={48} /><p className="mt-3 font-semibold">Capture uma evidencia real do local</p><p className="mt-2 text-xs text-slate-300">Se a camera ao vivo nao abrir, use a camera nativa do celular.</p></div></div>}
        </div>
        {cameraError && <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-700">{cameraError}</p>}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void readPhotoFromFile(file);
            event.currentTarget.value = "";
          }}
        />
        <Button variant="outline" className="w-full" onClick={startCamera} disabled={cameraState === "loading"}>{cameraState === "loading" ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}Abrir camera</Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Camera size={16} />Camera do celular</Button>
          <Button onClick={capturePhoto} disabled={cameraState === "loading"}>{cameraState === "on" ? <Camera size={16} /> : <Camera size={16} />}{cameraState === "on" ? "Capturar" : "Tirar foto"}</Button>
        </div>
        <Button className="w-full" disabled={!captured || !photo} onClick={() => {
          if (!photo) return;
          sessionStorage.setItem(PENDING_PHOTO_KEY, photo);
          show({ title: "Foto pronta", text: "A foto sera anexada a proxima leitura ou ocorrencia." });
          window.setTimeout(() => router.back(), 500);
        }}>Usar Foto</Button>
      </div>
    </MobileShell>
  );
}

export function MobileOcorrencia() {
  const { toast, show } = useToast();
  const [type, setType] = useState("Portao aberto");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Media");
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setPhoto(sessionStorage.getItem(PENDING_PHOTO_KEY));
  }, []);

  async function registerIncident() {
    if (!location.trim() || !description.trim()) {
      show({ title: "Complete a ocorrencia", text: "Informe o local e descreva o que aconteceu.", tone: "warning" });
      return;
    }
    setLoading(true);
    try {
      await apiJson("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, location, description, priority, photoUrl: photo })
      });
      setType("Portao aberto");
      setLocation("");
      setDescription("");
      setPriority("Media");
      setPhoto(null);
      setSent(true);
      sessionStorage.removeItem(PENDING_PHOTO_KEY);
      show({ title: "Ocorrencia enviada", text: "Ocorrencia registrada e enviada para a central." });
    } catch (err) {
      show({ title: "Falha no envio", text: err instanceof Error ? err.message : "Tente novamente.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell title="Registrar ocorrencia">
      <ToastView toast={toast} />
      <div className="space-y-3">
        {sent && <Card className="border-green-200 bg-green-50"><CardContent><div className="flex gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500 text-white"><Check size={20} /></div><div><p className="font-black text-green-900">Ocorrencia registrada</p><p className="mt-1 text-sm font-semibold text-green-700">Os campos foram limpos e o registro ja esta na central.</p></div></div></CardContent></Card>}
        <Select value={type} onChange={(event) => { setType(event.target.value); setSent(false); }}>
          <option>Portao aberto</option>
          <option>Pessoa suspeita</option>
          <option>Equipamento danificado</option>
          <option>Lampada queimada</option>
          <option>Vazamento</option>
        </Select>
        <Input placeholder="Local" value={location} onChange={(event) => { setLocation(event.target.value); setSent(false); }} />
        <Textarea placeholder="Descricao" value={description} onChange={(event) => { setDescription(event.target.value); setSent(false); }} />
        {photo && <div className="overflow-hidden rounded-lg border border-blue-200 bg-blue-50 p-2"><img src={photo} alt="Evidencia pronta para envio" className="h-40 w-full rounded-md object-cover" /><p className="mt-2 text-sm font-semibold text-blue-700">Foto pronta para anexar.</p></div>}
        <Link href="/mobile/foto"><Button variant="outline" className="w-full"><Camera size={16} />{photo ? "Trocar foto" : "Anexar foto"}</Button></Link>
        <Select value={priority} onChange={(event) => { setPriority(event.target.value); setSent(false); }}>
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
  const [location, setLocation] = useState("");
  const [sending, setSending] = useState(false);

  async function sendPanic() {
    setSending(true);
    try {
      await apiJson("/api/mobile/panic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: location.trim() || "Localizacao nao informada" })
      });
      setConfirm(false);
      show({ title: "Alerta enviado", text: "Alerta enviado para a central de monitoramento." });
    } catch (err) {
      show({ title: "Falha no alerta", text: err instanceof Error ? err.message : "Nao foi possivel enviar para a central." });
    } finally {
      setSending(false);
    }
  }

  return (
    <MobileShell title="Emergencia">
      <ToastView toast={toast} />
      <div className="space-y-5 text-center">
        <AlertTriangle className="mx-auto text-red-500" size={42} />
        <p className="text-sm font-semibold text-slate-500">Use apenas em situacoes reais de risco.</p>
        <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Local da emergencia (opcional)" />
        <button onClick={() => setConfirm(true)} className="pulse-soft mx-auto grid h-56 w-56 place-items-center rounded-full bg-red-500 text-2xl font-black text-white shadow-soft">ACIONAR<br />EMERGENCIA</button>
        {confirm && <Card><CardContent><p className="font-black">Confirmar envio?</p><p className="mt-2 text-sm text-slate-500">A central de monitoramento sera avisada imediatamente{location.trim() ? ` sobre ${location.trim()}` : ""}.</p><div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setConfirm(false)} disabled={sending}>Cancelar</Button><Button variant="danger" onClick={sendPanic} disabled={sending}>{sending ? <Loader2 className="animate-spin" size={16} /> : <Siren size={16} />}Enviar</Button></div></CardContent></Card>}
      </div>
    </MobileShell>
  );
}

export function MobilePerfil() {
  const [user, setUser] = useState<{ name: string; email: string; role: string; status?: string | null; shift?: string | null } | null>(null);

  useEffect(() => {
    apiJson<{ user: { name: string; email: string; role: string; status?: string | null; shift?: string | null } | null }>("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  const initials = (user?.name ?? "Usuario")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <MobileShell title="Perfil">
      <div className="space-y-4 text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-slate-950 text-3xl font-black text-white">{initials}</div>
        <div><h1 className="text-2xl font-black">{user?.name ?? "Usuario logado"}</h1><p className="text-sm text-slate-500">{user?.email ?? "Carregando perfil..."}</p></div>
        <Card><CardContent className="space-y-3 text-left text-sm font-semibold text-slate-600"><p>Perfil: {user?.role ?? "Carregando"}</p><p>Status: {user?.status ?? "Carregando"}</p><p>Turno: {user?.shift ?? "Nao informado"}</p></CardContent></Card>
        <LogoutButton className="w-full" />
      </div>
    </MobileShell>
  );
}
