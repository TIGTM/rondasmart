import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

export async function GET() {
  const { user, response } = await requireSession(["GUARD", "CLIENT_ADMIN", "ADMIN", "SUPER_ADMIN"]);
  if (response) return response;

  const active = await query(
    `SELECT p.*, c.name AS condominium_name
     FROM patrols p
     JOIN condominiums c ON c.id = p.condominium_id
     WHERE p.guard_id = $1 AND p.status = 'Em andamento'
     ORDER BY p.started_at DESC NULLS LAST, p.created_at DESC
     LIMIT 1`,
    [user?.id]
  );

  const patrol = active.rows[0] ?? null;
  const condominiumId = patrol?.condominium_id ?? user?.condominiumId ?? null;

  if (!condominiumId) {
    return Response.json({
      patrol: patrol ? rowsToCamel([patrol])[0] : null,
      checkpoints: []
    });
  }

  const checkpoints = await query(
    `SELECT cp.id, cp.name, cp.location, cp.qr_token, cp.status,
            cp.last_visit_at,
            v.visited_at,
            v.photo_url,
            v.notes
     FROM checkpoints cp
     LEFT JOIN patrol_visits v ON v.checkpoint_id = cp.id AND v.patrol_id = $1
     WHERE cp.condominium_id = $2
     ORDER BY cp.name`,
    [patrol?.id ?? null, condominiumId]
  );

  return Response.json({
    patrol: patrol ? rowsToCamel([patrol])[0] : null,
    checkpoints: rowsToCamel(checkpoints.rows)
  });
}
