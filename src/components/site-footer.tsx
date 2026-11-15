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
          "connects India’s folk artists with customers who have personalized demands. We aim at rejuvenating the rich Indian folk artistry by providing this marketplace. The examples marked “Sample data” help you explore the pilot, including its rankings and impact.",
          "भारत के लोक कलाकारों को व्यक्तिगत माँग रखने वाले ग्राहकों से जोड़ता है। इस बाज़ार के ज़रिए हमारा उद्देश्य भारत की समृद्ध लोक कलाओं को फिर से जीवंत करना है। “नमूना डेटा” वाले उदाहरण पायलट, उसकी रैंकिंग और प्रभाव को समझने में मदद करते हैं।",
        )}
      </p>
      <nav aria-label={t("Footer navigation", "फ़ुटर नेविगेशन")}>
        <Link href="/">{t("Home", "मुख्य पृष्ठ")}</Link>
        <Link href="/talent">{t("Find artists", "कलाकार खोजें")}</Link>
        <Link href="/commissions">{t("Demand board", "माँग बोर्ड")}</Link>
        <Link href="/impact">{t("Impact", "प्रभाव")}</Link>
      </nav>
    </div>
    <div className="shell footer-credits"><Link href="/credits">{t("Photo credits", "फ़ोटो श्रेय")}</Link><p>{t("Photographs from Wikimedia Commons. View photographers, sources and licences.", "तस्वीरें Wikimedia Commons से। फ़ोटोग्राफ़र, स्रोत और लाइसेंस देखें।")}</p></div>
  </footer>;
}
