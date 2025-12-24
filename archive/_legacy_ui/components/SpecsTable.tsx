interface Spec {
  label: string;
  value: string;
  unit?: string;
}

interface SpecsTableProps {
  specs: Spec[];
  className?: string;
}

const LOCKER_SPECS: Spec[] = [
  { label: "Dimensions", value: "400 x 400 x 600", unit: "mm" },
  { label: "Connectivity", value: "LTE-M / WiFi 6" },
  { label: "Power", value: "110V + 48h", unit: "Battery Backup" },
  { label: "Weight Capacity", value: "50", unit: "kg" },
  { label: "Camera Resolution", value: "12", unit: "MP" },
  { label: "Depth Accuracy", value: "±0.5", unit: "mm" },
  { label: "Operating Temp", value: "-10 to 45", unit: "°C" },
  { label: "Security Rating", value: "UL TL-15" },
];

export function SpecsTable({ specs = LOCKER_SPECS, className = "" }: SpecsTableProps) {
  return (
    <div className={`glass-panel rounded-xl overflow-hidden ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">
              Specification
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {specs.map((spec, index) => (
            <tr
              key={spec.label}
              className={index % 2 === 0 ? "bg-slate-900/20" : "bg-transparent"}
            >
              <td className="px-6 py-4 text-sm text-slate-300 font-sans">
                {spec.label}
              </td>
              <td className="px-6 py-4 text-right">
                <span className="font-mono text-proveniq-success">
                  {spec.value}
                </span>
                {spec.unit && (
                  <span className="ml-1 text-xs text-slate-500 font-sans">
                    {spec.unit}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { LOCKER_SPECS };
