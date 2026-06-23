import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

export async function GET() {
  const { user, response } = await requireSession(["SUPER_ADMIN", "CLIENT_ADMIN", "ADMIN", "MANAGER"]);
  if (response) return response;

  const companyParams = user?.role === "SUPER_ADMIN" ? [] : [user?.companyId];
  const patrolCompanyFilter = user?.role === "SUPER_ADMIN" ? "" : "JOIN condominiums c ON c.id = p.condominium_id AND c.company_id = $1";
  const incidentCompanyFilter = user?.role === "SUPER_ADMIN" ? "" : "LEFT JOIN condominiums c ON c.id = i.condominium_id LEFT JOIN users u ON u.id = i.guard_id";
  const incidentWhere = user?.role === "SUPER_ADMIN" ? "" : "AND (c.company_id = $1 OR u.company_id = $1)";
  const userWhere = user?.role === "SUPER_ADMIN" ? "" : "AND company_id = $1";

  const [todayPatrols, completedPatrols, delayedPatrols, incidents, activeGuards, weekly, activities, alerts] =
    await Promise.all([
      query(`SELECT count(*)::int AS total FROM patrols p ${patrolCompanyFilter} WHERE p.created_at::date = CURRENT_DATE`, companyParams),
      query(`SELECT count(*)::int AS total FROM patrols p ${patrolCompanyFilter} WHERE p.status = 'Finalizada' AND p.created_at::date = CURRENT_DATE`, companyParams),
      query(`SELECT count(*)::int AS total FROM patrols p ${patrolCompanyFilter} WHERE p.status = 'Atrasada'`, companyParams),
      query(`SELECT count(*)::int AS total FROM incidents i ${incidentCompanyFilter} WHERE i.status <> 'Resolvida' ${incidentWhere}`, companyParams),
      query(`SELECT count(*)::int AS total FROM users WHERE role = 'GUARD' AND status <> 'Offline' ${userWhere}`, companyParams),
      query(
        `SELECT to_char(day, 'DD/MM') AS label, COALESCE(count(p.id),0)::int AS total
         FROM generate_series(CURRENT_DATE - interval '6 days', CURRENT_DATE, interval '1 day') day
         LEFT JOIN patrols p ON p.created_at::date = day::date
         ${user?.role === "SUPER_ADMIN" ? "" : "LEFT JOIN condominiums c ON c.id = p.condominium_id"}
         ${user?.role === "SUPER_ADMIN" ? "" : "WHERE p.id IS NULL OR c.company_id = $1"}
         GROUP BY day
         ORDER BY day`,
        companyParams
      ),
      query(
        `SELECT i.created_at, i.type AS title, i.location, i.status
         FROM incidents i
         ${incidentCompanyFilter}
         WHERE 1=1 ${incidentWhere}
         ORDER BY i.created_at DESC
         LIMIT 6`,
        companyParams
      ),
      query(
        `SELECT i.type AS title, i.description AS text, i.priority, i.status
         FROM incidents i
         ${incidentCompanyFilter}
         WHERE i.status <> 'Resolvida' ${incidentWhere}
         ORDER BY i.created_at DESC
         LIMIT 3`,
        companyParams
      )
    ]);

  return Response.json({
    kpis: {
      todayPatrols: todayPatrols.rows[0].total,
      completedPatrols: completedPatrols.rows[0].total,
      delayedPatrols: delayedPatrols.rows[0].total,
      incidents: incidents.rows[0].total,
      activeGuards: activeGuards.rows[0].total
    },
    weekly: rowsToCamel(weekly.rows),
    activities: rowsToCamel(activities.rows),
    alerts: rowsToCamel(alerts.rows)
  });
}
