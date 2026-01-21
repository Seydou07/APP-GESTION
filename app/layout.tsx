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
  return (
    <html lang="fr">
      <body
        className={`${poppins.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  );
}
