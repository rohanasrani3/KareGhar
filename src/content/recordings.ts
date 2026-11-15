/**
 * Real recordings from Wikimedia Commons under free licences, used by sample
 * music portfolios and sample completed demands. Each file was trimmed to a
 * short excerpt with a fade, loudness-normalised and converted to MP3
 * (public/audio). CC BY / BY-SA require credit: the portfolio caption shows it
 * (src/content/credits.ts) and /credits lists every entry.
 */
export type Recording = {
  id: string;
  form: string;
  src: string;
  title: { en: string; hi: string };
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
};

const commons = (file: string) => "https://commons.wikimedia.org/wiki/File:" + file;
const BY_3 = "https://creativecommons.org/licenses/by/3.0/";
const BY_SA_4 = "https://creativecommons.org/licenses/by-sa/4.0/";

export const RECORDINGS = {
  kharaharapriya: {
    id: "kharaharapriya",
    form: "carnatic",
    src: "/audio/carnatic-kharaharapriya.mp3",
    title: { en: "Raga Kharaharapriya, violin alapana", hi: "राग खरहरप्रिया, वायलिन आलापना" },
    author: "Lavanya Kothandaraman",
    license: "CC BY 3.0",
    licenseUrl: BY_3,
    source: commons("Kharaharapriya.wav"),
  },
  yaman: {
    id: "yaman",
    form: "hindustani",
    src: "/audio/hindustani-yaman.mp3",
    title: { en: "Raag Yaman", hi: "राग यमन" },
    author: "Gyanada Gadre-Phadke (ज्ञानदा गद्रे-फडके)",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA_4,
    source: commons("RagaYaman.wav"),
  },
  bharud: {
    id: "bharud",
    form: "marathi-folk",
    src: "/audio/marathi-bharud.mp3",
    title: { en: "Bharud, a Marathi folk song", hi: "भारूड, एक मराठी लोकगीत" },
    author: "The open draft",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA_4,
    source: commons("Bharud_a_marathi_lokgeet.ogg"),
  },
  lokgeet: {
    id: "lokgeet",
    form: "marathi-folk",
    src: "/audio/marathi-lokgeet.mp3",
    title: { en: "Marathi lokgeet, sung on a journey", hi: "सफ़र में गाया मराठी लोकगीत" },
    author: "The open draft",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA_4,
    source: commons("Marathi_Lokgeet.ogg"),
  },
} satisfies Record<string, Recording>;
