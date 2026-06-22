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

async function upsertCondominium(client, data) {
  const result = await client.query(
    `INSERT INTO condominiums (name, document, address, city, district, manager_name, manager_phone, manager_email, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (name) DO UPDATE SET
       city = EXCLUDED.city,
       district = EXCLUDED.district,
       manager_name = EXCLUDED.manager_name,
       status = EXCLUDED.status,
       updated_at = now()
     RETURNING id`,
    [
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
    `INSERT INTO users (name, email, password_hash, role, phone, registration, shift, status, condominium_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       role = EXCLUDED.role,
       phone = EXCLUDED.phone,
       shift = EXCLUDED.shift,
       status = EXCLUDED.status,
       condominium_id = EXCLUDED.condominium_id,
       updated_at = now()`,
    [
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

    const jardim = await upsertCondominium(client, {
      name: "Condominio Jardim America",
      document: "12.345.678/0001-90",
      address: "Rua das Acacias, 120",
      city: "Belo Horizonte/MG",
      district: "Sion",
      managerName: "Marina Duarte",
      managerPhone: "31 3333-0101",
      managerEmail: "marina@jardimamerica.com.br",
      status: "Ativo"
    });
    const monte = await upsertCondominium(client, {
      name: "Residencial Monte Verde",
      document: "23.456.789/0001-10",
      address: "Alameda Verde, 45",
      city: "Nova Lima/MG",
      district: "Vila da Serra",
      managerName: "Rafael Mendes",
      managerPhone: "31 3333-0202",
      managerEmail: "rafael@monteverde.com.br",
      status: "Ativo"
    });
    const solar = await upsertCondominium(client, {
      name: "Edificio Solar das Palmeiras",
      document: "34.567.890/0001-20",
      address: "Av. Joao Cesar, 980",
      city: "Contagem/MG",
      district: "Eldorado",
      managerName: "Claudia Rocha",
      managerPhone: "31 3333-0303",
      managerEmail: "claudia@solarpalmeiras.com.br",
      status: "Implantacao"
    });

    const guards = [
      ["Joao Pereira", "vigilante@rondasmart.com.br", "GUARD", "31 99910-1010", "RS-0042", "07:00 - 19:00", "Em ronda", jardim],
      ["Marcos Silva", "marcos@rondasmart.com.br", "GUARD", "31 99920-2020", "RS-0043", "19:00 - 07:00", "Disponivel", monte],
      ["Carlos Andrade", "carlos@rondasmart.com.br", "GUARD", "31 99930-3030", "RS-0044", "07:00 - 19:00", "Offline", solar],
      ["Fernanda Costa", "fernanda@rondasmart.com.br", "GUARD", "31 99940-4040", "RS-0045", "12:00 - 00:00", "Em alerta", jardim]
    ];

    await upsertUser(client, {
      name: "Administrador Ronda Smart",
      email: "admin@rondasmart.com.br",
      password: "rondasmart-demo",
      role: "ADMIN",
      status: "Disponivel",
      condominiumId: null
    });

    for (const [name, email, role, phone, registration, shift, status, condominiumId] of guards) {
      await upsertUser(client, {
        name,
        email,
        password: "rondasmart-demo",
        role,
        phone,
        registration,
        shift,
        status,
        condominiumId
      });
    }

    const checkpointNames = [
      "Portaria Principal",
      "Bloco A",
      "Bloco B",
      "Piscina",
      "Salao de Festas",
      "Garagem G1",
      "Garagem G2",
      "Casa de Maquinas",
      "Area Gourmet",
      "Playground"
    ];

    for (const [index, name] of checkpointNames.entries()) {
      await client.query(
        `INSERT INTO checkpoints (condominium_id, name, location, qr_token, status, last_visit_at)
         VALUES ($1,$2,$3,$4,$5, now() - (($6 || ' minutes')::interval))
         ON CONFLICT (qr_token) DO UPDATE SET
           name = EXCLUDED.name,
           location = EXCLUDED.location,
           status = EXCLUDED.status,
           updated_at = now()`,
        [
          jardim,
          name,
          index < 3 ? "Acesso e blocos" : index < 7 ? "Area comum" : "Area tecnica",
          `RS-${String(index + 1).padStart(3, "0")}`,
          index % 4 === 0 ? "Pendente" : "Operacional",
          12 + index * 9
        ]
      );
    }

    const guardResult = await client.query("SELECT id FROM users WHERE email = $1", ["vigilante@rondasmart.com.br"]);
    const guardId = guardResult.rows[0].id;
    const patrolResult = await client.query(
      `INSERT INTO patrols (condominium_id, guard_id, name, status, started_at)
       VALUES ($1,$2,'Ronda Jardim America - Manha','Em andamento', now() - interval '42 minutes')
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [jardim, guardId]
    );

    if (patrolResult.rows[0]?.id) {
      const patrolId = patrolResult.rows[0].id;
      const visited = await client.query("SELECT id FROM checkpoints WHERE condominium_id = $1 ORDER BY name LIMIT 3", [jardim]);
      for (const checkpoint of visited.rows) {
        await client.query(
          `INSERT INTO patrol_visits (patrol_id, checkpoint_id, notes)
           VALUES ($1,$2,'Validado no seed inicial')
           ON CONFLICT DO NOTHING`,
          [patrolId, checkpoint.id]
        );
      }
    }

    const incidents = [
      ["Emergencia - botao de panico", "Garagem G1", "Alerta enviado pelo vigilante durante ronda.", "Emergencia", "Aberta"],
      ["Lampada queimada", "Bloco A", "Lampada do corredor principal apagada.", "Media", "Em analise"],
      ["Portao aberto", "Portaria Principal", "Portao lateral encontrado aberto.", "Alta", "Aberta"],
      ["Vazamento", "Casa de Maquinas", "Pequeno vazamento proximo ao quadro de bombas.", "Alta", "Resolvida"]
    ];
    for (const incident of incidents) {
      await client.query(
        `INSERT INTO incidents (condominium_id, guard_id, type, location, description, priority, status)
         SELECT $1,$2,$3,$4,$5,$6,$7
         WHERE NOT EXISTS (
           SELECT 1 FROM incidents WHERE type = $3 AND location = $4 AND created_at > now() - interval '30 days'
         )`,
        [jardim, guardId, ...incident]
      );
    }

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
