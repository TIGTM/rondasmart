import { requireSession } from "@/lib/auth";
import { query, rowsToCamel } from "@/lib/db";

export async function GET() {
  const { response } = await requireSession(["ADMIN", "MANAGER"]);
  if (response) return response;

  const [todayPatrols, completedPatrols, delayedPatrols, incidents, activeGuards, weekly, activities, alerts] =
    await Promise.all([
      query("SELECT count(*)::int AS total FROM patrols WHERE created_at::date = CURRENT_DATE"),
      query("SELECT count(*)::int AS total FROM patrols WHERE status = 'Finalizada' AND created_at::date = CURRENT_DATE"),
      query("SELECT count(*)::int AS total FROM patrols WHERE status = 'Atrasada'"),
      query("SELECT count(*)::int AS total FROM incidents WHERE status <> 'Resolvida'"),
      query("SELECT count(*)::int AS total FROM users WHERE role = 'GUARD' AND status <> 'Offline'"),
      query(
        `SELECT to_char(day, 'DD/MM') AS label, COALESCE(count(p.id),0)::int AS total
         FROM generate_series(CURRENT_DATE - interval '6 days', CURRENT_DATE, interval '1 day') day
         LEFT JOIN patrols p ON p.created_at::date = day::date
         GROUP BY day
         ORDER BY day`
      ),
      query(
        `SELECT created_at, type AS title, location, status
         FROM incidents
         ORDER BY created_at DESC
         LIMIT 6`
      ),
      query(
        `SELECT type AS title, description AS text, priority, status
         FROM incidents
         WHERE status <> 'Resolvida'
         ORDER BY created_at DESC
         LIMIT 3`
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
