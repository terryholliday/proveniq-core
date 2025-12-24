import type { Metadata } from "next";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "@/components/providers/ToastProvider";
import { ShortcutsProvider } from "@/components/providers/ShortcutsProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proveniq",
  description: "Institutional-grade asset financialization platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans flex bg-black text-white min-h-screen">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <AppHeader />
              <main className="flex-1 relative flex flex-col">
                <div className="px-8 pt-6">
                  <Breadcrumbs />
                </div>
                <div className="flex-1">
                  <ShortcutsProvider>
                    {children}
                  </ShortcutsProvider>
                </div>
              </main>
            </div>
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
