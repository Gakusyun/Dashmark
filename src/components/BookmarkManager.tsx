import { useState, useCallback, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { DialogBox } from './DialogBox';
import { DraggableItemList } from './DraggableItemList';
import { ItemList } from './ItemList';
import { GroupSelector } from './GroupSelector';
import { useBatchSelection } from '../hooks/useBatchSelection';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import type { Bookmark } from '../types';
import { isValidUrl, normalizeUrl } from '../utils/urlValidator';

interface BookmarkManagerProps {
  onClose?: () => void;
  autoAdd?: number;
  onAutoAddConsumed?: () => void;
}

export const BookmarkManager: React.FC<BookmarkManagerProps> = ({ autoAdd, onAutoAddConsumed }) => {
  const {
    data,
    deleteBookmark,
    updateBookmark,
    addBookmark,
    batchDeleteBookmarks,
    addGroup,
    updateBookmarkOrder,
  } = useData();
  const { showError, showWarning } = useToast();

  // 使用批量选择 Hook
  const {
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    selectedCount,
    isAllSelected,
    isIndeterminate,
  } = useBatchSelection({
    items: data.bookmarks || [],
    getItemId: (bookmark) => bookmark.id,
  });

  // 使用确认对话框 Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [formData, setFormData] = useState({
    type: 'link' as 'link' | 'text',
    title: '',
    url: '',
    content: '',
    groupIds: [] as string[],
  });

  // 添加排序模式状态
  const [isSortingMode, setIsSortingMode] = useState(false);

  // 自动打开添加对话框（由 FAB 触发）
  const autoAddConsumedRef = useRef(false);
  useEffect(() => {
    if (autoAdd && !autoAddConsumedRef.current) {
      autoAddConsumedRef.current = true;
      setEditingBookmark(null);
      setFormData({ type: 'link', title: '', url: '', content: '', groupIds: [] });
      setModalOpen(true);
      onAutoAddConsumed?.();
    }
  }, [autoAdd, onAutoAddConsumed]);

  const handleBatchDelete = () => {
    if (selectedCount === 0) return;

    confirm({
      title: `确定删除选中的 ${selectedCount} 个收藏吗？`,
      onConfirm: () => {
        batchDeleteBookmarks(Array.from(selectedIds));
        clearSelection();
      },
    });
  };

  const handleAdd = () => {
    setEditingBookmark(null);
    setFormData({
      type: 'link',
      title: '',
      url: '',
      content: '',
      groupIds: [],
    });
    setModalOpen(true);
  };

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setFormData({
      type: bookmark.type,
      title: bookmark.title,
      url: bookmark.url || '',
      content: bookmark.content || '',
      groupIds: [...bookmark.groupIds],
    });
    setModalOpen(true);
  };

  const handleDelete = (bookmark: Bookmark) => {
    confirm({
      title: `确定删除收藏"${bookmark.title}"吗？`,
      onConfirm: () => deleteBookmark(bookmark.id),
    });
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      showError('标题不能为空');
      return;
    }

    if (formData.type === 'link' && !formData.url.trim()) {
      showError('URL不能为空');
      return;
    }

    if (formData.type === 'text' && !formData.content.trim()) {
      showError('内容不能为空');
      return;
    }

    if (formData.groupIds.length === 0) {
      showWarning('请至少选择一个分组');
      return;
    }

    // 如果是链接类型，验证 URL 安全性
    if (formData.type === 'link') {
      const rawUrl = formData.url.trim();
      if (!isValidUrl(rawUrl)) {
        showError('URL 格式无效或不安全，请检查输入');
        return;
      }
    }

    // 规范化 URL（确保包含协议）
    const url = formData.type === 'link' ? normalizeUrl(formData.url.trim()) : undefined;

    if (editingBookmark) {
      updateBookmark(
        editingBookmark.id,
        formData.type,
        formData.title.trim(),
        formData.groupIds,
        url,
        formData.type === 'text' ? formData.content.trim() : undefined
      );
    } else {
      addBookmark(
        formData.type,
        formData.title.trim(),
        formData.groupIds,
        url,
        formData.type === 'text' ? formData.content.trim() : undefined
      );
    }

    setModalOpen(false);
  };

  const handleGroupCreated = useCallback((group: { id: string }) => {
    setFormData((prev) => ({
      ...prev,
      groupIds: [...prev.groupIds, group.id],
    }));
  }, []);

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      type: event.target.value as 'link' | 'text',
    });
  };

  // 根据类型生成显示文本
  const getSecondaryText = (bookmark: Bookmark) => {
    if (bookmark.type === 'link') {
      return bookmark.url || '';
    } else {
      const content = bookmark.content || '';
      return content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }
  };

  // 切换排序模式
  const toggleSortingMode = () => {
    setIsSortingMode(!isSortingMode);
  };

  const inputCls =
    'w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:text-white';

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <button
          onClick={handleAdd}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          添加收藏
        </button>
        <button
          onClick={toggleSortingMode}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {isSortingMode ? '完成排序' : '修改次序'}
        </button>
        {selectedCount > 0 && (
          <button
            onClick={handleBatchDelete}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            批量删除 ({selectedCount})
          </button>
        )}
      </div>

      {(data.bookmarks?.length ?? 0) === 0 ? (
        <p className="py-6 text-center text-slate-500 dark:text-slate-400">
          暂无收藏，点击"添加收藏"开始添加
        </p>
      ) : (
        <>
          <div className="mb-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onChange={selectAll}
                className="h-4 w-4 accent-blue-600"
              />
              全选
            </label>
          </div>
          {isSortingMode ? (
            <DraggableItemList
              items={[...(data.bookmarks || [])].sort((a, b) => a.order - b.order)}
              getItemId={(bookmark) => bookmark.id}
              emptyMessage='暂无收藏，点击"添加收藏"开始添加'
              onOrderChange={updateBookmarkOrder}
              renderItem={(bookmark) => (
                <div className="ml-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {bookmark.title}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {getSecondaryText(bookmark)}
                  </p>
                </div>
              )}
            />
          ) : (
            <ItemList
              items={[...(data.bookmarks || [])].sort((a, b) => a.order - b.order)}
              getItemId={(bookmark) => bookmark.id}
              emptyMessage='暂无收藏，点击"添加收藏"开始添加'
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onEdit={handleEdit}
              onDelete={handleDelete}
              renderItem={(bookmark) => (
                <div className="ml-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {bookmark.title}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {getSecondaryText(bookmark)}
                  </p>
                </div>
              )}
            />
          )}
        </>
      )}

      <DialogBox
        open={modalOpen}
        title={editingBookmark ? '编辑收藏' : '添加收藏'}
        confirmText="保存"
        onConfirm={handleSave}
        onClose={() => setModalOpen(false)}
      >
        <div className="mb-3 mt-1">
          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">收藏类型</p>
          <div className="flex gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="radio"
                value="link"
                checked={formData.type === 'link'}
                onChange={handleTypeChange}
                className="h-4 w-4 accent-blue-600"
              />
              链接
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="radio"
                value="text"
                checked={formData.type === 'text'}
                onChange={handleTypeChange}
                className="h-4 w-4 accent-blue-600"
              />
              文字记录
            </label>
          </div>
        </div>

        <input
          autoFocus
          className={`${inputCls} mb-3`}
          placeholder="标题"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        {formData.type === 'link' ? (
          <input
            className={`${inputCls} mb-3`}
            placeholder="example.com 或 https://example.com"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />
        ) : (
          <textarea
            className={`${inputCls} mb-3 resize-y`}
            rows={4}
            placeholder="输入要保存的文字内容"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          />
        )}

        <GroupSelector
          groups={data.groups}
          selectedIds={formData.groupIds}
          onSelectionChange={(ids) => setFormData({ ...formData, groupIds: ids })}
          onCreateGroup={(name) => addGroup(name)}
          onGroupCreated={handleGroupCreated}
        />
      </DialogBox>

      <ConfirmDialog />
    </div>
  );
};
