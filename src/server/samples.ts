import "server-only";
import { FORM_PHOTOS, PHOTOS } from "@/content/photos";
import { RECORDINGS } from "@/content/recordings";

/**
 * Sample marketplace data. Only this trusted backend module designates sample
 * records (sample=1). The people and businesses are invented; their portfolio
 * media are real, credited Wikimedia Commons photos and recordings
 * (src/content/photos.ts, src/content/recordings.ts), and every gallery caption
 * shows that credit.
 *
 * Product rules (AGENTS.md): samples carry a small "Sample" tag on public pages,
 * are read-only, cannot sign in (empty password hash, login requires sample=0),
 * count toward artist rankings, ratings and Impact totals.
 *
 * Seeding is idempotent and runs on local SQLite, or on PostgreSQL when
 * KAREGHAR_SEED_SAMPLES=1. A finished run records SEED_VERSION in
 * schema_migrations so later cold starts skip it: bump SEED_VERSION whenever
 * catalogue membership/content changes. Migration 009 updates the existing
 * acceptance states without replaying or expanding a hosted catalogue.
 * Contact-only upgrades use CONTACT_VERSION separately
 * so an existing catalogue can be patched without inserting more demands.
 */
const SEED_VERSION = "samples:2026-11-15-live";
const CONTACT_VERSION = "samples:2026-11-16-contacts";

type Value = string | number | null;
type Query = (sql: string, values?: Value[]) => Promise<unknown[]>;

type SampleAccount = { id: string; username: string; name: string; role: "artist" | "customer"; company?: string; bio: string };
type SampleWork = { id: string; artist: string; form: string; title: string; url: string };
type SampleDemand = {
  id: string;
  customer: string;
  form: string;
  title: string;
  brief: string;
  fee: number;
  status: "finding" | "done";
  /** Accepted proposal with finished work still to be uploaded. */
  submitted?: boolean;
  artist?: string;
  /** Done only: the submitted file. Defaults to the form's photo. */
  output?: string;
  /** Done only: false keeps the finished work private (it still counts and can be rated). */
  published?: boolean;
  /** Done only: the customer's 1–5 star rating. */
  rating?: number;
  outputType?: "audio" | "video" | "live" | "physical" | "image" | "other";
};

