import Link from "next/link";
import { language } from "@/i18n/language";

/** Direction D colophon: one paragraph about the site, its media credits and sample listings, then the links. */
export async function SiteFooter() {
  const { t } = await language();
  return <footer className="site-footer">
    <div className="shell footer-grid">
      <p className="footer-colophon">
        <Link className="brand" href="/">KareGhar</Link>
        {t(
          "connects India’s folk artists with customers who have personalized demands. We aim at rejuvenating the rich Indian folk artistry by providing this marketplace. Listings tagged “Sample” show how the marketplace works.",
          "भारत के लोक कलाकारों को व्यक्तिगत माँग रखने वाले ग्राहकों से जोड़ता है। इस बाज़ार के ज़रिए हमारा उद्देश्य भारत की समृद्ध लोक कलाओं को फिर से जीवंत करना है। “नमूना” टैग वाली सूचियाँ दिखाती हैं कि यह बाज़ार कैसे काम करता है।",
        )}
      </p>
      <nav aria-label={t("Footer navigation", "फ़ुटर नेविगेशन")}>
        <Link href="/">{t("Home", "मुख्य पृष्ठ")}</Link>
        <Link href="/talent">{t("Find artists", "कलाकार खोजें")}</Link>
        <Link href="/commissions">{t("Demand board", "माँग बोर्ड")}</Link>
        <Link href="/impact">{t("Impact", "प्रभाव")}</Link>
      </nav>
    </div>
    <div className="shell footer-credits"><Link href="/credits">{t("Credits", "श्रेय")}</Link><p>{t("Photographs and recordings from Wikimedia Commons. View their authors, sources and licences.", "तस्वीरें और रिकॉर्डिंग Wikimedia Commons से। उनके रचनाकार, स्रोत और लाइसेंस देखें।")}</p></div>
  </footer>;
}
