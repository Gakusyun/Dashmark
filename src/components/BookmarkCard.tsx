import React from 'react';
import { Card, CardContent, Typography, Link as MuiLink } from '@mui/material';
import { isLink } from '../utils/typeUtils';
import type { Link, Bookmark } from '../types';

interface BookmarkCardProps {
  link: Link | Bookmark;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ link }) => {
  const isBookmark = isLink(link);
  const href = isBookmark ? (link as Bookmark).url : (link as Link).url;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <MuiLink
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      underline="none"
      sx={{ display: 'block' }}
      onClick={handleClick}
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
            fontWeight={500}
            sx={{
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
  );
};
