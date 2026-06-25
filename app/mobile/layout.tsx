import { requirePageRoles } from "@/lib/page-auth";

export default async function MobileAreaLayout({ children }: { children: React.ReactNode }) {
  await requirePageRoles(["GUARD"]);
  return children;
}
