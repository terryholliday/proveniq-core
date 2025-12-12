export interface ScriptStep {
    id: number;
    timeRange: string;
    section: string;
    action: string;
    script: string[]; // Lines of text
    highlight?: string; // UI Element to point at (optional idea)
}

export const INVESTOR_DEMO_SCRIPT: ScriptStep[] = [
    {
        id: 0,
        timeRange: "0:00 - 1:00",
        section: "Frame the Problem",
        action: "Set the Trap. Do NOT click anything.",
        script: [
            "Every physical asset today has multiple truths.",
            "A seller thinks it’s worth X. A buyer thinks Y. An insurer sees fraud.",
            "There is no system of record for physical assets.",
            "Proveniq-Core IS that system."
        ]
    },
    {
        id: 1,
        timeRange: "1:00 - 2:00",
        section: "Core Primitive",
        action: "Scroll to CoreNetwork. Kill the 'AI Startup' vibe.",
        script: [
            "Core is not an AI model. It’s a deterministic policy engine.",
            "AI assists signals, but Core DECIDES.",
            "Every decision is explainable, replayable, and revocable.",
            "(Point to Network): Home, Locker, SmartTags ingest. Ledger records. Claims consume."
        ]
    },
    {
        id: 2,
        timeRange: "2:00 - 3:00",
        section: "The API",
        action: "Scroll to API Console. Click 'Run'.",
        script: [
            "This is a single verification request.",
            "What matters is not the response — it’s the WHY.",
            "Look at: Score Buckets, Decision, Confidence Band, Audit Metadata."
        ]
    },
    {
        id: 3,
        timeRange: "3:00 - 4:00",
        section: "Moment of Truth",
        action: "Scroll to Policy Simulator. Slow down.",
        script: [
            "Now here’s where it gets interesting.",
            "We take the EXACT same asset, same evidence.",
            "And we run it through different policies.",
            "(Click 'Run All Policies' and wait)"
        ]
    },
    {
        id: 4,
        timeRange: "4:00 - 5:00",
        section: "Force the Insight",
        action: "Point at side-by-side results.",
        script: [
            "Same facts.",
            "Insurer: REJECTED.",
            "Lender: REVIEW.",
            "Marketplace: APPROVED (with disclosure).",
            "That’s not inconsistency. That’s Policy-Based Truth."
        ]
    },
    {
        id: 5,
        timeRange: "5:00 - 6:00",
        section: "Explainability",
        action: "Click Explain Panel. Open Evidence Drawer.",
        script: [
            "This isn't a black box.",
            "You see exact factors, weights, and evidence.",
            "If something changes, the truth changes — and Core records it."
        ]
    },
    {
        id: 6,
        timeRange: "6:00 - 7:00",
        section: "Tollbooth Close",
        action: "Stop scrolling. Land the plane.",
        script: [
            "Every downstream action relies on Core’s verdict.",
            "We don’t monetize data. We monetize decisions.",
            "If you rely on Core’s truth, you pay the toll."
        ]
    }
];
