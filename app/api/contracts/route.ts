import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

function appUrl() {
  return (process.env.PUBLIC_APP_URL || "http://localhost:3100").replace(/\/$/, "");
}

export async function GET() {
  const { user, response } = await requireSession(["CLIENT_ADMIN", "ADMIN", "MANAGER"]);
  if (response) return response;
  if (!user?.companyId) return Response.json({ contracts: [] });

  const result = await query(
    `SELECT ct.id, ct.title, ct.status, ct.public_token, ct.sent_at, ct.signed_at,
            ct.signer_name, ct.signer_document, ct.signer_email, ct.evidence_hash,
            c.name AS company_name
     FROM contracts ct
     JOIN companies c ON c.id = ct.company_id
     WHERE ct.company_id = $1
     ORDER BY ct.created_at DESC`,
    [user.companyId]
  );

  return Response.json({
    contracts: rowsToCamel(result.rows).map((contract) => ({
      ...contract,
      documentUrl: `${appUrl()}/assinar/${contract.publicToken}`
    }))
  });
}
