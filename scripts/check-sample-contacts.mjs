// Shared SQLite/PostgreSQL regression for the maintenance SQL and seed upgrade.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

export async function checkSampleContacts(q, seedSamples) {
  const before = await q("SELECT id,status,customer,artist,fee FROM demands ORDER BY id");
  const fixtures = [
    ["blank", 1, 0, "   "], ["kept", 1, 0, "public@example.invalid"],
    ["real", 0, 0, ""], ["deleted", 1, 1, ""], ["admin", 1, 0, ""],
  ];
  for (const [name, sample, deleted, contact] of fixtures) {
    const id = "contact-check-" + name;
    await q(`INSERT INTO accounts(id,username,email,name,role,password_hash,sample,deleted,contact)
      VALUES($1,$1,$2,$1,'artist','',$3,$4,$5)`, [id, id + "-private@example.invalid", sample, deleted, contact]);
  }
  await q("INSERT INTO admin_grants(account) VALUES('contact-check-admin')");
  const verify = async () => {
    for (const [name, , , original] of fixtures) {
      const [row] = await q("SELECT contact,email FROM accounts WHERE id=$1", ["contact-check-" + name]);
      assert.equal(row.contact, name === "blank" ? "contact-check-blank@example.invalid" : original);
      assert.equal(row.email, "contact-check-" + name + "-private@example.invalid");
    }
    assert.deepEqual(await q("SELECT id,status,customer,artist,fee FROM demands ORDER BY id"), before);
  };
  // Execute the shipped SQL statements twice to check repeatability in each dialect.
  const statements = readFileSync("scripts/backfill-sample-contacts.sql", "utf8")
    .replace(/--[^\n]*/g, "").split(";").map((sql) => sql.trim()).filter(Boolean);
  for (let run = 0; run < 2; run++) for (const sql of statements) await q(sql);
  await verify();
  // Simulate a database with the old catalogue marker but no contact upgrade.
  await q("UPDATE accounts SET contact='' WHERE id='contact-check-blank'");
  await q("DELETE FROM schema_migrations WHERE version='samples:2026-11-16-contacts'");
  await seedSamples(q);
  await seedSamples(q);
  await verify();
  await q("DELETE FROM admin_grants WHERE account='contact-check-admin'");
  for (const [name] of fixtures) await q("DELETE FROM accounts WHERE id=$1", ["contact-check-" + name]);
}
