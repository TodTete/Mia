import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Public_Sans, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});
const publicSans = Public_Sans({subsets:['latin'],variable:'--font-public-sans'});
const manrope = Manrope({subsets:['latin'],variable:'--font-manrope'});
const spaceGrotesk = Space_Grotesk({subsets:['latin'],variable:'--font-space-grotesk'});

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
      <body className="min-h-full font-manrope bg-slate-50 dark:bg-black text-black dark:text-white transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
