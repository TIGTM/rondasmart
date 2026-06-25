"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ban, Check, Copy, ExternalLink, FileSignature, Loader2, Plus, Printer, ShieldCheck, Trash2, X } from "lucide-react";
import { AdminLayout, MasterLayout } from "@/components/prototype";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/form";

type Company = { id: string; name: string; document?: string | null; plan: string };
type Contract = {
  id: string;
  companyName: string;
  title: string;
  status: string;
  signingUrl: string;
  sentAt: string;
  signedAt?: string | null;
  signerName?: string | null;
  signerEmail?: string | null;
  evidenceHash?: string | null;
};
type ClientContract = Omit<Contract, "signingUrl"> & {
  documentUrl: string;
  signerDocument?: string | null;
};
type PublicContract = {
  title: string;
  content: string;
  status: string;
  sentAt: string;
  signedAt?: string | null;
  signerName?: string | null;
  signerDocument?: string | null;
  signerEmail?: string | null;
  evidenceHash?: string | null;
  companyName: string;
  companyDocument?: string | null;
};

async function apiJson<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Nao foi possivel concluir a operacao.");
  return data as T;
}

function ContractStatus({ status }: { status: string }) {
  const style = status === "Assinado" ? "bg-green-100 text-green-700" : status === "Cancelado" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${style}`}>{status}</span>;
}

export function MasterContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastLink, setLastLink] = useState("");

  async function load() {
    const [contractData, companyData] = await Promise.all([
      apiJson<{ contracts: Contract[] }>("/api/platform/contracts"),
      apiJson<{ companies: Company[] }>("/api/platform/companies")
    ]);
    setContracts(contractData.contracts);
    setCompanies(companyData.companies.filter((company) => company.name !== "Ronda Smart Plataforma"));
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar contratos."));
    const interval = window.setInterval(() => { void load().catch(() => undefined); }, 15000);
    return () => window.clearInterval(interval);
  }, []);

  async function createContract(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      const data = await apiJson<{ contract: Contract }>("/api/platform/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      setLastLink(data.contract.signingUrl);
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel criar o contrato.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setLastLink(url);
  }

  async function cancelContract(id: string) {
    if (!window.confirm("Cancelar este contrato? O link de assinatura deixara de funcionar.")) return;
    try {
      await apiJson(`/api/platform/contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Cancelado" })
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel cancelar o contrato.");
    }
  }

  async function deleteContract(contract: Contract) {
    const confirmation = window.prompt(`Exclusao permanente: digite EXCLUIR para apagar "${contract.title}".`);
    if (confirmation !== "EXCLUIR") return;
    try {
      await apiJson(`/api/platform/contracts/${contract.id}`, { method: "DELETE" });
      if (lastLink === contract.signingUrl) setLastLink("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel excluir o contrato.");
    }
  }

  return (
    <MasterLayout title="Contratos">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">Crie, envie e acompanhe assinaturas dos clientes.</p>
        <Button onClick={() => setOpen(true)}><Plus size={16} />Novo contrato</Button>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
      {lastLink && <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4"><Check className="text-green-600" /><p className="min-w-0 flex-1 break-all text-sm font-semibold text-green-800">{lastLink}</p><Button variant="outline" onClick={() => copyLink(lastLink)}><Copy size={16} />Copiar</Button></div>}
      <div className="grid gap-4 xl:grid-cols-2">
        {contracts.map((contract) => (
          <Card key={contract.id}>
            <CardContent>
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-sm font-bold text-blue-600">{contract.companyName}</p><h2 className="mt-1 text-lg font-black">{contract.title}</h2></div>
                <ContractStatus status={contract.status} />
              </div>
              <div className="mt-4 grid gap-1 text-sm font-semibold text-slate-500">
                <p>Enviado em {new Date(contract.sentAt).toLocaleString("pt-BR")}</p>
                {contract.signedAt && <p>Assinado em {new Date(contract.signedAt).toLocaleString("pt-BR")} por {contract.signerName}</p>}
                {contract.evidenceHash && <p className="truncate font-mono text-xs">Hash: {contract.evidenceHash}</p>}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => copyLink(contract.signingUrl)}><Copy size={16} />Copiar link</Button>
                <Link href={contract.signingUrl} target="_blank"><Button variant="outline"><ExternalLink size={16} />Abrir</Button></Link>
                {contract.status === "Aguardando assinatura" && <Button variant="outline" onClick={() => cancelContract(contract.id)}><Ban size={16} />Cancelar</Button>}
                <Button variant="outline" className="text-red-600" onClick={() => deleteContract(contract)}><Trash2 size={16} />Excluir</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!contracts.length && <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center text-sm font-semibold text-slate-400 xl:col-span-2">Nenhum contrato criado.</div>}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-4">
          <form onSubmit={createContract} className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><p className="text-xs font-bold uppercase text-blue-600">Contrato SaaS</p><h2 className="text-xl font-black">Novo contrato</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Fechar"><X /></button></div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <Select name="companyId" required className="md:col-span-2"><option value="">Selecione o cliente</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</Select>
              <Input name="title" placeholder="Titulo do contrato" className="md:col-span-2" />
              <Input name="setupAmount" placeholder="Valor da implantacao" defaultValue="250,00" required />
              <Input name="monthlyAmount" placeholder="Valor mensal" defaultValue="250,00" required />
              <Input name="startDate" type="date" required />
              <Textarea name="notes" placeholder="Condicoes adicionais, prazo minimo, implantacao ou observacoes" className="md:col-span-2" />
              <p className="text-xs font-semibold text-slate-500 md:col-span-2">O sistema gera um contrato-base com os dados do cliente. Recomenda-se revisao juridica do texto definitivo da sua operacao.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 p-5"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" size={16} /> : <FileSignature size={16} />}Gerar contrato</Button></div>
          </form>
        </div>
      )}
    </MasterLayout>
  );
}

