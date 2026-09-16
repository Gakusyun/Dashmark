/**
 * Escape 键分层处理。
 *
 * 问题背景：Modal（比如收藏编辑器）可能嵌套在 Manager 这类整屏浮层里，
 * 两者都监听 window 的 Escape。浏览器的规则是同一事件目标上，
 * `stopPropagation()` 不会阻止**同一目标**上的其他监听器，只有
 * `stopImmediatePropagation()` 才会；而且监听器按注册顺序执行，
 * 后注册的（Manager）反而可能先执行。结果是按一次 Esc 会同时关闭两层。
 *
 * 解决方式：维护一个层级栈。只有栈顶（最后打开的那一层）能响应 Escape，
 * 其余层忽略该事件。
 */

const stack: symbol[] = [];

/** 注册一层，返回用于注销的句柄 */
export function pushEscapeLayer(): symbol {
  const token = Symbol('escape-layer');
  stack.push(token);
  return token;
}

export function popEscapeLayer(token: symbol): void {
  const index = stack.lastIndexOf(token);
  if (index !== -1) stack.splice(index, 1);
}

/** 当前这一层是否是最上层（即应当响应 Escape 的那一层） */
export function isTopEscapeLayer(token: symbol): boolean {
  return stack.length === 0 || stack[stack.length - 1] === token;
}
