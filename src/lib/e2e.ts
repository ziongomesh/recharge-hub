// E2E (ECDH P-256 + AES-GCM 256). Servidor nunca vê texto claro.
// Uso:
//   const me = await generateKeyPair();
//   exportPublicKey(me.publicKey) -> base64 (manda pro peer via socket)
//   const shared = await deriveSharedKey(me.privateKey, peerPubB64);
//   const { ciphertext, iv } = await encrypt(shared, 'oi');
//   const plain = await decrypt(shared, ciphertext, iv);

const subtle = window.crypto.subtle;

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
}

export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const raw = await subtle.exportKey("spki", publicKey);
  return bufToB64(raw);
}

export async function importPeerPublicKey(b64: string): Promise<CryptoKey> {
  return subtle.importKey("spki", b64ToBuf(b64), { name: "ECDH", namedCurve: "P-256" }, false, []);
}

export async function deriveSharedKey(privateKey: CryptoKey, peerPubB64: string): Promise<CryptoKey> {
  const peerPub = await importPeerPublicKey(peerPubB64);
  return subtle.deriveKey(
    { name: "ECDH", public: peerPub },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(shared: CryptoKey, plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(plaintext);
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, shared, enc);
  return { ciphertext: bufToB64(ct), iv: bufToB64(iv.buffer) };
}

export async function decrypt(shared: CryptoKey, ciphertextB64: string, ivB64: string): Promise<string> {
  const ct = b64ToBuf(ciphertextB64);
  const iv = new Uint8Array(b64ToBuf(ivB64));
  const plain = await subtle.decrypt({ name: "AES-GCM", iv }, shared, ct);
  return new TextDecoder().decode(plain);
}
