import { LockerCutaway } from "@/components/motion/LockerCutaway";
import { SpecsTable, LOCKER_SPECS } from "@/components/SpecsTable";
import { PROVENIQ_DNA } from "@/lib/config";

const lockerProduct = PROVENIQ_DNA.products.find((p) => p.id === "locker");

export const metadata = {
  title: "Locker | Proveniq",
  description: "Institutional-grade custody hardware with integrated verification sensors.",
};

export default function LockerPage() {
  return (
    <div className="min-h-screen">
      <div className="flex">
        <div className="flex-1 py-16 px-8">
          <div className="max-w-xl">
            <header className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 text-xs font-medium uppercase tracking-wider rounded-full bg-slate-800 text-slate-400">
                  {lockerProduct?.type}
                </span>
                <span className="px-3 py-1 text-xs font-mono rounded-full bg-proveniq-accent/20 text-proveniq-accent border border-proveniq-accent/30">
                  {lockerProduct?.role}
                </span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-100 mb-4">
                Anti-Fraud Locker
              </h1>
              <p className="text-xl text-slate-400">
                Institutional-grade custody hardware that creates verifiable
                proof of possession through integrated sensors.
              </p>
            </header>

            <section className="mb-16">
              <h2 className="text-2xl font-semibold text-slate-100 mb-6">
                The Problem
              </h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                Traditional safe deposit boxes and home safes provide physical
                security but zero digital provenance. Items go in, items come
                out—there's no auditable record of what's inside, when it
                changed, or who accessed it.
              </p>
              <p className="text-slate-400 leading-relaxed">
                For high-value collateral (jewelry, watches, collectibles), this
                opacity makes institutional financing impossible. Lenders can't
                underwrite what they can't continuously verify.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-2xl font-semibold text-slate-100 mb-6">
                The Solution
              </h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                The Proveniq Locker is a custody device with integrated sensors
                that create continuous, tamper-evident proof of possession:
              </p>
              <ul className="space-y-3 text-slate-400">
                <li className="flex items-start gap-3">
                  <span className="text-proveniq-accent mt-1">•</span>
                  <span>
                    <strong className="text-slate-200">Camera Module</strong> —
                    High-resolution imaging for visual verification and change
                    detection.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-proveniq-accent mt-1">•</span>
                  <span>
                    <strong className="text-slate-200">Weight Scale</strong> —
                    Precision measurement to detect additions, removals, or
                    substitutions.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-proveniq-accent mt-1">•</span>
                  <span>
                    <strong className="text-slate-200">Depth Sensor</strong> —
                    3D volumetric mapping for spatial fingerprinting of
                    contents.
                  </span>
                </li>
              </ul>
            </section>

            <section className="mb-16">
              <h2 className="text-2xl font-semibold text-slate-100 mb-6">
                How It Works
              </h2>
              <div className="space-y-6">
                <div className="glass-panel rounded-lg p-4">
                  <span className="text-xs font-mono text-proveniq-accent">
                    01
                  </span>
                  <h3 className="text-slate-200 font-medium mt-1">
                    Initial Capture
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Items are placed and the system creates a baseline Digital
                    Twin: images, weight, and volumetric signature.
                  </p>
                </div>
                <div className="glass-panel rounded-lg p-4">
                  <span className="text-xs font-mono text-proveniq-accent">
                    02
                  </span>
                  <h3 className="text-slate-200 font-medium mt-1">
                    Continuous Monitoring
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Sensors poll at configurable intervals. Any deviation
                    triggers an alert and evidence capture.
                  </p>
                </div>
                <div className="glass-panel rounded-lg p-4">
                  <span className="text-xs font-mono text-proveniq-accent">
                    03
                  </span>
                  <h3 className="text-slate-200 font-medium mt-1">
                    Access Events
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Every open/close is logged with before/after comparison.
                    Unauthorized changes are flagged to Core.
                  </p>
                </div>
                <div className="glass-panel rounded-lg p-4">
                  <span className="text-xs font-mono text-proveniq-accent">
                    04
                  </span>
                  <h3 className="text-slate-200 font-medium mt-1">
                    Verification Requests
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Lenders or insurers can request on-demand verification.
                    Fresh evidence is captured and cryptographically signed.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-16">
              <h2 className="text-2xl font-semibold text-slate-100 mb-6">
                Technical Specifications
              </h2>
              <SpecsTable specs={LOCKER_SPECS} />
            </section>

            <section className="mb-32">
              <h2 className="text-2xl font-semibold text-slate-100 mb-6">
                Use Cases
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel rounded-lg p-4">
                  <h3 className="text-slate-200 font-medium">
                    Collateralized Lending
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Continuous proof of possession for asset-backed loans.
                  </p>
                </div>
                <div className="glass-panel rounded-lg p-4">
                  <h3 className="text-slate-200 font-medium">
                    Insurance Verification
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Evidence-grade documentation for scheduled items.
                  </p>
                </div>
                <div className="glass-panel rounded-lg p-4">
                  <h3 className="text-slate-200 font-medium">
                    Estate Management
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Auditable inventory for high-value collections.
                  </p>
                </div>
                <div className="glass-panel rounded-lg p-4">
                  <h3 className="text-slate-200 font-medium">
                    Chain of Custody
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Tamper-evident provenance for authentication.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="w-[450px] sticky top-0 h-screen flex items-center justify-center bg-slate-950/50">
          <div className="relative">
            <LockerCutaway />
            <p className="text-center text-xs text-slate-600 mt-4 font-mono">
              Scroll to reveal internal components
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
