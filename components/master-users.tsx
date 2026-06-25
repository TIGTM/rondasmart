"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Eye, EyeOff, KeyRound, Loader2, RefreshCw, Search, X } from "lucide-react";
import { MasterLayout } from "@/components/prototype";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form";

type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  companyId?: string | null;
  companyName?: string | null;
  condominiumName?: string | null;
  shift?: string | null;
};

async function apiJson<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Nao foi possivel concluir a operacao.");
  return data as T;
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    SUPER_ADMIN: "Master",
    CLIENT_ADMIN: "Admin do cliente",
    ADMIN: "Administrador",
    MANAGER: "Gestor",
    GUARD: "Vigilante"
  };
  return labels[role] ?? role;
}

export function MasterUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [selected, setSelected] = useState<PlatformUser | null>(null);
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await apiJson<{ users: PlatformUser[] }>("/api/platform/users");
      setUsers(data.users);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar os usuarios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadUsers(); }, []);

  const companies = useMemo(() => Array.from(new Set(users.map((item) => item.companyName).filter(Boolean) as string[])).sort(), [users]);
  const roles = useMemo(() => Array.from(new Set(users.map((item) => item.role))).sort(), [users]);
  const filtered = users.filter((item) => {
    const term = query.trim().toLowerCase();
    return (!term || `${item.name} ${item.email} ${item.companyName ?? ""}`.toLowerCase().includes(term)) &&
      (!company || item.companyName === company) &&
      (!role || item.role === role);
  });

  function generatePassword() {
    const bytes = new Uint32Array(4);
    crypto.getRandomValues(bytes);
    const generated = `Rs!${Array.from(bytes).map((value) => value.toString(36)).join("").slice(0, 13)}`;
    setPassword(generated);
    setConfirmation(generated);
    setShowPassword(true);
  }

  function openReset(user: PlatformUser) {
    setSelected(user);
    setPassword("");
    setConfirmation("");
    setError("");
    setSuccess("");
    setShowPassword(false);
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    if (password.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("A confirmacao nao corresponde a nova senha.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const result = await apiJson<{ currentSessionEnded: boolean }>("/api/platform/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.id, password })
      });
      setSuccess(`Senha de ${selected.name} redefinida. As sessoes anteriores foram encerradas.`);
      setSelected(null);
      setPassword("");
      setConfirmation("");
      if (result.currentSessionEnded) window.location.href = "/login";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel redefinir a senha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MasterLayout title="Usuarios">
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_240px_200px_auto]">
        <div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nome, e-mail ou cliente" className="pl-10" /></div>
        <Select value={company} onChange={(event) => setCompany(event.target.value)}><option value="">Todos os clientes</option>{companies.map((value) => <option key={value}>{value}</option>)}</Select>
        <Select value={role} onChange={(event) => setRole(event.target.value)}><option value="">Todos os perfis</option>{roles.map((value) => <option key={value} value={value}>{roleLabel(value)}</option>)}</Select>
        <Button variant="outline" onClick={loadUsers}><RefreshCw size={16} />Atualizar</Button>
      </div>
      {error && !selected && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
      {success && <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">{success}</p>}
      {loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-blue-600" /></div> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((user) => (
            <Card key={user.id}>
              <CardContent>
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-black">{user.name}</h2><p className="truncate text-sm text-slate-500">{user.email}</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{roleLabel(user.role)}</span></div>
                <div className="mt-4 space-y-1 text-sm font-semibold text-slate-500"><p>{user.companyName ?? "Sem empresa"}</p><p>{user.condominiumName ?? "Sem condominio"}</p><p>Status: {user.status}</p></div>
                <Button className="mt-5 w-full" variant="outline" onClick={() => openReset(user)}><KeyRound size={16} />Redefinir senha</Button>
              </CardContent>
            </Card>
          ))}
          {!filtered.length && <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center text-sm font-semibold text-slate-400 md:col-span-2 xl:col-span-3">Nenhum usuario encontrado.</div>}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-4">
          <form onSubmit={resetPassword} className="my-auto w-full max-w-md rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><p className="text-xs font-bold uppercase text-blue-600">Redefinir senha</p><h2 className="text-xl font-black">{selected.name}</h2><p className="text-sm text-slate-500">{selected.email}</p></div><button type="button" onClick={() => setSelected(null)} aria-label="Fechar"><X /></button></div>
            <div className="space-y-3 p-5">
              <div className="relative"><Input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} placeholder="Nova senha" minLength={8} required className="pr-11" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3 text-slate-500" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
              <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} type={showPassword ? "text" : "password"} placeholder="Confirmar nova senha" minLength={8} required />
              <Button type="button" variant="outline" className="w-full" onClick={generatePassword}><RefreshCw size={16} />Gerar senha segura</Button>
              <p className="text-xs font-semibold text-slate-500">A senha anterior nao pode ser visualizada. Todas as sessoes do usuario serao encerradas.</p>
              {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 p-5"><Button type="button" variant="outline" onClick={() => setSelected(null)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}Salvar nova senha</Button></div>
          </form>
        </div>
      )}
    </MasterLayout>
  );
}
