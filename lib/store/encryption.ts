import crypto from "node:crypto";

function fieldKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET fehlt");
  return crypto.createHash("sha256").update(`agentic-os-sensitive-fields:${secret}`).digest();
}

export function encryptSensitive(value: unknown) {
  const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv("aes-256-gcm", fieldKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptSensitive(value: string) {
  const [iv, tag, data] = value.split("."), decipher = crypto.createDecipheriv("aes-256-gcm", fieldKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8"));
}
