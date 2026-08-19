const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer)).map(byte => byte.toString(16).padStart(2, '0')).join('');

export const createPasswordRecord = async (password: string) => {
  const salt = crypto.randomUUID();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`));
  return { salt, hash: toHex(digest) };
};

export const verifyPasswordRecord = async (password: string, record: { salt: string; hash: string }) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${record.salt}:${password}`));
  return toHex(digest) === record.hash;
};
