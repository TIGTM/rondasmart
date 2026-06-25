import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

export async function GET() {
  const { user, response } = await requireSession(["SUPER_ADMIN", "CLIENT_ADMIN", "ADMIN", "MANAGER", "GUARD"]);
  if (response) return response;

  const params = user?.role === "SUPER_ADMIN" ? [] : [user?.companyId];
  const result = await query(
    `SELECT p.*, c.name AS condominium_name, u.name AS guard_name,
            (SELECT count(*)::int FROM patrol_visits v WHERE v.patrol_id = p.id) AS completed_checkpoints,
            (SELECT count(*)::int FROM checkpoints cp WHERE cp.condominium_id = p.condominium_id) AS total_checkpoints,
            (SELECT count(*)::int FROM incidents i WHERE i.patrol_id = p.id) AS incidents_count,
            COALESCE(
              (
                SELECT jsonb_agg(
                  jsonb_build_object(
                  'visitedAt', v.visited_at,
                    'checkpointName', cp.name
                  )
                  ORDER BY v.visited_at
                )
                FROM patrol_visits v
                JOIN checkpoints cp ON cp.id = v.checkpoint_id
                WHERE v.patrol_id = p.id
              ),
              '[]'::jsonb
            ) AS visit_events,
            COALESCE(
              (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'createdAt', i.created_at,
                    'type', i.type,
                    'location', i.location
                  )
                  ORDER BY i.created_at
                )
                FROM incidents i
                WHERE i.patrol_id = p.id
              ),
              '[]'::jsonb
            ) AS incident_events
     FROM patrols p
     JOIN condominiums c ON c.id = p.condominium_id
     LEFT JOIN users u ON u.id = p.guard_id
     ${user?.role === "SUPER_ADMIN" ? "" : "WHERE c.company_id = $1"}
     ORDER BY p.created_at DESC
     LIMIT 100`,
    params
  );
  return Response.json({ patrols: rowsToCamel(result.rows) });
}

export async function POST(request: Request) {
  const { user, response } = await requireSession(["SUPER_ADMIN", "CLIENT_ADMIN", "ADMIN", "MANAGER", "GUARD"]);
  if (response) return response;

  const body = await request.json();
  if (!body.guardId && user?.id) {
    const active = await query(
      `SELECT *
       FROM patrols
       WHERE guard_id = $1 AND status = 'Em andamento'
       ORDER BY started_at DESC NULLS LAST, created_at DESC
       LIMIT 1`,
      [user.id]
    );
    if (active.rowCount) {
      return Response.json({ patrol: rowsToCamel(active.rows)[0] });
    }
  }

  const condominiumId = body.condominiumId ?? user?.condominiumId;
  if (!condominiumId) return Response.json({ error: "Condominio obrigatorio para iniciar ronda." }, { status: 400 });

  const condominium = await query(
    "SELECT id FROM condominiums WHERE id = $1 AND ($2::text = 'SUPER_ADMIN' OR company_id = $3)",
    [condominiumId, user?.role, user?.companyId]
  );
  if (!condominium.rowCount) return Response.json({ error: "Condominio invalido para esta empresa." }, { status: 400 });

  const guardId = body.guardId ?? user?.id;
  if (body.guardId) {
    const guard = await query(
      `SELECT id
       FROM users
       WHERE id = $1
         AND role = 'GUARD'
         AND ($2::text = 'SUPER_ADMIN' OR company_id = $3)
         AND (condominium_id IS NULL OR condominium_id = $4)`,
      [body.guardId, user?.role, user?.companyId, condominiumId]
    );
    if (!guard.rowCount) return Response.json({ error: "Vigilante invalido para esta empresa ou condominio." }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO patrols (condominium_id, guard_id, name, status, started_at)
     VALUES ($1,$2,$3,'Em andamento',now())
     RETURNING *`,
    [condominiumId, guardId, body.name ?? "Ronda em execucao"]
  );
  return Response.json({ patrol: rowsToCamel(result.rows)[0] }, { status: 201 });
}