export const SAMPLE_ACCOUNTS: SampleAccount[] = [
  // Customers
  { id: "demo-customer", username: "aangan_studio", name: "Aangan Studio", role: "customer", bio: "An interior design studio in Pune. We bring handmade Indian craft into homes, cafés and small offices." },
  { id: "demo-hotel", username: "haveli_courtyard", name: "Haveli Courtyard Hotel", role: "customer", bio: "A 24-room heritage hotel in Jaipur. We commission local art for our rooms and host music evenings in the courtyard." },
  { id: "demo-cafe", username: "chai_adda_cafe", name: "Chai Adda Café", role: "customer", bio: "A neighbourhood café and reading corner in Kolkata, with a poetry night every month." },
  { id: "demo-events", username: "shubh_utsav", name: "Shubh Utsav Events", role: "customer", bio: "Wedding and event planners in Mumbai. We look for folk performers and artists who make each celebration personal." },
  { id: "demo-artsclub", username: "kala_ankur", name: "Kala Ankur Arts Club", role: "customer", bio: "A weekend arts club for children in Bengaluru. We invite folk artists for workshops and an annual day." },
  { id: "demo-school", username: "nalanda_school", name: "Nalanda Public School", role: "customer", bio: "A CBSE school in Nagpur. Our art and culture committee brings traditional artists to campus." },
  { id: "demo-boutique", username: "rangrez_boutique", name: "Rangrez Boutique", role: "customer", bio: "A clothing boutique in Lucknow working with hand embroidery, block print and handloom." },
  { id: "demo-podcast", username: "gaatha_podcast", name: "Gaatha Podcast", role: "customer", bio: "A Hindi and Marathi podcast of folk stories. We commission music for intros and episodes." },
  { id: "demo-resort", username: "konkan_shores", name: "Konkan Shores Resort", role: "customer", bio: "A beach resort near Ratnagiri. We host cultural evenings and decorate with local craft." },
  // Folk painting
  { id: "demo-artist", username: "meera_patil", name: "Meera Patil", role: "artist", bio: "Warli painter from Dahanu, Maharashtra. I paint walls, canvases and wedding backdrops in white on red-ochre, and I enjoy large murals for cafés and schools." },
  { id: "demo-madhubani", username: "pooja_jha", name: "Pooja Jha", role: "artist", bio: "Madhubani artist from Darbhanga, Bihar. I work with natural colours and fine line work, from framed panels to book illustrations." },
  { id: "demo-gond", username: "arjun_dhurve", name: "Arjun Dhurve", role: "artist", bio: "Gond painter from Patangarh, Madhya Pradesh. Trees, birds and forest stories in dots and dashes, on paper, canvas or walls." },
  { id: "demo-pattachitra", username: "lipika_mahapatra", name: "Lipika Mahapatra", role: "artist", bio: "Pattachitra painter from Raghurajpur, Odisha. I paint on treated cloth and palm leaf with mineral colours." },
  { id: "demo-kalamkari", username: "srinivas_reddy", name: "Srinivas Reddy", role: "artist", bio: "Kalamkari artist from Srikalahasti, Andhra Pradesh. Hand-drawn pen work and vegetable dyes on cotton." },
  // Music
  { id: "demo-musician", username: "ravi_pawar", name: "Ravi Pawar", role: "artist", bio: "Folk singer from Satara, Maharashtra. Bharud, abhang and festival songs, solo or with dholki and tal." },
  { id: "demo-baul", username: "gour_das", name: "Gour Das", role: "artist", bio: "Baul singer from Birbhum, West Bengal. I sing with ektara and dotara at gatherings, cafés and festivals." },
  { id: "demo-hindustani", username: "ananya_kulkarni", name: "Ananya Kulkarni", role: "artist", bio: "Hindustani classical vocalist from Pune, trained in the Kirana gharana. Morning and evening ragas, bhajans and light classical." },
  { id: "demo-carnatic", username: "karthik_iyer", name: "Karthik Iyer", role: "artist", bio: "Carnatic violinist from Chennai. Solo recitals, accompaniment and recorded music for films and dance." },
  // Dance & performance
  { id: "demo-lavani", username: "sneha_jadhav", name: "Sneha Jadhav", role: "artist", bio: "Lavani dancer from Kolhapur. Solo and group performances with live dholki for weddings and cultural evenings." },
  { id: "demo-kathak", username: "riya_sharma", name: "Riya Sharma", role: "artist", bio: "Kathak dancer and teacher from Lucknow. Performances, launches and workshops for children." },
  { id: "demo-bharatanatyam", username: "lakshmi_narayanan", name: "Lakshmi Narayanan", role: "artist", bio: "Bharatanatyam dancer from Thanjavur, performing for 15 years. Recitals with a short explanation of each piece for new audiences." },
  { id: "demo-kathputli", username: "ramesh_bhat", name: "Ramesh Bhat", role: "artist", company: "Bhat Puppet Theatre", bio: "Third-generation Kathputli puppeteer from Udaipur. Our family troupe performs folk tales with live music." },
  // Crafts & textiles
  { id: "demo-blockprinter", username: "meena_khatri", name: "Meena Khatri", role: "artist", bio: "Block printer from Bagru, Rajasthan. Hand-carved blocks and natural dyes on cotton: table linen, bags and fabric by the metre." },
  { id: "demo-terracotta", username: "bapi_pal", name: "Bapi Pal", role: "artist", bio: "Potter from Panchmura, Bankura. Terracotta horses, planters and festival diyas, fired in our village kiln." },
  { id: "demo-handloom", username: "fatima_ansari", name: "Fatima Ansari", role: "artist", company: "Ansari Handloom Co-op", bio: "Weaver and coordinator of a 12-loom co-operative in Varanasi. Cotton and silk throws, stoles and runners." },
  { id: "demo-chikankari", username: "nazia_khan", name: "Nazia Khan", role: "artist", bio: "Chikankari embroiderer from Lucknow. Hand embroidery on kurtas, dupattas and yokes, alone or with a small team." },
];

const photo = (form: string) => FORM_PHOTOS[form].src;
const photoWork = (id: string, artist: string, form: string): SampleWork => ({ id, artist, form, title: FORM_PHOTOS[form].alt.en, url: photo(form) });
const recordingWork = (id: string, artist: string, key: keyof typeof RECORDINGS): SampleWork => {
  const r = RECORDINGS[key];
  return { id, artist, form: r.form, title: r.title.en, url: r.src };
};

