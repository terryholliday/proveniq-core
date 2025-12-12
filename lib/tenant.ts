import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cache } from "react";

export interface TenantContext {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  userId: string;
  userRole: string;
  orgRole: string;
}

export const getCurrentTenant = cache(async (): Promise<TenantContext | null> => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  const membership = await db.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: {
      organization: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!membership) {
    return null;
  }

  return {
    organizationId: membership.organization.id,
    organizationSlug: membership.organization.slug,
    organizationName: membership.organization.name,
    userId: session.user.id,
    userRole: session.user.role,
    orgRole: membership.role,
  };
});

export async function getTenantById(organizationId: string): Promise<TenantContext | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  const membership = await db.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId,
      },
    },
    include: {
      organization: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
  });

  if (!membership) {
    return null;
  }

  return {
    organizationId: membership.organization.id,
    organizationSlug: membership.organization.slug,
    organizationName: membership.organization.name,
    userId: session.user.id,
    userRole: session.user.role,
    orgRole: membership.role,
  };
}

export async function getTenantBySlug(slug: string): Promise<TenantContext | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  const organization = await db.organization.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!organization) {
    return null;
  }

  return getTenantById(organization.id);
}

export async function getUserOrganizations(userId: string) {
  return db.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        select: {
          id: true,
          slug: true,
          name: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOrganization(
  userId: string,
  name: string,
  slug: string
) {
  return db.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name,
        slug,
      },
    });

    await tx.organizationMember.create({
      data: {
        userId,
        organizationId: organization.id,
        role: "OWNER",
      },
    });

    return organization;
  });
}

export async function inviteToOrganization(
  organizationId: string,
  userId: string,
  role: "ADMIN" | "MEMBER" | "VIEWER" = "MEMBER"
) {
  return db.organizationMember.create({
    data: {
      organizationId,
      userId,
      role,
    },
  });
}

export async function removeFromOrganization(
  organizationId: string,
  userId: string
) {
  return db.organizationMember.delete({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });
}

export async function updateMemberRole(
  organizationId: string,
  userId: string,
  role: "ADMIN" | "MEMBER" | "VIEWER"
) {
  return db.organizationMember.update({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    data: { role },
  });
}

export function scopeQuery<T extends { organizationId?: string }>(
  query: T,
  organizationId: string
): T & { organizationId: string } {
  return {
    ...query,
    organizationId,
  };
}
