import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useData } from '../contexts/DataContext';
import { ContentCopyIcon, CloseIcon, EditIcon, SaveIcon, CancelIcon } from './Icons';
import type { TextRecord, Bookmark } from '../types';

interface TextRecordCardProps {
  record: TextRecord | Bookmark;
  isFullscreen: boolean;
  onOpenFullscreen: () => void;
  onCloseFullscreen: () => void;
}

export const TextRecordCard: React.FC<TextRecordCardProps> = ({
  record,
  isFullscreen,
  onOpenFullscreen,
  onCloseFullscreen,
}) => {
  const { showSuccess } = useToast();
  const { updateBookmark } = useData();

  const content = ('type' in record ? record.content : (record as TextRecord).content) || '';

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  useEffect(() => {
    setEditContent(content);
  }, [content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    showSuccess('内容已复制到剪贴板');
  };

  const handleStartEdit = () => {
    setEditContent(content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(content);
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) {
      return;
    }
    if ('type' in record) {
      const bookmark = record as Bookmark;
      updateBookmark(bookmark.id, 'text', bookmark.title, bookmark.groupIds, undefined, editContent.trim());
    }
    setIsEditing(false);
    showSuccess('内容已保存');
  };

  const handleClose = () => {
    setIsEditing(false);
    onCloseFullscreen();
  };

  return (
    <>
      <div
        className="flex h-full cursor-pointer flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-[#1e1e1e]"
        onClick={(e) => {
          e.stopPropagation();
          onOpenFullscreen();
        }}
      >
        <p className="mb-1 overflow-hidden text-ellipsis whitespace-nowrap font-medium text-slate-900 dark:text-white">
          {record.title}
        </p>
        <p className="line-clamp-3 flex-1 whitespace-pre-wrap break-words text-sm text-slate-500 dark:text-slate-400">
          {content}
        </p>
      </div>

      {/* 全屏显示对话框 */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[9990] flex flex-col bg-white dark:bg-[#121212]">
          {/* 顶部工具栏 */}
          <div className="sticky top-0 flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-[#1e1e1e]">
            <button
              onClick={handleClose}
              aria-label="close"
              className="rounded p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <CloseIcon size={20} />
            </button>
            <h2 className="ml-2 flex-1 truncate text-lg font-semibold text-slate-900 dark:text-white">
              {record.title}
            </h2>
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="mr-1 flex items-center gap-1.5 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <CancelIcon size={16} />
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <SaveIcon size={16} />
                  保存
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleStartEdit}
                  className="mr-1 flex items-center gap-1.5 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <EditIcon size={16} />
                  编辑
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <ContentCopyIcon size={16} />
                  复制
                </button>
              </>
            )}
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-auto px-4 pt-6">
            {isEditing ? (
              <textarea
                autoFocus
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="h-[70vh] w-full resize-none rounded-lg border border-slate-300 bg-transparent p-4 text-[1.1rem] leading-relaxed text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:text-white"
                style={{ whiteSpace: 'pre-wrap' }}
              />
            ) : (
              <p className="whitespace-pre-wrap break-words text-[1.1rem] leading-relaxed text-slate-900 dark:text-white">
                {content}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};
