import { CoreNetwork } from "@/components/motion/CoreNetwork";
import { ApiConsole } from "@/components/ApiConsole";
import { PROVENIQ_DNA } from "@/lib/config";

const coreProduct = PROVENIQ_DNA.products.find((p) => p.id === "core");

export const metadata = {
  title: "Core | Proveniq",
  description: "The central nervous system orchestrating verification, adjudication, and financialization.",
};

export default function CoreProductPage() {
  return (
    <div className="min-h-screen py-16 px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 text-xs font-medium uppercase tracking-wider rounded-full bg-slate-800 text-slate-400">
              {coreProduct?.type}
            </span>
            <span className="px-3 py-1 text-xs font-mono rounded-full bg-proveniq-accent/20 text-proveniq-accent border border-proveniq-accent/30">
              {coreProduct?.role}
            </span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-100 mb-4">
            Core
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl">
            The central nervous system that orchestrates verification workflows,
            routes asset data, and coordinates between ingestion, adjudication,
            and financing modules.
          </p>
        </header>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-slate-100 mb-8">
            Network Topology
          </h2>
          <div className="glass-panel rounded-xl p-8 flex items-center justify-center">
            <CoreNetwork autoAnimate />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="glass-panel rounded-lg p-4">
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                Inputs
              </span>
              <p className="text-slate-300 mt-1">Phone, Hardware sensors</p>
            </div>
            <div className="glass-panel rounded-lg p-4">
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                Processing
              </span>
              <p className="text-slate-300 mt-1">Verification, Validation</p>
            </div>
            <div className="glass-panel rounded-lg p-4">
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                Outputs
              </span>
              <p className="text-slate-300 mt-1">Ledger, Banking rails</p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-slate-100 mb-8">
            API Console
          </h2>
          <ApiConsole autoType />
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-slate-100 mb-8">
            Performance Metrics
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel rounded-lg p-6">
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                API Latency
              </span>
              <p className="text-3xl font-mono text-proveniq-success mt-2">
                142<span className="text-lg text-slate-500">ms</span>
              </p>
              <span className="text-xs text-slate-600">p95 response time</span>
            </div>
            <div className="glass-panel rounded-lg p-6">
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                Throughput
              </span>
              <p className="text-3xl font-mono text-proveniq-success mt-2">
                12.4<span className="text-lg text-slate-500">k/s</span>
              </p>
              <span className="text-xs text-slate-600">requests per second</span>
            </div>
            <div className="glass-panel rounded-lg p-6">
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                Uptime
              </span>
              <p className="text-3xl font-mono text-proveniq-success mt-2">
                99.97<span className="text-lg text-slate-500">%</span>
              </p>
              <span className="text-xs text-slate-600">last 90 days</span>
            </div>
            <div className="glass-panel rounded-lg p-6">
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                Verification Accuracy
              </span>
              <p className="text-3xl font-mono text-proveniq-success mt-2">
                97.2<span className="text-lg text-slate-500">%</span>
              </p>
              <span className="text-xs text-slate-600">confidence threshold</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
