import { useState, useRef, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { BookmarkCard } from './BookmarkCard';
import { TextRecordCard } from './TextRecordCard';
import { filterItemsByQuery } from '../utils/itemFilter';
import { isLink, type Item } from '../utils/typeUtils';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { ChevronLeftIcon, ExpandMoreIcon, ChevronRightIcon } from './Icons';
import type { Group, Link, TextRecord, Bookmark } from '../types';
import type { PinyinModule } from '../utils/searchScorer';

interface GroupSectionProps {
  group: Group;
  onClick?: () => void;
  isFullscreen?: boolean;
  onBack?: () => void;
}

interface CommonBookmarksSectionProps {
  title: string;
  count: number;
  linksCount?: number;
  textRecordsCount?: number;
  items: Item[];
  onClick?: () => void;
  isFullscreen?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
  searchQuery?: string;
}

const CommonBookmarksSection: React.FC<CommonBookmarksSectionProps> = ({
  title,
  count,
  linksCount,
  textRecordsCount,
  items,
  onClick,
  isFullscreen = false,
  onBack,
  showBackButton = false,
  searchQuery = '',
}) => {
  // 管理文字记录的全屏状态
  const [fullscreenTextRecordId, setFullscreenTextRecordId] = useState<string | null>(null);

  // 管理折叠状态（默认展开）
  const [collapsed, setCollapsed] = useState(false);

  // 动态加载拼音库
  const pinyinModuleRef = useRef<PinyinModule | null>(null);
  const [pinyinLoaded, setPinyinLoaded] = useState(false);

  // 防抖搜索查询（300ms 延迟）
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  // 当有搜索词时，动态加载拼音库（只加载一次）
  useEffect(() => {
    if (debouncedSearchQuery.trim() && !pinyinModuleRef.current) {
      import('pinyin-pro').then((module) => {
        pinyinModuleRef.current = module as unknown as PinyinModule;
        setPinyinLoaded(true);
      });
    }
  }, [debouncedSearchQuery]);

  // 根据搜索关键词过滤项目
  const filteredItems = useMemo(() => {
    // 将Bookmark转换为兼容Link | TextRecord类型的格式
    const compatibleItems = items.map((item) => {
      if ('type' in item) {
        if (item.type === 'link') {
          return {
            id: item.id,
            title: item.title,
            url: item.url || '',
            groupIds: item.groupIds,
            order: item.order,
          } as Link;
        } else {
          return {
            id: item.id,
            title: item.title,
            content: item.content || '',
            groupIds: item.groupIds,
            order: item.order,
          } as TextRecord;
        }
      }
      return item;
    });

    const filteredCompatibleItems = filterItemsByQuery(
      compatibleItems,
      debouncedSearchQuery,
      new Map(),
      pinyinModuleRef.current
    );

    return filteredCompatibleItems.map(
      (filteredItem) => items.find((originalItem) => originalItem.id === filteredItem.id) || filteredItem
    );
    // pinyinLoaded 确保 pinyin 加载后重新计算
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, debouncedSearchQuery, pinyinLoaded]);

  const handleCloseTextRecordFullscreen = () => {
    setFullscreenTextRecordId(null);
  };

  // 判断是否是"所有"分组
  const isAllBookmarks = title === '所有收藏';

  // 只有非"所有"分组才可折叠
  const canCollapse = !isAllBookmarks;

  // 检测屏幕尺寸
  const isXsScreen = useMediaQuery('(max-width: 599.95px)');
  const isSmUp = useMediaQuery('(min-width: 600px)');
  const isMdUp = useMediaQuery('(min-width: 900px)');
  const isLgUp = useMediaQuery('(min-width: 1200px)');
  const isSmScreen = isSmUp && !isMdUp;
  const isMdScreen = isMdUp && !isLgUp;
  const isLgScreen = isLgUp;

  // 根据屏幕宽度确定最大显示数量（3行）
  let maxItems = 6;
  if (isXsScreen) {
    maxItems = 6; // 2列 × 3行
  } else if (isSmScreen) {
    maxItems = 9; // 3列 × 3行
  } else if (isMdScreen) {
    maxItems = 12; // 4列 × 3行
  } else if (isLgScreen) {
    maxItems = isAllBookmarks ? 12 : 6;
  }

  const renderCards = (list: Item[], cardGridCls: string) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {list.map((item) => (
        <div key={item.id} className={cardGridCls}>
          {isLink(item) ? (
            <BookmarkCard link={item as Link | Bookmark} />
          ) : (
            <TextRecordCard
              record={item as TextRecord | Bookmark}
              isFullscreen={fullscreenTextRecordId === item.id}
              onOpenFullscreen={() => setFullscreenTextRecordId(item.id)}
              onCloseFullscreen={handleCloseTextRecordFullscreen}
            />
          )}
        </div>
      ))}
    </div>
  );

  if (isFullscreen) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-4">
          {showBackButton && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ChevronLeftIcon size={16} />
              返回全部
            </button>
          )}
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{title}</h1>
          <span className="text-sm text-slate-500 dark:text-slate-400">({count} 个项目)</span>
        </div>
        {items.length === 0 ? (
          <div className="rounded-lg border border-slate-200 p-6 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
            暂无项目
          </div>
        ) : (
          renderCards(items, '')
        )}
      </div>
    );
  }

  // 构建计数显示文本
  const getCountDisplay = () => {
    if (linksCount !== undefined && textRecordsCount !== undefined) {
      if (linksCount > 0 && textRecordsCount > 0) {
        return `${linksCount} 个链接, ${textRecordsCount} 条文字`;
      } else if (linksCount > 0) {
        return `${linksCount} 个链接`;
      } else if (textRecordsCount > 0) {
        return `${textRecordsCount} 条文字`;
      } else {
        return '0 个项目';
      }
    }
    return `${count} 个项目`;
  };

  // 搜索模式下不使用卡片容器
  if (debouncedSearchQuery.trim()) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            找到 {filteredItems.length} 个项目
          </p>
        </div>
        {filteredItems.length === 0 ? (
          <div className="rounded-lg border border-slate-200 p-6 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
            未找到匹配的项目
          </div>
        ) : (
          renderCards(filteredItems, '')
        )}
      </div>
    );
  }

  return (
    <div
      onClick={fullscreenTextRecordId ? undefined : onClick}
      className={`h-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-700 dark:bg-[#1e1e1e] ${
        onClick && !fullscreenTextRecordId ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div
          className={`flex items-center gap-0.5 rounded py-0.5 pl-1 pr-2 ${
            canCollapse
              ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700'
              : 'cursor-default'
          }`}
          onClick={
            canCollapse
              ? (e) => {
                  e.stopPropagation();
                  setCollapsed(!collapsed);
                }
              : undefined
          }
        >
          {canCollapse &&
            (collapsed ? <ChevronRightIcon size={22} /> : <ExpandMoreIcon size={22} />)}
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">{getCountDisplay()}</span>
      </div>
      {/* 折叠时隐藏内容 */}
      {!collapsed &&
        (items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">暂无项目</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {items.slice(0, maxItems).map((item) => (
              <div
                key={item.id}
                className={isAllBookmarks ? 'lg:col-span-1' : 'lg:col-span-3'}
              >
                {isLink(item) ? (
                  <BookmarkCard link={item as Link | Bookmark} />
                ) : (
                  <TextRecordCard
                    record={item as TextRecord | Bookmark}
                    isFullscreen={fullscreenTextRecordId === item.id}
                    onOpenFullscreen={() => setFullscreenTextRecordId(item.id)}
                    onCloseFullscreen={handleCloseTextRecordFullscreen}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
};

export const GroupSection: React.FC<GroupSectionProps> = ({
  group,
  onClick,
  isFullscreen = false,
  onBack,
}) => {
  const { data } = useData();
  const groupBookmarks = data.bookmarks.filter((bookmark) => bookmark.groupIds.includes(group.id));

  const linksCount = groupBookmarks.filter((b) => b.type === 'link').length;
  const textRecordsCount = groupBookmarks.filter((b) => b.type === 'text').length;

  return (
    <CommonBookmarksSection
      title={group.name}
      count={groupBookmarks.length}
      linksCount={linksCount}
      textRecordsCount={textRecordsCount}
      items={groupBookmarks}
      onClick={onClick}
      isFullscreen={isFullscreen}
      onBack={onBack}
      showBackButton={isFullscreen}
    />
  );
};

interface AllBookmarksProps {
  onClick?: () => void;
  isFullscreen?: boolean;
  onBack?: () => void;
  searchQuery?: string;
}

export const AllBookmarks: React.FC<AllBookmarksProps> = ({
  onClick,
  isFullscreen = false,
  onBack,
  searchQuery = '',
}) => {
  const { data } = useData();

  const items = data.bookmarks;
  const linksCount = data.bookmarks.filter((b) => b.type === 'link').length;
  const textRecordsCount = data.bookmarks.filter((b) => b.type === 'text').length;

  return (
    <CommonBookmarksSection
      title="所有收藏"
      count={items.length}
      linksCount={linksCount}
      textRecordsCount={textRecordsCount}
      items={items}
      onClick={onClick}
      isFullscreen={isFullscreen}
      onBack={onBack}
      showBackButton={isFullscreen}
      searchQuery={searchQuery}
    />
  );
};
