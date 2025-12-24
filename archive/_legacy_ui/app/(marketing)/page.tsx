import { Flywheel } from "@/components/motion/Flywheel";
import { MetricsMarquee } from "@/components/MetricsMarquee";

export default function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="flex-1 flex items-center">
        <div className="container mx-auto px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-8">
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-slate-100">
                Proof Unlocks Value.
              </h1>
              <p className="text-xl text-slate-400 max-w-lg leading-relaxed">
                Institutional-grade infrastructure for physical asset
                financialization. From ingestion to liquidity, every step is
                verified, auditable, and bankable.
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-proveniq-accent text-white font-medium rounded-lg hover:bg-sky-600 transition-colors">
                  Request Access
                </button>
                <button className="px-6 py-3 border border-slate-700 text-slate-300 font-medium rounded-lg hover:border-slate-600 hover:text-slate-100 transition-colors">
                  Read the Bible
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <Flywheel showPackets autoRotate />
            </div>
          </div>
        </div>
      </section>

      <MetricsMarquee
        items={[
          { label: "TVL", value: "$14.2M" },
          { label: "Active Tags", value: "8,420" },
          { label: "Fraud Prevented", value: "$2.1M" },
        ]}
      />
    </div>
  );
}
