import { FilterFields } from "./filter-fields";
import type { Form } from "@/contract/schemas";
import { language } from "@/i18n/language";
import Link from "next/link";
export function stateName(s: string, hi: boolean) {
  return (
    {
      finding: hi ? "प्रस्ताव प्रक्रिया में" : "In progress",
      done: hi ? "पूर्ण" : "Completed",
    } as Record<string, string>
  )[s];
}
export async function Sample() {
  const { t } = await language();
  return <span className="sample" title={t("A fictional sample listing that shows how KareGhar works. It is included on the Impact page.", "KareGhar कैसे काम करता है, यह दिखाने वाली काल्पनिक नमूना सूची। इसे प्रभाव पृष्ठ पर गिना जाता है।")}>{t("Sample", "नमूना")}</span>;
}
export async function Filters({
  all,
  params,
  status = false,
  href,
}: {
  all: Form[];
  params: { category?: string; form?: string; status?: string };
  status?: boolean;
  href?: string;
}) {
  const { lang, t } = await language();
  return (
    <form className="filters" action={href ?? (status ? "/commissions" : "/talent")}>
      <FilterFields
        key={`${params.category ?? ""}:${params.form ?? ""}`}
        all={all}
        lang={lang}
        initialCategory={params.category}
        initialForm={params.form}
      />{" "}
      {status && (
        <label>
          {t("Status", "स्थिति")}
          <select key={params.status ?? ""} name="status" defaultValue={params.status ?? ""}>
            <option value="">{t("All statuses", "सभी स्थितियाँ")}</option>
            {["finding", "done"].map((s) => (
              <option key={s} value={s}>
                {stateName(s, lang === "hi")}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="filter-actions">
        <button className="button">{t("Apply filters", "फ़िल्टर लगाएँ")}</button>
        {(params.category || params.form || (status && params.status)) && <Link className="clear-filters" href={href ?? (status ? "/commissions" : "/talent")}>{t("Clear filters", "फ़िल्टर हटाएँ")} <span aria-hidden="true">×</span></Link>}
      </div>
    </form>
  );
}
