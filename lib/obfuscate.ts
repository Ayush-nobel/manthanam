import "server-only";

/** Reverse + base64 an email address so it isn't plain text in the HTML. Decoded by ObfuscatedEmailLink. */
export function encodeEmail(email: string): string {
  return Buffer.from([...email].reverse().join(""), "utf8").toString("base64");
}
