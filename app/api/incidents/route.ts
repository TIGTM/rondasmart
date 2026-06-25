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
  const type = String(body.type ?? "").trim();
  const location = String(body.location ?? "").trim();
  const description = String(body.description ?? "").trim();
  const photoUrl = body.photoUrl ? String(body.photoUrl) : null;
  if (!type || !location || !description) {
    return Response.json({ error: "Tipo, local e descricao sao obrigatorios." }, { status: 400 });
  }
  if (photoUrl && (!photoUrl.startsWith("data:image/") || photoUrl.length > 1_500_000)) {
    return Response.json({ error: "A foto enviada e invalida ou muito grande." }, { status: 400 });
  }
  const condominiumId = body.condominiumId ?? user?.condominiumId ?? null;
  if (condominiumId) {
    const condominium = await query(
      "SELECT id FROM condominiums WHERE id = $1 AND ($2::text = 'SUPER_ADMIN' OR company_id = $3)",
      [condominiumId, user?.role, user?.companyId]
    );
    if (!condominium.rowCount) return Response.json({ error: "Condominio invalido para esta empresa." }, { status: 400 });
  }
  const guardId = user?.role === "GUARD" ? user.id : body.guardId ?? user?.id ?? null;
  if (guardId) {
    const guard = await query(
      `SELECT id FROM users
       WHERE id = $1 AND ($2::text = 'SUPER_ADMIN' OR company_id = $3)`,
      [guardId, user?.role, user?.companyId]
    );
    if (!guard.rowCount) return Response.json({ error: "Usuario responsavel invalido para esta empresa." }, { status: 400 });
  }
  const patrolId = body.patrolId ?? null;
  if (patrolId) {
    const patrol = await query(
      `SELECT p.id, p.condominium_id
       FROM patrols p
       JOIN condominiums c ON c.id = p.condominium_id
       WHERE p.id = $1
         AND ($2::text = 'SUPER_ADMIN' OR c.company_id = $3)
         AND ($2::text <> 'GUARD' OR p.guard_id = $4)`,
      [patrolId, user?.role, user?.companyId, user?.id]
    );
    if (!patrol.rowCount || (condominiumId && patrol.rows[0].condominium_id !== condominiumId)) {
      return Response.json({ error: "Ronda invalida para esta ocorrencia." }, { status: 400 });
    }
  }

  const result = await query(
    `INSERT INTO incidents (condominium_id, patrol_id, guard_id, type, location, description, priority, status, photo_url)
     VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,'Media'),COALESCE($8,'Aberta'),$9)
     RETURNING *`,
    [
      condominiumId,
      patrolId,
      guardId,
      type,
      location,
      description,
      body.priority ?? "Media",
      body.status ?? "Aberta",
      photoUrl
    ]
  );
  return Response.json({ incident: rowsToCamel(result.rows)[0] }, { status: 201 });
}
