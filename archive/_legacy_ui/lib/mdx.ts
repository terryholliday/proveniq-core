import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { PROVENIQ_DNA } from "./config";

const BIBLE_DIR = path.join(process.cwd(), "app/bible");

export interface BibleFrontmatter {
  title: string;
  metrics?: string[];
  SIMULATED_METRICS?: boolean;
}

export interface BibleDocument {
  slug: string;
  frontmatter: BibleFrontmatter;
  content: string;
}

export function getValidDocSlugs(): string[] {
  return PROVENIQ_DNA.products.map((p) => p.docSlug);
}

export function isValidDocSlug(slug: string): boolean {
  return getValidDocSlugs().includes(slug);
}

export function getProductByDocSlug(slug: string) {
  return PROVENIQ_DNA.products.find((p) => p.docSlug === slug) ?? null;
}

export async function getBibleDocument(slug: string): Promise<BibleDocument | null> {
  if (!isValidDocSlug(slug)) {
    return null;
  }

  const filePath = path.join(BIBLE_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    slug,
    frontmatter: data as BibleFrontmatter,
    content,
  };
}

export function getAllBibleDocuments(): BibleDocument[] {
  const validSlugs = getValidDocSlugs();
  const documents: BibleDocument[] = [];

  for (const slug of validSlugs) {
    const filePath = path.join(BIBLE_DIR, `${slug}.mdx`);

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(fileContent);

      documents.push({
        slug,
        frontmatter: data as BibleFrontmatter,
        content,
      });
    }
  }

  return documents;
}
