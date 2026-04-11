/// <reference path="../types/des-js.d.ts" />
import CryptoJS from "crypto-js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import desPkg from "des.js";
const des = desPkg as {
  DES: unknown;
  CBC: {
    instantiate: (base: unknown) => {
      create: (o: Record<string, unknown>) => {
        update: (d: number[]) => number[];
        final: () => number[];
      };
    };
  };
};

const CBC = des.CBC.instantiate(des.DES);

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const o = new Uint8Array(a.length + b.length);
  o.set(a, 0);
  o.set(b, a.length);
  return o;
}

function uint8ToWordArray(u8: Uint8Array): CryptoJS.lib.WordArray {
  const words: number[] = [];
  for (let i = 0; i < u8.length; i++) {
    words[i >>> 2] |= u8[i]! << (24 - (i % 4) * 8);
  }
  return CryptoJS.lib.WordArray.create(words, u8.length);
}

function wordArrayToUint8(wa: CryptoJS.lib.WordArray): Uint8Array {
  const out = new Uint8Array(wa.sigBytes);
  for (let i = 0; i < wa.sigBytes; i++) {
    out[i] = (wa.words[i >>> 2]! >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return out;
}

function md5Digest(data: Uint8Array): Uint8Array {
  return wordArrayToUint8(CryptoJS.MD5(uint8ToWordArray(data)));
}

/** OpenJDK PBES1Core DES key derivation (see PBES1Core.deriveCipherKey for DES). */
export function deriveJavaPbeMd5DesKeyIv(
  password: string,
  salt: Uint8Array,
  iterationCount: number,
): { key: Uint8Array; iv: Uint8Array } {
  const passwdBytes = new TextEncoder().encode(password);
  let toBeHashed = md5Digest(concatBytes(passwdBytes, salt));
  for (let i = 1; i < iterationCount; i++) {
    toBeHashed = md5Digest(toBeHashed);
  }
  return {
    key: toBeHashed.subarray(0, 8),
    iv: toBeHashed.subarray(8, 16),
  };
}

/** Salt bytes from BrdReader.java PBEParameterSpec. */
export const BRD_PBE_SALT = new Uint8Array([
  0xc7, 0x73, 0x21, 0x8c, 0x7e, 0xc8, 0xee, 0x99,
]);

export function decryptBrdPayload(
  ciphertext: Uint8Array,
  password: string,
  iterations = 20,
): string {
  const { key, iv } = deriveJavaPbeMd5DesKeyIv(password, BRD_PBE_SALT, iterations);
  const dec = CBC.create({
    type: "decrypt",
    key: [...key],
    iv: [...iv],
    padding: true,
  });
  const plainBlocks = dec.update([...ciphertext]).concat(dec.final());
  return new TextDecoder("utf-8").decode(Uint8Array.from(plainBlocks));
}

export function decryptBrdFile(fullFile: Uint8Array, password: string): string {
  if (fullFile.length <= 12) throw new Error("Encrypted .brd too short");
  return decryptBrdPayload(fullFile.subarray(12), password);
}

export function encryptBrdPayload(plaintext: string, password: string, iterations = 20): Uint8Array {
  const { key, iv } = deriveJavaPbeMd5DesKeyIv(password, BRD_PBE_SALT, iterations);
  const enc = CBC.create({
    type: "encrypt",
    key: [...key],
    iv: [...iv],
    padding: true,
  });
  const pt = [...new TextEncoder().encode(plaintext)];
  return Uint8Array.from(enc.update(pt).concat(enc.final()));
}

export function wrapEncryptedBrdFile(plaintext: string, variant: "1.01" | "1.02"): Uint8Array {
  const label = variant === "1.02" ? "%BRD-1.02" : "%BRD-1.01";
  const pw = variant === "1.02" ? "deltaXTaildeltaXMiddle" : "deltaXTail";
  const head = new Uint8Array(12);
  head.set(new TextEncoder().encode(`${label}\r\n`), 0);
  const body = encryptBrdPayload(plaintext, pw);
  const out = new Uint8Array(12 + body.length);
  out.set(head, 0);
  out.set(body, 12);
  return out;
}

export function brdEncryptionPasswordForHeader(headerLine: string): string | null {
  const h = headerLine.trim();
  if (h.startsWith("%BRD-1.02")) return "deltaXTaildeltaXMiddle";
  if (h.startsWith("%BRD-1.01")) return "deltaXTail";
  return null;
}
