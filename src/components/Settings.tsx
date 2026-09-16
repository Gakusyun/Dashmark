import { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { DialogBox } from './DialogBox';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import {
  DeleteIcon,
  EditIcon,
  AddIcon,
  CloudUploadIcon,
  CloudDownloadIcon,
} from './Icons';
import type { SearchEngine } from '../types';
import { isValidUrl, normalizeUrl } from '../utils/urlValidator';

const selectCls =
  'w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:text-white';

export const Settings: React.FC = () => {
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
  const { mode, setMode } = useTheme();
  const { showError, showSuccess } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEngine, setEditingEngine] = useState<SearchEngine | null>(null);
  const [engineFormData, setEngineFormData] = useState({
    name: '',
    url: '',
  });

  // 使用确认对话框 Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // 导入模式：replace=覆盖, merge=合并
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');

  const customEngines = data.searchEngines;

  const handleAddEngine = () => {
    setEditingEngine(null);
    setEngineFormData({ name: '', url: '' });
    setModalOpen(true);
  };

  const handleEditEngine = (engine: SearchEngine) => {
    setEditingEngine(engine);
    setEngineFormData({ name: engine.name, url: engine.url });
    setModalOpen(true);
  };

  const handleDeleteEngine = (id: string) => {
    const engine = customEngines.find((e) => e.id === id);
    confirm({
      title: `确定删除搜索引擎"${engine?.name}"吗？`,
      onConfirm: () => deleteSearchEngine(id),
    });
  };

  const handleSaveEngine = () => {
    if (!engineFormData.name.trim() || !engineFormData.url.trim()) {
      showError('名称和 URL 不能为空');
      return;
    }

    // 验证 URL 安全性
    const rawUrl = engineFormData.url.trim();
    if (!isValidUrl(rawUrl)) {
      showError('URL 格式无效或不安全，请检查输入');
      return;
    }

    // 规范化 URL（确保包含协议）
    const url = normalizeUrl(rawUrl);

    if (editingEngine) {
      updateSearchEngine(editingEngine.id, engineFormData.name.trim(), url);
    } else {
      addSearchEngine(engineFormData.name.trim(), url);
    }

    setModalOpen(false);
  };

  const handleExport = () => {
    exportData();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteData = () => {
    confirm({
      title: '确定清除所有数据吗？',
      content: '此操作将删除所有分组、链接、文字记录和自定义设置，且无法恢复！',
      confirmText: '清除数据',
      confirmColor: 'error',
      onConfirm: () => {
        clearAllData();
        showSuccess('数据已清除');
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isMerge = importMode === 'merge';

    importData(
      file,
      (warnings) => {
        if (warnings.length > 0) {
          warnings.forEach((w) => showError(w));
        }
        showSuccess(isMerge ? '数据合并成功' : '数据导入成功');
        refreshData();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      (error) => {
        showError(`导入失败：${error.message}`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      isMerge
    );
  };

  return (
    <div>
      {/* 深色模式 */}
      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
          深色模式
        </label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as 'light' | 'dark' | 'auto')}
          className={selectCls}
        >
          <option value="auto">跟随系统</option>
          <option value="light">浅色</option>
          <option value="dark">深色</option>
        </select>
      </div>

      {/* 默认搜索引擎 */}
      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
          默认搜索引擎
        </label>
        <select
          value={data.settings.searchEngine}
          onChange={(e) => updateSettings({ searchEngine: e.target.value })}
          className={selectCls}
        >
          {allSearchEngines.map((engine) => (
            <option key={engine.id} value={engine.id}>
              {engine.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleAddEngine}
        className="mb-3 flex items-center gap-1.5 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <AddIcon size={16} />
        添加搜索引擎
      </button>

      {/* 自定义搜索引擎列表 */}
      <ul className="mb-6 divide-y divide-slate-100 dark:divide-slate-700">
        {customEngines.map((engine) => (
          <li key={engine.id} className="flex items-center gap-1 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{engine.name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{engine.url}</p>
            </div>
            <button
              onClick={() => handleEditEngine(engine)}
              aria-label="编辑"
              className="rounded p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <EditIcon size={18} />
            </button>
            <button
              onClick={() => handleDeleteEngine(engine.id)}
              aria-label="删除"
              className="rounded p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <DeleteIcon size={18} />
            </button>
          </li>
        ))}
      </ul>

      {/* 开关设置 */}
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm text-slate-700 dark:text-slate-200">隐藏备案信息</span>
        <ToggleSwitch
          checked={data.settings.hideLegalInfo || false}
          onChange={(e) => updateSettings({ hideLegalInfo: e.target.checked })}
        />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm text-slate-700 dark:text-slate-200">Cookie 同意状态</span>
        <ToggleSwitch
          checked={data.settings.cookieConsent === true}
          onChange={(e) => updateSettings({ cookieConsent: e.target.checked })}
        />
      </div>

      {/* 搜索引擎编辑对话框 */}
      <DialogBox
        open={modalOpen}
        title={editingEngine ? '编辑搜索引擎' : '添加搜索引擎'}
        confirmText="保存"
        onConfirm={handleSaveEngine}
        onClose={() => setModalOpen(false)}
      >
        <input
          autoFocus
          className={`${selectCls} mb-3 mt-1`}
          placeholder="例如：必应"
          value={engineFormData.name}
          onChange={(e) => setEngineFormData({ ...engineFormData, name: e.target.value })}
        />
        <input
          className={selectCls}
          placeholder="https://www.bing.com/search?q="
          value={engineFormData.url}
          onChange={(e) => setEngineFormData({ ...engineFormData, url: e.target.value })}
        />
        <div className="mt-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-300">
          URL 中使用 {'{q}'} 作为搜索关键词的占位符，例如：https://example.com/search?q={'{q}'}
        </div>
      </DialogBox>

      {/* 导入导出 */}
      <div className="mb-3 flex flex-wrap gap-3">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <CloudDownloadIcon size={16} />
          导出数据
        </button>
        <button
          onClick={handleImportClick}
          className="flex items-center gap-1.5 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <CloudUploadIcon size={16} />
          导入数据
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,.json.gz"
          className="hidden"
        />
        <button
          onClick={handleDeleteData}
          className="flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          <DeleteIcon size={16} />
          清空数据
        </button>
      </div>

      {/* 导入模式 */}
      <div className="mb-4 flex gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="radio"
            value="replace"
            checked={importMode === 'replace'}
            onChange={(e) => setImportMode(e.target.value as 'replace' | 'merge')}
            className="h-4 w-4 accent-blue-600"
          />
          覆盖现有数据
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="radio"
            value="merge"
            checked={importMode === 'merge'}
            onChange={(e) => setImportMode(e.target.value as 'replace' | 'merge')}
            className="h-4 w-4 accent-blue-600"
          />
          合并到现有数据
        </label>
      </div>

      <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-300">
        数据以 JSON 格式存储在本地浏览器中。建议定期备份数据以防丢失。
      </div>

      <ConfirmDialog />
    </div>
  );
};

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="relative inline-block h-6 w-11 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="absolute inset-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-blue-600 dark:bg-slate-600" />
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
    </label>
  );
}
