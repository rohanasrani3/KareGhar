import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
const mediaDirectory = () => join(process.env.KAREGHAR_DATA_DIR || ".kareghar", "media");
const formats = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  mp4: "video/mp4",
} as const;
export type Extension = keyof typeof formats;
export function isMediaKey(key: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|mp3|mp4|wav)$/.test(key);
}
function detect(data: Buffer): Extension | undefined {
  if (data.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") return "png";
  if (data.subarray(0, 3).toString("hex") === "ffd8ff") return "jpg";
  if (data.toString("ascii", 0, 4) === "RIFF") {
    if (data.toString("ascii", 8, 12) === "WEBP") return "webp";
    if (data.toString("ascii", 8, 12) === "WAVE") return "wav";
  }
  if (data.toString("ascii", 4, 8) === "ftyp") return "mp4";
  if (
    data.toString("ascii", 0, 3) === "ID3" ||
    (data[0] === 255 && (data[1] & 224) === 224)
  )
    return "mp3";
}
function remote(key: string) {
  const base = process.env.SUPABASE_URL,
    secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !secret) throw Error("Supabase Storage configuration missing");
  return {
    url: base + "/storage/v1/object/kareghar/" + key,
    headers: { Authorization: "Bearer " + secret, apikey: secret },
  };
}
export async function saveMedia(file: File, photo: boolean) {
  if (!file.size || file.size > 5 * 1024 * 1024) return null;
  const bytes = Buffer.from(await file.arrayBuffer()),
    ext = detect(bytes);
  if (!ext || (photo && !formats[ext].startsWith("image/"))) return null;
  const key = randomUUID() + "." + ext;
  if (process.env.DATABASE_URL) {
    const { url, headers } = remote(key);
    const response = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": formats[ext] },
      body: new Uint8Array(bytes),
    });
    if (!response.ok) {
      // Supabase explains the failure in the body, e.g. "Bucket not found" or an invalid key.
      const reason = (await response.text().catch(() => "")).slice(0, 300);
      console.error(`[kareghar] media upload failed: ${response.status} ${reason}`);
      throw Error("Media upload failed");
    }
  } else {
    await mkdir(mediaDirectory(), { recursive: true });
    await writeFile(join(mediaDirectory(), key), bytes);
  }
  return key;
}
export async function removeMedia(key: string) {
  if (!isMediaKey(key)) return;
  if (process.env.DATABASE_URL) {
    const { url, headers } = remote(key);
    const result = await fetch(url, { method: "DELETE", headers });
    if (!result.ok) throw Error("Media cleanup failed");
  } else await unlink(join(mediaDirectory(), key)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}
export async function mediaResponse(key: string, request?: Request) {
  if (!isMediaKey(key)) return new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const type = formats[key.split(".").pop() as Extension];
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
    "Content-Disposition": 'inline; filename="' + key + '"',
  };
  let bytes: Buffer;
  try {
    if (process.env.DATABASE_URL) {
      const remoteFile = remote(key),
        response = await fetch(remoteFile.url, {
          headers: remoteFile.headers,
          cache: "no-store",
        });
      if (!response.ok) return new Response(null, { status: response.status === 404 ? 404 : 503, headers });
      bytes = Buffer.from(await response.arrayBuffer());
    } else bytes = await readFile(join(mediaDirectory(), key));
  } catch (error) {
    return new Response(null, { status: (error as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 503, headers });
  }
  const range = request?.headers.get("range");
  if (range?.startsWith("bytes=")) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const size = bytes.length;
    let start = 0, end = size - 1;
    if (match && (match[1] || match[2])) {
      if (match[1]) {
        start = Number(match[1]);
        if (match[2]) end = Math.min(Number(match[2]), size - 1);
      } else start = Math.max(0, size - Number(match[2]));
    }
    if (!match || !(match[1] || match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start || (!match[1] && Number(match[2]) === 0))
      return new Response(null, { status: 416, headers: { ...headers, "Content-Range": "bytes */" + size } });
    headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
    headers["Content-Length"] = String(end - start + 1);
    return new Response(new Uint8Array(bytes.subarray(start, end + 1)), { status: 206, headers });
  }
  headers["Content-Length"] = String(bytes.length);
  return new Response(new Uint8Array(bytes), { headers });
}