export const SAMPLE_WORKS: SampleWork[] = [
  photoWork("demo-wall", "demo-artist", "warli"),
  photoWork("demo-textile", "demo-blockprinter", "block-print"),
  recordingWork("demo-song", "demo-musician", "bharud"),
  { id: "demo-wall-sketch", artist: "demo-artist", form: "warli", title: PHOTOS.warli.alt.en, url: PHOTOS.warli.src },
  photoWork("demo-madhubani-fish", "demo-madhubani", "madhubani"),
  photoWork("demo-gond-tree", "demo-gond", "gond"),
  photoWork("demo-patta-temple", "demo-pattachitra", "pattachitra"),
  photoWork("demo-kalam-vines", "demo-kalamkari", "kalamkari"),
  photoWork("demo-folk-poster", "demo-musician", "marathi-folk"),
  recordingWork("demo-folk-lokgeet", "demo-musician", "lokgeet"),
  photoWork("demo-baul-poster", "demo-baul", "baul"),
  recordingWork("demo-raag", "demo-hindustani", "yaman"),
  photoWork("demo-raag-poster", "demo-hindustani", "hindustani"),
  recordingWork("demo-varnam", "demo-carnatic", "kharaharapriya"),
  photoWork("demo-varnam-poster", "demo-carnatic", "carnatic"),
  photoWork("demo-lavani-stage", "demo-lavani", "lavani"),
  photoWork("demo-kathak-spin", "demo-kathak", "kathak"),
  photoWork("demo-bn-pose", "demo-bharatanatyam", "bharatanatyam"),
  photoWork("demo-puppets", "demo-kathputli", "kathputli"),
  photoWork("demo-pots", "demo-terracotta", "terracotta"),
  photoWork("demo-weave", "demo-handloom", "handloom"),
  photoWork("demo-chikan-flowers", "demo-chikankari", "chikankari"),
];

/** Sample works removed from earlier seeds (no suitable real media). */
const RETIRED_WORKS = ["demo-baul-song"];

/**
 * Listed oldest → newest; dates follow this order. Each artist's first
 * completed demand is published; later ones stay private but are still rated.
 */
