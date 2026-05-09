import React, { useState } from 'react';
import { Card, CardContent, Typography, Link as MuiLink, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { OpenInNew as OpenInNewIcon, ContentCopy as ContentCopyIcon, Edit as EditIcon } from '@mui/icons-material';
import { isLink } from '../utils/typeUtils';
import type { Link, Bookmark } from '../types';
import { useToast } from '../contexts/ToastContext';

interface BookmarkCardProps {
  link: Link | Bookmark;
  onEdit?: () => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ link, onEdit }) => {
  const isBookmark = isLink(link);
  const href = isBookmark ? (link as Bookmark).url : (link as Link).url;
  const { showSuccess, showError } = useToast();

  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu(
      contextMenu === null
        ? { mouseX: e.clientX + 2, mouseY: e.clientY - 6 }
        : null,
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleOpenInNewTab = () => {
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
    handleCloseContextMenu();
  };

  const handleCopyLink = () => {
    if (href) {
      navigator.clipboard.writeText(href).then(() => {
        showSuccess('链接已复制到剪贴板');
      }).catch(() => {
        showError('复制失败');
      });
    }
    handleCloseContextMenu();
  };

  const handleEdit = () => {
    onEdit?.();
    handleCloseContextMenu();
  };

  return (
    <>
      <MuiLink
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        underline="none"
        sx={{ display: 'block' }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <Card
          sx={{
            height: '100%',
            cursor: 'pointer',
            '&:hover': {
              transform: 'translateY(-2px)',
            },
            transition: 'transform 200ms',
          }}
        >
          <CardContent>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {link.title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.875rem',
              }}
            >
              {href}
            </Typography>
          </CardContent>
        </Card>
      </MuiLink>
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleOpenInNewTab}>
          <ListItemIcon>
            <OpenInNewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>在新标签页打开</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCopyLink}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>复制链接</ListItemText>
        </MenuItem>
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>编辑</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
