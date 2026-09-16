import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DragHandleIcon } from './Icons';

export interface DraggableItemListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyMessage?: string;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  getItemId: (item: T) => string;
  onOrderChange: (orderedIds: string[]) => void;
}

/**
 * 可拖拽排序列表。
 *
 * 交互实现（鼠标 + 触摸统一走 Pointer Events）：
 *  - 按住拖拽手柄即可"提起"该项，被提起的行跟随指针移动、略微放大并浮起；
 *  - 其余行根据目标位置实时让位（绝对定位 + transform 过渡），
 *    因此视觉上是"其它项滑开"，而不是只给一个虚线框；
 *  - 松手时把最终顺序回写，未移动则视为点击不触发排序。
 *
 * 关键点：拖动过程中只更新本地 DOM transform（不触发 React 重排），
 * 松手才提交一次 onOrderChange，避免拖拽中频繁写库导致卡顿。
 */
export function DraggableItemList<T>({
  items,
  renderItem,
  emptyMessage = '暂无数据',
  selectedIds,
  onToggleSelect,
  getItemId,
  onOrderChange,
}: DraggableItemListProps<T>) {
  const listRef = useRef<HTMLUListElement>(null);
  const rowRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  // 当前被拖拽项的 id 与目标插入位置
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // 拖拽过程中的可变量（不参与渲染，避免频繁 re-render）
  const dragRef = useRef<{
    id: string;
    pointerId: number;
    startY: number;
    /** 每行的高度（含间距），用于计算位移 */
    rowHeight: number;
    /** 各行的原始中心 Y 坐标（拖拽开始时测量一次） */
    centers: number[];
    /** 被拖拽行的原始索引 */
    fromIndex: number;
    /** 指针当前 Y */
    currentY: number;
  } | null>(null);

  const clearDrag = useCallback(() => {
    dragRef.current = null;
    setActiveId(null);
    setOverIndex(null);
  }, []);

  // 拖拽中：把被提起的行固定为跟随指针，其余行按目标位置让位
  const applyTransforms = useCallback(
    (targetIndex: number) => {
      const drag = dragRef.current;
      if (!drag || !listRef.current) return;
      const ids = items.map((it) => getItemId(it));

      ids.forEach((id, index) => {
        const el = rowRefs.current.get(id);
        if (!el) return;

        if (id === drag.id) {
          // 被提起的行：跟随指针
          el.style.transform = `translateY(${drag.currentY - drag.startY}px)`;
          el.style.zIndex = '10';
          return;
        }

        // 让位：位于 from 与 target 之间的行整体前移/后移一格
        let shift = 0;
        if (drag.fromIndex < targetIndex && index > drag.fromIndex && index <= targetIndex) {
          shift = -1;
        } else if (drag.fromIndex > targetIndex && index >= targetIndex && index < drag.fromIndex) {
          shift = 1;
        }
        el.style.transform = shift === 0 ? '' : `translateY(${shift * drag.rowHeight}px)`;
        el.style.zIndex = '';
      });
    },
    [items, getItemId]
  );

  // 指针按下（手柄或整行）：进入拖拽态
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, id: string, index: number) => {
      // 仅响应主键 / 触摸 / 笔
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      // 复选框等交互元素不触发拖拽
      const target = e.target as HTMLElement;
      if (target.closest('input, button, a, textarea, select')) {
        if (!target.closest('[data-drag-handle]')) return;
      }

      const row = rowRefs.current.get(id);
      if (!row) return;
      const rect = row.getBoundingClientRect();
      // 行高含外边距：用相邻两行中心距更准确，退化为行高
      const centers = items.map((it) => {
        const el = rowRefs.current.get(getItemId(it));
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2;
      });
      const rowHeight =
        centers.length > 1
          ? Math.abs(centers[1] - centers[0])
          : rect.height;

      dragRef.current = {
        id,
        pointerId: e.pointerId,
        startY: e.clientY,
        rowHeight,
        centers,
        fromIndex: index,
        currentY: e.clientY,
      };
      setActiveId(id);
      setOverIndex(index);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [items, getItemId]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      drag.currentY = e.clientY;

      // 根据指针 Y 与各行原始中心，算出目标索引
      let target = drag.fromIndex;
      for (let i = 0; i < drag.centers.length; i++) {
        if (e.clientY >= drag.centers[i]) target = i;
      }
      // 指针高于第一行中心时，目标为 0
      if (e.clientY < drag.centers[0]) target = 0;

      if (target !== overIndex) setOverIndex(target);
      applyTransforms(target);
    },
    [applyTransforms, overIndex]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);

      const target = overIndex;
      if (target !== null && target !== drag.fromIndex) {
        const ids = items.map((it) => getItemId(it));
        const next = [...ids];
        const [moved] = next.splice(drag.fromIndex, 1);
        next.splice(target, 0, moved);
        onOrderChange(next);
      }
      clearDrag();
    },
    [items, getItemId, onOrderChange, overIndex, clearDrag]
  );

  // 提交顺序后，待 React 重渲染完毕再清除 transform，避免闪动
  useLayoutEffect(() => {
    if (activeId) return;
    rowRefs.current.forEach((el) => {
      el.style.transform = '';
      el.style.transition = '';
      el.style.zIndex = '';
    });
  }, [activeId, items]);

  // 拖拽态下的全局兜底：指针移出列表也能正常结束
  useEffect(() => {
    if (!activeId) return;
    const onCancel = () => clearDrag();
    window.addEventListener('pointercancel', onCancel);
    return () => window.removeEventListener('pointercancel', onCancel);
  }, [activeId, clearDrag]);

  if (items.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-slate-400 dark:text-slate-500">{emptyMessage}</p>
    );
  }

  const setRowRef = (id: string, el: HTMLLIElement | null) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  };

  return (
    <ul ref={listRef} className="space-y-1.5">
      {items.map((item, index) => {
        const id = getItemId(item);
        const isSelected = selectedIds?.has(id);
        const isActive = activeId === id;

        return (
          <li
            key={id}
            ref={(el) => setRowRef(id, el)}
            className={`relative flex items-center gap-2 rounded-xl border-2 bg-white px-2.5 py-2 will-change-transform dark:bg-black ${
              isSelected ? 'border-transparent bg-sky-50 dark:bg-sky-950/30' : 'border-transparent'
            } ${
              isActive
                ? 'border-sky-500 shadow-lg shadow-slate-900/10 dark:shadow-none'
                : ''
            }`}
            style={{
              // 仅非拖拽行做位移动画；被提起的行直接跟随指针
              transition: isActive ? 'none' : 'transform 180ms cubic-bezier(0.2, 0, 0, 1)',
              touchAction: 'none',
            }}
          >
            {selectedIds && onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(id)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 shrink-0 accent-sky-600"
              />
            )}
            <div className="min-w-0 flex-1">{renderItem(item)}</div>
            <button
              type="button"
              data-drag-handle
              aria-label="拖动排序"
              onPointerDown={(e) => handlePointerDown(e, id, index)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={`shrink-0 cursor-grab rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing dark:text-slate-500 dark:hover:bg-slate-900 dark:hover:text-slate-300 ${
                isActive ? 'text-sky-500' : ''
              }`}
              style={{ touchAction: 'none' }}
            >
              <DragHandleIcon size={18} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
