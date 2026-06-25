import { randomBytes } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { buildDefaultContract, DEFAULT_CONTRACT_TITLE } from "@/lib/contracts";
import { query, rowsToCamel } from "@/lib/db";

function appUrl() {
  return (process.env.PUBLIC_APP_URL || "http://localhost:3100").replace(/\/$/, "");
}

export async function GET() {
  const { response } = await requireSession(["SUPER_ADMIN"]);
  if (response) return response;

  const result = await query(
    `SELECT ct.*, c.name AS company_name, c.document AS company_document
     FROM contracts ct
     JOIN companies c ON c.id = ct.company_id
     ORDER BY ct.created_at DESC`
  );

  return Response.json({
    contracts: rowsToCamel(result.rows).map((contract) => ({
      ...contract,
      signingUrl: `${appUrl()}/assinar/${contract.publicToken}`
    }))
  });
}

export async function POST(request: Request) {
  const { user, response } = await requireSession(["SUPER_ADMIN"]);
  if (response) return response;

  const body = await request.json();
  if (!body.companyId) return Response.json({ error: "Cliente obrigatorio." }, { status: 400 });

  const companyResult = await query(
    `SELECT id, name, document, plan
     FROM companies
     WHERE id = $1 AND name <> 'Ronda Smart Plataforma'
     LIMIT 1`,
    [body.companyId]
  );
  if (!companyResult.rowCount) return Response.json({ error: "Cliente nao encontrado." }, { status: 404 });

  const company = companyResult.rows[0];
  const title = String(body.title || DEFAULT_CONTRACT_TITLE).trim();
  const content = String(body.content || buildDefaultContract({
    companyName: company.name,
    companyDocument: company.document,
    plan: company.plan,
    setupAmount: body.setupAmount,
    monthlyAmount: body.monthlyAmount,
    startDate: body.startDate,
    notes: body.notes
  })).trim();

  if (title.length < 5 || content.length < 200) {
    return Response.json({ error: "Titulo ou conteudo do contrato incompleto." }, { status: 400 });
  }

  const publicToken = randomBytes(32).toString("hex");
  const result = await query(
    `INSERT INTO contracts (company_id, title, content, public_token, created_by)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [body.companyId, title, content, publicToken, user?.id]
  );

  const contract = rowsToCamel(result.rows)[0];
  return Response.json({
    contract: {
      ...contract,
      companyName: company.name,
      signingUrl: `${appUrl()}/assinar/${publicToken}`
    }
  }, { status: 201 });
}
