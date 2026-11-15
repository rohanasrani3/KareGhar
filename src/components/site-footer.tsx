import Link from "next/link";
import { language } from "@/i18n/language";

/** Direction D colophon: one paragraph about the site, its photographs and sample data, then the links. */
export async function SiteFooter() {
  const { t } = await language();
  return <footer className="site-footer">
    <div className="shell footer-grid">
      <p className="footer-colophon">
        <Link className="brand" href="/">KareGhar</Link>
        {t(
          "connects businesses commissioning work with India’s folk artists, in Hindi and English. Photographs come from Wikimedia Commons under free licences and show real crafts, not KareGhar artists.",
          "काम करवाने वाले व्यवसायों को भारत के लोक कलाकारों से जोड़ता है, हिन्दी और अंग्रेज़ी में। तस्वीरें Wikimedia Commons से मुफ़्त लाइसेंस के तहत ली गई हैं और असली कलाएँ दिखाती हैं, KareGhar कलाकारों का काम नहीं।",
        )}{" "}
        {t(
          "We’re building our first community. Examples marked “Sample data” help you explore the pilot, including its rankings and impact. They’re fictional and read-only.",
          "हम अपना पहला समुदाय बना रहे हैं। “नमूना डेटा” वाले काल्पनिक उदाहरण पायलट, उसकी रैंकिंग और प्रभाव को समझने के लिए हैं। ये केवल देखने के लिए हैं।",
        )}
      </p>
      <nav aria-label={t("Footer navigation", "फ़ुटर नेविगेशन")}>
        <Link href="/">{t("Home", "मुख्य पृष्ठ")}</Link>
        <Link href="/talent">{t("Find artists", "कलाकार खोजें")}</Link>
        <Link href="/commissions">{t("Commission work", "कमीशन कार्य")}</Link>
        <Link href="/impact">{t("Impact", "प्रभाव")}</Link>
        <Link href="/credits">{t("Photo credits", "फ़ोटो श्रेय")}</Link>
      </nav>
    </div>
  </footer>;
}
