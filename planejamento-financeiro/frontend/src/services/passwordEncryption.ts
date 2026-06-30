const ENCRYPTED_PREFIX = "enc:v1:";

function publicKeyPem() {
  return process.env.NEXT_PUBLIC_PASSWORD_ENCRYPTION_PUBLIC_KEY?.replace(/\\n/g, "\n").trim() ?? "";
}

function pemToArrayBuffer(pem: string) {
  const base64 = pem
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\s/g, "");
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

function bytesToBase64(bytes: ArrayBuffer) {
  const view = new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

export async function encryptPassword(password: string) {
  if (password.startsWith(ENCRYPTED_PREFIX)) return password;
  const pem = publicKeyPem();
  if (!pem) {
    return password;
  }
  const key = await window.crypto.subtle.importKey(
    "spki",
    pemToArrayBuffer(pem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    key,
    new TextEncoder().encode(password)
  );
  return `${ENCRYPTED_PREFIX}${bytesToBase64(encrypted)}`;
}
