import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

export async function POST(request: Request) {
  const { user, response } = await requireSession(["GUARD", "CLIENT_ADMIN", "ADMIN", "SUPER_ADMIN"]);
  if (response) return response;

  const body = await request.json();
  const qrToken = String(body.qrToken ?? "").trim();
  const patrolId = body.patrolId ? String(body.patrolId) : null;
  const photoUrl = body.photoUrl ? String(body.photoUrl) : null;

  if (!qrToken) {
    return Response.json({ error: "QR Code obrigatorio." }, { status: 400 });
  }
  if (photoUrl && (!photoUrl.startsWith("data:image/") || photoUrl.length > 1_500_000)) {
    return Response.json({ error: "A foto enviada e invalida ou muito grande." }, { status: 400 });
  }

  const checkpoint = await query(
    `SELECT cp.*, c.company_id
     FROM checkpoints cp
     JOIN condominiums c ON c.id = cp.condominium_id
     WHERE cp.qr_token = $1
       AND ($2::text = 'SUPER_ADMIN' OR c.company_id = $3)
     LIMIT 1`,
    [qrToken, user?.role, user?.companyId]
  );

  if (!checkpoint.rowCount) {
    return Response.json({ error: "Ponto de ronda nao encontrado." }, { status: 404 });
  }

  const checkpointRow = checkpoint.rows[0];
  if (user?.role === "GUARD" && user.condominiumId && user.condominiumId !== checkpointRow.condominium_id) {
    return Response.json({ error: "Este QR Code pertence a outro condominio." }, { status: 403 });
  }

  if (patrolId) {
    const allowedPatrol = await query(
      `SELECT p.id
       FROM patrols p
       JOIN condominiums c ON c.id = p.condominium_id
       WHERE p.id = $1
         AND p.condominium_id = $2
         AND ($3::text = 'SUPER_ADMIN' OR c.company_id = $4)
         AND ($3::text <> 'GUARD' OR p.guard_id = $5)`,
      [patrolId, checkpointRow.condominium_id, user?.role, user?.companyId, user?.id]
    );
    if (!allowedPatrol.rowCount) {
      return Response.json({ error: "Ronda invalida para este ponto." }, { status: 403 });
    }
  }

  let activePatrolId = patrolId;
  if (!activePatrolId) {
    const patrol = await query(
      `SELECT id, condominium_id
       FROM patrols
       WHERE guard_id = $1 AND status = 'Em andamento'
       ORDER BY started_at DESC NULLS LAST, created_at DESC
       LIMIT 1`,
      [user?.id]
    );
    if (patrol.rows[0]?.id && patrol.rows[0].condominium_id === checkpointRow.condominium_id) {
      activePatrolId = patrol.rows[0].id;
    } else if (patrol.rows[0]?.id) {
      return Response.json({ error: "Finalize a ronda atual antes de validar ponto de outro condominio." }, { status: 409 });
    }
  }

  if (!activePatrolId) {
    const patrol = await query(
      `INSERT INTO patrols (condominium_id, guard_id, name, status, started_at)
       VALUES ($1,$2,'Ronda iniciada pelo app','Em andamento',now())
       RETURNING id`,
      [checkpointRow.condominium_id, user?.id]
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
    [activePatrolId, checkpointRow.id, photoUrl, body.notes ?? "Validado pelo app mobile"]
  );

  await query("UPDATE checkpoints SET last_visit_at = now(), updated_at = now() WHERE id = $1", [checkpointRow.id]);

  const visits = await query(
    `SELECT cp.id, cp.name, cp.qr_token, v.visited_at, v.photo_url
     FROM checkpoints cp
     LEFT JOIN patrol_visits v ON v.checkpoint_id = cp.id AND v.patrol_id = $1
     WHERE cp.condominium_id = $2
     ORDER BY cp.name`,
    [activePatrolId, checkpointRow.condominium_id]
  );

  return Response.json({
    patrolId: activePatrolId,
    checkpoint: rowsToCamel([checkpointRow])[0],
    visits: rowsToCamel(visits.rows)
  });
}
