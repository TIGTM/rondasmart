import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

export async function POST(request: Request) {
  const { user, response } = await requireSession(["ADMIN", "MANAGER", "GUARD"]);
  if (response) return response;

  const body = await request.json().catch(() => ({}));
  let patrolId = body.patrolId ? String(body.patrolId) : null;

  if (!patrolId) {
    const active = await query(
      `SELECT id
       FROM patrols
       WHERE guard_id = $1 AND status = 'Em andamento'
       ORDER BY started_at DESC NULLS LAST, created_at DESC
       LIMIT 1`,
      [user?.id]
    );
    patrolId = active.rows[0]?.id ?? null;
  }

  if (!patrolId) {
    return Response.json({ error: "Nenhuma ronda em andamento encontrada." }, { status: 404 });
  }

  const result = await query(
    `UPDATE patrols
     SET status = 'Finalizada', finished_at = now(), updated_at = now()
     WHERE id = $1
       AND ($2::text IN ('ADMIN','MANAGER') OR guard_id = $3)
     RETURNING *`,
    [patrolId, user?.role, user?.id]
  );

  if (!result.rowCount) {
    return Response.json({ error: "Ronda nao encontrada ou sem permissao." }, { status: 404 });
  }

  return Response.json({ patrol: rowsToCamel(result.rows)[0] });
}