export const SAMPLE_COMMISSIONS: SampleDemand[] = [
  // Completed
  { id: "demo-mural", customer: "demo-customer", form: "warli", title: "Warli mural for a café", brief: "Paint a village celebration on the café counter wall, about 8 × 5 ft.", fee: 8000, status: "done", artist: "demo-artist", rating: 5 },
  { id: "demo-pattachitra-invite", customer: "demo-events", form: "pattachitra", title: "Pattachitra art for wedding invitations", brief: "Paint one Pattachitra panel of a bride and groom under a temple arch. We will print it on 300 invitation cards.", fee: 11000, status: "done", artist: "demo-pattachitra", rating: 5 },
  { id: "demo-carnatic-score", customer: "demo-customer", form: "carnatic", title: "Carnatic violin score for a short film", brief: "Record about three minutes of Carnatic violin for a short documentary about a weaving village. Calm, slow tempo.", fee: 10000, status: "done", artist: "demo-carnatic", output: RECORDINGS.kharaharapriya.src, rating: 5 },
  { id: "demo-handloom-throws", customer: "demo-hotel", form: "handloom", title: "Handwoven throws for 10 guest rooms", brief: "Ten cotton throws, about 50 × 60 inches, in our courtyard colours (rust, mustard and indigo).", fee: 20000, status: "done", artist: "demo-handloom", rating: 5 },
  { id: "demo-kalamkari-hanging", customer: "demo-cafe", form: "kalamkari", title: "Kalamkari wall hanging for the reading corner", brief: "A 4 × 3 ft Kalamkari cloth with vines and flowers, natural dyes, ready to hang.", fee: 8500, status: "done", artist: "demo-kalamkari", rating: 4 },
  { id: "demo-bn-annual-day", customer: "demo-artsclub", form: "bharatanatyam", title: "Bharatanatyam recital for our annual day", brief: "A 20-minute solo recital for an audience of families and children, with a short explanation of each piece.", fee: 9000, status: "done", artist: "demo-bharatanatyam", rating: 5 },
  { id: "demo-raag-evening", customer: "demo-hotel", form: "hindustani", title: "Hindustani vocal evening in the courtyard", brief: "Ninety minutes of light classical vocal music for hotel guests, with tabla and harmonium accompaniment.", fee: 14000, status: "done", artist: "demo-hindustani", output: RECORDINGS.yaman.src, outputType: "live", rating: 5 },
  { id: "demo-madhubani-backdrop", customer: "demo-events", form: "madhubani", title: "Madhubani backdrop for a haldi ceremony", brief: "A 10 × 6 ft painted cloth backdrop with fish, lotuses and a bride's palanquin, in yellow and red.", fee: 16000, status: "done", artist: "demo-madhubani", rating: 5 },
  { id: "demo-gond-library", customer: "demo-school", form: "gond", title: "Gond mural for the school library", brief: "A tree-of-life mural above the library shelves, about 12 × 4 ft, with animals children can spot.", fee: 18000, status: "done", artist: "demo-gond", rating: 5 },
  { id: "demo-folk-podcast", customer: "demo-podcast", form: "marathi-folk", title: "Folk song intro for our podcast", brief: "A short Marathi folk song to open each episode, sung unaccompanied or with light percussion.", fee: 5000, status: "done", artist: "demo-musician", output: RECORDINGS.bharud.src, rating: 4 },
  { id: "demo-baul-poetry", customer: "demo-cafe", form: "baul", title: "Baul songs for our poetry night", brief: "Forty-five minutes of Baul songs between readings. A small room of about 40 people.", fee: 6000, status: "done", artist: "demo-baul", outputType: "live", rating: 5 },
  { id: "demo-lavani-resort", customer: "demo-resort", form: "lavani", title: "Lavani for a Maharashtra night", brief: "A 20-minute Lavani performance with dholki for resort guests on the lawn.", fee: 15000, status: "done", artist: "demo-lavani", rating: 5 },
  { id: "demo-kathak-workshop", customer: "demo-artsclub", form: "kathak", title: "Kathak workshop for children", brief: "A two-hour introduction to Kathak footwork and storytelling for 25 children aged 8 to 12.", fee: 7000, status: "done", artist: "demo-kathak", rating: 5 },
  { id: "demo-puppet-fair", customer: "demo-school", form: "kathputli", title: "Puppet show at our school fair", brief: "Two 30-minute Kathputli shows with a folk tale, for primary classes.", fee: 9000, status: "done", artist: "demo-kathputli", rating: 5 },
  { id: "demo-print-napkins", customer: "demo-cafe", form: "block-print", title: "Block-printed napkins for the café", brief: "Forty cotton napkins with a small Bagru motif in indigo, washed and hemmed.", fee: 4800, status: "done", artist: "demo-blockprinter", rating: 4 },
  { id: "demo-terracotta-diyas", customer: "demo-resort", form: "terracotta", title: "Terracotta diyas for Diwali", brief: "Three hundred hand-made diyas and twelve large lamps for the resort paths.", fee: 9500, status: "done", artist: "demo-terracotta", rating: 5 },
  { id: "demo-chikan-dupattas", customer: "demo-boutique", form: "chikankari", title: "Chikankari dupattas for a festive collection", brief: "Ten cotton dupattas with a scattered booti pattern and a scalloped border.", fee: 22000, status: "done", artist: "demo-chikankari", rating: 5 },
  // Completed, kept private by the customer
  { id: "demo-warli-classroom", customer: "demo-school", form: "warli", title: "Warli wall for a primary classroom", brief: "A harvest scene along one classroom wall, low enough for children to see the details.", fee: 9000, status: "done", artist: "demo-artist", output: PHOTOS.warli.src, published: false, rating: 5 },
  { id: "demo-madhubani-book", customer: "demo-podcast", form: "madhubani", title: "Madhubani cover for a story collection", brief: "One square cover illustration for an audiobook of folk tales from Mithila.", fee: 7000, status: "done", artist: "demo-madhubani", published: false, rating: 4 },
  { id: "demo-patta-resort", customer: "demo-resort", form: "pattachitra", title: "Pattachitra panels for the lobby", brief: "Three framed panels of Dashavatara scenes, about 2 × 3 ft each.", fee: 21000, status: "done", artist: "demo-pattachitra", published: false, rating: 4 },
  { id: "demo-kalam-cushions", customer: "demo-customer", form: "kalamkari", title: "Kalamkari cushion covers", brief: "Twelve 16-inch cushion covers with a peacock border, for a client's living room.", fee: 9000, status: "done", artist: "demo-kalamkari", published: false, rating: 5 },
  { id: "demo-folk-festival", customer: "demo-events", form: "marathi-folk", title: "Folk songs for a Ganesh festival video", brief: "Three short songs recorded for a society's Ganeshotsav highlights video.", fee: 6500, status: "done", artist: "demo-musician", output: RECORDINGS.lokgeet.src, published: false, rating: 5 },
  { id: "demo-raag-podcast", customer: "demo-podcast", form: "hindustani", title: "Classical vocal for a podcast episode", brief: "A five-minute evening raga to close an episode about the Pune music circle.", fee: 6000, status: "done", artist: "demo-hindustani", output: RECORDINGS.yaman.src, published: false, rating: 4 },
  { id: "demo-raag-morning", customer: "demo-events", form: "hindustani", title: "Morning raga for a wedding breakfast", brief: "An hour of morning ragas and bhajans with tanpura and tabla.", fee: 12000, status: "done", artist: "demo-hindustani", output: RECORDINGS.yaman.src, outputType: "live", published: false, rating: 5 },
  { id: "demo-carnatic-recital", customer: "demo-artsclub", form: "carnatic", title: "Violin accompaniment for a dance recital", brief: "Live violin for a 40-minute Bharatanatyam recital, with one rehearsal.", fee: 8000, status: "done", artist: "demo-carnatic", output: RECORDINGS.kharaharapriya.src, outputType: "live", published: false, rating: 4 },
  { id: "demo-lavani-college", customer: "demo-events", form: "lavani", title: "Lavani at a college festival", brief: "A 15-minute group performance on an outdoor stage.", fee: 12000, status: "done", artist: "demo-lavani", published: false, rating: 4 },
  { id: "demo-bn-inauguration", customer: "demo-hotel", form: "bharatanatyam", title: "Bharatanatyam at a gallery inauguration", brief: "A 15-minute invocation piece to open a new art gallery.", fee: 8000, status: "done", artist: "demo-bharatanatyam", published: false, rating: 4 },
  { id: "demo-bn-festival", customer: "demo-resort", form: "bharatanatyam", title: "Recital for a festival weekend", brief: "Two short recitals on Saturday and Sunday evening for resort guests.", fee: 14000, status: "done", artist: "demo-bharatanatyam", published: false, rating: 5 },
  { id: "demo-bn-school", customer: "demo-school", form: "bharatanatyam", title: "Lecture-demonstration for students", brief: "A 45-minute lecture-demonstration on mudras and rhythm for classes 6 to 8.", fee: 6000, status: "done", artist: "demo-bharatanatyam", published: false, rating: 3 },
  { id: "demo-puppet-hotel", customer: "demo-hotel", form: "kathputli", title: "Puppet show for a family weekend", brief: "Evening puppet shows on Friday and Saturday for guests' children.", fee: 10000, status: "done", artist: "demo-kathputli", published: false, rating: 4 },
  { id: "demo-puppet-club", customer: "demo-artsclub", form: "kathputli", title: "Puppet-making session and show", brief: "A short show followed by a puppet-making activity for 20 children.", fee: 8000, status: "done", artist: "demo-kathputli", published: false, rating: 5 },
  { id: "demo-print-totes", customer: "demo-boutique", form: "block-print", title: "Block-printed tote bags for a launch", brief: "Sixty canvas totes printed with our logo motif in two colours.", fee: 9000, status: "done", artist: "demo-blockprinter", published: false, rating: 3 },
  { id: "demo-handloom-runners", customer: "demo-customer", form: "handloom", title: "Handloom table runners", brief: "Six runners in natural cotton with an indigo stripe, 14 × 72 inches.", fee: 7500, status: "done", artist: "demo-handloom", published: false, rating: 5 },
  { id: "demo-handloom-stoles", customer: "demo-boutique", form: "handloom", title: "Silk-cotton stoles for winter", brief: "Twenty stoles in four colours with a simple border.", fee: 18000, status: "done", artist: "demo-handloom", published: false, rating: 4 },
  // Completed on proposal acceptance; no finished submission yet
  { id: "demo-jingle", customer: "demo-customer", form: "marathi-folk", title: "Marathi folk jingle", brief: "Record a short folk melody for a café opening.", fee: 3000, status: "done", submitted: false, artist: "demo-musician" },
  { id: "demo-gond-menu", customer: "demo-cafe", form: "gond", title: "Gond illustrations for our new menu", brief: "Six small Gond-style illustrations of tea, snacks and birds for a printed menu card.", fee: 9000, status: "done", submitted: false, artist: "demo-gond" },
  { id: "demo-chikan-kurtas", customer: "demo-hotel", form: "chikankari", title: "Chikankari detailing on staff kurtas", brief: "Hand chikankari yokes on 12 white cotton kurtas for front-desk staff. Simple floral pattern.", fee: 16000, status: "done", submitted: false, artist: "demo-chikankari" },
  { id: "demo-kathak-launch", customer: "demo-events", form: "kathak", title: "Kathak performance at a product launch", brief: "A 10-minute Kathak piece with live tabla to open a jewellery brand launch.", fee: 15000, status: "done", submitted: false, artist: "demo-kathak" },
  // In progress
  { id: "demo-print", customer: "demo-customer", form: "block-print", title: "Hand-printed table runners", brief: "Design six cotton runners with Bagru floral motifs for our café.", fee: 4500, status: "finding" },
  { id: "demo-madhubani-lobby", customer: "demo-hotel", form: "madhubani", title: "Madhubani panels for the hotel lobby", brief: "Three 3 × 4 ft Madhubani panels showing local festivals for the lobby wall. Bright natural colours.", fee: 25000, status: "finding" },
  { id: "demo-lavani-sangeet", customer: "demo-events", form: "lavani", title: "Lavani performance for a sangeet night", brief: "A group Lavani performance of about 15 minutes for a wedding sangeet in Pune, with dholki.", fee: 18000, status: "finding" },
  { id: "demo-baul-evening", customer: "demo-cafe", form: "baul", title: "बाउल संगीत की एक शाम", brief: "हमारे कैफ़े की पहली सालगिरह पर एक घंटे का बाउल संगीत कार्यक्रम चाहिए। छोटी जगह है, लगभग 40 लोग होंगे।", fee: 7000, status: "finding" },
  { id: "demo-terracotta-planters", customer: "demo-hotel", form: "terracotta", title: "Terracotta planters for the courtyard", brief: "Twenty hand-thrown terracotta planters in three sizes, with simple incised patterns.", fee: 12000, status: "finding" },
  { id: "demo-kathputli-show", customer: "demo-artsclub", form: "kathputli", title: "बाल दिवस के लिए कठपुतली शो", brief: "बच्चों के लिए 30 मिनट का कठपुतली शो, कहानी के साथ। लगभग 80 बच्चे होंगे।", fee: 6000, status: "finding" },
];

