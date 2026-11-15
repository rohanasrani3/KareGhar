import { language } from "@/i18n/language";
import { register } from "@/server/actions";
import { ActionForm } from "@/components/action-form";
import Link from "next/link";
export default async function Page() {
  const { t, lang } = await language();
  return (
    <section className="auth-page">
      <h1>{t("Create an account", "खाता बनाएँ")}</h1>
      <p>{t("Find your next collaborator. Artists can set up their portfolio after signing in.", "अपना अगला सहयोगी खोजें। कलाकार लॉग इन करने के बाद पोर्टफ़ोलियो बना सकते हैं।")}</p>
      <ActionForm
        action={register}
        label={t("Create account", "खाता बनाएँ")}
        lang={lang}
      >
        <label>
          {t("Account type", "खाते का प्रकार")}
          <select name="role">
            <option value="customer">{t("Customer", "ग्राहक")}</option>
            <option value="artist">{t("Artist", "कलाकार")}</option>
          </select>
        </label>
        <label>
          {t("Name", "नाम")}
          <input name="name" autoComplete="name" maxLength={120} required />
        </label>
        <label>
          {t("Email (private)", "ईमेल (निजी)")}
          <input type="email" name="email" autoComplete="email" maxLength={254} autoCapitalize="none" spellCheck={false} required />
        </label>
        <label>
          {t("Public contact (required)", "सार्वजनिक संपर्क (अनिवार्य)")}
          <input name="contact" minLength={1} maxLength={240} required aria-describedby="signup-contact-help" />
          <small id="signup-contact-help">
            {t(
              "Enter a business email, phone number or preferred way to connect. This is visible to everyone on your public profile. Your account email stays private.",
              "व्यावसायिक ईमेल, फ़ोन नंबर या संपर्क का पसंदीदा तरीका दें। यह आपके सार्वजनिक प्रोफ़ाइल पर सभी को दिखाई देगा। आपके खाते का ईमेल निजी रहेगा।",
            )}
          </small>
        </label>
        <label>
          {t(
            "Username (3–40 case-sensitive letters, digits or underscores)",
            "उपयोगकर्ता नाम (3–40 बड़े या छोटे अंग्रेज़ी अक्षर, अंक या अंडरस्कोर)",
          )}
          <input
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            minLength={3}
            maxLength={40}
            pattern="[A-Za-z0-9_]{3,40}"
            required
          />
        </label>
        <label>
          {t(
            "Password (at least 6 characters)",
            "पासवर्ड (कम से कम 6 अक्षर)",
          )}
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            maxLength={128}
            required
          />
        </label>
      </ActionForm>
      <p>{t("Already have an account?", "पहले से खाता है?")} <Link href="/login">{t("Log in", "लॉग इन")}</Link></p>
    </section>
  );
}
