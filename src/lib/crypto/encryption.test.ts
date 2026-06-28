import { beforeAll, describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./encryption";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
});

describe("encrypt / decrypt", () => {
  it("round-trips a known string", () => {
    const plain = "HDFC0001234";
    expect(decrypt(encrypt(plain))).toBe(plain);
  });

  it("produces different ciphertext for identical plaintext (random IV)", () => {
    const a = encrypt("same");
    const b = encrypt("same");
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe("same");
    expect(decrypt(b)).toBe("same");
  });

  it("rejects tampered ciphertext", () => {
    const ct = encrypt("secret");
    expect(() => decrypt(ct.replace(/.$/, "X"))).toThrow();
  });
});
