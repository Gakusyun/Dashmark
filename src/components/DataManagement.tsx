import React, { useRef } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { CloudUpload as UploadIcon, CloudDownload as DownloadIcon } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';

export const DataManagement: React.FC = () => {
  const { exportData, importData, refreshData } = useData();
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportData();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importData(
      file,
      () => {
        showSuccess('数据导入成功');
        refreshData();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      (error) => {
        showError(`导入失败：${error.message}`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        数据备份
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          导出数据
        </Button>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={handleImportClick}
        >
          导入数据
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,.json.gz"
          style={{ display: 'none' }}
        />
      </Box>

      <Alert severity="info">
        数据以 JSON 格式存储在本地浏览器中。建议定期备份数据以防丢失。
      </Alert>
    </Box>
  );
};
