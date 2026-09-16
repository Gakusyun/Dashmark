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
      className={cn('shrink-0 rounded-md object-contain', className)}
      style={{ width: size, height: size }}
    />
  );
}
