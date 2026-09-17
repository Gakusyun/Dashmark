/**
 * 云同步客户端
 *
 * 同步模型：整包快照。JSON → gzip → AES-GCM 后上传，服务器只见密文。
 * 触发时机：
 * - 自动：打开页面时 + 数据变更后防抖（静默，云端新则拉取覆盖，覆盖前存历史快照）
 * - 手动：设置里的"立即同步"按钮（双向：本地新→上传，云端新→下载，均有变更→冲突弹窗）
 *
 * 状态追踪：localStorage 记录 lastSyncedAt（上次同步后云端的 updatedAt）
 * 与 lastHash（上次同步后本地整包 gzip 的哈希），用于判定"谁更新"。
 */
import * as storage from './storage';
import { deriveKeys, encrypt, decrypt, sha256Hex } from './syncCrypto';

/** 官方公用 Worker 地址；fork 部署后可在设置里填写自己的服务器 */
export const DEFAULT_SYNC_SERVER = 'https://dashmark-sync.gakusyun.workers.dev';

const CONFIG_KEY = 'dashmark_sync_config';
const STATE_KEY = 'dashmark_sync_state';
const DEBOUNCE_MS = 30_000;

export interface SyncConfig {
  server: string;
  id: string;
  passphrase: string;
}

interface SyncState {
  lastSyncedAt: number;
  lastHash: string;
}

export type SyncOutcome = 'pushed' | 'pulled' | 'upToDate' | 'conflict' | 'error';

// ==================== 配置与状态 ====================

export function getConfig(): SyncConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const config = JSON.parse(raw) as SyncConfig;
    return config.id && config.passphrase ? config : null;
  } catch {
    return null;
  }
}

export function setConfig(config: SyncConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function clearConfig(): void {
  localStorage.removeItem(CONFIG_KEY);
  localStorage.removeItem(STATE_KEY);
}

function getState(): SyncState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return JSON.parse(raw) as SyncState;
  } catch {
    // 忽略损坏的状态，视作从未同步
  }
  return { lastSyncedAt: 0, lastHash: '' };
}

function setState(state: SyncState): void {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function getStateSnapshot(): SyncState {
  return getState();
}

// ==================== 服务端通信 ====================

function serverBase(config: SyncConfig): string {
  const base = (config.server || DEFAULT_SYNC_SERVER).replace(/\/+$/, '');
  return base;
}

async function getMeta(base: string, id: string): Promise<number | null> {
  const resp = await fetch(`${base}/sync/${encodeURIComponent(id)}/meta`);
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`meta ${resp.status}`);
  const body = (await resp.json()) as { updatedAt: number };
  return body.updatedAt;
}

async function push(base: string, config: SyncConfig, verifier: string, plain: Uint8Array): Promise<number> {
  const key = (await deriveKeys(config.id, config.passphrase)).key;
  const payload = await encrypt(key, plain);
  const hash = await sha256Hex(plain);
  const resp = await fetch(`${base}/sync/${encodeURIComponent(config.id)}`, {
    method: 'PUT',
    headers: { 'X-Dashmark-Verifier': verifier, 'X-Dashmark-Hash': hash },
    body: payload as unknown as BodyInit,
  });
  if (resp.status === 403) throw new Error('ID 已被其他口令占用');
  if (resp.status === 413) throw new Error('数据包过大');
  if (resp.status === 429) throw new Error('上传过于频繁，请稍后再试');
  if (!resp.ok) throw new Error(`上传失败（${resp.status}）`);
  const body = (await resp.json()) as { updatedAt: number };
  return body.updatedAt;
}

async function pull(base: string, config: SyncConfig): Promise<Uint8Array> {
  const { key, verifier } = await deriveKeys(config.id, config.passphrase);
  const resp = await fetch(`${base}/sync/${encodeURIComponent(config.id)}`, {
    headers: { 'X-Dashmark-Verifier': verifier },
  });
  if (resp.status === 403) throw new Error('口令不正确');
  if (resp.status === 404) throw new Error('云端还没有数据');
  if (resp.status === 429) throw new Error('操作过于频繁，请稍后再试');
  if (!resp.ok) throw new Error(`下载失败（${resp.status}）`);
  const payload = new Uint8Array(await resp.arrayBuffer());
  return decrypt(key, payload);
}

// ==================== 同步流程 ====================

/** 当前本地整包的 gzip 哈希，用于判定本地是否有未同步的修改 */
async function currentPlain(): Promise<Uint8Array> {
  return storage.snapshotCurrent();
}

