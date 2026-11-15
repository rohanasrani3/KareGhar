import Link from "next/link";
import { language } from "@/i18n/language";
import { query } from "@/server/db";

type Stats = {
  posted: number;
  selected: number;
  artists: number;
  customers: number;
  fees: number;
  finding: number;
};
export default async function Page() {
  const [{ t }, [s]] = await Promise.all([
    language(),
    query<Stats>(`SELECT COUNT(*) AS posted,
    COUNT(CASE WHEN artist IS NOT NULL AND status='done' THEN 1 END) AS selected,
    COUNT(DISTINCT CASE WHEN status='done' THEN artist END) AS artists,
    COUNT(DISTINCT customer) AS customers, COALESCE(SUM(CASE WHEN artist IS NOT NULL AND status='done' THEN fee ELSE 0 END),0) AS fees,
    COUNT(CASE WHEN status='finding' THEN 1 END) AS finding
    FROM demands`),
  ]);
  const money = (n: number) => "₹" + Number(n).toLocaleString("en-IN");
  const totals = [
    [
      t("Agreed demand value", "माँगों का तय मूल्य"),
      money(s.fees),
      t(
        "The agreed fees for demands with a selected artist. Work and payments take place directly between the customer and artist; these are not verified earnings.",
        "चुने गए कलाकार वाली माँगों का तय शुल्क। काम और भुगतान ग्राहक व कलाकार के बीच सीधे होते हैं; यह सत्यापित आय नहीं है।",
      ),
    ],
    [
      t("Demands with an artist selected", "कलाकार चुनी गई माँगें"),
      s.selected,
      t(
        "A demand counts when its customer selects an artist's proposal. This records a connection, without verifying delivery or payment.",
        "ग्राहक द्वारा कलाकार का प्रस्ताव चुनने पर माँग गिनी जाती है। यह जुड़ाव दर्शाता है; कार्य की डिलीवरी या भुगतान की पुष्टि नहीं करता।",
      ),
    ],
    [
      t("Artists connected", "जुड़े हुए कलाकार"),
      s.artists,
      t(
        "Each artist selected for at least one demand counts once.",
        "कम से कम एक माँग के लिए चुने गए हर कलाकार को एक बार गिना जाता है।",
      ),
    ],
    [
      t("Customers posting demands", "माँग पोस्ट करने वाले ग्राहक"),
      s.customers,
      t(
        "Each customer who has posted a demand counts once.",
        "माँग पोस्ट करने वाले हर ग्राहक को एक बार गिना जाता है।",
      ),
    ],
  ] as const;
  return (
    <>
      <h1>
        {t("What the pilot has done so far", "पायलट की अब तक की उपलब्धियाँ")}
      </h1>
      <p className="page-lead">
        {t(
          "A shared picture of the demands and artist connections in our community.",
          "हमारे समुदाय की माँगों और कलाकारों से बने जुड़ाव की एक साझा तस्वीर।",
        )}
      </p>
      <p className="field-help">
        {t(
          "Includes real activity and sample data impact. Sample demands, artist connections and fees are included to show how the marketplace works. Sample fees are fictional.",
          "इसमें वास्तविक गतिविधि और नमूना डेटा का प्रभाव शामिल है। बाज़ार कैसे काम करता है, यह दिखाने के लिए नमूना माँगें, कलाकारों से जुड़ाव और शुल्क भी गिने जाते हैं। नमूना शुल्क काल्पनिक हैं।",
        )}
      </p>
      <dl className="impact-totals">
        {totals.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="impact-panels">
        <section className="card impact-connections">
          <h2>{t("Demand connections", "माँगों से जुड़ाव")}</h2>
          <dl>
            {[
              [t("Demands posted", "पोस्ट की गई माँगें"), s.posted],
              [t("In progress", "प्रस्ताव प्रक्रिया में"), s.finding],
              [t("Artist selected", "कलाकार चुना गया"), s.selected],
              [
                t(
                  "Average agreed fee",
                  "औसत तय शुल्क",
                ),
                Number(s.selected) ? money(Math.round(s.fees / s.selected)) : "—",
              ],
            ].map(([label, value]) => (
              <div className="impact-row" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="card">
          <h2>{t("How we count", "गणना की विधि")}</h2>
          <dl>
            {totals.map(([label, , explanation]) => (
              <div key={label}>
                <dt>
                  <strong>{label}</strong>
                </dt>
                <dd>{explanation}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <Link className="button" href="/talent">
        {t("Meet the artists", "कलाकारों से मिलें")}
      </Link>
    </>
  );
}
