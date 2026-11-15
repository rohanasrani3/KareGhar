import Image from "next/image";
import type { Metadata } from "next";
import { language } from "@/i18n/language";
import { FORM_PHOTOS, PHOTOS } from "@/content/photos";
import { ART_FORMS } from "@/contract/artForms";

export const metadata: Metadata = { title: "Photo credits" };

type Credit = { key: string; src: string; width: number; height: number; heading: string; alt: string; author: string; source: string; license: string; licenseUrl: string };

export default async function Credits() {
  const { t, lang } = await language();
  const site: Credit[] = Object.values(PHOTOS).map((p) => ({ key: p.id, src: p.src, width: p.width, height: p.height, heading: p.place[lang], alt: p.alt[lang], author: p.author, source: p.source, license: p.license, licenseUrl: p.licenseUrl }));
  const forms: Credit[] = Object.values(FORM_PHOTOS).map((p) => {
    const form = ART_FORMS.find((f) => f.id === p.form);
    return { key: p.form, src: p.src, width: p.width, height: p.height, heading: (lang === "hi" ? form?.hi : form?.name) ?? p.form, alt: p.alt[lang], author: p.author, source: p.source, license: p.license, licenseUrl: p.licenseUrl };
  });
  const list = (items: Credit[]) => (
    <ul className="credits-list">
      {items.map((c) => (
        <li key={c.key}>
          <Image src={c.src} width={c.width} height={c.height} sizes="160px" alt={c.alt} />
          <div>
            <strong>{c.heading}</strong>
            <p>{c.alt}</p>
            <p>
              {t("Photo by", "फ़ोटो:")}{" "}
              <a href={c.source} target="_blank" rel="noreferrer noopener">{c.author}</a>
              {", "}
              {c.licenseUrl ? <a href={c.licenseUrl} target="_blank" rel="noreferrer noopener">{c.license}</a> : c.license}
              {t(". Resized, and some cropped; otherwise unaltered.", "। आकार बदला गया, कुछ काटी गईं; बाकी कोई बदलाव नहीं।")}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{t("Photo credits", "फ़ोटो श्रेय")}</h1>
          <p className="page-lead">
            {t(
              "The photographs on KareGhar show real Indian crafts and performances. They come from Wikimedia Commons under free licences. They are not work by KareGhar artists.",
              "KareGhar पर दिखाई गई तस्वीरें असली भारतीय कलाओं और प्रस्तुतियों की हैं। ये Wikimedia Commons से मुफ़्त लाइसेंस के तहत ली गई हैं। ये KareGhar कलाकारों का काम नहीं हैं।",
            )}
          </p>
        </div>
      </div>
      <section aria-labelledby="site-photos-h">
        <h2 id="site-photos-h">{t("Home page", "मुख्य पृष्ठ")}</h2>
        {list(site)}
      </section>
      <section aria-labelledby="form-photos-h">
        <h2 id="form-photos-h">{t("Art-form example photos", "कला विधाओं की उदाहरण तस्वीरें")}</h2>
        <p className="page-lead">
          {t(
            "Sample demands and sample artists’ portfolios use these photos as examples of each art form. They are labelled “Example photo” and are not the sample artists’ own work.",
            "नमूना माँग और नमूना कलाकारों के पोर्टफ़ोलियो इन तस्वीरों को हर कला विधा के उदाहरण के रूप में दिखाते हैं। इन पर “Example photo” लिखा है और ये नमूना कलाकारों का अपना काम नहीं हैं।",
          )}
        </p>
        {list(forms)}
      </section>
    </>
  );
}
