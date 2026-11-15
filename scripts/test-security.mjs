import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname, extname, join } from "node:path";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { DatabaseSync } from "node:sqlite";
import { hash } from "@node-rs/argon2";
import ts from "typescript";
import { initializeLocalDb } from "./init-local-db.mjs";

const require = createRequire(import.meta.url), root = process.cwd();
const directory = mkdtempSync(join(tmpdir(), "kareghar-security-"));
const previousDirectory = process.env.KAREGHAR_DATA_DIR;
process.env.KAREGHAR_DATA_DIR = directory;
const db = new DatabaseSync(":memory:");
const passwordHash = await hash("original-password");
// Provision an admin using the original schema, before profile and demand upgrades.
db.exec(readFileSync("migrations/001_marketplace.sql", "utf8"));
db.exec(readFileSync("migrations/003_moderation.sql", "utf8").split("-- PostgreSQL privileges")[0] + "COMMIT;");
db.prepare("INSERT INTO accounts(id,username,email,name,role,password_hash) VALUES('admin','admin','','Administrator','customer',?)").run(passwordHash);
db.exec("INSERT INTO admin_grants(account) VALUES('admin')");
initializeLocalDb(db);
initializeLocalDb(db);
const upgradedAdmin = db.prepare("SELECT * FROM account_state WHERE id='admin'").get();
assert.equal(upgradedAdmin.password_hash, passwordHash);
assert.equal(upgradedAdmin.effective_role, "admin");
assert.equal(upgradedAdmin.email, "");
assert.equal(upgradedAdmin.contact, "");
assert.equal(upgradedAdmin.bio, "");
assert.equal(upgradedAdmin.deleted, 0);
assert.equal(upgradedAdmin.suspended, 0);
const statements = [];
const query = async (sql, values = []) => {
  statements.push({ sql, values });
  const ordered = [];
  return db.prepare(sql.replace(/\$(\d+)/g, (_, n) => { ordered.push(values[Number(n) - 1]); return "?"; }))
    .all(...ordered).map((row) => ({ ...row }));
};
const transaction = async (work) => {
  db.exec("BEGIN IMMEDIATE");
  try { const value = await work(query); db.exec("COMMIT"); return value; }
  catch (error) { db.exec("ROLLBACK"); throw error; }
};
let session = null;
class Redirect extends Error {}
const mocks = {
  "server-only": {},
  "next-auth": { getServerSession: async () => session },
  "next-auth/providers/credentials": { __esModule: true, default: (options) => options },
  "next/cache": { revalidatePath() {} },
  "next/headers": { cookies: async () => ({ set() {} }) },
  "next/navigation": { redirect(path) { throw new Redirect(path); }, notFound() { throw new Error("404"); } },
};
const cache = new Map();
function load(file) {
  const absolute = resolve(root, file);
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const loaded = { exports: {} }; cache.set(absolute, loaded);
  const compiled = ts.transpileModule(readFileSync(absolute, "utf8"), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  const localRequire = (name) => {
    if (mocks[name]) return mocks[name];
    let target = name.startsWith("@/") ? resolve(root, "src", name.slice(2)) : name.startsWith(".") ? resolve(dirname(absolute), name) : null;
    if (!target) return require(name);
    if (target === resolve(root, "src/server/db")) return { query, transaction };
    if (!extname(target)) { try { readFileSync(target + ".ts"); target += ".ts"; } catch { target += ".tsx"; } }
    return load(target);
  };
  runInNewContext(`(function(require,module,exports){${compiled}\n})`, {
    File, FormData, Response, Request, URL, Buffer, Date, console, process, fetch, setTimeout, clearTimeout,
  })(localRequire, loaded, loaded.exports);
  return loaded.exports;
}
const invoke = (action, values) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value instanceof File ? value : String(value));
  return action("", data);
};
for (const [id, role] of [["customer", "customer"], ["artist", "artist"]])
  await query("INSERT INTO accounts(id,username,email,name,role,password_hash) VALUES($1,$1,$2,$1,$3,$4)", [id, id + "@example.invalid", role, passwordHash]);
