import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { OpenInNewIcon, ContentCopyIcon, EditIcon } from './Icons';
import type { Link, Bookmark } from '../types';

interface BookmarkCardProps {
  link: Link | Bookmark;
  onEdit?: () => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ link, onEdit }) => {
  const href = link.url ?? ('url' in link ? link.url : '');
  const { showSuccess, showError } = useToast();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX + 2, y: e.clientY - 6 });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleOpenInNewTab = () => {
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
    handleCloseContextMenu();
  };

  const handleCopyLink = () => {
    if (href) {
      navigator.clipboard
        .writeText(href)
        .then(() => showSuccess('链接已复制到剪贴板'))
        .catch(() => showError('复制失败'));
    }
    handleCloseContextMenu();
  };

  const handleEdit = () => {
    onEdit?.();
    handleCloseContextMenu();
  };

  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <div className="h-full cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-[#1e1e1e]">
          <p className="overflow-hidden text-ellipsis whitespace-nowrap font-medium text-slate-900 dark:text-white">
            {link.title}
          </p>
          <p className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
            {href}
          </p>
        </div>
      </a>
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-[9990]" onClick={handleCloseContextMenu} />
          <div
            className="fixed z-[9991] min-w-[160px] overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <MenuItem icon={<OpenInNewIcon size={16} />} onClick={handleOpenInNewTab}>
              在新标签页打开
            </MenuItem>
            <MenuItem icon={<ContentCopyIcon size={16} />} onClick={handleCopyLink}>
              复制链接
            </MenuItem>
            {onEdit && (
              <MenuItem icon={<EditIcon size={16} />} onClick={handleEdit}>
                编辑
              </MenuItem>
            )}
          </div>
        </>
      )}
    </>
  );
};

function MenuItem({
  icon,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      <span className="text-slate-500 dark:text-slate-400">{icon}</span>
      {children}
    </button>
  );
}
