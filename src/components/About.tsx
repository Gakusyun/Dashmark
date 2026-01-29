import React from 'react';
import { Box, Typography, Link, Divider, Chip } from '@mui/material';
import packageJson from '../../package.json';
import {
    GitHub as GitHubIcon,
} from '@mui/icons-material';

export const About: React.FC = () => {
    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                关于 DashMark
            </Typography>

            <Box sx={{ mb: 3 }}>
                <Typography variant="body1" component="p">
                    DashMark 是一个收藏夹驱动的起始页。
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    版本 {packageJson.version}
                </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
                核心功能
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                <Chip label="📁 分组管理" size="small" />
                <Chip label="🔍 快速搜索" size="small" />
                <Chip label="🌙 深色主题" size="small" />
                <Chip label="💾 数据备份" size="small" />
                <Chip label="🔖 自定义搜索引擎" size="small" />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
                技术栈
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                <Chip label="React 19" size="small" variant="outlined" />
                <Chip label="TypeScript" size="small" variant="outlined" />
                <Chip label="Material UI" size="small" variant="outlined" />
                <Chip label="Vite" size="small" variant="outlined" />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
                相关链接
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link
                    href="https://github.com/Gakusyun/Dashmark"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                    <GitHubIcon fontSize="small" />
                    GitHub 仓库
                </Link>
            </Box>
        </Box>
    );
};