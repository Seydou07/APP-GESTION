import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { prisma } from "@/lib/prisma";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "K.M.BOMI - Gestion",
  description: "Système moderne de gestion de stock et ventes",
};

import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch settings for dynamic theme
  let themeColor = "#3C91E6"; // Default
  try {
    const settings = await (prisma as any).appSetting.findFirst();
    if (settings?.themeColor) {
      themeColor = settings.themeColor;
    }
  } catch (error) {
    console.error("Failed to fetch settings:", error);
  }

  return (
    <html lang="fr">
      <body
        className={`${poppins.variable} font-sans antialiased`}
        style={{ "--primary-dynamic": themeColor } as any}
      >
        <Providers>
          {children}
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  );
}
