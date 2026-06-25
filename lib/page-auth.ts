import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/auth";

function homeForRole(role: SessionUser["role"]) {
  if (role === "SUPER_ADMIN") return "/master/clientes";
  if (role === "GUARD") return "/mobile/home";
  return "/admin/dashboard";
}

export async function requirePageRoles(roles: SessionUser["role"][]) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect(homeForRole(user.role));
  return user;
}
