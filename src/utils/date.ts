import type { FreshnessInfo, FreshnessStatus } from '@/types';

export function formatDate(date: Date | string, format: 'YYYY-MM-DD' | 'full' | 'relative' = 'YYYY-MM-DD'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }

  if (format === 'full') {
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return `${year}-${month}-${day}`;
}

export function getTodayString(): string {
  return formatDate(new Date(), 'YYYY-MM-DD');
}

export function calculateFreshness(purchaseDate: string, shelfLifeDays: number): FreshnessInfo {
  const purchase = new Date(purchaseDate);
  purchase.setHours(0, 0, 0, 0);

  const expire = new Date(purchase);
  expire.setDate(expire.getDate() + shelfLifeDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = expire.getTime() - today.getTime();
  const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let status: FreshnessStatus;
  if (remainingDays <= 0) {
    status = 'expired';
  } else if (remainingDays <= 2) {
    status = 'expiring';
  } else {
    status = 'fresh';
  }

  return {
    status,
    remainingDays,
    expireDate: formatDate(expire, 'YYYY-MM-DD'),
  };
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d, 'YYYY-MM-DD');
}
