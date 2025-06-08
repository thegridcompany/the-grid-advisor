import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { HotkeyProvider } from "@/hooks/useHotkeys";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { Toaster } from "sonner";
import "@/components/ui/scrollbar.css";
import { WorkspaceProvider } from "@/components/workspace/WorkspaceProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Grid Brain",
  description: "AI Assistant for The Grid Company Partners",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${montserrat.variable} font-sans antialiased custom-scrollbar`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ProjectProvider>
            <HotkeyProvider>
              <WorkspaceProvider>
                {children}
              </WorkspaceProvider>
              <Toaster />
            </HotkeyProvider>
          </ProjectProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
