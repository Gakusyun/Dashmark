import React from 'react';
import { Card, CardContent, Typography, IconButton, Dialog, DialogContent, Toolbar, AppBar, Button } from '@mui/material';
import { ContentCopy as CopyIcon, Close as CloseIcon } from '@mui/icons-material';
import { useToast } from '../contexts/ToastContext';
import { isTextRecord } from '../utils/typeUtils';
import type { TextRecord, Bookmark } from '../types';

interface TextRecordCardProps {
  record: TextRecord | Bookmark;
  isFullscreen: boolean; // 由父组件控制的全屏状态
  onOpenFullscreen: () => void; // 打开全屏
  onCloseFullscreen: () => void; // 关闭全屏（父组件控制返回行为）
}

export const TextRecordCard: React.FC<TextRecordCardProps> = ({ 
  record, 
  isFullscreen, 
  onOpenFullscreen, 
  onCloseFullscreen 
}) => {
  const { showSuccess } = useToast();
  
  const isBookmark = 'type' in record && isTextRecord(record);
  const content = isBookmark ? (record as Bookmark).content || '' : (record as TextRecord).content;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    showSuccess('内容已复制到剪贴板');
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4,
          },
          transition: 'transform 200ms, box-shadow 200ms',
        }}
        onClick={(e) => {
          e.stopPropagation(); // 阻止事件冒泡到父级组件
          onOpenFullscreen();
        }}
      >
        <CardContent sx={{ flex: 1, pb: 1 }}>
          <Typography
            variant="body1"
            fontWeight={500}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mb: 1,
            }}
          >
            {record.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
              fontSize: '0.875rem',
              flex: 1,
            }}
          >
            {content}
          </Typography>
        </CardContent>
      </Card>

      {/* 全屏显示对话框 */}
      <Dialog
        fullScreen
        open={isFullscreen}
        onClose={onCloseFullscreen}
      >
        <AppBar position="sticky" color="default" elevation={1}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={onCloseFullscreen}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              {record.title}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={handleCopy}
            >
              复制
            </Button>
          </Toolbar>
        </AppBar>
        <DialogContent sx={{ mt: 4 }}>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.6,
              fontSize: '1.1rem',
            }}
          >
            {content}
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
};