const MUSIC = new Set(["marathi-folk", "baul", "hindustani", "carnatic"]);
const DANCE = new Set(["lavani", "kathak", "bharatanatyam", "kathputli"]);
const CRAFT = new Set(["block-print", "terracotta", "handloom", "chikankari", "kalamkari"]);
const DAY = 86400000;
const START = Date.UTC(2026, 6, 1); // 1 July 2026; demands follow every 2.5 days.
const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

async function seedSampleContacts(query: Query) {
  if ((await query("SELECT version FROM schema_migrations WHERE version=$1", [CONTACT_VERSION])).length) return;
  await query(`UPDATE accounts SET contact=username || '@example.invalid'
    WHERE sample=1 AND deleted=0 AND TRIM(contact)=''
      AND NOT EXISTS (SELECT 1 FROM admin_grants g WHERE g.account=accounts.id)`);
  await query("INSERT INTO schema_migrations(version) VALUES($1) ON CONFLICT DO NOTHING", [CONTACT_VERSION]);
}

export async function seedSamples(query: Query) {
  if ((await query("SELECT version FROM schema_migrations WHERE version=$1", [SEED_VERSION])).length) {
    await seedSampleContacts(query);
    return;
  }
  function all<T>(items: T[], run: (item: T) => Promise<unknown>) { return Promise.all(items.map(run)); }
  const sampleArtist = "AND artist IN (SELECT id FROM accounts WHERE sample=1)";

  await all(SAMPLE_ACCOUNTS, async (a) => {
    await query(
      "INSERT INTO accounts(id,username,email,name,role,password_hash,company,sample) VALUES($1,$1,$2,$3,$4,'',$5,1) ON CONFLICT DO NOTHING",
      [a.id, a.id + "@example.invalid", a.name, a.role, a.company ?? ""],
    );
    // Insert with the id as username (always free), then take the readable username
    // only when no other account holds it. Existing databases: refresh trusted
    // sample identities in place. Preserve supplied public contact; fill missing
    // sample contact with a fictional address without reading private login email.
    await query("UPDATE accounts SET name=$1,bio=$2,company=$3 WHERE id=$4 AND sample=1", [a.name, a.bio, a.company ?? "", a.id]);
    await query(
      "UPDATE accounts SET username=$1 WHERE id=$2 AND sample=1 AND NOT EXISTS (SELECT 1 FROM accounts o WHERE lower(o.username)=lower($1) AND o.id<>$2)",
      [a.username, a.id],
    );
    await query(`UPDATE accounts SET contact=username || '@example.invalid'
      WHERE id=$1 AND sample=1 AND deleted=0 AND TRIM(contact)=''
        AND NOT EXISTS (SELECT 1 FROM admin_grants g WHERE g.account=accounts.id)`, [a.id]);
  });

  await all(SAMPLE_WORKS, async (w) => {
    await query("INSERT INTO works(id,artist,form,title,url) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING", [w.id, w.artist, w.form, w.title, w.url]);
    await query(`UPDATE works SET title=$1,url=$2 WHERE id=$3 ${sampleArtist}`, [w.title, w.url, w.id]);
  });
  await all(RETIRED_WORKS, (id) => query(`DELETE FROM works WHERE id=$1 ${sampleArtist}`, [id]));

  await all([...SAMPLE_COMMISSIONS.entries()], async ([i, c]) => {
    const created = START + Math.round(i * 2.5 * DAY);
    const selected = c.artist ? created + DAY : 0;
    const hasSubmission = c.status === "done" && c.submitted !== false;
    const submitted = hasSubmission ? created + 6 * DAY : 0;
    const deadline = isoDate(created + (hasSubmission ? 21 : c.artist ? 60 : 75) * DAY);
    const outputType = c.outputType ?? (MUSIC.has(c.form) ? "audio" : DANCE.has(c.form) ? "live" : CRAFT.has(c.form) ? "physical" : "image");
    const output = hasSubmission ? c.output ?? photo(c.form) : "";
    const published = hasSubmission && c.published !== false ? 1 : 0;
    await query(
      "INSERT INTO demands(id,customer,form,title,brief,fee,status,artist,sample,created) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,$9) ON CONFLICT DO NOTHING",
      [c.id, c.customer, c.form, c.title, c.brief, c.fee, c.status, c.artist ?? null, created],
    );
    await query(
      `UPDATE demands SET title=$1,brief=$2,fee=$3,original_fee=$3,output_type=$4,created=$5,updated=$6,selected_at=$7,submitted_at=$8,
       output=$9,published=$10,deadline=$11 WHERE id=$12 AND sample=1`,
      [c.title, c.brief, c.fee, outputType, created, submitted || selected || created, selected, submitted, output, published, deadline, c.id],
    );
  });

  await all(SAMPLE_COMMISSIONS.filter((c) => c.status === "done" && c.submitted !== false && c.rating && c.artist), async (c) => {
    const rated = START + Math.round(SAMPLE_COMMISSIONS.indexOf(c) * 2.5 * DAY) + 7 * DAY;
    await query(
      "INSERT INTO demand_ratings(demand,customer,artist,score,created,updated) SELECT id,customer,artist,CAST($2 AS INTEGER),CAST($3 AS BIGINT),CAST($3 AS BIGINT) FROM demands WHERE id=$1 AND sample=1 AND status='done' ON CONFLICT DO NOTHING",
      [c.id, c.rating!, rated],
    );
    await query("UPDATE demand_ratings SET score=$1 WHERE demand=$2 AND demand IN (SELECT id FROM demands WHERE sample=1)", [c.rating!, c.id]);
  });

  await seedSampleContacts(query);
  await query("INSERT INTO schema_migrations(version) VALUES($1) ON CONFLICT DO NOTHING", [SEED_VERSION]);
}
