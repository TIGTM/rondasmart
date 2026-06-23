import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

export async function GET() {
  const { user, response } = await requireSession(["SUPER_ADMIN", "CLIENT_ADMIN", "ADMIN", "MANAGER", "GUARD"]);
  if (response) return response;

  const params = user?.role === "SUPER_ADMIN" ? [] : [user?.companyId];
  const result = await query(
    `SELECT i.*, c.name AS condominium_name, u.name AS guard_name
     FROM incidents i
     LEFT JOIN condominiums c ON c.id = i.condominium_id
     LEFT JOIN users u ON u.id = i.guard_id
     ${user?.role === "SUPER_ADMIN" ? "" : "WHERE c.company_id = $1 OR u.company_id = $1"}
     ORDER BY i.created_at DESC
     LIMIT 100`,
    params
  );
  return Response.json({ incidents: rowsToCamel(result.rows) });
}

export async function POST(request: Request) {
  const { user, response } = await requireSession(["SUPER_ADMIN", "CLIENT_ADMIN", "ADMIN", "MANAGER", "GUARD"]);
  if (response) return response;

  const body = await request.json();
  const condominiumId = body.condominiumId ?? user?.condominiumId ?? null;
  if (condominiumId) {
    const condominium = await query(
      "SELECT id FROM condominiums WHERE id = $1 AND ($2::text = 'SUPER_ADMIN' OR company_id = $3)",
      [condominiumId, user?.role, user?.companyId]
    );
    if (!condominium.rowCount) return Response.json({ error: "Condominio invalido para esta empresa." }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO incidents (condominium_id, patrol_id, guard_id, type, location, description, priority, status, photo_url)
     VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,'Media'),COALESCE($8,'Aberta'),$9)
     RETURNING *`,
    [
      condominiumId,
      body.patrolId ?? null,
      body.guardId ?? user?.id ?? null,
      body.type,
      body.location ?? null,
      body.description ?? null,
      body.priority ?? "Media",
      body.status ?? "Aberta",
      body.photoUrl ?? null
    ]
  );
  return Response.json({ incident: rowsToCamel(result.rows)[0] }, { status: 201 });
}
