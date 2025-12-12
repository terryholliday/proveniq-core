import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";

type UserRole = "USER" | "ADMIN" | "AUDITOR" | "INVESTOR";

interface WithAuthOptions {
  roles?: UserRole[];
  redirectTo?: string;
}

export async function withAuth(options: WithAuthOptions = {}) {
  const { roles, redirectTo = "/auth/signin" } = options;
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect(redirectTo);
  }
  
  if (roles && roles.length > 0) {
    const userRole = session.user.role as UserRole;
    if (!roles.includes(userRole)) {
      redirect("/unauthorized");
    }
  }
  
  return session;
}

export async function requireAuth() {
  return withAuth();
}

export async function requireAdmin() {
  return withAuth({ roles: ["ADMIN"] });
}

export async function requireAuditor() {
  return withAuth({ roles: ["ADMIN", "AUDITOR"] });
}

export async function requireInvestor() {
  return withAuth({ roles: ["ADMIN", "INVESTOR"] });
}

// For use in API routes
export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
