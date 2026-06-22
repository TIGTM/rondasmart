import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

export async function GET() {
  const { response } = await requireSession(["ADMIN", "MANAGER"]);
  if (response) return response;

  const result = await query(
    `SELECT c.*, count(u.id)::int AS guards_count
     FROM condominiums c
     LEFT JOIN users u ON u.condominium_id = c.id AND u.role = 'GUARD'
     GROUP BY c.id
     ORDER BY c.name`
  );
  return Response.json({ condominiums: rowsToCamel(result.rows) });
}

export async function POST(request: Request) {
  const { response } = await requireSession(["ADMIN"]);
  if (response) return response;

  const body = await request.json();
  const result = await query(
    `INSERT INTO condominiums (name, document, address, city, district, manager_name, manager_phone, manager_email, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,'Ativo'))
     RETURNING *`,
    [
      body.name,
      body.document ?? null,
      body.address ?? null,
      body.city,
      body.district ?? null,
      body.managerName ?? null,
      body.managerPhone ?? null,
      body.managerEmail ?? null,
      body.status ?? "Ativo"
    ]
  );
  return Response.json({ condominium: rowsToCamel(result.rows)[0] }, { status: 201 });
}
