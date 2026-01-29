import React from 'react';
import { Box, Typography, Button, Paper, Grid, useMediaQuery, useTheme } from '@mui/material';
import { ChevronLeft as ChevronLeftIcon } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { BookmarkCard } from './BookmarkCard';
import type { Group } from '../types';

interface GroupSectionProps {
  group: Group;
  onClick?: () => void;
  isFullscreen?: boolean;
  onBack?: () => void;
}

export const GroupSection: React.FC<GroupSectionProps> = ({
  group,
  onClick,
  isFullscreen = false,
  onBack,
}) => {
  const { data } = useData();
  const theme = useTheme();
  const groupLinks = data.links.filter(link => link.groupIds.includes(group.id));

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
  } else if (isMdScreen) {
    maxLinks = 9; // md及以上: 3列 * 3行 = 9
  }

  if (isFullscreen) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ChevronLeftIcon />}
            onClick={onBack}
          >
            返回全部
          </Button>
          <Typography variant="h4">{group.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            ({groupLinks.length} 个链接)
          </Typography>
        </Box>
        {groupLinks.length === 0 ? (
          <Paper sx={{ p:3, textAlign: 'center' }}>
            <Typography color="text.secondary">暂无链接</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {groupLinks.map(link => (
              <Grid key={link.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
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
        <Typography variant="h6">{group.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {groupLinks.length}
        </Typography>
      </Box>
      {groupLinks.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          暂无链接
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {groupLinks.slice(0, maxLinks).map(link => (
            <Grid key={link.id} size={{ xs: 6, sm: 4, md: 3, lg: 6 }}>
              <BookmarkCard link={link} />
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
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
  } else if (isLgScreen) {
    maxLinks = 9; // lg及以上：AllBookmarks占满整行，显示9个（3行×3列）
  }

  if (isFullscreen) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ChevronLeftIcon />}
            onClick={onBack}
          >
            返回全部
          </Button>
          <Typography variant="h4">所有收藏</Typography>
          <Typography variant="body2" color="text.secondary">
            ({data.links.length} 个链接)
          </Typography>
        </Box>
        {data.links.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">暂无链接</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {data.links.map(link => (
              <Grid key={link.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
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
        <Typography variant="h6">所有</Typography>
        <Typography variant="body2" color="text.secondary">
          {data.links.length}
        </Typography>
      </Box>
      {data.links.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          暂无链接
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {data.links.slice(0, maxLinks).map(link => (
            <Grid key={link.id} size={{ xs: 6, sm: 4, md: 3 }}>
              <BookmarkCard link={link} />
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
};
