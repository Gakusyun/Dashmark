import React from 'react';
import { Box, Typography, Button, Paper, Grid } from '@mui/material';
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
  const groupLinks = data.links.filter(link => link.groupIds.includes(group.id));

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
        mb: 3,
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
          {groupLinks.slice(0, 8).map(link => (
            <Grid key={link.id} size={{ xs: 6, sm: 4, md: 3 }}>
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
        mb: 3,
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
          {data.links.slice(0, 8).map(link => (
            <Grid key={link.id} size={{ xs: 6, sm: 4, md: 3 }}>
              <BookmarkCard link={link} />
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
};
