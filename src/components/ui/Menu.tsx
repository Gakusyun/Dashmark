import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

export interface MenuItemSpec {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onSelect: () => void;
}

interface MenuProps {
  items: MenuItemSpec[];
  /** 触发后菜单锚定的屏幕坐标 */
  anchor: { x: number; y: number } | null;
  onClose: () => void;
}

/**
 * 浮层菜单：可复用为右键菜单或"更多操作"下拉。
 * 通过 portal 渲染到 body，避免被卡片 overflow 裁剪。
 */
export function Menu({ items, anchor, onClose }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: -9999, y: -9999 });

  // 首帧测量后把菜单限制在视口内
  useLayoutEffect(() => {
    if (!anchor || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const pad = 8;
    let x = anchor.x;
    let y = anchor.y;
    if (x + rect.width > window.innerWidth - pad) x = window.innerWidth - rect.width - pad;
    if (y + rect.height > window.innerHeight - pad) y = anchor.y - rect.height;
    setPos({ x: Math.max(pad, x), y: Math.max(pad, y) });
  }, [anchor]);

  useEffect(() => {
    if (!anchor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anchor, onClose]);

  if (!anchor) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9990]">
      <div className="absolute inset-0" onClick={onClose} onContextMenu={(e) => e.preventDefault()} />
      <div
        ref={ref}
        role="menu"
        className="animate-pop absolute min-w-[11rem] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-800"
        style={{ top: pos.y, left: pos.x }}
      >
        {items.map((item) => (
          <button
            key={item.key}
            role="menuitem"
            onClick={() => {
              item.onSelect();
              onClose();
            }}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
              item.danger
                ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'
            )}
          >
            {item.icon && (
              <span className={item.danger ? '' : 'text-slate-400 dark:text-slate-500'}>
                {item.icon}
              </span>
            )}
            <span className="flex-1">{item.label}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}
