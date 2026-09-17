/**
 * 云同步的本地加密
 *
 * 口令永不明文离开浏览器：
 * - AES 密钥   = PBKDF2(口令, 盐 = ID + ":enc") → AES-256-GCM 加解密
 * - 口令校验值 = PBKDF2(口令, 盐 = ID + ":ver") → 发给服务器做"认领"比对
 *
 * 盐是确定性字符串（由 ID 派生），因此任何设备上输入相同 ID + 口令
 * 都会得到相同密钥，多端同步不受影响。
 */

const PBKDF2_ITERATIONS = 150_000;

async function deriveBits(
  passphrase: string,
  salt: string
): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
}

export interface SyncKeys {
  /** AES-256-GCM 密钥，仅存在于本浏览器 */
  key: CryptoKey;
  /** 口令校验值（十六进制），随请求发送给服务器比对 */
  verifier: string;
}

export async function deriveKeys(id: string, passphrase: string): Promise<SyncKeys> {
  const [keyBits, verifierBits] = await Promise.all([
    deriveBits(passphrase, `${id}:enc`),
    deriveBits(passphrase, `${id}:ver`),
  ]);

  const key = await crypto.subtle.importKey('raw', keyBits, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
  const verifier = Array.from(new Uint8Array(verifierBits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { key, verifier };
}

/** AES-256-GCM 加密，输出格式：12 字节 IV + 密文（含认证标签） */
export async function encrypt(key: CryptoKey, plaintext: Uint8Array): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plaintext as unknown as BufferSource
    )
  );
  const result = new Uint8Array(iv.length + ciphertext.length);
  result.set(iv, 0);
  result.set(ciphertext, iv.length);
  return result;
}

/** 解密 12 字节 IV 前缀的 AES-256-GCM 密文；口令错误会抛出异常 */
export async function decrypt(key: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext as unknown as BufferSource
  );
  return new Uint8Array(plaintext);
}

/** SHA-256 十六进制摘要（用于"内容一致不写入"的预检） */
export async function sha256Hex(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data as unknown as BufferSource);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
