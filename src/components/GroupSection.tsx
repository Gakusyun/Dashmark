import React, { useState, useRef } from 'react';
import { Box, Typography, Button, Paper, Grid, useMediaQuery, useTheme } from '@mui/material';
import { ChevronLeft as ChevronLeftIcon, ExpandMore as ExpandMoreIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { BookmarkCard } from './BookmarkCard';
import { TextRecordCard } from './TextRecordCard';
import { filterItemsByQuery } from '../utils/itemFilter';
import { isLink } from '../utils/typeUtils';
import type { Item, Group, Link, TextRecord, Bookmark } from '../utils/typeUtils';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

interface GroupSectionProps {
  group: Group;
  onClick?: () => void;
  isFullscreen?: boolean;
  onBack?: () => void;
}

// 定义联合类型，可以接受链接、文字记录或收藏
// type Item = (Link | TextRecord) | (Omit<Bookmark, 'content'> & { content: string }) | (Omit<Bookmark, 'url'> & { url: string }) | Bookmark;

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
  const theme = useTheme();

  // 管理文字记录的全屏状态
  const [fullscreenTextRecordId, setFullscreenTextRecordId] = useState<string | null>(null);

  // 管理折叠状态（默认展开）
  const [collapsed, setCollapsed] = useState(false);

  // 动态加载拼音库（用 ref 避免重复 import）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pinyinModuleRef = useRef<any>(null);
  const [pinyinLoaded, setPinyinLoaded] = useState(false);

  // 防抖搜索查询（300ms 延迟）
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  // 当有搜索词时，动态加载拼音库（只加载一次）
  React.useEffect(() => {
    if (debouncedSearchQuery.trim() && !pinyinModuleRef.current) {
      import('pinyin-pro').then(module => {
        pinyinModuleRef.current = module;
        setPinyinLoaded(true);
      });
    }
  }, [debouncedSearchQuery]);

  // 根据搜索关键词过滤项目
  const filteredItems = React.useMemo(() => {
    // 将Bookmark转换为兼容Link | TextRecord类型的格式
    const compatibleItems = items.map(item => {
      if ('type' in item) {
        // 这是一个Bookmark
        if (item.type === 'link') {
          return {
            id: item.id,
            title: item.title,
            url: item.url || '',
            groupIds: item.groupIds,
            order: item.order
          } as Link;
        } else {
          return {
            id: item.id,
            title: item.title,
            content: item.content || '',
            groupIds: item.groupIds,
            order: item.order
          } as TextRecord;
        }
      } else {
        // 这已经是Link或TextRecord类型
        return item;
      }
    });

    const filteredCompatibleItems = filterItemsByQuery(compatibleItems, debouncedSearchQuery, new Map(), pinyinModuleRef.current);

    // 将过滤后的结果转换回原始类型
    return filteredCompatibleItems.map(filteredItem => {
      return items.find(originalItem => originalItem.id === filteredItem.id) || filteredItem;
    }) as Item[];
    // pinyinLoaded 确保 pinyin 加载后重新计算
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, debouncedSearchQuery, pinyinLoaded]);

  // 处理文字记录全屏关闭
  const handleCloseTextRecordFullscreen = () => {
    setFullscreenTextRecordId(null);
  };

  // 判断是否是"所有"分组
  const isAllBookmarks = title === "所有收藏";

  // 只有非"所有"分组才可折叠
  const canCollapse = !isAllBookmarks;

  // 检测屏幕尺寸
  const isXsScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const isSmScreen = isSmUp && !isMdUp;
  const isMdScreen = isMdUp && !isLgUp;
  const isLgScreen = isLgUp;

  // 根据屏幕宽度确定最大显示数量（3行）
  let maxItems;
  if (isXsScreen) {
    maxItems = 6; // 2列 × 3行
  } else if (isSmScreen) {
    maxItems = 9; // 3列 × 3行
  } else if (isMdScreen) {
    maxItems = 12; // 4列 × 3行
  } else if (isLgScreen) {
    maxItems = isAllBookmarks ? 12 : 6; // "所有"4列×3行=12，普通2列×3行=6
  }

  if (isFullscreen) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          {showBackButton && (
            <Button
              variant="outlined"
              startIcon={<ChevronLeftIcon />}
              onClick={onBack}
            >
              返回全部
            </Button>
          )}
          <Typography variant="h4">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            ({count} 个项目)
          </Typography>
        </Box>
        {items.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">暂无项目</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {items.map((item) => {
              return (
                <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  {isLink(item) ?
                    <BookmarkCard link={item as (Link | Bookmark)} /> :
                    <TextRecordCard
                      record={item as (TextRecord | Bookmark)}
                      isFullscreen={fullscreenTextRecordId === item.id}
                      onOpenFullscreen={() => setFullscreenTextRecordId(item.id)}
                      onCloseFullscreen={handleCloseTextRecordFullscreen}
                    />}
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
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

  // 搜索模式下不使用 Paper 容器
  if (debouncedSearchQuery.trim()) {
    return (
      <Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            找到 {filteredItems.length} 个项目
          </Typography>
        </Box>
        {filteredItems.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">未找到匹配的项目</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {filteredItems.map((item) => {
              const gridSizes = {
                xs: 12,
                sm: 6,
                md: 4,
                lg: 3
              };
              
              return (
                <Grid key={item.id} size={gridSizes}>
                  {isLink(item) ?
                    <BookmarkCard link={item as (Link | Bookmark)} /> :
                    <TextRecordCard
                      record={item as (TextRecord | Bookmark)}
                      isFullscreen={fullscreenTextRecordId === item.id}
                      onOpenFullscreen={() => setFullscreenTextRecordId(item.id)}
                      onCloseFullscreen={handleCloseTextRecordFullscreen}
                    />}
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    );
  }

  return (
    <Paper
      onClick={fullscreenTextRecordId ? undefined : onClick}
      sx={{
        p: 3,
        height: '100%',
        cursor: (onClick && !fullscreenTextRecordId) ? 'pointer' : 'default',
        '&:hover': {
          backgroundColor: (onClick && !fullscreenTextRecordId) ? 'action.hover' : 'transparent',
        },
        transition: 'background-color 200ms',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: canCollapse ? 'pointer' : 'default',
            py: 0.5,
            px: 1,
            ml: -1,
            borderRadius: 1,
            '&:hover': canCollapse ? { backgroundColor: 'action.hover' } : {},
          }}
          onClick={canCollapse ? (e) => { e.stopPropagation(); setCollapsed(!collapsed); } : undefined}
        >
          {canCollapse && (
            collapsed
              ? <ChevronRightIcon fontSize="medium" />
              : <ExpandMoreIcon fontSize="medium" />
          )}
          <Typography variant="h6">{title}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {getCountDisplay()}
        </Typography>
      </Box>
      {/* 折叠时隐藏内容 */}
      {!collapsed && (
        items.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            暂无项目
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {items.slice(0, maxItems).map((item) => {
              const gridSizes = {
                xs: 6,
                sm: 4,
                md: 3,
                lg: isAllBookmarks ? 3 : 6
              };
              return (
                <Grid key={item.id} size={gridSizes}>
                  {isLink(item) ?
                    <BookmarkCard link={item as (Link | Bookmark)} /> :
                    <TextRecordCard
                      record={item as (TextRecord | Bookmark)}
                      isFullscreen={fullscreenTextRecordId === item.id}
                      onOpenFullscreen={() => setFullscreenTextRecordId(item.id)}
                      onCloseFullscreen={handleCloseTextRecordFullscreen}
                    />}
                </Grid>
              );
            })}
          </Grid>
        )
      )}
    </Paper>
  );
};

export const GroupSection: React.FC<GroupSectionProps> = ({
  group,
  onClick,
  isFullscreen = false,
  onBack,
}) => {
  const { data } = useData();
  const groupBookmarks = data.bookmarks.filter(bookmark => bookmark.groupIds.includes(group.id));

  // 分别计算链接和文字记录数量
  const linksCount = groupBookmarks.filter(b => b.type === 'link').length;
  const textRecordsCount = groupBookmarks.filter(b => b.type === 'text').length;

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

  // 使用所有收藏
  const items = data.bookmarks;

  // 计算各类项目数量
  const linksCount = data.bookmarks.filter(b => b.type === 'link').length;
  const textRecordsCount = data.bookmarks.filter(b => b.type === 'text').length;

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