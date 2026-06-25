import { hashPassword, requireSession } from "@/lib/auth";
import { pool, query, rowsToCamel } from "@/lib/db";

export async function GET() {
  const { response } = await requireSession(["SUPER_ADMIN"]);
  if (response) return response;

  const result = await query(
    `SELECT u.id, u.name, u.email, u.role, u.status, u.shift, u.created_at,
            u.company_id, c.name AS company_name, co.name AS condominium_name
     FROM users u
     LEFT JOIN companies c ON c.id = u.company_id
     LEFT JOIN condominiums co ON co.id = u.condominium_id
     ORDER BY c.name NULLS LAST, u.name`
  );
  return Response.json({ users: rowsToCamel(result.rows) });
}

export async function PATCH(request: Request) {
  const { user: master, response } = await requireSession(["SUPER_ADMIN"]);
  if (response) return response;

  const body = await request.json();
  const userId = String(body.userId ?? "");
  const password = String(body.password ?? "");
  if (!userId) return Response.json({ error: "Usuario obrigatorio." }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "A nova senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  if (password.length > 128) return Response.json({ error: "A senha informada e muito longa." }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE users
       SET password_hash = $2, updated_at = now()
       WHERE id = $1
       RETURNING id, name, email, role`,
      [userId, hashPassword(password)]
    );
    if (!result.rowCount) {
      await client.query("ROLLBACK");
      return Response.json({ error: "Usuario nao encontrado." }, { status: 404 });
    }

    await client.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
    await client.query("COMMIT");

    return Response.json({
      user: rowsToCamel(result.rows)[0],
      currentSessionEnded: master?.id === userId
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
