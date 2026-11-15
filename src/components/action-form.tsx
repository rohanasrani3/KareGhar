"use client";
import { useActionState } from "react";
import { unstable_rethrow } from "next/navigation";
const messages: Record<string, [string, string]> = {
  invalid: ["Check the fields and try again.", "कृपया दर्ज जानकारी जाँचें।"],
  taken: [
    "Username or email already in use.",
    "उपयोगकर्ता नाम या ईमेल पहले से दर्ज है।",
  ],
  denied: [
    "Check your credentials and account permissions.",
    "अपना पासवर्ड और खाते की अनुमति जाँचें।",
  ],
  file: [
    "Choose a supported file up to 4 MB.",
    "4 MB तक की समर्थित फ़ाइल चुनें।",
  ],
  toolarge: [
    "This file is too large to upload. Photos are resized for you; audio and video must be under 4 MB.",
    "यह फ़ाइल अपलोड के लिए बहुत बड़ी है। फ़ोटो अपने आप छोटी हो जाती हैं; ऑडियो और वीडियो 4 MB से कम होने चाहिए।",
  ],
  limited: ["Too many attempts. Try again in 15 minutes.", "बहुत अधिक प्रयास। 15 मिनट बाद फिर कोशिश करें।"],
  unavailable: ["We could not save your file. Please try again.", "आपकी फ़ाइल सहेजी नहीं जा सकी। कृपया फिर कोशिश करें।"],
  conflict: [
    "This action is no longer available. Refresh the page.",
    "यह कार्रवाई अब उपलब्ध नहीं है। पेज रीफ़्रेश करें।",
  ],
  saved: ["Saved.", "सहेजा गया।"],
  expired: ["The 15-minute editing window has ended.", "संपादन के लिए 15 मिनट का समय समाप्त हो गया है।"],
  active: ["Submit the finished work or cancel the selection before deleting your account.", "खाता हटाने से पहले तैयार कार्य जमा करें या चयन रद्द करें।"],
  acknowledged: ["Please confirm that you will contact the other person before starting work.", "कृपया पुष्टि करें कि काम शुरू करने से पहले आप दूसरे व्यक्ति से संपर्क करेंगे।"],
};
/** Hosts such as Vercel reject request bodies over 4.5 MB before the app runs; stay below it. */
const UPLOAD_LIMIT = 4 * 1024 * 1024;
const SHRINK_ABOVE = 1.5 * 1024 * 1024;
const MAX_EDGE = 2000;

/** Re-encode a large JPEG/PNG/WebP photo as a JPEG of at most MAX_EDGE px; null if it can't be made smaller. */
async function shrinkImage(file: File): Promise<File | null> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) { bitmap.close(); return null; }
  context.fillStyle = "#ffffff"; // JPEG has no transparency
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob || blob.size >= file.size) return null;
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

/** Shrink large photos in place, then report whether the files still fit under the upload limit. */
async function prepareUploads(data: FormData) {
  let total = 0;
  for (const [name, value] of [...data.entries()]) {
    if (!(value instanceof File) || !value.size) continue;
    let file = value;
    if (file.size > SHRINK_ABOVE && /^image\/(jpeg|png|webp)$/.test(file.type)) {
      const smaller = await shrinkImage(file).catch(() => null);
      if (smaller) { data.set(name, smaller); file = smaller; }
    }
    total += file.size;
  }
  return total <= UPLOAD_LIMIT;
}

export function ActionForm({
  action,
  label,
  lang,
  children,
  onSuccess,
  secondaryAction,
  className = "",
}: {
  action: (state: string, data: FormData) => Promise<string>;
  label: string;
  lang: "hi" | "en";
  children?: React.ReactNode;
  onSuccess?: () => void;
  secondaryAction?: React.ReactNode;
  className?: string;
}) {
  const [state, submit, pending] = useActionState(async (previous: string, data: FormData) => {
    if (!await prepareUploads(data)) return "toolarge";
    let result: string;
    try {
      result = await action(previous, data);
    } catch (error) {
      unstable_rethrow(error); // let Next.js redirects and not-found signals through
      // A rejected upload (for example an oversized body) or a network failure.
      return "unavailable";
    }
    if (result === "saved") onSuccess?.();
    return result;
  }, "");
  return (
    <form action={submit} className={`stack ${className}`} aria-busy={pending}>
      {children}
      <div className="form-actions">
        <button className="button" disabled={pending}>
          {pending ? (lang === "hi" ? "सहेज रहे हैं…" : "Saving…") : label}
        </button>
        {secondaryAction}
      </div>
      <span role="status" className={`form-feedback ${state === "saved" ? "success" : "error"}`}>
        {state && (messages[state] ?? messages.invalid)[lang === "hi" ? 1 : 0]}
      </span>
    </form>
  );
}
