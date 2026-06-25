import { requireSession } from "@/lib/auth";
import { query, rowToCamel } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { user, response } = await requireSession(["SUPER_ADMIN", "CLIENT_ADMIN", "ADMIN", "MANAGER"]);
  if (response) return response;

  const { id } = await context.params;
  const body = await request.json();
  const status = String(body.status ?? "");
  if (!["Aberta", "Em analise", "Resolvida"].includes(status)) {
    return Response.json({ error: "Status invalido." }, { status: 400 });
  }

  const result = await query(
    `UPDATE incidents i
     SET status = $2, updated_at = now()
     WHERE i.id = $1
       AND (
         $3::text = 'SUPER_ADMIN'
         OR EXISTS (SELECT 1 FROM condominiums c WHERE c.id = i.condominium_id AND c.company_id = $4)
         OR EXISTS (SELECT 1 FROM users u WHERE u.id = i.guard_id AND u.company_id = $4)
       )
     RETURNING i.*`,
    [id, status, user?.role, user?.companyId]
  );

  if (!result.rowCount) return Response.json({ error: "Ocorrencia nao encontrada." }, { status: 404 });
  return Response.json({ incident: rowToCamel(result.rows[0]) });
}
