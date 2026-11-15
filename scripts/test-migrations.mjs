// Isolated PostgreSQL rehearsal. Install the optional runtime under the ignored
// audit directory: npm install --prefix .kareghar/pg-audit @electric-sql/pglite
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname, extname } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { randomUUID } from "node:crypto";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";

const root = process.cwd(), require = createRequire(import.meta.url);
const runtime = process.env.PG_AUDIT_MODULE || resolve(root, ".kareghar/pg-audit/node_modules/@electric-sql/pglite/dist/index.js");
const { PGlite } = await import(pathToFileURL(runtime).href);
const db = new PGlite();
const q = async (sql, values = []) => (await db.query(sql, values)).rows;
await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean);");

try {
  for (const name of readdirSync(resolve(root, "migrations")).filter((name) => /^\d+.*\.sql$/.test(name)).sort()) {
    await db.exec(readFileSync(resolve(root, "migrations", name), "utf8"));
    if (name.startsWith("001_")) await db.exec(`
      INSERT INTO accounts(id,username,email,name,role,password_hash) VALUES
       ('legacy-customer','legacy_customer','legacy-customer@example.invalid','Legacy customer','customer',''),
       ('legacy-artist','legacy_artist','legacy-artist@example.invalid','Legacy artist','artist','');
      INSERT INTO forms(id,category,name,hi) VALUES('legacy-form','painting','Legacy form','Legacy form');
      INSERT INTO commissions(id,customer,artist,form,title,brief,fee,status,output,created)
       VALUES('legacy-demand','legacy-customer','legacy-artist','legacy-form','Legacy work','Preserve history',789,'progress','legacy.png',123);
      INSERT INTO proposals(id,commission,artist,message) VALUES('legacy-proposal','legacy-demand','legacy-artist','Private legacy proposal');`);
    if (name.startsWith("003_")) await db.exec(`
      INSERT INTO accounts(id,username,email,name,role,password_hash)
       VALUES('legacy-admin','legacy_admin','','Legacy administrator','customer','preserved-admin-hash');
      INSERT INTO admin_grants(account) VALUES('legacy-admin');`);
    if (name.startsWith("004_")) await db.exec(`
      INSERT INTO commission_events(id,commission,actor,artist,kind,created,quote,output)
       VALUES('legacy-event','legacy-demand','legacy-artist','legacy-artist','submitted',123,789,'legacy.png');
      INSERT INTO messages(id,commission,sender,artist,body,created)
       VALUES('legacy-message','legacy-demand','legacy-customer','legacy-artist','Private legacy message',124);
      INSERT INTO history_reads(account,commission,last_seen) VALUES('legacy-customer','legacy-demand',120);`);
    if (name.startsWith("006_")) await db.exec("INSERT INTO commission_ratings(commission,customer,artist,score,created,updated) VALUES('legacy-demand','legacy-customer','legacy-artist',4,125,125)");
  }

  const [legacy] = await q("SELECT * FROM demands WHERE id='legacy-demand'");
  const [legacyAdmin] = await q("SELECT * FROM account_state WHERE id='legacy-admin'");
  assert.equal(legacyAdmin.effective_role, "admin");
  assert.equal(legacyAdmin.password_hash, "preserved-admin-hash");
  assert.equal(legacyAdmin.email, "");
  assert.equal(legacyAdmin.bio, "");
  assert.equal(legacyAdmin.contact, "");
  assert.equal(legacyAdmin.deleted, 0);
  assert.equal(legacyAdmin.suspended, 0);
  assert.equal(legacy.status, "done");
  assert.equal(legacy.original_fee, 789);
  assert.equal(legacy.output, "legacy.png");
  assert.equal(legacy.legacy_accepted_at, 0);
  assert.equal((await q("SELECT demand FROM proposals WHERE id='legacy-proposal'"))[0].demand, legacy.id);
  assert.equal((await q("SELECT demand FROM demand_events WHERE id='legacy-event'"))[0].demand, legacy.id);
  assert.equal((await q("SELECT demand FROM demand_ratings"))[0].demand, legacy.id);
  assert.equal((await q("SELECT demand FROM messages WHERE id='legacy-message'"))[0].demand, legacy.id);
  assert.equal((await q("SELECT demand FROM history_reads"))[0].demand, legacy.id);
  assert.equal((await q("SELECT public FROM storage.buckets WHERE id='kareghar'"))[0].public, false);
  assert.equal((await q("SELECT COUNT(*)::integer AS n FROM schema_migrations WHERE version='008_demand_naming'"))[0].n, 1);
  assert.equal((await q("SELECT COUNT(*)::integer AS n FROM pg_tables WHERE schemaname='public' AND tablename LIKE '%commission%'"))[0].n, 0);
  const oldConstraints = await q("SELECT conname,contype FROM pg_constraint WHERE connamespace='public'::regnamespace AND conname LIKE '%commission%'");
  assert.deepEqual(oldConstraints, []);
  assert.equal((await q("SELECT COUNT(*)::integer AS n FROM pg_indexes WHERE schemaname='public' AND indexname LIKE '%commission%'"))[0].n, 0);
  const foreignKeys = await q("SELECT conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE contype='f' AND confrelid='demands'::regclass");
  assert.equal(foreignKeys.length, 5);
  assert(foreignKeys.every((row) => row.definition.includes("FOREIGN KEY (demand) REFERENCES demands(id)")));
  const tables = await q("SELECT tablename,rowsecurity FROM pg_tables WHERE schemaname='public'");
  assert.equal(tables.length, 13);
  assert(tables.every((table) => table.rowsecurity));
  for (const role of ["anon", "authenticated"]) {
    for (const table of [...tables.map((table) => table.tablename), "account_state", "demand_state"]) {
      const [access] = await q("SELECT has_table_privilege($1,$2,'SELECT,INSERT,UPDATE,DELETE') AS allowed", [role, table]);
      assert.equal(access.allowed, false, `${role} unexpectedly has access to ${table}`);
    }
    await db.exec(`SET ROLE ${role}`);
    await assert.rejects(q("SELECT * FROM demands"), /permission denied/);
    await db.exec("RESET ROLE");
  }
  await assert.rejects(q("INSERT INTO history_reads(account,demand,last_seen) VALUES('legacy-artist','missing-demand',0)"), /foreign key/);

  // Execute actual application SQL against PostgreSQL, with only framework and
  // storage boundaries replaced. This catches dialect/type-inference mistakes
  // that the SQLite integration checks cannot detect.
  let session = null;
  const viewer = async () => session ? (await q("SELECT *,effective_role AS role FROM account_state WHERE id=$1 AND suspended=0", [session]))[0] ?? null : null;
  const transaction = async (work) => {
    await db.exec("BEGIN");
    try { const result = await work(q); await db.exec("COMMIT"); return result; }
    catch (error) { await db.exec("ROLLBACK"); throw error; }
  };
  class Redirect extends Error { constructor(path) { super(path); this.path = path; } }
  const mocks = {
    "server-only": {},
    "next/cache": { revalidatePath() {} },
    "next/headers": { cookies: async () => ({ set() {} }) },
    "next/navigation": { redirect(path) { throw new Redirect(path); }, notFound() { throw Error("Not found"); } },
    "@/server/auth": { viewer },
    "@/i18n/language": { language: async () => ({ lang: "en", t: (en) => en }) },
    "@/server/db": { query: q, transaction },
    "@/server/media": { saveMedia: async () => randomUUID() + ".png", removeMedia: async () => {}, mediaResponse: async () => new Response("bytes") },
  };
  const cache = new Map();
  function load(file) {
    const absolute = resolve(root, file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const loaded = { exports: {} }; cache.set(absolute, loaded);
    const code = ts.transpileModule(readFileSync(absolute, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const localRequire = (name) => {
      if (mocks[name]) return mocks[name];
      let target = name.startsWith("@/") ? resolve(root, "src", name.slice(2)) : name.startsWith(".") ? resolve(dirname(absolute), name) : null;
      if (!target) return require(name);
      for (const boundary of ["auth", "db", "media"]) if (target === resolve(root, "src/server", boundary)) return mocks["@/server/" + boundary];
      if (!extname(target)) { try { readFileSync(target + ".ts"); target += ".ts"; } catch { target += ".tsx"; } }
      return load(target);
    };
    runInNewContext(`(function(require,module,exports){${code}\n})`, { File, FormData, Response, Request, URL, Buffer, Date, console, process, setTimeout, clearTimeout })(localRequire, loaded, loaded.exports);
    return loaded.exports;
  }
  const market = load("src/server/market.ts"), history = load("src/server/history.ts"), actions = load("src/server/actions.ts"), messaging = load("src/server/history-actions.ts");
  const { ART_FORMS } = load("src/contract/artForms.ts");
  for (const form of ART_FORMS) await q("INSERT INTO forms(id,category,name,hi) VALUES($1,$2,$3,$4)", [form.id, form.category, form.name, form.hi]);
  await load("src/server/samples.ts").seedSamples(q);
  await load("src/server/samples.ts").seedSamples(q);
  assert.equal((await market.forms()).length, ART_FORMS.length + 1);
  assert((await market.artists()).length > 0);
  await market.artists({ category: "painting", form: "warli" });
  await market.works("legacy-artist"); await market.publicProfile("legacy_artist");
  await market.publishedWorks("legacy-artist"); await market.artistRating("legacy-artist");
  await market.commissions(); await market.commissions({ category: "painting", form: "warli", status: "finding" });
  assert.equal((await history.historyDetail("legacy-demand", "legacy-customer")).messages.length, 1);
  await history.history("legacy-artist"); await history.unreadCount("legacy-artist");
  await market.proposals("legacy-demand", "legacy-customer");
  const invoke = (action, values) => { const data = new FormData(); for (const [name, value] of Object.entries(values)) data.set(name, value instanceof File ? value : String(value)); return action("", data); };
  session = "legacy-customer";
  const deadline = new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10);
  let id;
  try { await invoke(actions.postCommission, { title: "PostgreSQL demand", brief: "A fully tested demand", category: "painting", form: "warli", fee: 1000, output_type: "physical", deadline }); assert.fail("Expected redirect"); }
  catch (error) { assert(error instanceof Redirect); id = error.path.split("/").pop(); }
  session = "legacy-artist";
  assert.equal(await invoke(actions.commissionAction, { id, action: "propose", message: "Private proposal", pricing: "quote", quote: 700, acknowledged: "on" }), "saved");
  const [proposal] = await market.proposals(id, session);
  assert.equal(await invoke(actions.commissionAction, { id, action: "editProposal", message: "Edited proposal", pricing: "quote", quote: 750, acknowledged: "on" }), "saved");
  session = "legacy-customer";
  assert.equal(await invoke(messaging.sendMessage, { id, artist: "legacy-artist", body: "Confirm details privately" }), "saved");
  assert.equal(await invoke(actions.commissionAction, { id, action: "select", proposal: proposal.id, acknowledged: "on" }), "saved");
  assert.equal(await invoke(actions.commissionAction, { id, action: "cancel", reason: "Change schedule" }), "saved");
  await q("UPDATE proposals SET status='active' WHERE id=$1", [proposal.id]);
  assert.equal(await invoke(actions.commissionAction, { id, action: "select", proposal: proposal.id, acknowledged: "on" }), "saved");
  session = "legacy-artist";
  assert.equal(await invoke(actions.commissionAction, { id, action: "submit", file: new File(["finished"], "finished.png") }), "saved");
  const [storedDemand] = await q("SELECT output FROM demands WHERE id=$1", [id]);
  const media = load("src/app/api/media/[key]/route.ts");
  const mediaRead = () => media.GET(new Request("http://localhost/api/media/" + storedDemand.output), { params: Promise.resolve({ key: storedDemand.output }) });
  assert.equal((await mediaRead()).status, 200);
  session = null;
  assert.equal((await mediaRead()).status, 404);
  session = "legacy-customer";
  assert.equal(await invoke(actions.commissionAction, { id, action: "rate", rating: 5 }), "saved");
  assert.equal(await invoke(actions.commissionAction, { id, action: "visibility", public: "on" }), "saved");
  assert.equal(await invoke(messaging.markHistoryRead, { id, seenAt: Date.now() }), "saved");
  assert.equal((await market.commissions({}, id))[0].fee, 1000);
  assert.equal((await market.commissions({}, id, session))[0].fee, 750);
  assert.equal((await market.commissions({}, id))[0].rating, 5);
  assert.equal((await market.publishedWorks("legacy-artist")).length, 1);
  assert((await history.historyDetail(id, session)).commission.output);
  session = null;
  assert.equal((await mediaRead()).status, 200);
  for (const route of ["forms", "talent", "commissions"]) {
    assert.equal((await load(`src/app/api/${route}/route.ts`).GET(new Request("http://localhost/api/" + route))).status, 200);
  }
  assert.equal((await load("src/app/api/people/[handle]/route.ts").GET(new Request("http://localhost"), { params: Promise.resolve({ handle: "legacy_artist" }) })).status, 200);
  assert.equal((await load("src/app/api/commissions/[id]/route.ts").GET(new Request("http://localhost"), { params: Promise.resolve({ id }) })).status, 200);
  session = "legacy-customer";
  assert.equal(await invoke(actions.commissionAction, { id, action: "visibility" }), "saved");
  session = null;
  assert.equal((await mediaRead()).status, 404);
  session = "legacy-artist";
  assert.equal(await invoke(actions.addWork, { title: "PostgreSQL portfolio", category: "painting", formName: "Warli", url: "https://example.invalid/art.jpg" }), "saved");
  const [work] = await market.works(session);
  assert.equal(await invoke(actions.updateWork, { id: work.id, title: "Updated PostgreSQL portfolio", category: "craft", formName: "PostgreSQL craft", url: "https://example.invalid/art.jpg" }), "saved");
  assert.equal(await invoke(actions.updateProfile, { name: "Legacy artist", email: "legacy-artist@example.invalid", company: "", bio: "Audited profile", contact: "Public contact", links: "https://example.invalid", removePhoto: "on" }), "saved");
  assert.equal((await market.publicProfile("legacy_artist")).bio, "Audited profile");
  assert.equal(await invoke(actions.deleteWork, { id: work.id }), "saved");
  const impact = renderToStaticMarkup(await load("src/app/impact/page.tsx").default());
  assert(impact.includes("Agreed demand value"));
  session = "legacy-admin";
  const moderation = load("src/server/moderation.ts");
  assert.equal((await moderation.requireAdmin()).id, "legacy-admin");
  assert.equal(await invoke(actions.updateProfile, { name: "Legacy administrator", email: "", company: "", bio: "Moderation team", contact: "", links: "" }), "saved");
  await moderation.moderationAccounts(); await moderation.moderationHistory();
  const dashboard = await moderation.moderationDashboard("legacy-artist");
  assert.equal(dashboard.person.bio, "Audited profile");
  assert.equal(dashboard.person.contact, "Public contact");
  assert.equal(Object.hasOwn(dashboard.person, "email"), false);
  assert.equal((await q("SELECT password_hash FROM accounts WHERE id='legacy-admin'"))[0].password_hash, "preserved-admin-hash");
  console.log("PASS: PostgreSQL migrations 001–008, legacy admin grant/credentials/profile compatibility, preserved records/FKs, renamed constraints/indexes, RLS/grants, sample idempotency, public/private projections and full demand workflow.");
} finally {
  await db.close();
}
