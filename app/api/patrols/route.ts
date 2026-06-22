import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

export async function GET() {
  const { response } = await requireSession(["ADMIN", "MANAGER", "GUARD"]);
  if (response) return response;

  const result = await query(
    `SELECT p.*, c.name AS condominium_name, u.name AS guard_name,
            count(v.id)::int AS completed_checkpoints
     FROM patrols p
     JOIN condominiums c ON c.id = p.condominium_id
     LEFT JOIN users u ON u.id = p.guard_id
     LEFT JOIN patrol_visits v ON v.patrol_id = p.id
     GROUP BY p.id, c.name, u.name
     ORDER BY p.created_at DESC
     LIMIT 100`
  );
  return Response.json({ patrols: rowsToCamel(result.rows) });
}

export async function POST(request: Request) {
  const { user, response } = await requireSession(["ADMIN", "MANAGER", "GUARD"]);
  if (response) return response;

  const body = await request.json();
  const result = await query(
    `INSERT INTO patrols (condominium_id, guard_id, name, status, started_at)
     VALUES ($1,$2,$3,'Em andamento',now())
     RETURNING *`,
    [body.condominiumId ?? user?.condominiumId, body.guardId ?? user?.id, body.name ?? "Ronda em execucao"]
  );
  return Response.json({ patrol: rowsToCamel(result.rows)[0] }, { status: 201 });
}
