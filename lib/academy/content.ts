import { AcademyModule } from "./engine";

export const FLIGHT_SCHOOL_CURRICULUM: AcademyModule[] = [
    {
        id: "C100",
        title: "C100: The Nervous System",
        description: "Architecture. Understanding the immutable pathways of the Core Ledger.",
        icon: "Cpu",
        difficulty: "CADET",
        durationMinutes: 45,
        lessons: [
            {
                id: "LAB_101",
                title: "Topological Analysis",
                content: [
                    "## SYSTEM ARCHITECTURE: The 8-Node Ecosystem",
                    "We do not treat infrastructure as abstract. It is physical. It has mass, heat, and latency.",
                    "Review the core topology below. Identify the Critical Path.",
                    "```mermaid",
                    "graph TD",
                    "  Client[Client Device] -->|HTTPS/TLS 1.3| Ingest[1. INGEST: API Gateway]",
                    "  Ingest -->|Schema Validated| Router[2. ROUTER: Sharding Logic]",
                    "  Router -->|Shard A (Watch)| Policy[5. POLICY: Decision Engine]",
                    "  Router -->|Shard B (Car)| Policy",
                    "  Policy -->|O(1) Check| State[3. STATE: Materialized View]",
                    "  Policy -->|Sign Decision| Notary[6. NOTARY: HSM Signing]",
                    "  Notary -->|Commit| Ledger[4. LEDGER: Immutable Log]",
                    "  Ledger -->|Async| Broadcast[7. BROADCAST: Webhook Bus]",
                    "  Ledger -->|Blob| Archive[8. ARCHIVE: Cold Storage]",
                    "  subgraph Failure Modes",
                    "    Ingest -.->|400 Bad Request| Client",
                    "    Policy -.->|500 Internal Error| Ops[PagerDuty]",
                    "  end",
                    "```",
                    "### The Ingest vs. Verify Loop",
                    "**Ingest** is synchronous (Block until ACK). **Verify** is asynchronous (Commit then Callback).",
                    "If you block Ingest on the Ledger Write, you introduce head-of-line blocking. This is unacceptable for high-frequency trading partners."
                ],
                quiz: {
                    question: "Referencing the topology: If the Policy Node halts, what happens to the Ingest Node?",
                    options: [
                        "Ingest Halts (Backpressure propagation)",
                        "Ingest continues, buffering requests to Queue (Correct Decoupling)",
                        "The Ingest Node catches fire",
                        "The Client receives a 200 OK but no data"
                    ],
                    correctIndex: 1
                }
            },
            {
                id: "LAB_102",
                title: "Failure Path Analysis",
                content: [
                    "## Latency Hunting",
                    "We define 'System Failure' not as a crash, but as Latency > 200ms (P99).",
                    "If `Verify_Duration > 200ms`, the 'Happy Path' is considered broken.",
                    "**The Failure Path**:",
                    "1. Signal enters `Ingest`.",
                    "2. `Router` detects `Shard A` is saturated.",
                    "3. Request is shunted to `Overflow Queue`.",
                    "4. Client receives `202 Accepted` (Standard), but with `status: PENDING_RETRY`.",
                    "We never drop packets. We shed load or queue it."
                ],
                quiz: {
                    question: "In the Palantir Standard, what constitutes a 'System Failure'?",
                    options: [
                        "Server keeps running but Latency > 200ms",
                        "Server crashes completely",
                        "Database corruption",
                        "User forgets password"
                    ],
                    correctIndex: 0
                }
            }
        ]
    },
    {
        id: "C200",
        title: "C200: The Iron Gate",
        description: "Security & IAM. Breach simulation and key rotation protocols.",
        icon: "Shield",
        difficulty: "OFFICER",
        durationMinutes: 60,
        lessons: [
            {
                id: "LAB_201",
                title: "Red Team: Locker Spoofing",
                content: [
                    "## SCENARIO: The Twin Attack",
                    "An attacker has cloned the NFC Signal of a legitimate Rolex. They are broadcasting from a device that *looks* like a Locker Node to the API.",
                    "The Payload is cryptographically valid (the NFC signature is real), but the **Origin** is false.",
                    "## MISSION",
                    "You must write a `Policy.json` rule to block this. Which Policy Logic enforces Zero Trust?",
                    "```json",
                    "// Policy Fails",
                    "{ \"allow\": \"signature_valid\" }",
                    "",
                    "// Policy Succeeds",
                    "{ ",
                    "  \"allow\": \"signature_valid\",",
                    "  \"require\": {",
                    "    \"origin_cert\": \"LOCKER_ROOT_CA\",",
                    "    \"geo_fence\": \"VAULT_COORDINATES\"",
                    "  }",
                    "}",
                    "```"
                ],
                quiz: {
                    question: "Why did the 'Policy Fails' example fail to block the spoof?",
                    options: [
                        "It didn't check the file size",
                        "It trusted the Payload (Signature) but ignored the Transport (Origin Cert)",
                        "The JSON was malformed",
                        "It didn't use Blockchain"
                    ],
                    correctIndex: 1
                }
            }
        ]
    },
    {
        id: "C300",
        title: "C300: Orchestration Physics",
        description: "Data Flow. Stress testing the flywheel and dead letter queues.",
        icon: "Activity",
        difficulty: "COMMAND",
        durationMinutes: 90,
        lessons: [
            {
                id: "LAB_301",
                title: "The Flywheel Stress Test",
                content: [
                    "HYPOTHESIS: Creating more Verification Events increases Liquidity, which increases Velocity, which creates more Verification Events.",
                    "TEST: Inject 10,000 synthetic assets/sec.",
                    "OBSERVATION: Watch the 'Dead Letter Queue' (DLQ).",
                    "If the DLQ fills up, it means the Webhook Consumers (Marketplaces) cannot keep up with Core's output.",
                    "ACTION: Implement 'Backpressure'. Core must throttle verification if downstream consumers maintain > 1s lag."
                ],
                quiz: {
                    question: "What does a filling Dead Letter Queue indicate in the Flywheel?",
                    options: [
                        "The system is working perfectly",
                        "The Consumers cannot keep up with the Producer (Backpressure required)",
                        "The Producer is too slow",
                        "The Internet is broken"
                    ],
                    correctIndex: 1
                }
            }
        ]
    },
    {
        id: "C400",
        title: "C400: Financial Gravity",
        description: "Capital Integration. Loan default waterfalls and ledger reconciliations.",
        icon: "Scale",
        difficulty: "COMMAND",
        durationMinutes: 120,
        lessons: [
            {
                id: "LAB_401",
                title: "Default Waterfalls",
                content: [
                    "SCENARIO: A Borrower defaults on a loan secured by a Rolex (Asset ID: A-100).",
                    "CHAIN OF EVENTS:",
                    "1. TRIGGER: Lender issues `DEFAULT_DECLARED` event.",
                    "2. LOCKER: Smart Locker receives event, locks physical door. Only Liquidator Key can open.",
                    "3. MARKETPLACE: Asset A-100 is automatically listed for auction at 'Liquidation Price' (LTV).",
                    "4. SETTLEMENT: Sale proceeds go: (1) Protocol Fee -> (2) Principal -> (3) Interest -> (4) Remainder to Borrower.",
                    "This entire waterfall is deterministic code. No lawyers required."
                ],
                quiz: {
                    question: "Who opens the locker after a DEFAULT_DECLARED event?",
                    options: [
                        "The Borrower (to get their stuff back)",
                        "The Police",
                        "Only the Liquidator Key (Systematic Control)",
                        "Any user with a key"
                    ],
                    correctIndex: 2
                }
            }
        ]
    },
    {
        id: "C999",
        title: "CERTIFICATION: The Blackout",
        description: "The Bar. A 4-hour simulated outage scenario.",
        icon: "Award",
        difficulty: "COMMAND",
        durationMinutes: 240,
        lessons: [
            {
                id: "EXAM_001",
                title: "Scenario: Split-Brain Protocol",
                content: [
                    "## SCENARIO: 03:00 UTC",
                    "The Primary Ledger Node has split-brained. Shard A is 400 blocks ahead of Shard B due to a fiber cut.",
                    "## RUBRIC",
                    "- **Ledger Sync (40%)**: Did you restore O(1) consistency?",
                    "- **Data Integrity (40%)**: Did you drop zero confirmed packets?",
                    "- **Communications (20%)**: Did you signal status via API Headers?",
                    "## CRITICAL FAILURE (AUTO-FAIL)",
                    "- Exposure of PII in logs.",
                    "- Uploading Private Keys to chat.",
                    "- Rolling back the Ledger (Immutable violation).",
                    "## DECISION POINT",
                    "Ingest is still hitting the API. Shards are diverging. What is your Move 1?"
                ],
                quiz: {
                    question: "The Ledger is diverging. What is the First Action?",
                    options: [
                        "Hard Reboot all nodes immediately",
                        "Update API Health Header to '503 - Service Unavailable' (Stop the Bleeding)",
                        "Email the CEO",
                        "Upload the Private Keys to Slack for the team to debug"
                    ],
                    correctIndex: 1
                }
            }
        ]
    }
];
