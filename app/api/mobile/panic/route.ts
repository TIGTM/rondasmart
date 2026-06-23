import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

export async function POST(request: Request) {
  const { user, response } = await requireSession(["GUARD", "CLIENT_ADMIN", "ADMIN", "SUPER_ADMIN"]);
  if (response) return response;

  const body = await request.json().catch(() => ({}));
  const result = await query(
    `INSERT INTO incidents (condominium_id, patrol_id, guard_id, type, location, description, priority, status)
     VALUES ($1,$2,$3,'Emergencia - botao de panico',$4,$5,'Emergencia','Aberta')
     RETURNING *`,
    [
      body.condominiumId ?? user?.condominiumId ?? null,
      body.patrolId ?? null,
      user?.id ?? null,
      body.location ?? "Localizacao nao informada",
      body.description ?? "Alerta de panico acionado pelo aplicativo mobile."
    ]
  );

  return Response.json({ incident: rowsToCamel(result.rows)[0] }, { status: 201 });
}
