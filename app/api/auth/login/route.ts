import { createSession, verifyPassword } from "@/lib/auth";
import { query, rowToCamel } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!email || !password) {
    return Response.json({ error: "Informe e-mail e senha." }, { status: 400 });
  }

  const result = await query(
    `SELECT id, name, email, role, password_hash, company_id, condominium_id
     FROM users
     WHERE lower(email) = $1
     LIMIT 1`,
    [email]
  );

  const user = result.rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) {
    return Response.json({ error: "Credenciais invalidas." }, { status: 401 });
  }

  await createSession(user.id);
  const safeUser = rowToCamel({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    company_id: user.company_id,
    condominium_id: user.condominium_id
  });

  return Response.json({ user: safeUser });
}
