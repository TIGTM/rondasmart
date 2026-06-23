import { cookies } from "next/headers";
import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { query, rowToCamel } from "@/lib/db";

const COOKIE_NAME = "ronda_session";
const SESSION_DAYS = 7;

function shouldUseSecureCookie() {
  if (process.env.COOKIE_SECURE) return process.env.COOKIE_SECURE === "true";
  return Boolean(process.env.PUBLIC_APP_URL?.startsWith("https://"));
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "CLIENT_ADMIN" | "ADMIN" | "MANAGER" | "GUARD";
  companyId?: string | null;
  condominiumId?: string | null;
};

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const iterations = 120000;
  const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationsText, salt, expectedHash] = storedHash.split("$");
  if (algorithm !== "pbkdf2_sha256" || !iterationsText || !salt || !expectedHash) return false;

  const actual = pbkdf2Sync(password, salt, Number(iterationsText), 32, "sha256");
  const expected = Buffer.from(expectedHash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash(token), expiresAt]
  );

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    expires: expiresAt
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash(token)]);
  }
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const result = await query(
    `SELECT u.id, u.name, u.email, u.role, u.company_id, u.condominium_id
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()
     LIMIT 1`,
    [tokenHash(token)]
  );

  if (!result.rowCount) return null;
  return rowToCamel(result.rows[0]) as SessionUser;
}

export async function requireSession(roles?: SessionUser["role"][]) {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, response: Response.json({ error: "Nao autenticado" }, { status: 401 }) };
  }
  if (roles && !roles.includes(user.role)) {
    return { user, response: Response.json({ error: "Sem permissao" }, { status: 403 }) };
  }
  return { user, response: null };
}
