import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";
import { randomUUID } from "node:crypto";

function normalizeQrToken(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, "").toUpperCase();
}

export async function GET() {
  const { user, response } = await requireSession(["SUPER_ADMIN", "CLIENT_ADMIN", "ADMIN", "MANAGER", "GUARD"]);
  if (response) return response;

  const params = user?.role === "SUPER_ADMIN" ? [] : [user?.companyId];
  const result = await query(
    `SELECT cp.*, c.name AS condominium_name
     FROM checkpoints cp
     JOIN condominiums c ON c.id = cp.condominium_id
     ${user?.role === "SUPER_ADMIN" ? "" : "WHERE c.company_id = $1"}
     ORDER BY c.name, cp.name`,
    params
  );
  return Response.json({ checkpoints: rowsToCamel(result.rows) });
}

export async function POST(request: Request) {
  const { user, response } = await requireSession(["SUPER_ADMIN", "CLIENT_ADMIN", "ADMIN", "MANAGER"]);
  if (response) return response;

  const body = await request.json();
  const qrToken = normalizeQrToken(body.qrToken || `RS-${randomUUID().slice(0, 8)}`);
  const condominium = await query(
    "SELECT id FROM condominiums WHERE id = $1 AND ($2::text = 'SUPER_ADMIN' OR company_id = $3)",
    [body.condominiumId, user?.role, user?.companyId]
  );
  if (!condominium.rowCount) return Response.json({ error: "Condominio invalido para esta empresa." }, { status: 400 });

  const duplicate = await query(
    "SELECT id FROM checkpoints WHERE upper(regexp_replace(qr_token, '[[:space:]]+', '', 'g')) = $1 LIMIT 1",
    [qrToken]
  );
  if (duplicate.rowCount) return Response.json({ error: "Ja existe um ponto com este codigo QR." }, { status: 409 });

  const result = await query(
    `INSERT INTO checkpoints (condominium_id, name, location, qr_token, status)
     VALUES ($1,$2,$3,$4,COALESCE($5,'Operacional'))
     RETURNING *`,
    [
      body.condominiumId,
      body.name,
      body.location ?? null,
      qrToken,
      body.status ?? "Operacional"
    ]
  );
  return Response.json({ checkpoint: rowsToCamel(result.rows)[0] }, { status: 201 });
}
