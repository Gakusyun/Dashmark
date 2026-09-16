import { useMemo, useRef, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field, Input, Segmented, Switch } from './ui/Field';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  ExportIcon,
  ImportIcon,
  SearchIcon,
} from './Icons';
import { isValidUrl, normalizeUrl } from '../utils/urlValidator';
import { getDisplayHost } from '../utils/urlDisplay';
import type { SearchEngine } from '../types';

/**
 * 设置面板：按"外观 / 搜索 / 数据"分区，取代旧版平铺的一长条控件。
 */
export function SettingsPanel() {
  const {
    data,
    allSearchEngines,
    updateSettings,
    addSearchEngine,
    updateSearchEngine,
    deleteSearchEngine,
    exportData,
    importData,
    refreshData,
    clearAllData,
  } = useData();
  const { showError, showSuccess, showWarning } = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const fileRef = useRef<HTMLInputElement>(null);
  const [engineEditorOpen, setEngineEditorOpen] = useState(false);
  const [editingEngine, setEditingEngine] = useState<SearchEngine | null>(null);
  const [engineName, setEngineName] = useState('');
  const [engineUrl, setEngineUrl] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');

  const customEngines = data.searchEngines;

  const totals = useMemo(
    () => ({
      links: data.bookmarks.filter((b) => b.type === 'link').length,
      texts: data.bookmarks.filter((b) => b.type === 'text').length,
    }),
    [data.bookmarks]
  );

  const openNewEngine = () => {
    setEditingEngine(null);
    setEngineName('');
    setEngineUrl('');
    setEngineEditorOpen(true);
  };

  const openEditEngine = (engine: SearchEngine) => {
    setEditingEngine(engine);
    setEngineName(engine.name);
    setEngineUrl(engine.url);
    setEngineEditorOpen(true);
  };

  const saveEngine = () => {
    const name = engineName.trim();
    const raw = engineUrl.trim();
    if (!name || !raw) return showError('名称和网址都不能为空');
    if (!isValidUrl(raw)) return showError('网址格式无效或不安全');

    const url = normalizeUrl(raw);
    if (editingEngine) {
      updateSearchEngine(editingEngine.id, name, url);
    } else {
      addSearchEngine(name, url);
    }
    setEngineEditorOpen(false);
  };

  const removeEngine = (engine: SearchEngine) => {
    confirm({
      title: `删除搜索引擎「${engine.name}」？`,
      confirmText: '删除',
      onConfirm: () => deleteSearchEngine(engine.id),
    });
  };

  const handleImportFile = (file: File) => {
    const merge = importMode === 'merge';
    importData(
      file,
      (warnings) => {
        warnings.forEach((w) => showWarning(w));
        showSuccess(merge ? '已合并导入' : '已覆盖导入');
        refreshData();
        if (fileRef.current) fileRef.current.value = '';
      },
      (error) => {
        showError(`导入失败：${error.message}`);
        if (fileRef.current) fileRef.current.value = '';
      },
      merge
    );
  };

  const handleClearAll = () => {
    confirm({
      title: '清空所有数据？',
      content: '所有分组、链接、文字记录与自定义设置都会被删除，且无法恢复。建议先导出备份。',
      confirmText: '清空',
      onConfirm: () => {
        clearAllData();
        showSuccess('数据已清空');
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* ============ 外观 ============ */}
      <Section title="外观" description="主题固定跟随系统设置">
        <Row label="隐藏备案信息" description="关闭页脚的公网/ICP 备案展示">
          <Switch
            label="隐藏备案信息"
            checked={data.settings.hideLegalInfo ?? false}
            onChange={(checked) => updateSettings({ hideLegalInfo: checked })}
          />
        </Row>
        <Row label="匿名使用统计" description="使用 Microsoft Clarity 分析使用情况以改进体验">
          <Switch
            label="匿名使用统计"
            checked={data.settings.cookieConsent === true}
            onChange={(checked) => updateSettings({ cookieConsent: checked })}
          />
        </Row>
      </Section>

      {/* ============ 搜索 ============ */}
      <Section title="搜索" description="命令栏在无匹配结果时会用默认引擎搜索网络">
        <Row label="默认搜索引擎">
          <select
            value={data.settings.searchEngine}
            onChange={(e) => updateSettings({ searchEngine: e.target.value })}
            className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-black dark:text-slate-300 dark:focus:border-sky-400"
          >
            {allSearchEngines.map((engine) => (
              <option key={engine.id} value={engine.id}>
                {engine.name}
              </option>
            ))}
          </select>
        </Row>

        <div className="pt-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              自定义搜索引擎
            </span>
            <Button size="sm" variant="ghost" icon={<PlusIcon size={13} />} onClick={openNewEngine}>
              添加
            </Button>
          </div>

          {customEngines.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
              还没有自定义引擎，内置的 Google / Bing / 百度 / 夸克始终可用
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
              {customEngines.map((engine) => (
                <li key={engine.id} className="group flex items-center gap-3 px-3 py-2">
                  <SearchIcon size={15} className="shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                      {engine.name}
                    </p>
                    <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                      {getDisplayHost(engine.url)}
                    </p>
                  </div>
                  <button
                    onClick={() => openEditEngine(engine)}
                    aria-label={`编辑 ${engine.name}`}
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                  >
                    <EditIcon size={15} />
                  </button>
                  <button
                    onClick={() => removeEngine(engine)}
                    aria-label={`删除 ${engine.name}`}
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                  >
                    <TrashIcon size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      {/* ============ 数据 ============ */}
      <Section
        title="数据"
        description={`当前共 ${data.groups.length} 个分组、${totals.links} 个链接、${totals.texts} 条文字记录`}
      >
        <Row label="导入模式" description="导入备份文件时如何处理现有数据">
          <Segmented
            value={importMode}
            onChange={setImportMode}
            options={[
              { value: 'replace', label: '覆盖' },
              { value: 'merge', label: '合并' },
            ]}
          />
        </Row>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="primary" icon={<ExportIcon size={15} />} onClick={() => exportData()}>
            导出备份
          </Button>
          <Button
            variant="secondary"
            icon={<ImportIcon size={15} />}
            onClick={() => fileRef.current?.click()}
          >
            导入备份
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.gz,.json.gz"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
            }}
          />
          <Button variant="danger" icon={<TrashIcon size={15} />} onClick={handleClearAll}>
            清空数据
          </Button>
        </div>

        <p className="pt-1 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
          数据保存在浏览器的 IndexedDB 中，不会上传到服务器。清理浏览器数据会导致丢失，建议定期导出备份。
        </p>
      </Section>

      {/* 搜索引擎编辑 */}
      <Modal
        open={engineEditorOpen}
        title={editingEngine ? '编辑搜索引擎' : '添加搜索引擎'}
        onClose={() => setEngineEditorOpen(false)}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEngineEditorOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={saveEngine}>
              保存
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="名称">
            <Input
              autoFocus
              value={engineName}
              onChange={(e) => setEngineName(e.target.value)}
              placeholder="例如：DuckDuckGo"
              maxLength={50}
            />
          </Field>
          <Field
            label="搜索地址"
            hint={
              <>
                用 <code className="rounded bg-slate-100 px-1 dark:bg-slate-700">{'{q}'}</code>{' '}
                表示关键词位置，例如 https://duckduckgo.com/?q={'{q}'}；不含占位符时关键词会追加在末尾。
              </>
            }
          >
            <Input
              value={engineUrl}
              onChange={(e) => setEngineUrl(e.target.value)}
              placeholder="https://example.com/search?q="
              inputMode="url"
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog />
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{description}</p>
        )}
      </header>
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-black dark:shadow-none">
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-slate-700 dark:text-slate-200">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
