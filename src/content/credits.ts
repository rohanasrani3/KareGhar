import { FORM_PHOTOS, PHOTOS } from "@/content/photos";
import { RECORDINGS } from "@/content/recordings";

export type MediaCredit = { kind: "photo" | "recording"; author: string; license: string; licenseUrl: string; source: string };

const BY_SRC = new Map<string, MediaCredit>([
  ...[...Object.values(PHOTOS), ...Object.values(FORM_PHOTOS)].map((p): [string, MediaCredit] => [p.src, { kind: "photo", author: p.author, license: p.license, licenseUrl: p.licenseUrl, source: p.source }]),
  ...Object.values(RECORDINGS).map((r): [string, MediaCredit] => [r.src, { kind: "recording", author: r.author, license: r.license, licenseUrl: r.licenseUrl, source: r.source }]),
]);

/** Attribution for a site-hosted Wikimedia Commons photo or recording, or undefined for user uploads. */
export const creditFor = (url: string) => BY_SRC.get(url);
