import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Grid, useMediaQuery, useTheme } from '@mui/material';
import { ChevronLeft as ChevronLeftIcon } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { BookmarkCard } from './BookmarkCard';
import { TextRecordCard } from './TextRecordCard';
import type { Group, Link, TextRecord } from '../types';

interface GroupSectionProps {
  group: Group;
  onClick?: () => void;
  isFullscreen?: boolean;
  onBack?: () => void;
}

// 定义联合类型，可以接受链接或文字记录
type Item = Link | TextRecord;

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
}) => {
  const theme = useTheme();
  
  // 管理文字记录的全屏状态
  const [fullscreenTextRecordId, setFullscreenTextRecordId] = useState<string | null>(null);
  
  // 处理文字记录全屏关闭
  const handleCloseTextRecordFullscreen = () => {
    if (isFullscreen) {
      // 如果当前在分组详情或全部详情页（全屏模式），关闭文字记录全屏后应返回详情页
      setFullscreenTextRecordId(null);
    } else {
      // 如果在主页（非全屏模式），关闭文字记录全屏后只关闭对话框，返回主页
      setFullscreenTextRecordId(null);
    }
  };

  // 检测屏幕尺寸，计算3行应该显示的链接数量
  const isXsScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmScreen = useMediaQuery(theme.breakpoints.up('sm'));
  const isMdScreen = useMediaQuery(theme.breakpoints.up('md'));
  const isLgScreen = useMediaQuery(theme.breakpoints.up('lg'));

  let maxItems = 9; // 默认 md
  if (isXsScreen) {
    maxItems = 6; // xs: 2列 * 3行 = 6
  } else if (isSmScreen && !isMdScreen) {
    maxItems = 12; // sm: 4列 * 3行 = 12
  } else if (isMdScreen && !isLgScreen) {
    maxItems = 9; // md: 3列 * 3行 = 9
  } else if (isLgScreen && showBackButton) {
    maxItems = 9; // lg及以上：AllBookmarks占满整行，显示9个（3行×3列）
  } else if (isLgScreen) {
    maxItems = 9; // lg及以上：GroupSection显示9个（3行×3列）
  }

  // 判断是否是"所有"分组
  const isAllBookmarks = title === "所有收藏";

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
              // 判断是链接还是文字记录
              const isLink = 'url' in item;
              return (
                <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4, lg: isAllBookmarks ? 3 : 6 }}>
                  {isLink ? 
                    <BookmarkCard link={item as Link} /> : 
                    <TextRecordCard 
                      record={item as TextRecord} 
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {getCountDisplay()}
        </Typography>
      </Box>
      {items.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          暂无项目
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {items.slice(0, maxItems).map((item) => {
            // 对于"所有"分组，在大屏幕时显示4个/行（lg: 3），对于普通分组显示2个/行（lg: 6）
            const gridSizes = {
              xs: 6,      // 2列
              sm: 4,      // 3列
              md: 3,      // 4列
              lg: isAllBookmarks ? 3 : 6 // "所有"分组: 4列(1/4屏), 普通分组: 2列(1/2屏)
            };
            
            // 判断是链接还是文字记录
            const isLink = 'url' in item;
            return (
              <Grid key={item.id} size={gridSizes}>
                {isLink ? 
                  <BookmarkCard link={item as Link} /> : 
                  <TextRecordCard 
                    record={item as TextRecord} 
                    isFullscreen={fullscreenTextRecordId === item.id}
                    onOpenFullscreen={() => setFullscreenTextRecordId(item.id)}
                    onCloseFullscreen={handleCloseTextRecordFullscreen}
                  />}
              </Grid>
            );
          })}
        </Grid>
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
  const groupLinks = data.links.filter(link => link.groupIds.includes(group.id));
  const groupTextRecords = data.textRecords.filter(record => record.groupIds.includes(group.id));
  
  // 合并链接和文字记录
  const items = [...groupLinks, ...groupTextRecords];
  
  // 计算链接数和文字记录数
  const linksCount = groupLinks.length;
  const textRecordsCount = groupTextRecords.length;

  return (
    <CommonBookmarksSection
      title={group.name}
      count={items.length}
      linksCount={linksCount}
      textRecordsCount={textRecordsCount}
      items={items}
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
}

export const AllBookmarks: React.FC<AllBookmarksProps> = ({
  onClick,
  isFullscreen = false,
  onBack,
}) => {
  const { data } = useData();
  
  // 分别计算链接数和文字记录数
  const linksCount = data.links.length;
  const textRecordsCount = data.textRecords.length;
  
  // 合并链接和文字记录
  const items = [...data.links, ...data.textRecords];

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
    />
  );
};