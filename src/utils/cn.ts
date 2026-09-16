/**
 * 极简 className 合并工具。
 *
 * 项目没有引入 clsx/tailwind-merge，这里提供轻量实现：
 * 过滤掉 falsy 值，用空格拼接。因为我们的类名都来自固定字面量集合
 * （不出现动态构造的冲突类），无需 tailwind-merge 的冲突消解。
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  let out = '';
  for (const value of values) {
    if (!value) continue;
    out = out ? `${out} ${value}` : String(value);
  }
  return out;
}
