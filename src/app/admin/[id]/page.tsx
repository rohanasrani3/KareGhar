import Link from "next/link";
import { language } from "@/i18n/language";
import { requireAdmin, moderationDashboard } from "@/server/moderation";
import { moderateAccount } from "@/server/moderation-action";
import { ActionForm } from "@/components/action-form";
import { stateName } from "@/components/discovery";
import { works } from "@/server/market";
import { SocialLinks, parseProfileLinks } from "@/components/social-links";
import { web } from "@/contract/schemas";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [admin, { t, lang }, { person, jobs }] = await Promise.all([
    requireAdmin(),
    language(),
    moderationDashboard(id),
  ]);
  const portfolio = person.role === "artist" ? await works(id) : [];
  return (
    <section className="narrow">
      <Link href="/admin">{t("Account moderation", "खाता प्रबंधन")}</Link>
      <h1>{person.name}</h1>
      <p>
        @{person.username} ·{" "}
        {person.deleted ? t("Deleted", "हटाया गया") : person.suspended ? t("Suspended", "निलंबित") : t("Active", "सक्रिय")}
      </p>
      {person.company && <p>{person.company}</p>}
      <dl className="stack">
        {person.bio && <div>
          <dt><strong>{t("Bio", "परिचय")}</strong></dt>
          <dd className="pre">{person.bio}</dd>
        </div>}
        <div>
          <dt><strong>{t("Public contact", "सार्वजनिक संपर्क")}</strong></dt>
          <dd className="pre">{person.contact || t("Not shared yet", "अभी साझा नहीं किया गया")}</dd>
        </div>
      </dl>
      <SocialLinks links={parseProfileLinks(person.links)} />
      {portfolio.length > 0 && (
        <>
          <h2>{t("Portfolio", "पोर्टफ़ोलियो")}</h2>
          {portfolio.map((w) => (
            <p key={w.id}>
              {(w.url.startsWith("/") && !w.url.startsWith("//")) || web.safeParse(w.url).success ? <a href={w.url}>{w.title}</a> : w.title}
            </p>
          ))}
        </>
      )}
      <h2>{t("Work history", "कार्य इतिहास")}</h2>
      {!jobs.length && <p>{t("No demands.", "कोई माँग नहीं है।")}</p>}
      {jobs.map((c) => (
        <p key={c.id}>
          {!c.paused ? <Link href={"/demands/" + c.id}>{c.title}</Link> : c.title}{", "}
          {stateName(c.status, lang === "hi")}
          {c.paused ? ", " + t("Paused", "रुका हुआ") : ""}
        </p>
      ))}
      {Boolean(person.deleted) && <p>{t("This account was deleted. Its retained history cannot be restored as an active account.", "यह खाता हटाया गया था। सुरक्षित इतिहास से इसे सक्रिय खाते के रूप में बहाल नहीं किया जा सकता।")}</p>}
      {admin.id !== id && !person.sample && !person.deleted && (
        <>
          <h2>
            {person.suspended
              ? t("Restore account", "खाता बहाल करें")
              : t("Suspend account", "खाता निलंबित करें")}
          </h2>
          <p>
            {person.suspended
              ? t(
                  "Restoring allows a fresh login and resumes eligible demands.",
                  "बहाली के बाद सदस्य फिर लॉग इन कर सकता है और पात्र माँगें फिर से जारी होंगी।",
                )
              : t(
                  "Suspension signs this user out, hides their listings and pauses actions on their demands.",
                  "निलंबन से सदस्य लॉग आउट होगा, उसकी लिस्टिंग छिपेंगी और माँग पर कार्रवाई रुकेगी।",
                )}
          </p>
          <ActionForm
            key={person.suspended}
            lang={lang}
            action={moderateAccount}
            label={
              person.suspended
                ? t("Restore account", "खाता बहाल करें")
                : t("Suspend account", "खाता निलंबित करें")
            }
          >
            <input
              type="hidden"
              name="version"
              value={person.session_version}
            />
            <input type="hidden" name="target" value={id} />
            <input
              type="hidden"
              name="action"
              value={person.suspended ? "restore" : "suspend"}
            />
            <label>
              {t("Reason for the audit log", "इतिहास में दर्ज करने का कारण")}
              <textarea required maxLength={4000} name="reason" />
            </label>
            <label>
              <input type="checkbox" name="confirm" required />{" "}
              {t(
                "I confirm this account action.",
                "मैं इस खाते पर कार्रवाई की पुष्टि करता हूँ।",
              )}
            </label>
          </ActionForm>
        </>
      )}
    </section>
  );
}
