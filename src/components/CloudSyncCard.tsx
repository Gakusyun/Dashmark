import { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Field, Input } from './ui/Field';
import { CloudIcon, HistoryIcon, SyncIcon, TrashIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import * as storage from '../utils/storage';
import {
  DEFAULT_SYNC_SERVER,
  autoSync,
  clearConfig,
  getConfig,
  getStateSnapshot,
  manualSync,
  pullRemote,
  pushLocal,
  setConfig,
  verifyCredentials,
  type SyncConfig,
} from '../utils/sync';

/**
 * 设置面板"数据"区的云同步卡片：
 * 开启同步（ID + 口令）/ 立即同步 / 冲突处理 / 历史版本撤回 / 退出同步。
 */
export function CloudSyncCard() {
  const { showSuccess, showError } = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { refreshData } = useData();

  const [config, setLocalConfig] = useState<SyncConfig | null>(() => getConfig());
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(() => getStateSnapshot().lastSyncedAt);

  // 开启同步的表单
  const [server, setServer] = useState('');
  const [syncId, setSyncId] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [starting, setStarting] = useState(false);

  // 冲突弹窗
  const [conflictOpen, setConflictOpen] = useState(false);
  // 历史版本弹窗
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<{ id: string; savedAt: number }[]>([]);
  const [busy, setBusy] = useState(false);

  // 开启同步后：先静默同步一次，让用户立刻看到状态
  useEffect(() => {
    if (!config) return;
    void autoSync().then(() => setLastSyncedAt(getStateSnapshot().lastSyncedAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSync = async () => {
    const id = syncId.trim();
    const pass = passphrase;
    if (!id || !pass) return showError('同步 ID 和口令都不能为空');
    if (id.length < 3) return showError('同步 ID 至少需要 3 个字符');
    if (pass.length < 6) return showError('口令至少需要 6 个字符，太短容易被猜出');

    setStarting(true);
    try {
      const result = await verifyCredentials(server.trim(), id, pass);
      if (!result.ok) return showError(result.message ?? '校验失败');

      const next = { server: server.trim(), id, passphrase: pass };
      setConfig(next);
      setLocalConfig(next);
      setPassphrase('');
      void autoSync().then(() => setLastSyncedAt(getStateSnapshot().lastSyncedAt));
      showSuccess('云同步已开启');
    } finally {
      setStarting(false);
    }
  };

  const stopSync = () => {
    confirm({
      title: '退出云同步？',
      content:
        '本机将不再自动同步，云端数据不会被删除。重新开启时输入相同的 ID 和口令即可继续同步。',
      confirmText: '退出',
      onConfirm: () => {
        clearConfig();
        setLocalConfig(null);
        setLastSyncedAt(0);
        showSuccess('已退出云同步');
      },
    });
  };

  const runSync = async () => {
    setBusy(true);
    try {
      const outcome = await manualSync();
      setLastSyncedAt(getStateSnapshot().lastSyncedAt);
      if (outcome === 'conflict') {
        setConflictOpen(true);
      } else if (outcome === 'pulled') {
        showSuccess('已从云端恢复最新数据');
        await refreshData();
      } else if (outcome === 'pushed') {
        showSuccess('已上传到云端');
      } else if (outcome === 'upToDate') {
        showSuccess('云端与本地已是最新');
      } else {
        showError('同步失败，请检查网络与配置');
      }
    } finally {
      setBusy(false);
    }
  };

  const chooseConflict = async (choice: 'local' | 'remote') => {
    setBusy(true);
    setConflictOpen(false);
    try {
      if (choice === 'local') {
        await pushLocal();
        showSuccess('已用本地数据覆盖云端');
      } else {
        await pullRemote();
        showSuccess('已用云端数据覆盖本地');
        await refreshData();
      }
      setLastSyncedAt(getStateSnapshot().lastSyncedAt);
    } catch {
      showError('同步失败，请检查网络与配置');
    } finally {
      setBusy(false);
    }
  };

  const openHistory = async () => {
    setHistory(await storage.listHistory());
    setHistoryOpen(true);
  };

  const restore = (id: string, savedAt: number) => {
    confirm({
      title: '恢复该历史版本？',
      content: `当前数据会先上传到云端，随后本地将恢复到 ${new Date(savedAt).toLocaleString()} 的状态。`,
      confirmText: '恢复',
      onConfirm: async () => {
        setBusy(true);
        try {
          await storage.restoreHistory(id);
          await pushLocal();
          await refreshData();
          setLastSyncedAt(getStateSnapshot().lastSyncedAt);
          setHistoryOpen(false);
          showSuccess('已恢复历史版本');
        } catch {
          showError('恢复失败');
        } finally {
          setBusy(false);
        }
      },
    });
  };

  return (
    <>
      <div className="pt-2">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <CloudIcon size={14} />
            云同步
          </span>
          {config && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {lastSyncedAt > 0 ? `上次同步：${new Date(lastSyncedAt).toLocaleString()}` : '尚未同步'}
            </span>
          )}
        </div>

        {!config ? (
          <div className="space-y-3 rounded-lg border border-dashed border-slate-200 p-3 dark:border-slate-700">
            <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
              数据在本地加密后才会上传，服务器无法查看内容。多台设备输入相同的
              ID 和口令即可互相同步。
              <span className="text-amber-600 dark:text-amber-500">
                请务必记牢 ID 和口令：忘记后将无法找回云端数据。
              </span>
            </p>
            <Field label="服务器地址" hint="留空使用官方服务器；自部署请填写你的后端地址">
              <Input
                value={server}
                onChange={(e) => setServer(e.target.value)}
                placeholder={DEFAULT_SYNC_SERVER}
                inputMode="url"
              />
            </Field>
            <Field label="同步 ID">
              <Input
                value={syncId}
                onChange={(e) => setSyncId(e.target.value)}
                placeholder="自定义一个不易撞名的 ID"
                maxLength={64}
              />
            </Field>
            <Field label="口令">
              <Input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="至少 6 位，忘了就找不回数据"
                maxLength={128}
              />
            </Field>
            <Button
              variant="primary"
              size="sm"
              icon={<CloudIcon size={14} />}
              disabled={starting}
              onClick={() => void startSync()}
            >
              {starting ? '校验中…' : '开启同步'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-slate-600 dark:text-slate-300">
              {config.id}
              <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                {config.server || '官方服务器'}
              </span>
            </span>
            <Button
              variant="primary"
              size="sm"
              icon={<SyncIcon size={14} className={busy ? 'animate-spin' : undefined} />}
              disabled={busy}
              onClick={() => void runSync()}
            >
              立即同步
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<HistoryIcon size={14} />}
              disabled={busy}
              onClick={() => void openHistory()}
            >
              历史版本
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<TrashIcon size={14} />}
              disabled={busy}
              onClick={stopSync}
            >
              退出同步
            </Button>
          </div>
        )}
      </div>

      {/* 冲突处理 */}
      <Modal
        open={conflictOpen}
        title="同步冲突"
        onClose={() => setConflictOpen(false)}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConflictOpen(false)}>
              取消
            </Button>
            <Button variant="secondary" onClick={() => void chooseConflict('remote')}>
              用云端覆盖本地
            </Button>
            <Button variant="primary" onClick={() => void chooseConflict('local')}>
              用本地上传
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          本地和云端都有新的修改。选择保留哪一边：
          覆盖本地时会先把当前数据存入历史版本，可以撤回。
        </p>
      </Modal>

      {/* 历史版本 */}
      <Modal
        open={historyOpen}
        title="历史版本"
        onClose={() => setHistoryOpen(false)}
        size="sm"
      >
        {history.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            还没有历史版本。每次从云端覆盖本地之前，都会自动保存一份，供你撤回。
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {history.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {new Date(entry.savedAt).toLocaleString()}
                </span>
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => restore(entry.id, entry.savedAt)}>
                  恢复
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ConfirmDialog />
    </>
  );
}
