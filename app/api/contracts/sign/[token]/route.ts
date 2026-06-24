import { createHash } from "node:crypto";
import { query, rowToCamel } from "@/lib/db";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const result = await query(
    `SELECT ct.id, ct.title, ct.content, ct.status, ct.sent_at, ct.signed_at,
            ct.signer_name, ct.signer_document, ct.signer_email, ct.evidence_hash,
            c.name AS company_name, c.document AS company_document
     FROM contracts ct
     JOIN companies c ON c.id = ct.company_id
     WHERE ct.public_token = $1
     LIMIT 1`,
    [token]
  );

  if (!result.rowCount) return Response.json({ error: "Contrato nao encontrado." }, { status: 404 });
  return Response.json({ contract: rowToCamel(result.rows[0]) });
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const body = await request.json();
  const signerName = String(body.signerName ?? "").trim();
  const signerDocument = String(body.signerDocument ?? "").replace(/\s+/g, "").trim();
  const signerEmail = String(body.signerEmail ?? "").trim().toLowerCase();
  const consentText = "Li o contrato, concordo com seu conteudo e confirmo que possuo poderes para assinar pela contratante.";

  if (signerName.length < 3 || signerDocument.length < 5 || !signerEmail.includes("@") || body.accepted !== true) {
    return Response.json({ error: "Preencha a identificacao e confirme o aceite do contrato." }, { status: 400 });
  }

  const contractResult = await query(
    `SELECT id, title, content, status
     FROM contracts
     WHERE public_token = $1
     LIMIT 1`,
    [token]
  );
  if (!contractResult.rowCount) return Response.json({ error: "Contrato nao encontrado." }, { status: 404 });
  const contract = contractResult.rows[0];
  if (contract.status === "Assinado") return Response.json({ error: "Este contrato ja foi assinado." }, { status: 409 });
  if (contract.status === "Cancelado") return Response.json({ error: "Este contrato foi cancelado." }, { status: 410 });

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const signerIp = forwardedFor || request.headers.get("x-real-ip") || "nao identificado";
  const userAgent = request.headers.get("user-agent") || "nao identificado";
  const signedAt = new Date();
  const evidenceHash = createHash("sha256").update(JSON.stringify({
    contractId: contract.id,
    title: contract.title,
    content: contract.content,
    signerName,
    signerDocument,
    signerEmail,
    consentText,
    signerIp,
    userAgent,
    signedAt: signedAt.toISOString()
  })).digest("hex");

  const result = await query(
    `UPDATE contracts
     SET status = 'Assinado',
         signer_name = $2,
         signer_document = $3,
         signer_email = $4,
         signer_ip = $5,
         signer_user_agent = $6,
         consent_text = $7,
         evidence_hash = $8,
         signed_at = $9,
         updated_at = now()
     WHERE public_token = $1 AND status = 'Aguardando assinatura'
     RETURNING id, title, status, signed_at, signer_name, signer_document, signer_email, evidence_hash`,
    [token, signerName, signerDocument, signerEmail, signerIp, userAgent, consentText, evidenceHash, signedAt]
  );

  if (!result.rowCount) return Response.json({ error: "O contrato nao esta disponivel para assinatura." }, { status: 409 });
  return Response.json({ contract: rowToCamel(result.rows[0]) });
}
