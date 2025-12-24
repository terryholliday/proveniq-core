import { notFound } from "next/navigation";
import { getBibleDocument, getValidDocSlugs, getProductByDocSlug } from "@/lib/mdx";
import { MdxContent } from "@/components/mdx/MdxContent";
import ReactMarkdown from "react-markdown";

interface BiblePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getValidDocSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BiblePageProps) {
  const { slug } = await params;
  const doc = await getBibleDocument(slug);

  if (!doc) {
    return { title: "Not Found" };
  }

  return {
    title: `${doc.frontmatter.title} | Proveniq Bible`,
    description: `Investment documentation for ${doc.frontmatter.title}`,
  };
}

export default async function BiblePage({ params }: BiblePageProps) {
  const { slug } = await params;
  const doc = await getBibleDocument(slug);

  if (!doc) {
    notFound();
  }

  const product = getProductByDocSlug(slug);

  return (
    <div className="min-h-screen py-16 px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            {product && (
              <span className="px-3 py-1 text-xs font-medium uppercase tracking-wider rounded-full bg-slate-800 text-slate-400">
                {product.type}
              </span>
            )}
            {doc.frontmatter.SIMULATED_METRICS && (
              <span className="px-3 py-1 text-xs font-medium uppercase tracking-wider rounded-full bg-amber-900/50 text-amber-400 border border-amber-700">
                Simulated Metrics
              </span>
            )}
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-100 mb-4">
            {doc.frontmatter.title}
          </h1>

          {doc.frontmatter.metrics && (
            <div className="flex flex-wrap gap-4 mt-6">
              {doc.frontmatter.metrics.map((metric, i) => (
                <div
                  key={i}
                  className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700"
                >
                  <span className="font-mono text-proveniq-success">
                    {metric}
                  </span>
                </div>
              ))}
            </div>
          )}
        </header>

        <MdxContent>
          <ReactMarkdown>{doc.content}</ReactMarkdown>
        </MdxContent>
      </div>
    </div>
  );
}
