import { requirePageRoles } from "@/lib/page-auth";

export default async function MasterAreaLayout({ children }: { children: React.ReactNode }) {
  await requirePageRoles(["SUPER_ADMIN"]);
  return children;
}
