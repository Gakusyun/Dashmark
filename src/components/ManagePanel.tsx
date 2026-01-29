import React from 'react';
import { Drawer, Box, Typography, IconButton, Tabs, Tab } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { LinkManager } from './LinkManager';
import { GroupManager } from './GroupManager';
import { Settings } from './Settings';
import { DataManagement } from './DataManagement';
import { About } from './About';

interface ManagePanelProps {
  open: boolean;
  onClose: () => void;
}

export const ManagePanel: React.FC<ManagePanelProps> = ({ open, onClose }) => {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleClose = () => {
    // 移除焦点以避免可访问性警告
    (document.activeElement as HTMLElement)?.blur();
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: { width: { xs: '100%', sm: 500, md: 600 } }
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6">管理收藏</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="链接" />
          <Tab label="分组" />
          <Tab label="设置" />
          <Tab label="数据" />
          <Tab label="关于" />
        </Tabs>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {tabValue === 0 && <LinkManager onClose={onClose} />}
          {tabValue === 1 && <GroupManager onClose={onClose} />}
          {tabValue === 2 && <Settings />}
          {tabValue === 3 && <DataManagement />}
          {tabValue === 4 && <About />}
        </Box>
      </Box>
    </Drawer>
  );
};
