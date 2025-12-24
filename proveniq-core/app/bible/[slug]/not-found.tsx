import Link from "next/link";

export default function BibleNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-100 mb-4">404</h1>
        <p className="text-xl text-slate-400 mb-2">Document Not Found</p>
        <p className="text-slate-500 mb-8">
          This slug does not exist in PROVENIQ_DNA.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-proveniq-accent text-white font-medium rounded-lg hover:bg-sky-600 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
