import type { Metadata } from "next";
import { SystemShell } from "@/components/layout/SystemShell";
import "./globals.css";
import { PROVENIQ_DNA } from "@/lib/config";

export const metadata: Metadata = {
    title: "PROVENIQ Core",
    description: "Institutional Asset Financialization",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={PROVENIQ_DNA.theme.fonts.ui}>
            <body className="antialiased bg-slate-950 text-white overflow-hidden">
                <SystemShell>
                    {children}
                </SystemShell>
            </body>
        </html>
    );
}
