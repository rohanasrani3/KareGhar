import { FORM_PHOTOS } from "@/content/photos";

/**
 * Cover image for SAMPLE commissions only: a real, credited photo of the art
 * form's work (src/content/photos.ts FORM_PHOTOS), never a person. Real briefs
 * show only their reference image, published media or the form label
 * (AGENTS.md), so never call this for a record with sample=0.
 */
export function sampleCover(form: string): string | undefined {
  return FORM_PHOTOS[form]?.src;
}