export function ClientContractsPage() {
  const [contracts, setContracts] = useState<ClientContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiJson<{ contracts: ClientContract[] }>("/api/contracts")
      .then((data) => setContracts(data.contracts))
      .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar os contratos."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Contratos">
      <div className="mb-5">
        <p className="text-sm font-semibold text-slate-500">Documentos da sua empresa enviados pela Ronda Smart.</p>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
      {loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-blue-600" /></div> : (
        <div className="grid gap-4 xl:grid-cols-2">
          {contracts.map((contract) => (
            <Card key={contract.id}>
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-sm font-bold text-blue-600">{contract.companyName}</p><h2 className="mt-1 text-lg font-black">{contract.title}</h2></div>
                  <ContractStatus status={contract.status} />
                </div>
                <div className="mt-4 grid gap-1 text-sm font-semibold text-slate-500">
                  <p>Disponibilizado em {new Date(contract.sentAt).toLocaleString("pt-BR")}</p>
                  {contract.status === "Assinado" && contract.signedAt && <>
                    <p>Assinado em {new Date(contract.signedAt).toLocaleString("pt-BR")}</p>
                    <p>Signatario: {contract.signerName}</p>
                    <p>E-mail: {contract.signerEmail}</p>
                    <p className="truncate font-mono text-xs">Hash: {contract.evidenceHash}</p>
                  </>}
                </div>
                <div className="mt-5">
                  {contract.status === "Assinado" ? (
                    <Link href={contract.documentUrl} target="_blank"><Button><Printer size={16} />Abrir e imprimir copia</Button></Link>
                  ) : (
                    <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-700">A copia assinada ficara disponivel aqui depois da assinatura.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {!contracts.length && <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center text-sm font-semibold text-slate-400 xl:col-span-2">Nenhum contrato disponibilizado para sua empresa.</div>}
        </div>
      )}
    </AdminLayout>
  );
}

export function PublicContractPage({ token }: { token: string }) {
  const [contract, setContract] = useState<PublicContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiJson<{ contract: PublicContract }>(`/api/contracts/sign/${token}`)
      .then((data) => setContract(data.contract))
      .catch((err) => setError(err instanceof Error ? err.message : "Contrato nao encontrado."))
      .finally(() => setLoading(false));
  }, [token]);

  async function sign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      await apiJson(`/api/contracts/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, accepted: values.accepted === "on" })
      });
      const updated = await apiJson<{ contract: PublicContract }>(`/api/contracts/sign/${token}`);
      setContract(updated.contract);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel assinar.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-blue-600" /></main>;
  if (!contract) return <main className="grid min-h-screen place-items-center p-6"><p className="rounded-lg bg-red-50 p-4 font-semibold text-red-700">{error}</p></main>;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between print:hidden"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-600 text-white"><ShieldCheck /></div><div><p className="font-black">Ronda Smart</p><p className="text-xs font-semibold text-slate-500">Assinatura de contrato</p></div></div><Button variant="outline" onClick={() => window.print()}><Printer size={16} />Imprimir</Button></div>
        <article className="rounded-lg bg-white p-6 shadow-sm md:p-10 print:shadow-none">
          <div className="border-b border-slate-200 pb-6"><p className="text-sm font-bold uppercase text-blue-600">{contract.companyName}</p><h1 className="mt-2 text-2xl font-black md:text-3xl">{contract.title}</h1><div className="mt-3"><ContractStatus status={contract.status} /></div></div>
          <div className="whitespace-pre-wrap py-8 text-sm leading-7 text-slate-700">{contract.content}</div>
          {contract.status === "Assinado" ? (
            <section className="rounded-lg border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-2 font-black text-green-800"><ShieldCheck />Documento assinado eletronicamente</div>
              <div className="mt-4 grid gap-2 text-sm font-semibold text-green-900">
                <p>Signatario: {contract.signerName}</p><p>Documento: {contract.signerDocument}</p><p>E-mail: {contract.signerEmail}</p>
                <p>Data: {contract.signedAt ? new Date(contract.signedAt).toLocaleString("pt-BR") : "-"}</p>
                <p className="break-all font-mono text-xs">Hash de evidencia: {contract.evidenceHash}</p>
              </div>
            </section>
          ) : (
            <form onSubmit={sign} className="space-y-4 border-t border-slate-200 pt-7 print:hidden">
              <h2 className="text-xl font-black">Assinar contrato</h2>
              <div className="grid gap-3 md:grid-cols-2"><Input name="signerName" placeholder="Nome completo do representante" required /><Input name="signerDocument" placeholder="CPF do representante" required /><Input name="signerEmail" type="email" placeholder="E-mail do representante" required className="md:col-span-2" /></div>
              <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-700"><input name="accepted" type="checkbox" required className="mt-1 h-4 w-4" /><span>Li o contrato, concordo com seu conteudo e confirmo que possuo poderes para assinar pela contratante.</span></label>
              {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>{submitting ? <Loader2 className="animate-spin" /> : <FileSignature />}Assinar eletronicamente</Button>
            </form>
          )}
        </article>
      </div>
    </main>
  );
}
