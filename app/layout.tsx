import type { Metadata } from "next";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { LAYOUT } from "@/lib/physics";
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
                <div className="flex h-screen w-full">
                    <AppSidebar />
                    <div
                        className="flex-1 flex flex-col h-full overflow-hidden relative"
                        style={{ marginLeft: LAYOUT.sidebarWidth }}
                    >
                        {/* Header could go here if needed, consuming LAYOUT.headerHeight */}
                        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
                            {children}
                        </main>
                    </div>
                </div>
            </body>
        </html>
    );
}
