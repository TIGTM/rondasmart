import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

export async function GET() {
  const { user, response } = await requireSession(["SUPER_ADMIN", "CLIENT_ADMIN", "ADMIN", "MANAGER"]);
  if (response) return response;

  const params = user?.role === "SUPER_ADMIN" ? [] : [user?.companyId];
  const result = await query(
    `SELECT c.*, count(u.id)::int AS guards_count
     FROM condominiums c
     LEFT JOIN users u ON u.condominium_id = c.id AND u.role = 'GUARD'
     ${user?.role === "SUPER_ADMIN" ? "" : "WHERE c.company_id = $1"}
     GROUP BY c.id
     ORDER BY c.name`,
    params
  );
  return Response.json({ condominiums: rowsToCamel(result.rows) });
}

export async function POST(request: Request) {
  const { user, response } = await requireSession(["SUPER_ADMIN", "CLIENT_ADMIN", "ADMIN", "MANAGER"]);
  if (response) return response;

  const body = await request.json();
  const companyId = user?.role === "SUPER_ADMIN" ? body.companyId : user?.companyId;
  if (!companyId) return Response.json({ error: "Empresa obrigatoria." }, { status: 400 });

  const result = await query(
    `INSERT INTO condominiums (company_id, name, document, address, city, district, manager_name, manager_phone, manager_email, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,'Ativo'))
     RETURNING *`,
    [
      companyId,
      body.name,
      body.document ?? null,
      body.address ?? null,
      body.city,
      body.district ?? null,
      body.managerName ?? null,
      body.managerPhone ?? null,
      body.managerEmail ?? null,
      body.status ?? "Ativo"
    ]
  );
  return Response.json({ condominium: rowsToCamel(result.rows)[0] }, { status: 201 });
}
