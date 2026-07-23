const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const CHAR_TO_INDEX: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i += 1) {
  CHAR_TO_INDEX[ALPHABET[i]] = i;
}

// Décodeur base64 -> octets sans dépendance (ni atob, ni Buffer, dont la
// disponibilité n'est pas garantie dans tous les moteurs JS de React Native) :
// nécessaire pour envoyer une image (récupérée en base64 depuis
// expo-image-manipulator) vers Supabase Storage, qui attend des octets bruts.
export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[\r\n]/g, '').replace(/=+$/, '');
  const byteLength = Math.floor((clean.length * 6) / 8);
  const bytes = new Uint8Array(byteLength);

  let byteIndex = 0;
  let buffer = 0;
  let bitsInBuffer = 0;

  for (const char of clean) {
    const value = CHAR_TO_INDEX[char];
    if (value === undefined) continue;
    buffer = (buffer << 6) | value;
    bitsInBuffer += 6;
    if (bitsInBuffer >= 8) {
      bitsInBuffer -= 8;
      bytes[byteIndex] = (buffer >> bitsInBuffer) & 0xff;
      byteIndex += 1;
    }
  }

  return bytes;
}
