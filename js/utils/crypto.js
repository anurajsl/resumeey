/* Web Crypto AES-GCM for API Key Encryption */

const ALGORITHM = 'AES-GCM';
const KEY_USAGE = ['encrypt', 'decrypt'];
const STORAGE_KEY = 'resumey_enc_key';

let _keyCache = null;

async function getKey() {
  if (_keyCache) return _keyCache;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const raw = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
    _keyCache = await crypto.subtle.importKey('raw', raw, ALGORITHM, false, KEY_USAGE);
    return _keyCache;
  }

  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: 256 },
    true,
    KEY_USAGE
  );

  const exported = await crypto.subtle.exportKey('raw', key);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  localStorage.setItem(STORAGE_KEY, b64);
  _keyCache = key;
  return key;
}

export async function encrypt(plaintext) {
  if (!plaintext) return '';
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded);
  // Combine iv + ciphertext and base64 encode
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(b64) {
  if (!b64) return '';
  try {
    const key = await getKey();
    const combined = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decoded = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, ciphertext);
    return new TextDecoder().decode(decoded);
  } catch {
    return '';
  }
}

export function clearEncryptionKey() {
  localStorage.removeItem(STORAGE_KEY);
  _keyCache = null;
}
