import { readFile } from "node:fs/promises";
import { createHash, pbkdf2Sync, randomBytes } from "node:crypto";
import pg from "pg";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ?? "postgres://ronda:ronda@127.0.0.1:5432/rondasmart";

const pool = new Pool({ connectionString });

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$120000$${salt}$${hash}`;
}

async function upsertCompany(client, data) {
  const result = await client.query(
    `INSERT INTO companies (name, document, contact_name, contact_email, contact_phone, plan, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (name) DO UPDATE SET
       document = EXCLUDED.document,
       contact_name = EXCLUDED.contact_name,
       contact_email = EXCLUDED.contact_email,
       contact_phone = EXCLUDED.contact_phone,
       plan = EXCLUDED.plan,
       status = EXCLUDED.status,
       updated_at = now()
     RETURNING id`,
    [
      data.name,
      data.document,
      data.contactName,
      data.contactEmail,
      data.contactPhone,
      data.plan,
      data.status
    ]
  );
  return result.rows[0].id;
}

async function upsertCondominium(client, data) {
  const result = await client.query(
    `INSERT INTO condominiums (company_id, name, document, address, city, district, manager_name, manager_phone, manager_email, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (company_id, name) DO UPDATE SET
       company_id = EXCLUDED.company_id,
       city = EXCLUDED.city,
       district = EXCLUDED.district,
       manager_name = EXCLUDED.manager_name,
       status = EXCLUDED.status,
       updated_at = now()
     RETURNING id`,
    [
      data.companyId,
      data.name,
      data.document,
      data.address,
      data.city,
      data.district,
      data.managerName,
      data.managerPhone,
      data.managerEmail,
      data.status
    ]
  );
  return result.rows[0].id;
}

async function upsertUser(client, data) {
  await client.query(
    `INSERT INTO users (company_id, name, email, password_hash, role, phone, registration, shift, status, condominium_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (email) DO UPDATE SET
       company_id = EXCLUDED.company_id,
       name = EXCLUDED.name,
       role = EXCLUDED.role,
       phone = EXCLUDED.phone,
       shift = EXCLUDED.shift,
       status = EXCLUDED.status,
       condominium_id = EXCLUDED.condominium_id,
       updated_at = now()`,
    [
      data.companyId,
      data.name,
      data.email,
      hashPassword(data.password),
      data.role,
      data.phone,
      data.registration,
      data.shift,
      data.status,
      data.condominiumId
    ]
  );
}

async function main() {
  const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(schema);

    const platformCompany = await upsertCompany(client, {
      name: "Ronda Smart Plataforma",
      document: "00.000.000/0001-00",
      contactName: "Administrador Ronda Smart",
      contactEmail: "admin@rondasmart.com.br",
      contactPhone: "31 0000-0000",
      plan: "Interno",
      status: "Ativo"
    });

    await upsertUser(client, {
      name: "Administrador Ronda Smart",
      email: "admin@rondasmart.com.br",
      password: "rondasmart-demo",
      role: "SUPER_ADMIN",
      status: "Disponivel",
      companyId: platformCompany,
      condominiumId: null
    });

    await client.query("COMMIT");

    const digest = createHash("sha256").update(connectionString).digest("hex").slice(0, 8);
    console.log(`Database ready (${digest}).`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
