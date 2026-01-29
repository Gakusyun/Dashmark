import React from 'react';
import { Card, CardContent, Typography, Link as MuiLink } from '@mui/material';
import type { Link } from '../types';

interface BookmarkCardProps {
  link: Link;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ link }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <MuiLink
      href={link.url}
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
            {link.url}
          </Typography>
        </CardContent>
      </Card>
    </MuiLink>
  );
};
