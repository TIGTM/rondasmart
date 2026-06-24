import { requireSession } from "@/lib/auth";
import { query, rowToCamel } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireSession(["SUPER_ADMIN"]);
  if (response) return response;

  const { id } = await context.params;
  const body = await request.json();
  if (body.status !== "Cancelado") return Response.json({ error: "Status invalido." }, { status: 400 });

  const result = await query(
    `UPDATE contracts
     SET status = 'Cancelado', updated_at = now()
     WHERE id = $1 AND status = 'Aguardando assinatura'
     RETURNING id, status, updated_at`,
    [id]
  );
  if (!result.rowCount) return Response.json({ error: "Contrato nao encontrado ou ja assinado." }, { status: 409 });
  return Response.json({ contract: rowToCamel(result.rows[0]) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response } = await requireSession(["SUPER_ADMIN"]);
  if (response) return response;

  const { id } = await context.params;
  const result = await query(
    `DELETE FROM contracts
     WHERE id = $1
     RETURNING id, title, status`,
    [id]
  );
  if (!result.rowCount) return Response.json({ error: "Contrato nao encontrado." }, { status: 404 });
  return Response.json({ contract: rowToCamel(result.rows[0]) });
}