const actAs = async (id) => {
  const [account] = await query("SELECT session_version FROM account_state WHERE id=$1", [id]);
  session = { accountId: id, revision: account.session_version };
};
const auth = load("src/server/auth.ts"), actions = load("src/server/actions.ts"), media = load("src/server/media.ts");
const authorize = auth.authOptions.providers[0].authorize;
let key;
try {
  assert.equal((await authorize({ username: "admin", password: "original-password" })).id, "admin");
  await actAs("admin");
  assert.equal((await auth.viewer()).role, "admin");
  const moderationReads = load("src/server/moderation.ts");
  assert.equal((await moderationReads.requireAdmin()).id, "admin");
  // Historical blank email/contact must not prevent an admin saving a profile.
  assert.equal(await invoke(actions.updateProfile, { name: "Administrator", email: "", company: "", bio: "Moderation team", contact: "", links: "" }), "saved");
  assert.equal((await auth.viewer()).role, "admin");
  assert.equal(await invoke(actions.deleteAccount, { current: "original-password", confirm: "DELETE" }), "denied");
  await assert.rejects(invoke(actions.changePassword, { current: "original-password", password: "updated-admin-password" }), Redirect);
  assert.equal(await auth.viewer(), null);
  assert.equal(await authorize({ username: "admin", password: "original-password" }), null);
  assert.equal((await authorize({ username: "admin", password: "updated-admin-password" })).id, "admin");
  await actAs("admin");
  assert.equal((await moderationReads.requireAdmin()).id, "admin");

  for (let i = 0; i < 12; i++) assert.equal(await authorize({ username: "customer", password: "wrong" }), null);
  assert.equal(await authorize({ username: "customer", password: "original-password" }), null);
  await query("UPDATE login_limits SET started=0");
  assert.equal((await authorize({ username: "customer", password: "original-password" })).id, "customer");
  assert.equal((await query("SELECT COUNT(*) AS n FROM login_limits"))[0].n, 0);
  await query("UPDATE accounts SET password_hash='malformed' WHERE id='artist'");
  assert.equal(await authorize({ username: "artist", password: "original-password" }), null);
  await query("UPDATE accounts SET password_hash=$1 WHERE id='artist'", [passwordHash]);
  assert.equal(await authorize({ username: "invalid:username", password: "original-password" }), null);

  await actAs("customer");
  for (let i = 0; i < 12; i++) assert.equal(await invoke(actions.changePassword, { current: "wrong", password: "new-password" }), "denied");
  assert.equal(await invoke(actions.deleteAccount, { current: "original-password", confirm: "DELETE" }), "limited");
  await query("UPDATE login_limits SET started=0");
  await assert.rejects(invoke(actions.changePassword, { current: "original-password", password: "new-password" }), Redirect);
  assert.equal(await auth.viewer(), null);

  assert.equal(await media.saveMedia(new File(["not an image"], "picture.png"), true), null);
  assert.equal(await media.saveMedia(new File([""], "empty.png"), true), null);
  const bytes = Buffer.from("89504e470d0a1a0a010203040506", "hex");
  key = await media.saveMedia(new File([bytes], "picture.png"), true);
  assert(media.isMediaKey(key));
  assert.equal((await media.mediaResponse("../outside.png")).status, 404);
  assert.equal((await media.mediaResponse("00000000-0000-0000-0000-000000000000.png")).status, 404);
  const whole = await media.mediaResponse(key);
  assert.equal(whole.status, 200);
  assert.equal(whole.headers.get("Cache-Control"), "private, no-store");
  assert.equal(whole.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(Buffer.from(await whole.arrayBuffer()).toString("hex"), bytes.toString("hex"));
  for (const [range, start, end] of [["bytes=2-5", 2, 5], ["bytes=-4", bytes.length - 4, bytes.length - 1], ["bytes=8-", 8, bytes.length - 1]]) {
    const part = await media.mediaResponse(key, new Request("http://test", { headers: { Range: range } }));
    assert.equal(part.status, 206);
    assert.equal(part.headers.get("Content-Range"), `bytes ${start}-${end}/${bytes.length}`);
    assert.equal(Buffer.from(await part.arrayBuffer()).toString("hex"), bytes.subarray(start, end + 1).toString("hex"));
  }
  for (const range of ["bytes=999-", "bytes=5-2", "bytes=-0", "bytes=-", "bytes=0-1,3-4"]) {
    const response = await media.mediaResponse(key, new Request("http://test", { headers: { Range: range } }));
    assert.equal(response.status, 416);
    assert.equal(response.headers.get("Content-Range"), "bytes */" + bytes.length);
  }

  await query("INSERT INTO forms(id,category,name,hi) VALUES('test','painting','Test','Test')");
  await query("UPDATE accounts SET bio='Artist biography',contact='Public studio contact' WHERE id='artist'");
  await query("INSERT INTO demands(id,customer,artist,form,title,brief,fee,original_fee,status,output,created) VALUES('admin-privacy','customer','artist','test','Private completion','Private completion',7,10,'done',$1,1)", [key]);
  await query("INSERT INTO proposals(id,demand,artist,message,quote,initial_quote) VALUES('private-proposal','admin-privacy','artist','Private offer',7,7)");
  await query("INSERT INTO demand_ratings(demand,customer,artist,score,created,updated) VALUES('admin-privacy','customer','artist',5,1,1)");
  await query("INSERT INTO messages(id,demand,sender,artist,body,created) VALUES('private-message','admin-privacy','customer','artist','Private conversation',1)");
  await actAs("admin");
  const market = load("src/server/market.ts"), history = load("src/server/history.ts");
  const dashboard = await moderationReads.moderationDashboard("artist");
  assert.equal(dashboard.person.bio, "Artist biography");
  assert.equal(dashboard.person.contact, "Public studio contact");
  for (const privateField of ["email", "password_hash", "revision"])
    assert.equal(Object.hasOwn(dashboard.person, privateField), false);
  assert.equal(await market.publicProfile("admin"), undefined);
  assert.equal(await history.historyDetail("admin-privacy", "admin"), undefined);
  assert.equal((await market.proposals("admin-privacy", "admin")).length, 0);
  const [privateDemand] = await market.commissions({}, "admin-privacy", "admin");
  assert.equal(privateDemand.fee, 10);
  assert.equal(privateDemand.output, "");
  assert.equal(privateDemand.rating, null);
  const mediaRoute = load("src/app/api/media/[key]/route.ts");
  assert.equal((await mediaRoute.GET(new Request("http://test"), { params: Promise.resolve({ key }) })).status, 404);
  assert.equal(await invoke(actions.commissionAction, { id: "admin-privacy", action: "rate", rating: 1 }), "conflict");
  assert.equal(await invoke(actions.commissionAction, { id: "admin-privacy", action: "visibility", public: "on" }), "conflict");
  await query("INSERT INTO demands(id,customer,artist,form,title,brief,fee,status,output_type,created) VALUES('format','customer','artist','test','Image','Image',10,'progress','audio',1)");
  await actAs("artist");
  assert.equal(await invoke(actions.commissionAction, { id: "format", action: "submit", file: new File([bytes], "wrong.png") }), "file");
  assert.equal((await query("SELECT status FROM demands WHERE id='format'"))[0].status, "progress");

  const schemas = load("src/contract/schemas.ts");
  for (const url of ["javascript:alert(1)", "data:text/html,hello", "https://name:secret@example.com/work", "not a URL"])
    assert.equal(schemas.web.safeParse(url).success, false);
  assert.equal(schemas.web.safeParse("https://example.com/work").success, true);

  const moderation = load("src/server/moderation-action.ts");
  for (const [id, role] of [["second_customer", "customer"], ["second_artist", "artist"]])
    await query("INSERT INTO accounts(id,username,email,name,role,password_hash) VALUES($1,$1,$2,$1,$3,$4)", [id, id + "@example.invalid", role, passwordHash]);
  await query("INSERT INTO demands(id,customer,form,title,brief,fee,original_fee,created) VALUES('selection','second_customer','test','Selection','Selection',10,10,1)");
  await actAs("second_artist");
  assert.equal(await invoke(actions.commissionAction, { id: "selection", action: "propose", pricing: "offered", message: "Ready to help", acknowledged: "on" }), "saved");
  const [proposal] = await query("SELECT id FROM proposals WHERE demand='selection'");
  const moderate = async (target, action) => {
    await actAs("admin");
    const [account] = await query("SELECT session_version FROM account_state WHERE id=$1", [target]);
    return invoke(moderation.moderateAccount, { target, version: account.session_version, action, reason: "Review account access", confirm: "on" });
  };
  assert.equal(await moderate("second_artist", "suspend"), "saved");
  await actAs("second_customer");
  assert.equal(await invoke(actions.commissionAction, { id: "selection", action: "select", proposal: proposal.id, acknowledged: "on" }), "conflict");
  assert.equal((await query("SELECT status FROM demands WHERE id='selection'"))[0].status, "finding");
  assert.equal(await moderate("second_artist", "restore"), "saved");
  await actAs("second_customer");
  statements.length = 0;
  assert.equal(await invoke(actions.commissionAction, { id: "selection", action: "select", proposal: proposal.id, acknowledged: "on" }), "saved");
  const demandLock = statements.findIndex(({ sql }) => sql.startsWith("UPDATE demands SET updated=updated"));
  const accountLocks = statements.map(({ sql, values }, index) => ({ sql, values, index }))
    .filter(({ sql }) => sql === "UPDATE accounts SET revision=revision WHERE id=$1");
  assert.deepEqual(accountLocks.map(({ values }) => values[0]), ["second_artist", "second_customer"]);
  assert(accountLocks.every(({ index }) => index > demandLock));
  for (const participant of ["second_customer", "second_artist"]) {
    await actAs(participant);
    assert.equal(await invoke(actions.deleteAccount, { current: "original-password", confirm: "DELETE" }), "active");
  }
  assert.equal(await moderate("second_customer", "suspend"), "saved");
  await actAs("second_artist");
  assert.equal(await invoke(actions.commissionAction, { id: "selection", action: "submit", file: new File([bytes], "finished.png") }), "denied");

  await query("UPDATE accounts SET deleted=1 WHERE id='customer'");
  await actAs("admin");
  assert.equal((await moderationReads.moderationAccounts()).find((account) => account.id === "customer").deleted, 1);
  assert.equal((await moderationReads.moderationDashboard("customer")).person.deleted, 1);
  assert.equal(await invoke(moderation.moderateAccount, { target: "customer", version: 1, action: "restore", reason: "Should not restore deleted account", confirm: "on" }), "conflict");
  assert.equal(await invoke(moderation.moderateAccount, { target: "customer", version: "999999999999999999999999", action: "restore", reason: "Invalid version", confirm: "on" }), "invalid");

  await media.removeMedia(key);
  await media.removeMedia(key);
  assert.equal((await media.mediaResponse(key)).status, 404);
  console.log("PASS: legacy admin migration/login/profile/password compatibility and privacy boundaries, persistent login/current-password budgets, invalid hashes, session invalidation, safe external URLs, upload signatures/format, private media keys and byte ranges, missing files, moderation/selection account lock ordering, suspended-participant guards, active-work deletion and deleted-account moderation.");
} finally {
  if (key) await media.removeMedia(key);
  db.close();
  try { rmdirSync(join(directory, "media")); } catch {}
  rmdirSync(directory);
  if (previousDirectory === undefined) delete process.env.KAREGHAR_DATA_DIR;
  else process.env.KAREGHAR_DATA_DIR = previousDirectory;
}
