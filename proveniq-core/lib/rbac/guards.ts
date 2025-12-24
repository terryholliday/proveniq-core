import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Permission, hasPermission, hasOrgPermission, Role, OrgRole } from "./roles";
import { forbidden, unauthorized } from "@/lib/api/response";

export interface AuthContext {
  userId: string;
  role: Role;
  organizationId?: string;
  orgRole?: OrgRole;
}

export async function getAuthContext(
  organizationId?: string
): Promise<AuthContext | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  const context: AuthContext = {
    userId: session.user.id,
    role: session.user.role as Role,
  };

  if (organizationId) {
    const membership = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId,
        },
      },
    });

    if (membership) {
      context.organizationId = organizationId;
      context.orgRole = membership.role;
    }
  }

  return context;
}

export async function requirePermission(
  permission: Permission,
  organizationId?: string
): Promise<AuthContext> {
  const context = await getAuthContext(organizationId);

  if (!context) {
    redirect("/auth/signin");
  }

  const hasGlobalPermission = hasPermission(context.role, permission);
  const hasOrgPermissionCheck =
    context.orgRole && hasOrgPermission(context.orgRole, permission);

  if (!hasGlobalPermission && !hasOrgPermissionCheck) {
    redirect("/unauthorized");
  }

  return context;
}

export async function requirePermissions(
  permissions: Permission[],
  organizationId?: string
): Promise<AuthContext> {
  const context = await getAuthContext(organizationId);

  if (!context) {
    redirect("/auth/signin");
  }

  for (const permission of permissions) {
    const hasGlobalPermission = hasPermission(context.role, permission);
    const hasOrgPermissionCheck =
      context.orgRole && hasOrgPermission(context.orgRole, permission);

    if (!hasGlobalPermission && !hasOrgPermissionCheck) {
      redirect("/unauthorized");
    }
  }

  return context;
}

export function apiGuard(permission: Permission) {
  return async function guard(
    request: NextRequest,
    context?: { organizationId?: string }
  ) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { allowed: false, response: unauthorized() };
    }

    const role = session.user.role as Role;
    let orgRole: OrgRole | undefined;

    if (context?.organizationId) {
      const membership = await db.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: session.user.id,
            organizationId: context.organizationId,
          },
        },
      });
      orgRole = membership?.role;
    }

    const hasGlobalPermission = hasPermission(role, permission);
    const hasOrgPermissionCheck = orgRole && hasOrgPermission(orgRole, permission);

    if (!hasGlobalPermission && !hasOrgPermissionCheck) {
      return { allowed: false, response: forbidden() };
    }

    return {
      allowed: true,
      context: {
        userId: session.user.id,
        role,
        organizationId: context?.organizationId,
        orgRole,
      } as AuthContext,
    };
  };
}

export function requireRole(...roles: Role[]) {
  return async function roleGuard() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      redirect("/auth/signin");
    }

    const userRole = session.user.role as Role;

    if (!roles.includes(userRole)) {
      redirect("/unauthorized");
    }

    return session;
  };
}

export function requireOrgRole(organizationId: string, ...roles: OrgRole[]) {
  return async function orgRoleGuard() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      redirect("/auth/signin");
    }

    const membership = await db.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId,
        },
      },
    });

    if (!membership || !roles.includes(membership.role)) {
      redirect("/unauthorized");
    }

    return { session, membership };
  };
}
