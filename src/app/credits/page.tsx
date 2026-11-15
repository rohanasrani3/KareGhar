import Image from "next/image";
import type { Metadata } from "next";
import { language } from "@/i18n/language";
import { FORM_PHOTOS, PHOTOS } from "@/content/photos";
import { ART_FORMS } from "@/contract/artForms";
import { RECORDINGS } from "@/content/recordings";

export const metadata: Metadata = { title: "Credits" };

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
          <h1>{t("Credits", "श्रेय")}</h1>
          <p className="page-lead">
            {t(
              "The photographs and recordings on KareGhar show real Indian crafts and music. They come from Wikimedia Commons under free licences, and each one is credited where it appears.",
              "KareGhar पर दिखाई गई तस्वीरें और रिकॉर्डिंग असली भारतीय कलाओं और संगीत की हैं। ये Wikimedia Commons से मुफ़्त लाइसेंस के तहत ली गई हैं, और जहाँ भी दिखती हैं वहाँ उनका श्रेय दिया गया है।",
            )}
          </p>
        </div>
      </div>
      <section aria-labelledby="site-photos-h">
        <h2 id="site-photos-h">{t("Home page", "मुख्य पृष्ठ")}</h2>
        {list(site)}
      </section>
      <section aria-labelledby="form-photos-h">
        <h2 id="form-photos-h">{t("Art-form photos", "कला विधाओं की तस्वीरें")}</h2>
        <p className="page-lead">
          {t(
            "Sample listings and sample artists’ portfolios use these photos of each art form. The photographers, not the sample artists, made them.",
            "नमूना सूचियाँ और नमूना कलाकारों के पोर्टफ़ोलियो हर कला विधा की इन तस्वीरों का उपयोग करते हैं। इन्हें फ़ोटोग्राफ़रों ने बनाया है, नमूना कलाकारों ने नहीं।",
          )}
        </p>
        {list(forms)}
      </section>
      <section aria-labelledby="recordings-h">
        <h2 id="recordings-h">{t("Recordings", "रिकॉर्डिंग")}</h2>
        <p className="page-lead">{t("Sample music portfolios play these recordings. The credited musicians performed them, not the sample artists. Each was trimmed to a short excerpt with a fade, its volume evened out and converted to MP3; otherwise unaltered.", "नमूना संगीत पोर्टफ़ोलियो ये रिकॉर्डिंग चलाते हैं। इन्हें श्रेय दिए गए संगीतकारों ने प्रस्तुत किया है, नमूना कलाकारों ने नहीं। हर रिकॉर्डिंग को छोटे अंश में काटा गया, आवाज़ बराबर की गई और MP3 में बदला गया; बाकी कोई बदलाव नहीं।")}</p>
        <ul className="credits-list">
          {Object.values(RECORDINGS).map((r) => (
            <li key={r.id}>
              <audio controls preload="none" src={r.src} aria-label={r.title[lang]} />
              <div>
                <strong>{r.title[lang]}</strong>
                <p>
                  {t("Performed by", "प्रस्तुति:")}{" "}
                  <a href={r.source} target="_blank" rel="noreferrer noopener">{r.author}</a>
                  {", "}
                  <a href={r.licenseUrl} target="_blank" rel="noreferrer noopener">{r.license}</a>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
