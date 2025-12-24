import { db } from "@/lib/db";
import { SearchIndex } from "@prisma/client";

export interface SearchResult {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  content: string;
  metadata: Record<string, unknown> | null;
  score?: number;
}

export interface SearchOptions {
  organizationId: string;
  query: string;
  entityType?: string;
  limit?: number;
  offset?: number;
}

export async function search(options: SearchOptions): Promise<SearchResult[]> {
  const { organizationId, query, entityType, limit = 20, offset = 0 } = options;

  // Basic search implementation using Prisma's contains
  // For production, we would want to use PostgreSQL full-text search (tsvector/tsquery)
  // or a dedicated search engine like Elasticsearch/Algolia
  
  const whereClause: any = {
    organizationId,
    OR: [
      { title: { contains: query, mode: "insensitive" } },
      { content: { contains: query, mode: "insensitive" } },
    ],
  };

  if (entityType) {
    whereClause.entityType = entityType;
  }

  const results = await db.searchIndex.findMany({
    where: whereClause,
    take: limit,
    skip: offset,
    orderBy: { updatedAt: "desc" }, // Simple ranking by recency for now
  });

  return results.map((result: SearchIndex) => ({
    id: result.id,
    entityType: result.entityType,
    entityId: result.entityId,
    title: result.title,
    content: result.content,
    metadata: result.metadata as Record<string, unknown> | null,
  }));
}
