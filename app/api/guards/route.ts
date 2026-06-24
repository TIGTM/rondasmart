import { hashPassword, requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

export async function GET() {
  const { user, response } = await requireSession(["SUPER_ADMIN", "CLIENT_ADMIN", "ADMIN", "MANAGER"]);
  if (response) return response;

  const params = user?.role === "SUPER_ADMIN" ? [] : [user?.companyId];
  const result = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.registration, u.shift, u.status, u.company_id, u.condominium_id,
            c.name AS condominium_name
     FROM users u
     LEFT JOIN condominiums c ON c.id = u.condominium_id
     WHERE u.role = 'GUARD'
       ${user?.role === "SUPER_ADMIN" ? "" : "AND u.company_id = $1"}
     ORDER BY u.name`,
    params
  );
  return Response.json({ guards: rowsToCamel(result.rows) });
}

export async function POST(request: Request) {
  const { user, response } = await requireSession(["SUPER_ADMIN", "CLIENT_ADMIN", "ADMIN"]);
  if (response) return response;

  const body = await request.json();
  if (String(body.password ?? "").length < 8) {
    return Response.json({ error: "A senha inicial deve ter pelo menos 8 caracteres." }, { status: 400 });
  }
  const companyId = user?.role === "SUPER_ADMIN" ? body.companyId : user?.companyId;
  if (!companyId) return Response.json({ error: "Empresa obrigatoria." }, { status: 400 });

  if (body.condominiumId) {
    const condominium = await query(
      "SELECT id FROM condominiums WHERE id = $1 AND ($2::text = 'SUPER_ADMIN' OR company_id = $3)",
      [body.condominiumId, user?.role, companyId]
    );
    if (!condominium.rowCount) return Response.json({ error: "Condominio invalido para esta empresa." }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO users (company_id, name, email, password_hash, role, phone, registration, shift, status, condominium_id)
     VALUES ($1,$2,$3,$4,'GUARD',$5,$6,$7,COALESCE($8,'Disponivel'),$9)
     RETURNING id, company_id, name, email, phone, registration, shift, status, condominium_id`,
    [
      companyId,
      body.name,
      String(body.email).toLowerCase(),
      hashPassword(body.password),
      body.phone ?? null,
      body.registration ?? null,
      body.shift ?? null,
      body.status ?? "Disponivel",
      body.condominiumId ?? null
    ]
  );
  return Response.json({ guard: rowsToCamel(result.rows)[0] }, { status: 201 });
}
