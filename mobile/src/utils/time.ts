/**
 * 相对时间显示工具
 *
 * 规则:
 *   <1分钟 → 刚刚
 *   <60分钟 → X分钟前
 *   <24小时 → X小时前
 *   <7天   → X天前
 *   <30天  → X周前
 *   >=30天 → 月-日
 *   跨年   → 年-月-日
 */

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;

  if (diffMs < 0) return '刚刚';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${weeks}周前`;

  const d = new Date(dateStr);
  const nowYear = new Date().getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  if (d.getFullYear() !== nowYear) {
    return `${d.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return `${month}月${day}日`;
}
