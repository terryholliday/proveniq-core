import { db } from "@/lib/db";

export interface IndexableEntity {
  organizationId: string;
  entityType: string;
  entityId: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export async function indexEntity(entity: IndexableEntity) {
  const { organizationId, entityType, entityId, title, content, metadata } = entity;

  return db.searchIndex.upsert({
    where: {
      organizationId_entityType_entityId: {
        organizationId,
        entityType,
        entityId,
      },
    },
    create: {
      organizationId,
      entityType,
      entityId,
      title,
      content,
      metadata: metadata as any,
    },
    update: {
      title,
      content,
      metadata: metadata as any,
      updatedAt: new Date(),
    },
  });
}

export async function removeEntityFromIndex(
  organizationId: string,
  entityType: string,
  entityId: string
) {
  try {
    await db.searchIndex.delete({
      where: {
        organizationId_entityType_entityId: {
          organizationId,
          entityType,
          entityId,
        },
      },
    });
  } catch (error) {
    // Ignore error if record doesn't exist
    if ((error as any).code !== "P2025") {
      throw error;
    }
  }
}

export async function reindexOrganization(organizationId: string) {
  // Clear existing index for organization
  await db.searchIndex.deleteMany({
    where: { organizationId },
  });

  // Re-index Assets
  const assets = await db.asset.findMany({
    where: { organizationId },
  });

  for (const asset of assets) {
    await indexEntity({
      organizationId,
      entityType: "asset",
      entityId: asset.id,
      title: asset.name,
      content: `${asset.name} ${asset.category} ${asset.status}`,
      metadata: asset.metadata as Record<string, unknown>,
    });
  }

  // Re-index Documents
  const documents = await db.document.findMany({
    where: { organizationId },
  });

  for (const doc of documents) {
    await indexEntity({
      organizationId,
      entityType: "document",
      entityId: doc.id,
      title: doc.name,
      content: `${doc.name} ${doc.contentType}`,
      metadata: doc.metadata as Record<string, unknown>,
    });
  }
}
