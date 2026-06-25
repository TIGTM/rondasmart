import { requirePageRoles } from "@/lib/page-auth";

export default async function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  await requirePageRoles(["SUPER_ADMIN", "CLIENT_ADMIN", "ADMIN", "MANAGER"]);
  return children;
}
