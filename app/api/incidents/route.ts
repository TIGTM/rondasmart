import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

export async function GET() {
  const { response } = await requireSession(["ADMIN", "MANAGER", "GUARD"]);
  if (response) return response;

  const result = await query(
    `SELECT i.*, c.name AS condominium_name, u.name AS guard_name
     FROM incidents i
     LEFT JOIN condominiums c ON c.id = i.condominium_id
     LEFT JOIN users u ON u.id = i.guard_id
     ORDER BY i.created_at DESC
     LIMIT 100`
  );
  return Response.json({ incidents: rowsToCamel(result.rows) });
}

export async function POST(request: Request) {
  const { user, response } = await requireSession(["ADMIN", "MANAGER", "GUARD"]);
  if (response) return response;

  const body = await request.json();
  const result = await query(
    `INSERT INTO incidents (condominium_id, patrol_id, guard_id, type, location, description, priority, status, photo_url)
     VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,'Media'),COALESCE($8,'Aberta'),$9)
     RETURNING *`,
    [
      body.condominiumId ?? user?.condominiumId ?? null,
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
