import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";
import { randomUUID } from "node:crypto";

export async function GET() {
  const { response } = await requireSession(["ADMIN", "MANAGER", "GUARD"]);
  if (response) return response;

  const result = await query(
    `SELECT cp.*, c.name AS condominium_name
     FROM checkpoints cp
     JOIN condominiums c ON c.id = cp.condominium_id
     ORDER BY c.name, cp.name`
  );
  return Response.json({ checkpoints: rowsToCamel(result.rows) });
}

export async function POST(request: Request) {
  const { response } = await requireSession(["ADMIN", "MANAGER"]);
  if (response) return response;

  const body = await request.json();
  const result = await query(
    `INSERT INTO checkpoints (condominium_id, name, location, qr_token, status)
     VALUES ($1,$2,$3,$4,COALESCE($5,'Operacional'))
     RETURNING *`,
    [
      body.condominiumId,
      body.name,
      body.location ?? null,
      body.qrToken ?? `RS-${randomUUID().slice(0, 8).toUpperCase()}`,
      body.status ?? "Operacional"
    ]
  );
  return Response.json({ checkpoint: rowsToCamel(result.rows)[0] }, { status: 201 });
}
