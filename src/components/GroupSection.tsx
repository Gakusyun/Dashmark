import React from 'react';
import { Box, Typography, Button, Paper, Grid, useMediaQuery, useTheme } from '@mui/material';
import { ChevronLeft as ChevronLeftIcon } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { BookmarkCard } from './BookmarkCard';
import type { Group, Link } from '../types';

interface GroupSectionProps {
  group: Group;
  onClick?: () => void;
  isFullscreen?: boolean;
  onBack?: () => void;
}

interface CommonBookmarksSectionProps {
  title: string;
  count: number;
  links: Link[];
  onClick?: () => void;
  isFullscreen?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
}

const CommonBookmarksSection: React.FC<CommonBookmarksSectionProps> = ({
  title,
  count,
  links,
  onClick,
  isFullscreen = false,
  onBack,
  showBackButton = false,
}) => {
  const theme = useTheme();

  // 检测屏幕尺寸，计算3行应该显示的链接数量
  const isXsScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmScreen = useMediaQuery(theme.breakpoints.up('sm'));
  const isMdScreen = useMediaQuery(theme.breakpoints.up('md'));
  const isLgScreen = useMediaQuery(theme.breakpoints.up('lg'));

  let maxLinks = 9; // 默认 md
  if (isXsScreen) {
    maxLinks = 6; // xs: 2列 * 3行 = 6
  } else if (isSmScreen && !isMdScreen) {
    maxLinks = 12; // sm: 4列 * 3行 = 12
  } else if (isMdScreen && !isLgScreen) {
    maxLinks = 9; // md: 3列 * 3行 = 9
  } else if (isLgScreen && showBackButton) {
    maxLinks = 9; // lg及以上：AllBookmarks占满整行，显示9个（3行×3列）
  } else if (isLgScreen) {
    maxLinks = 9; // lg及以上：GroupSection显示9个（3行×3列）
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
            ({count} 个链接)
          </Typography>
        </Box>
        {links.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">暂无链接</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {links.map((link) => (
              <Grid key={link.id} size={{ xs: 12, sm: 6, md: 4, lg: isAllBookmarks ? 3 : 6 }}>
                <BookmarkCard link={link} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  }

  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 3,
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
        transition: 'background-color 200ms',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {count}
        </Typography>
      </Box>
      {links.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          暂无链接
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {links.slice(0, maxLinks).map((link) => {
            // 对于"所有"分组，在大屏幕时显示4个/行（lg: 3），对于普通分组显示2个/行（lg: 6）
            const gridSizes = {
              xs: 6,      // 2列
              sm: 4,      // 3列
              md: 3,      // 4列
              lg: isAllBookmarks ? 3 : 6 // "所有"分组: 4列(1/4屏), 普通分组: 2列(1/2屏)
            };
            return (
              <Grid key={link.id} size={gridSizes}>
                <BookmarkCard link={link} />
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

  return (
    <CommonBookmarksSection
      title={group.name}
      count={groupLinks.length}
      links={groupLinks}
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

  return (
    <CommonBookmarksSection
      title="所有收藏"
      count={data.links.length}
      links={data.links}
      onClick={onClick}
      isFullscreen={isFullscreen}
      onBack={onBack}
      showBackButton={isFullscreen}
    />
  );
};