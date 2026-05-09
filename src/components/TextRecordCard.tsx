import React, { useState } from 'react';
import { Card, CardContent, Typography, IconButton, Dialog, DialogContent, Toolbar, AppBar, Button, TextField, Box } from '@mui/material';
import { ContentCopy as CopyIcon, Close as CloseIcon, Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useToast } from '../contexts/ToastContext';
import { useData } from '../contexts/DataContext';
import { isTextRecord } from '../utils/typeUtils';
import type { TextRecord, Bookmark } from '../types';

interface TextRecordCardProps {
  record: TextRecord | Bookmark;
  isFullscreen: boolean;
  onOpenFullscreen: () => void;
  onCloseFullscreen: () => void;
}

export const TextRecordCard: React.FC<TextRecordCardProps> = ({
  record,
  isFullscreen,
  onOpenFullscreen,
  onCloseFullscreen
}) => {
  const { showSuccess } = useToast();
  const { updateBookmark } = useData();

  const isBookmark = 'type' in record && isTextRecord(record);
  const content = isBookmark ? (record as Bookmark).content || '' : (record as TextRecord).content;

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    showSuccess('内容已复制到剪贴板');
  };

  const handleStartEdit = () => {
    setEditContent(content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(content);
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) {
      return;
    }
    if (isBookmark) {
      const bookmark = record as Bookmark;
      updateBookmark(bookmark.id, 'text', bookmark.title, bookmark.groupIds, undefined, editContent.trim());
    }
    setIsEditing(false);
    showSuccess('内容已保存');
  };

  const handleClose = () => {
    setIsEditing(false);
    onCloseFullscreen();
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
          e.stopPropagation();
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
        onClose={handleClose}
      >
        <AppBar position="sticky" color="default" elevation={1}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              {record.title}
            </Typography>
            {isEditing ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelEdit}
                  sx={{ mr: 1 }}
                >
                  取消
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveEdit}
                >
                  保存
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleStartEdit}
                  sx={{ mr: 1 }}
                >
                  编辑
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CopyIcon />}
                  onClick={handleCopy}
                >
                  复制
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>
        <DialogContent sx={{ mt: 4 }}>
          {isEditing ? (
            <TextField
              fullWidth
              multiline
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              variant="outlined"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '1.1rem',
                  lineHeight: 1.6,
                },
                '& .MuiInputBase-input': {
                  whiteSpace: 'pre-wrap',
                },
              }}
            />
          ) : (
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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