async function doSync(
  mode: 'auto' | 'manual',
  conflictChoice?: 'local' | 'remote'
): Promise<SyncOutcome> {
  const config = getConfig();
  if (!config) return 'error';

  const base = serverBase(config);
  const { verifier } = await deriveKeys(config.id, config.passphrase);
  const state = getState();
  const plain = await currentPlain();
  const localHash = await sha256Hex(plain);
  const cloudUpdatedAt = await getMeta(base, config.id);

  const localDirty = localHash !== state.lastHash;
  const cloudDirty = cloudUpdatedAt !== null && cloudUpdatedAt !== state.lastSyncedAt;

  // 两边都有新变更
  if (localDirty && cloudDirty) {
    if (mode === 'manual' && !conflictChoice) return 'conflict'; // 交给用户选择
    if (conflictChoice === 'local' || mode === 'auto') {
      // 用本地覆盖云端（自动流程约定：以本地为准静默推送）
      const updatedAt = await push(base, config, verifier, plain);
      setState({ lastSyncedAt: updatedAt, lastHash: localHash });
      return 'pushed';
    }
    // conflictChoice === 'remote'：放弃本地修改，拉取云端
  }

  // 云端有新数据 → 拉取覆盖本地（覆盖前保存历史快照，可撤回）
  if (cloudDirty && (!localDirty || conflictChoice === 'remote' || mode === 'auto')) {
    const payload = await pull(base, config);
    await storage.saveHistorySnapshot();
    await storage.applySnapshot(payload);
    const newHash = await sha256Hex(await storage.snapshotCurrent());
    setState({ lastSyncedAt: cloudUpdatedAt ?? Date.now(), lastHash: newHash });
    return 'pulled';
  }

  // 本地有新数据 → 上传
  if (localDirty) {
    const updatedAt = await push(base, config, verifier, plain);
    setState({ lastSyncedAt: updatedAt, lastHash: localHash });
    return 'pushed';
  }

  return 'upToDate';
}

// ==================== 自动同步（静默） ====================

let syncing = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** 数据变更后调用：30 秒防抖后自动同步一次 */
export function scheduleAutoSync(): void {
  if (!getConfig()) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void autoSync();
  }, DEBOUNCE_MS);
}

/** 静默自动同步：出错只打日志，不打扰用户 */
export async function autoSync(): Promise<SyncOutcome | null> {
  if (syncing || !getConfig()) return null;
  syncing = true;
  try {
    return await doSync('auto');
  } catch (error) {
    console.error('[DashMark] 自动同步失败:', error);
    return 'error';
  } finally {
    syncing = false;
  }
}

// ==================== 手动同步 ====================

/** 手动同步：返回结果供 UI 展示；'conflict' 表示需要用户选择方向 */
export async function manualSync(): Promise<SyncOutcome> {
  if (syncing) return 'error';
  syncing = true;
  try {
    return await doSync('manual');
  } catch (error) {
    console.error('[DashMark] 手动同步失败:', error);
    return 'error';
  } finally {
    syncing = false;
  }
}

/** 用户在冲突弹窗中选择后的处理 */
export async function resolveConflict(choice: 'local' | 'remote'): Promise<SyncOutcome> {
  if (syncing) return 'error';
  syncing = true;
  try {
    return await doSync('manual', choice);
  } catch (error) {
    console.error('[DashMark] 同步冲突处理失败:', error);
    return 'error';
  } finally {
    syncing = false;
  }
}

/** 手动拉取（下载并用云端覆盖本地），冲突处理时也使用 */
export async function pullRemote(): Promise<void> {
  const config = getConfig();
  if (!config) throw new Error('未配置同步');
  const payload = await pull(serverBase(config), config);
  await storage.saveHistorySnapshot();
  await storage.applySnapshot(payload);
  setState({
    lastSyncedAt: Date.now(),
    lastHash: await sha256Hex(await storage.snapshotCurrent()),
  });
}

/** 手动上传（用本地覆盖云端） */
export async function pushLocal(): Promise<void> {
  const config = getConfig();
  if (!config) throw new Error('未配置同步');
  const { verifier } = await deriveKeys(config.id, config.passphrase);
  const plain = await currentPlain();
  const updatedAt = await push(serverBase(config), config, verifier, plain);
  setState({ lastSyncedAt: updatedAt, lastHash: await sha256Hex(plain) });
}

/** 校验一组新的 ID + 口令是否可用（开启同步前调用） */
export async function verifyCredentials(
  server: string,
  id: string,
  passphrase: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    const { verifier } = await deriveKeys(id, passphrase);
    const base = (server || DEFAULT_SYNC_SERVER).replace(/\/+$/, '');
    const resp = await fetch(`${base}/sync/${encodeURIComponent(id)}/meta`);
    if (resp.status === 404) return { ok: true }; // 未被认领，可直接使用
    if (!resp.ok) return { ok: false, message: `服务器响应异常（${resp.status}）` };
    // ID 已存在：尝试下载验证口令是否匹配
    const dl = await fetch(`${base}/sync/${encodeURIComponent(id)}`, {
      headers: { 'X-Dashmark-Verifier': verifier },
    });
    if (dl.status === 403) {
      return { ok: false, message: '该 ID 已被使用，但口令不匹配。请检查口令或换一个 ID。' };
    }
    if (!dl.ok && dl.status !== 429) {
      return { ok: false, message: `服务器响应异常（${dl.status}）` };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: '无法连接同步服务器，请检查网络与服务器地址。' };
  }
}
