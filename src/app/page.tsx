import Image from "next/image";
import Link from "next/link";
import { language } from "@/i18n/language";
import { ART_FORMS, CATEGORIES, type Category } from "@/contract/artForms";
import { CATEGORY_PHOTOS, PHOTOS } from "@/content/photos";
import { forms } from "@/server/market";

/** Hindi names for the regions in the seed catalogue (src/contract/artForms.ts). */
const REGION_HI: Record<string, string> = {
  Maharashtra: "महाराष्ट्र",
  Bihar: "बिहार",
  "Madhya Pradesh": "मध्य प्रदेश",
  Odisha: "ओडिशा",
  "Andhra Pradesh": "आंध्र प्रदेश",
  "West Bengal": "पश्चिम बंगाल",
  "North India": "उत्तर भारत",
  "South India": "दक्षिण भारत",
  "Tamil Nadu": "तमिलनाडु",
  Rajasthan: "राजस्थान",
  "Pan-India": "पूरे भारत में",
  "Uttar Pradesh": "उत्तर प्रदेश",
};

const FIND_LABEL: Record<Category, { en: string; hi: string }> = {
  painting: { en: "Find painters", hi: "चित्रकार खोजें" },
  music: { en: "Find musicians", hi: "संगीतकार खोजें" },
  dance: { en: "Find performers", hi: "प्रस्तुति कलाकार खोजें" },
  craft: { en: "Find makers", hi: "शिल्पकार खोजें" },
};

export default async function Home() {
  const [{ t, lang }, catalogue] = await Promise.all([language(), forms()]);
  const hi = lang === "hi";
  const hero = PHOTOS.pattachitra;
  const band = PHOTOS.blockPrint;
  const regions = new Map<string, string[]>();
  for (const form of ART_FORMS) regions.set(form.region, [...(regions.get(form.region) ?? []), hi ? form.hi : form.name]);

  return (
    <>
      <section className="home-hero">
        <Image
          className="home-hero-photo"
          src={hero.src}
          width={hero.width}
          height={hero.height}
          priority
          sizes="(max-width: 1280px) 100vw, 1168px"
          alt={hero.alt[lang]}
        />
        <div className="home-hero-plate">
          <h1>{t("Connect with India’s folk artists", "भारत के लोक कलाकारों से काम करवाएँ")}</h1>
          <p>{t("Find an artist for your demand, or a demand for your craft.", "अपने माँग के लिए कलाकार खोजें, या अपनी कला के लिए माँग।")}</p>
          <div className="actions">
            <Link className="button" href="/talent">
              {t("Find an artist", "कलाकार खोजें")}
            </Link>
            <Link className="text-action" href="/commissions">
              {t("Browse demands", "माँग देखें")}
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section home-split" aria-labelledby="regions-h">
        <div>
          <h2 id="regions-h">{t("Where the crafts come from", "कलाएँ कहाँ से आती हैं")}</h2>
          <p>{t("Every art form in our starting catalogue, by the region it belongs to.", "हमारी शुरुआती सूची की हर कला विधा, उसके क्षेत्र के अनुसार।")}</p>
        </div>
        <dl className="region-list">
          {[...regions].map(([region, names]) => (
            <div key={region}>
              <dt>{hi ? (REGION_HI[region] ?? region) : region}</dt>
              <dd>{names.join(", ")}</dd>
            </div>
          ))}
        </dl>
      </section>

      <figure className="home-band">
        <Image className="home-band-photo" src={band.src} width={band.width} height={band.height} sizes="(max-width: 1280px) 100vw, 1168px" alt={band.alt[lang]} />
      </figure>

      <section className="home-section" aria-labelledby="how-h">
        <h2 id="how-h">{t("From a conversation to a creation", "बातचीत से कलाकृति तक")}</h2>
        <ol className="process-grid">
          <li><h3>{t("Find the right fit", "सही साथी खोजें")}</h3><p>{t("Explore portfolios or post a demand with your budget, references, and the kind of work you need.", "पोर्टफ़ोलियो देखें या बजट, संदर्भ और ज़रूरी काम का विवरण देकर माँग पोस्ट करें।")}</p></li>
          <li><h3>{t("Talk before you start", "शुरू करने से पहले बात करें")}</h3><p>{t("Exchange a private proposal. Contact the artist to agree on the scope, price, timing, and payment before choosing an artist.", "निजी प्रस्ताव साझा करें। कलाकार चुनने से पहले उनसे संपर्क करके काम, शुल्क, समय और भुगतान तय करें।")}</p></li>
          <li><h3>{t("Make it, then share it", "बनाएँ, फिर साझा करें")}</h3><p>{t("Artists submit their finished piece, and customers can then rate the artist. Artists rank based on the number of finished submissions.", "कलाकार अपना तैयार कार्य जमा करते हैं, जिसके बाद ग्राहक उन्हें रेटिंग दे सकते हैं। कलाकारों की रैंकिंग जमा तैयार कार्यों की संख्या पर आधारित है।")}</p></li>
        </ol>
      </section>

      <nav className="home-section" aria-labelledby="craft-h">
        <h2 id="craft-h">{t("Explore a craft", "कला खोजें")}</h2>
        <ul className="craft-index">
          {(Object.keys(CATEGORIES) as Category[]).map((id) => {
            const photo = PHOTOS[CATEGORY_PHOTOS[id]];
            const names = catalogue.filter((f) => f.category === id).map((f) => (hi ? f.hi : f.name));
            return (
              <li key={id}>
                <Image src={photo.src} width={photo.width} height={photo.height} sizes="200px" alt={photo.alt[lang]} />
                <h3><Link href={`/talent?category=${id}`}>{CATEGORIES[id][lang]}</Link></h3>
                <div>
                  <p className="craft-forms">{names.join(", ")}</p>
                </div>
                <Link className="text-action" href={`/talent?category=${id}`}>{FIND_LABEL[id][lang]}</Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className="home-cta" aria-labelledby="cta-h">
        <div>
          <h2 id="cta-h">{t("Find a demand that speaks to your craft.", "अपनी कला के लिए सही माँग खोजें।")}</h2>
          <Link className="button" href="/commissions">{t("Browse open demands", "खुली माँगें देखें")}</Link>
        </div>
      </section>
    </>
  );
}
