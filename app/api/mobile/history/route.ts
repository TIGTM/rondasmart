import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

export async function GET() {
  const { user, response } = await requireSession(["GUARD"]);
  if (response) return response;

  const patrols = await query(
    `SELECT p.id, p.name, p.status, p.started_at, p.finished_at, p.created_at,
            c.name AS condominium_name,
            (SELECT count(*)::int FROM patrol_visits v WHERE v.patrol_id = p.id) AS completed_checkpoints,
            (SELECT count(*)::int FROM checkpoints cp WHERE cp.condominium_id = p.condominium_id) AS total_checkpoints,
            (SELECT count(*)::int FROM incidents i WHERE i.patrol_id = p.id) AS incidents_count
     FROM patrols p
     JOIN condominiums c ON c.id = p.condominium_id
     WHERE p.guard_id = $1
     ORDER BY p.created_at DESC
     LIMIT 30`,
    [user?.id]
  );

  const incidents = await query(
    `SELECT i.id, i.type, i.location, i.description, i.priority, i.status, i.created_at,
            c.name AS condominium_name,
            p.name AS patrol_name
     FROM incidents i
     LEFT JOIN condominiums c ON c.id = i.condominium_id
     LEFT JOIN patrols p ON p.id = i.patrol_id
     WHERE i.guard_id = $1
     ORDER BY i.created_at DESC
     LIMIT 30`,
    [user?.id]
  );

  return Response.json({
    patrols: rowsToCamel(patrols.rows),
    incidents: rowsToCamel(incidents.rows)
  });
}
