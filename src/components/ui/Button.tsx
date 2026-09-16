import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { SpinnerIcon } from '../Icons';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const variants: Record<Variant, string> = {
  primary:
    'border border-sky-600 bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 disabled:bg-sky-400',
  secondary:
    'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:border-slate-700 dark:bg-black dark:text-slate-300 dark:hover:bg-slate-900',
  ghost:
    'text-slate-600 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-900 dark:active:bg-slate-800',
  subtle:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
  danger:
    'bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-400',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-9 gap-1.5 px-3.5 text-sm',
  lg: 'h-11 gap-2 px-5 text-sm',
  icon: 'h-9 w-9',
  'icon-sm': 'h-7 w-7',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-lg font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? (
        <SpinnerIcon size={size === 'sm' ? 13 : 15} className="animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
