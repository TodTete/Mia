import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Public_Sans, Manrope, Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { PremiumNav } from "@/components/ui/premium-nav";
import { AuthGuard } from "@/components/auth-guard";
import { Footer } from "@/components/ui/footer";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});
const publicSans = Public_Sans({subsets:['latin'],variable:'--font-public-sans'});
const manrope = Manrope({subsets:['latin'],variable:'--font-manrope'});
const spaceGrotesk = Space_Grotesk({subsets:['latin'],variable:'--font-space-grotesk'});
const jakarta = Plus_Jakarta_Sans({subsets:['latin'],variable:'--font-jakarta'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mia - Libro Mayor de Salud",
  description: "Sistema de salud bio-digital en tiempo real.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mia",
  },
};

export const viewport = {
  themeColor: "#3649cc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        inter.variable,
        publicSans.variable,
        manrope.variable,
        spaceGrotesk.variable
      )}
    >
      <body className={cn("min-h-screen flex flex-col font-jakarta bg-slate-50 dark:bg-black text-black dark:text-white transition-colors duration-300", jakarta.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthGuard>
            <div className="flex-1 flex flex-col">
              {children}
              <Footer />
            </div>
            <PremiumNav />
            <PWAInstallPrompt />
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
