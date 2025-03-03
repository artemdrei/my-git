import * as crypto from "crypto";

export function createHash(content: Buffer): string {
  return crypto.createHash("sha1").update(content).digest("hex");
}
