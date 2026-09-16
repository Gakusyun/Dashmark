import { DeleteIcon, EditIcon } from './Icons';

export interface ItemListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyMessage?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  getItemId: (item: T) => string;
}

export function ItemList<T>({
  items,
  renderItem,
  emptyMessage = '暂无数据',
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
  getItemId,
}: ItemListProps<T>) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-slate-500 dark:text-slate-400">{emptyMessage}</p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-700">
      {items.map((item) => {
        const id = getItemId(item);
        const isSelected = selectedIds?.has(id);
        return (
          <li
            key={id}
            className={`flex items-center gap-1 rounded-md px-1 py-1.5 ${
              isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
          >
            {selectedIds && onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(id)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 accent-blue-600"
              />
            )}
            <div className="min-w-0 flex-1">{renderItem(item)}</div>
            <div className="flex shrink-0 items-center">
              {onEdit && (
                <button
                  onClick={() => onEdit(item)}
                  aria-label="编辑"
                  className="rounded p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  <EditIcon size={18} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(item)}
                  aria-label="删除"
                  className="rounded p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  <DeleteIcon size={18} />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
