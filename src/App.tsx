import React, { useState } from 'react';
import { Box, Container, Typography, Toolbar, AppBar, IconButton, Grid, TextField } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { useData } from './contexts/DataContext';
import { SearchBox } from './components/SearchBox';
import { GroupSection, AllBookmarks } from './components/GroupSection';
import { ManagePanel } from './components/ManagePanel';

type ViewMode = 'all' | 'group' | null;
type SelectedGroup = string | 'all' | null;

const App: React.FC = () => {
  const { data } = useData();
  const [managePanelOpen, setManagePanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(null);
  const [selectedGroup, setSelectedGroup] = useState<SelectedGroup>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleGroupClick = (groupId: string) => {
    setSelectedGroup(groupId);
    setViewMode('group');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAllClick = () => {
    setSelectedGroup('all');
    setViewMode('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setViewMode(null);
    setSelectedGroup(null);
  };

  const renderContent = () => {
    // 搜索结果视图
    if (searchQuery.trim()) {
      return <AllBookmarks isFullscreen={false} searchQuery={searchQuery} />;
    }

    // 单分组视图
    if (viewMode === 'group' && selectedGroup && selectedGroup !== 'all') {
      const group = data.groups.find(g => g.id === selectedGroup);
      if (group) {
        return <GroupSection group={group} isFullscreen onBack={handleBack} />;
      }
    }

    // 所有收藏视图
    if (viewMode === 'all' || selectedGroup === 'all') {
      return <AllBookmarks isFullscreen onBack={handleBack} />;
    }

    // 默认视图
    if (data.groups.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary" gutterBottom>
            暂无分组和链接
          </Typography>
          <Typography color="text.secondary" variant="body2">
            点击右上角设置按钮开始添加
          </Typography>
        </Box>
      );
    }

    return (
      <>
        <Grid container spacing={2}>
          {data.groups.map(group => (
            <Grid key={group.id} size={{ xs: 12, lg: 6 }}>
              <GroupSection
                group={group}
                onClick={() => handleGroupClick(group.id)}
              />
            </Grid>
          ))}
          <Grid size={12}>
            <AllBookmarks onClick={handleAllClick} />
          </Grid>
        </Grid>
      </>
    );
  };

  return (
    <>
      <AppBar position="static" color="default" elevation={0} sx={{ mb: 4 }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 2 }}>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1, cursor: 'pointer' }}>
              DashMark
            </Typography>
            <TextField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              label="页内搜索"
              variant="standard"
              sx={{ width: 200 }}
            />
            <IconButton
              color="inherit"
              onClick={() => setManagePanelOpen(true)}
              size="large"
            >
              <SettingsIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ pb: 4 }}>
        <SearchBox />
        <Box sx={{ minHeight: '50vh' }}>
          {renderContent()}
        </Box>
        <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              鄂ICP备2024069158号-3
            </a>
          </Typography>
        </Box>
      </Container>

      <ManagePanel open={managePanelOpen} onClose={() => setManagePanelOpen(false)} />
    </>
  );
};

export default App;
