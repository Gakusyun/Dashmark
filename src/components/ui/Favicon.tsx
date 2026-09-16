import { useState } from 'react';
import { cn } from '../../utils/cn';
import { getFaviconUrl, getHue, getInitial } from '../../utils/urlDisplay';

interface FaviconProps {
  url: string;
  title: string;
  size?: number;
  className?: string;
}

/**
 * 网站图标：优先使用 favicon 服务，失败时回退为带稳定底色的首字母方块。
 */
export function Favicon({ url, title, size = 32, className }: FaviconProps) {
  const [failed, setFailed] = useState(false);
  const src = getFaviconUrl(url);
  const hue = getHue(url || title);

  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md font-semibold select-none',
          className
        )}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.44,
          backgroundColor: `hsl(${hue} 62% 92%)`,
          color: `hsl(${hue} 55% 32%)`,
        }}
      >
        {getInitial(title, url)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-lg',
        // 浅色下用极淡底区分白底图标；深色下用低透明度的白，
        // 既能框住各站自带的白底图标，又不会在深色卡片上过于抢眼
        'bg-slate-50 ring-1 ring-slate-900/[0.06] dark:bg-white/[0.08] dark:ring-0',
        className
      )}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="object-contain"
        // 内缩一点，让图标不贴边，视觉上更像“徽章”
        style={{ width: size * 0.68, height: size * 0.68 }}
      />
    </span>
  );
}
