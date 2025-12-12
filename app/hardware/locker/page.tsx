import { PROVENIQ_DNA } from "@/lib/config";
import { LockerCutaway } from "@/components/LockerCutaway";

export default function LockerPage() {
    const product = PROVENIQ_DNA.products.find((p) => p.id === "locker");

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="max-w-7xl mx-auto px-8 py-12">
                <header className="mb-24 text-center">
                    <h1 className="text-4xl font-bold mb-4">{product?.label}</h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">{product?.role} Layer</p>
                    <p className="mt-4 text-emerald-500 font-mono text-sm">SECURE_ENCLAVE::ONLINE</p>
                </header>

                {/* Scroll Interaction Zone */}
                <section className="relative border-t border-slate-900">
                    <LockerCutaway />
                </section>

                <section className="py-24 max-w-2xl mx-auto space-y-8 text-slate-300">
                    <h2 className="text-2xl font-bold text-white">Physical Security</h2>
                    <p>
                        The Locker system integrates physical sensing with cryptographic proof.
                        Every open/close event is signed by the hardware security module (HSM) embedded in the door mechanism.
                    </p>
                    <p>
                        This ensures that the digital twin (Ledger) remains perfectly synchronized with the physical reality of the asset.
                    </p>
                </section>
            </div>
        </div>
    );
}
