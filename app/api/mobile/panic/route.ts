import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

export async function POST(request: Request) {
  const { user, response } = await requireSession(["GUARD", "CLIENT_ADMIN", "ADMIN", "SUPER_ADMIN"]);
  if (response) return response;

  const body = await request.json().catch(() => ({}));
  const condominiumId = body.condominiumId ?? user?.condominiumId ?? null;
  if (condominiumId) {
    const condominium = await query(
      `SELECT id FROM condominiums
       WHERE id = $1 AND ($2::text = 'SUPER_ADMIN' OR company_id = $3)`,
      [condominiumId, user?.role, user?.companyId]
    );
    if (!condominium.rowCount) return Response.json({ error: "Condominio invalido para esta empresa." }, { status: 400 });
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
      return Response.json({ error: "Ronda invalida para este alerta." }, { status: 400 });
    }
  }
  const result = await query(
    `INSERT INTO incidents (condominium_id, patrol_id, guard_id, type, location, description, priority, status)
     VALUES ($1,$2,$3,'Emergencia - botao de panico',$4,$5,'Emergencia','Aberta')
     RETURNING *`,
    [
      condominiumId,
      patrolId,
      user?.id ?? null,
      body.location ?? "Localizacao nao informada",
      body.description ?? "Alerta de panico acionado pelo aplicativo mobile."
    ]
  );

  return Response.json({ incident: rowsToCamel(result.rows)[0] }, { status: 201 });
}
