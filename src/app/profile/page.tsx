import { redirect } from "next/navigation";
import Link from "next/link";
import { viewer } from "@/server/auth";
import { forms, works, artistRating } from "@/server/market";
import { unreadCount } from "@/server/history";
import { language } from "@/i18n/language";
import { Rating } from "@/components/rating";
import { ProfileTabs } from "@/components/profile-tabs";
import { ProfileEditor } from "@/components/profile-editor";
import { PortfolioManager } from "@/components/portfolio-manager";
import { AccountSecurity } from "@/components/account-security";
import { parseProfileLinks } from "@/components/social-links";
import "@/components/profile.css";

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string; onboarding?: string }> }) {
  const [user, { t, lang }, params] = await Promise.all([viewer(), language(), searchParams]);
  if (!user) redirect("/login");
  if (params.tab === "history") redirect("/profile/history");
  const tab = params.tab === "security" ? "security" : params.tab === "portfolio" && user.role === "artist" ? "portfolio" : "personal";
  const [all, portfolio, unread, rating] = await Promise.all([tab === "portfolio" ? forms() : Promise.resolve([]), tab === "portfolio" ? works(user.id) : Promise.resolve([]), unreadCount(user.id), artistRating(user.id)]);
  const { name, username, email, company, photo, role, bio, contact } = user;
  return <section className="profile-shell">
    <div className="profile-page-heading"><div><p className="meta">{t("Your space", "आपकी जगह")}</p><h1>{t("My profile", "मेरी प्रोफ़ाइल")}</h1></div><span className="profile-role">{user.role === "artist" ? t("Artist", "कलाकार") : user.role === "admin" ? t("Administrator", "प्रशासक") : t("Customer", "ग्राहक")}</span></div>
    {user.role === "artist" && <div className="profile-rating"><Rating score={rating.rating_average} count={rating.rating_count} hi={lang === "hi"} /></div>}
    <ProfileTabs artist={user.role === "artist"} active={tab} hi={lang === "hi"} unread={unread} />
    {tab === "personal" && <ProfileEditor user={{ name, username, email, company, photo, role, bio, contact }} links={parseProfileLinks(user.links)} lang={lang} />}
    {tab === "portfolio" && <PortfolioManager items={portfolio} all={all} lang={lang} onboarding={params.onboarding === "1"} />}
    {tab === "security" && <AccountSecurity lang={lang} admin={user.role === "admin"} />}
    {user.role === "admin" && <p><Link href="/admin">{t("Open moderation", "खाता प्रबंधन खोलें")}</Link></p>}
  </section>;
}
