import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

export async function POST(request: Request) {
  const { user, response } = await requireSession(["GUARD", "ADMIN"]);
  if (response) return response;

  const body = await request.json();
  const qrToken = String(body.qrToken ?? "").trim();
  const patrolId = body.patrolId ? String(body.patrolId) : null;

  if (!qrToken) {
    return Response.json({ error: "QR Code obrigatorio." }, { status: 400 });
  }

  const checkpoint = await query(
    `SELECT cp.*
     FROM checkpoints cp
     WHERE cp.qr_token = $1
     LIMIT 1`,
    [qrToken]
  );

  if (!checkpoint.rowCount) {
    return Response.json({ error: "Ponto de ronda nao encontrado." }, { status: 404 });
  }

  let activePatrolId = patrolId;
  if (!activePatrolId) {
    const patrol = await query(
      `SELECT id
       FROM patrols
       WHERE guard_id = $1 AND status = 'Em andamento'
       ORDER BY started_at DESC NULLS LAST, created_at DESC
       LIMIT 1`,
      [user?.id]
    );
    activePatrolId = patrol.rows[0]?.id;
  }

  if (!activePatrolId) {
    const patrol = await query(
      `INSERT INTO patrols (condominium_id, guard_id, name, status, started_at)
       VALUES ($1,$2,'Ronda iniciada pelo app','Em andamento',now())
       RETURNING id`,
      [checkpoint.rows[0].condominium_id, user?.id]
    );
    activePatrolId = patrol.rows[0].id;
  }

  await query(
    `INSERT INTO patrol_visits (patrol_id, checkpoint_id, photo_url, notes)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (patrol_id, checkpoint_id) DO UPDATE SET
       visited_at = now(),
       photo_url = COALESCE(EXCLUDED.photo_url, patrol_visits.photo_url),
       notes = EXCLUDED.notes`,
    [activePatrolId, checkpoint.rows[0].id, body.photoUrl ?? null, body.notes ?? "Validado pelo app mobile"]
  );

  await query("UPDATE checkpoints SET last_visit_at = now(), updated_at = now() WHERE id = $1", [checkpoint.rows[0].id]);

  const visits = await query(
    `SELECT cp.id, cp.name, cp.qr_token, v.visited_at, v.photo_url
     FROM checkpoints cp
     LEFT JOIN patrol_visits v ON v.checkpoint_id = cp.id AND v.patrol_id = $1
     WHERE cp.condominium_id = $2
     ORDER BY cp.name`,
    [activePatrolId, checkpoint.rows[0].condominium_id]
  );

  return Response.json({
    patrolId: activePatrolId,
    checkpoint: rowsToCamel([checkpoint.rows[0]])[0],
    visits: rowsToCamel(visits.rows)
  });
}
