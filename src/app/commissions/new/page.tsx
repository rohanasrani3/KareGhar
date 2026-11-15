import { redirect } from "next/navigation";
import Link from "next/link";
import { viewer } from "@/server/auth";
import { forms } from "@/server/market";
import { postCommission } from "@/server/actions";
import { language } from "@/i18n/language";
import { ActionForm } from "@/components/action-form";
import { CommissionFormFields } from "@/components/commission-form-fields";
import "@/components/commissions.css";

export default async function Page() {
  const [user, all, { lang, t }] = await Promise.all([viewer(), forms(), language()]);
  if (!user) redirect("/login");
  if (user.role !== "customer") redirect("/commissions");
  return <div className="commission-workspace">
    <Link className="back-link" href="/commissions">{t("All demands", "सभी माँगें")}</Link>
    <header className="workspace-heading"><p className="meta">{t("A clear demand brings your idea to life", "अच्छे काम की शुरुआत स्पष्ट विवरण से होती है")}</p><h1>{t("What would you like made?", "आप क्या बनवाना चाहते हैं?")}</h1><p>{t("Give an artist the details they need to bring your idea to life.", "अपनी कल्पना को साकार करने के लिए कलाकार को ज़रूरी जानकारी दें।")}</p></header>
    <div className="commission-layout">
      <section className="workspace-panel">
        <ActionForm lang={lang} action={postCommission} label={t("Publish your demand", "अपनी माँग प्रकाशित करें")}>
          <label>{t("Demand title", "माँग का शीर्षक")}<input name="title" maxLength={120} required placeholder={t("A Warli mural for our café", "हमारे कैफ़े के लिए वारली चित्र")} /></label>
          <CommissionFormFields all={all} lang={lang} />
        </ActionForm>
        <Link className="quiet-link" href="/commissions">{t("Cancel and return", "रद्द करके वापस जाएँ")}</Link>
      </section>
      <aside className="commission-aside"><p className="meta">{t("What happens next", "इसके बाद क्या होगा")}</p><ol className="brief-guide">
        <li><strong>{t("Meet interested artists", "इच्छुक कलाकारों से मिलें")}</strong><p>{t("Receive private proposals at your budget or with a custom quotation.", "अपने बजट पर या कलाकार के सुझाए मूल्य पर निजी प्रस्ताव पाएँ।")}</p></li>
        <li><strong>{t("Talk, then accept a proposal", "बात करें, फिर प्रस्ताव स्वीकार करें")}</strong><p>{t("Use Work history to discuss the demand, deadline and payment before accepting a proposal and choosing an artist for your demand.", "कार्य इतिहास में काम, समय-सीमा और भुगतान पर बात करें, फिर प्रस्ताव स्वीकार करके कलाकार को काम सौंपें।")}</p></li>
        <li><strong>{t("Rate the artist after submission", "कार्य जमा होने पर कलाकार को रेटिंग दें")}</strong><p>{t("Once the artist submits the finished work, rate the artist in Work history and choose whether to share the work publicly.", "कलाकार के तैयार कार्य जमा करने पर कार्य इतिहास में उसे रेटिंग दें और तय करें कि कार्य सार्वजनिक साझा करना है या नहीं।")}</p></li>
      </ol></aside>
    </div>
  </div>;
}
