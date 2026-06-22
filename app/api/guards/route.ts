import { hashPassword, requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

export async function GET() {
  const { response } = await requireSession(["ADMIN", "MANAGER"]);
  if (response) return response;

  const result = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.registration, u.shift, u.status, u.condominium_id,
            c.name AS condominium_name
     FROM users u
     LEFT JOIN condominiums c ON c.id = u.condominium_id
     WHERE u.role = 'GUARD'
     ORDER BY u.name`
  );
  return Response.json({ guards: rowsToCamel(result.rows) });
}

export async function POST(request: Request) {
  const { response } = await requireSession(["ADMIN"]);
  if (response) return response;

  const body = await request.json();
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role, phone, registration, shift, status, condominium_id)
     VALUES ($1,$2,$3,'GUARD',$4,$5,$6,COALESCE($7,'Disponivel'),$8)
     RETURNING id, name, email, phone, registration, shift, status, condominium_id`,
    [
      body.name,
      String(body.email).toLowerCase(),
      hashPassword(body.password ?? "rondasmart-demo"),
      body.phone ?? null,
      body.registration ?? null,
      body.shift ?? null,
      body.status ?? "Disponivel",
      body.condominiumId ?? null
    ]
  );
  return Response.json({ guard: rowsToCamel(result.rows)[0] }, { status: 201 });
}
