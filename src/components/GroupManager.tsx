import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { DialogBox } from './DialogBox';
import { ItemList } from './ItemList';
import { DraggableItemList } from './DraggableItemList';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import type { Group } from '../types';

interface GroupManagerProps {
  onClose?: () => void;
}

export const GroupManager: React.FC<GroupManagerProps> = () => {
  const { data, addGroup, updateGroup, deleteGroup, updateGroupOrder } = useData();
  const { showError } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Group>({
    id: '',
    name: '',
    order: 0,
  });

  // 添加排序模式状态
  const [isSortingMode, setIsSortingMode] = useState(false);

  // 使用确认对话框 Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const renderGroupItem = (group: Group) => {
    const linkCount = data.bookmarks.filter(
      (b) => b.type === 'link' && b.groupIds.includes(group.id)
    ).length;
    const textCount = data.bookmarks.filter(
      (b) => b.type === 'text' && b.groupIds.includes(group.id)
    ).length;

    const counts = [];
    if (linkCount > 0) counts.push(`${linkCount} 个链接`);
    if (textCount > 0) counts.push(`${textCount} 条文字`);

    const secondaryText = counts.length > 0 ? counts.join(', ') : '暂无内容';

    return (
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{group.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{secondaryText}</p>
      </div>
    );
  };

  const handleDelete = (group: Group) => {
    const linkCount = data.bookmarks.filter(
      (b) => b.type === 'link' && b.groupIds.includes(group.id)
    ).length;
    const textCount = data.bookmarks.filter(
      (b) => b.type === 'text' && b.groupIds.includes(group.id)
    ).length;

    const itemsDescription = [];
    if (linkCount > 0) {
      itemsDescription.push(`${linkCount} 个链接`);
    }
    if (textCount > 0) {
      itemsDescription.push(`${textCount} 条文字记录`);
    }

    const itemsText = itemsDescription.join(' 和 ');
    const title = itemsText
      ? `分组"${group.name}"包含 ${itemsText}，删除分组将同时删除仅属于此分组的收藏。确定要删除吗？`
      : `确定删除分组"${group.name}"吗？`;

    confirm({
      title: title,
      onConfirm: () => deleteGroup(group.id),
    });
  };

  const openAdd = () => {
    setIsEditing(false);
    setFormData({ id: '', name: '', order: 0 });
    setModalOpen(true);
  };

  const openEdit = (group: Group) => {
    setIsEditing(true);
    setFormData({ ...group });
    setModalOpen(true);
  };

  const close = () => {
    setModalOpen(false);
  };

  const updateFormData = (updates: Partial<Group>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      showError('分组名称不能为空');
      return;
    }

    if (isEditing) {
      updateGroup(formData.id, formData.name.trim());
    } else {
      addGroup(formData.name.trim());
    }

    close();
  };

  // 切换排序模式
  const toggleSortingMode = () => {
    setIsSortingMode(!isSortingMode);
  };

  return (
    <div>
      <div className="mb-4 flex gap-3">
        <button
          onClick={openAdd}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          添加分组
        </button>
        <button
          onClick={toggleSortingMode}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {isSortingMode ? '完成排序' : '修改次序'}
        </button>
      </div>

      {data.groups.length === 0 ? (
        <p className="py-6 text-center text-slate-500 dark:text-slate-400">
          暂无分组，点击"添加分组"开始添加
        </p>
      ) : isSortingMode ? (
        <DraggableItemList
          items={[...data.groups].sort((a, b) => a.order - b.order)}
          getItemId={(group) => group.id}
          emptyMessage='暂无分组，点击"添加分组"开始添加'
          onOrderChange={updateGroupOrder}
          renderItem={renderGroupItem}
        />
      ) : (
        <ItemList
          items={[...data.groups].sort((a, b) => a.order - b.order)}
          getItemId={(group) => group.id}
          emptyMessage='暂无分组，点击"添加分组"开始添加'
          onEdit={openEdit}
          onDelete={handleDelete}
          renderItem={renderGroupItem}
        />
      )}

      <DialogBox
        open={modalOpen}
        title={isEditing ? '编辑分组' : '添加分组'}
        confirmText="保存"
        onConfirm={handleSave}
        onClose={close}
      >
        <input
          autoFocus
          className="mt-1 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:text-white"
          placeholder="分组名称"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
        />
      </DialogBox>

      <ConfirmDialog />
    </div>
  );
};
