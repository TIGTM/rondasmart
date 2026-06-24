import { hashPassword, requireSession } from "@/lib/auth";
import { pool, query, rowsToCamel } from "@/lib/db";

export async function GET() {
  const { response } = await requireSession(["SUPER_ADMIN"]);
  if (response) return response;

  const result = await query(
    `SELECT c.*,
            count(DISTINCT co.id)::int AS condominiums_count,
            count(DISTINCT u.id) FILTER (WHERE u.role = 'GUARD')::int AS guards_count
     FROM companies c
     LEFT JOIN condominiums co ON co.company_id = c.id
     LEFT JOIN users u ON u.company_id = c.id
     GROUP BY c.id
     ORDER BY c.created_at DESC`
  );

  return Response.json({ companies: rowsToCamel(result.rows) });
}

export async function POST(request: Request) {
  const { response } = await requireSession(["SUPER_ADMIN"]);
  if (response) return response;

  const body = await request.json();
  if (!body.name) return Response.json({ error: "Nome do cliente obrigatorio." }, { status: 400 });
  if (!body.adminName || !body.adminEmail) return Response.json({ error: "Administrador do cliente obrigatorio." }, { status: 400 });
  if (String(body.adminPassword ?? "").length < 8) return Response.json({ error: "A senha inicial deve ter pelo menos 8 caracteres." }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const company = await client.query(
      `INSERT INTO companies (name, document, contact_name, contact_email, contact_phone, plan, status)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6,'Essencial'),COALESCE($7,'Ativo'))
       RETURNING *`,
      [
        body.name,
        body.document ?? null,
        body.contactName ?? null,
        body.contactEmail ?? null,
        body.contactPhone ?? null,
        body.plan ?? "Essencial",
        body.status ?? "Ativo"
      ]
    );

    await client.query(
      `INSERT INTO users (company_id, name, email, password_hash, role, status)
       VALUES ($1,$2,$3,$4,'CLIENT_ADMIN','Disponivel')`,
      [
        company.rows[0].id,
        body.adminName,
        String(body.adminEmail).toLowerCase(),
        hashPassword(body.adminPassword)
      ]
    );

    await client.query("COMMIT");
    return Response.json({ company: rowsToCamel(company.rows)[0] }, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    if ((error as { code?: string }).code === "23505") {
      return Response.json({ error: "Cliente ou e-mail do administrador ja cadastrado." }, { status: 409 });
    }
    throw error;
  } finally {
    client.release();
  }
}
