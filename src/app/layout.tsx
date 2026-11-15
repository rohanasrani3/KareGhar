import type { Metadata } from "next";
import { Hanken_Grotesk, Libre_Caslon_Display, Noto_Sans_Devanagari, Tiro_Devanagari_Hindi } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { language } from "@/i18n/language";
import "./globals.css";
import { AuthNotice } from "@/components/session-controls";
import { SiteFooter } from "@/components/site-footer";

// Direction D ("Loom, photographed"): Caslon display over Hanken Grotesk, with Devanagari partners for Hindi.
const caslon = Libre_Caslon_Display({ variable: "--font-caslon", subsets: ["latin"], weight: "400" });
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"], weight: ["400", "500", "600"] });
const tiro = Tiro_Devanagari_Hindi({ variable: "--font-tiro", subsets: ["devanagari", "latin"], weight: "400" });
const notoDeva = Noto_Sans_Devanagari({ variable: "--font-noto-deva", subsets: ["devanagari"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: { default: "KareGhar", template: "%s · KareGhar" },
  description: "Empowering artisans. Enabling businesses",
  icons: {
    icon: { url: "/kareghar-icon.png", type: "image/png", sizes: "256x256" },
    shortcut: "/favicon.ico",
  },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang } = await language();
  return (
    <html lang={lang} className={`${caslon.variable} ${hanken.variable} ${tiro.variable} ${notoDeva.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">{lang === "hi" ? "मुख्य सामग्री पर जाएँ" : "Skip to content"}</a>
        <SiteHeader />
        <main id="main-content" className="shell content" tabIndex={-1}>{children}</main>
        <SiteFooter />
        <AuthNotice hi={lang === "hi"} />
      </body>
    </html>
  );
}
