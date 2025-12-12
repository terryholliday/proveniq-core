import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organizations
    const memberships = await db.organizationMember.findMany({
      where: { userId: session.user.id },
      select: { organizationId: true },
    });

    const orgIds = memberships.map((m: { organizationId: string }) => m.organizationId);

    // Fetch stats in parallel
    const [totalAssets, verifiedAssets, pendingVerifications, recentActivity] =
      await Promise.all([
        // Total assets
        db.asset.count({
          where: { organizationId: { in: orgIds } },
        }),

        // Verified assets
        db.asset.count({
          where: {
            organizationId: { in: orgIds },
            status: "VERIFIED",
          },
        }),

        // Pending verifications
        db.verification.count({
          where: {
            asset: { organizationId: { in: orgIds } },
            status: "PENDING",
          },
        }),

        // Recent activity
        db.auditLog.findMany({
          where: { organizationId: { in: orgIds } },
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, email: true } },
          },
        }),
      ]);

    // Count active users (users who have logged in within last 24 hours)
    const activeUsers = await db.session.count({
      where: {
        expires: { gt: new Date() },
        user: {
          organizations: {
            some: { organizationId: { in: orgIds } },
          },
        },
      },
    });

    return NextResponse.json({
      totalAssets,
      verifiedAssets,
      pendingVerifications,
      activeUsers,
      recentActivity: recentActivity.map((log: any) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        timestamp: log.createdAt.toISOString(),
        user: log.user?.name || log.user?.email || null,
      })),
    });
  } catch (error) {
    console.error("[Dashboard Stats] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
