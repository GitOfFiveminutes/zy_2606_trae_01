import { useState } from 'react';
import { Utensils, Trash2 } from 'lucide-react';
import type { Food, ActionType } from '@/types';
import { STORAGE_AREA_LABELS, STORAGE_AREA_ICONS, FRESHNESS_LABELS } from '@/types';
import { useFreshness } from '@/hooks/useFreshness';
import { useAppStore } from '@/store';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/lib/utils';

interface FoodCardProps {
  food: Food;
  index: number;
}

const roommateColors: Record<string, { bg: string; text: string }> = {};
const colorPalette = [
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-pink-100', text: 'text-pink-700' },
  { bg: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  { bg: 'bg-teal-100', text: 'text-teal-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
];

function getOwnerColor(owner: string) {
  if (!roommateColors[owner]) {
    const idx = Object.keys(roommateColors).length % colorPalette.length;
    roommateColors[owner] = colorPalette[idx];
  }
  return roommateColors[owner];
}

export function FoodCard({ food, index }: FoodCardProps) {
  const [removing, setRemoving] = useState(false);
  const freshness = useFreshness(food.purchaseDate, food.shelfLifeDays);
  const { openConfirm, roommates } = useAppStore();

  const ownerColor = getOwnerColor(food.owner);
  const ownerAvatar = roommates.find(r => r.name === food.owner)?.avatar ?? '👤';

  const handleAction = (action: ActionType) => {
    setRemoving(true);
    setTimeout(() => {
      openConfirm(food, action);
      setRemoving(false);
    }, 250);
  };

  const statusStyles = {
    expired: {
      border: 'border-l-4 border-danger-500',
      bg: 'bg-gradient-to-br from-white to-danger-50/50',
      badge: 'danger' as const,
      daysText: 'text-danger-600',
      daysBg: 'bg-danger-100',
    },
    expiring: {
      border: 'border-l-4 border-warning-500',
      bg: 'bg-gradient-to-br from-white to-warning-50/50',
      badge: 'warning' as const,
      daysText: 'text-warning-600',
      daysBg: 'bg-warning-100',
    },
    fresh: {
      border: 'border-l-4 border-brand-500',
      bg: 'bg-gradient-to-br from-white to-brand-50/40',
      badge: 'brand' as const,
      daysText: 'text-brand-600',
      daysBg: 'bg-brand-100',
    },
  };

  const style = statusStyles[freshness.status];

  const formatRemainingDays = () => {
    if (freshness.remainingDays === 0) return '今天过期';
    if (freshness.remainingDays < 0) return `过期${Math.abs(freshness.remainingDays)}天`;
    return `剩 ${freshness.remainingDays} 天`;
  };

  return (
    <div
      className={cn(
        'rounded-2xl card-shadow overflow-hidden transition-all duration-300',
        'hover:card-shadow-hover hover:-translate-y-0.5',
        style.bg,
        style.border,
        removing && 'animate-slide-out-right',
        'stagger-item'
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-gray-900 truncate mb-1.5">
              {food.name}
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="gray">
                <span>{STORAGE_AREA_ICONS[food.storageArea]}</span>
                {STORAGE_AREA_LABELS[food.storageArea]}
              </Badge>
              <Badge variant={ownerColor.bg.replace('bg-', '').replace('-100', '') as any || 'default'} className={`${ownerColor.bg} ${ownerColor.text}`}>
                <span>{ownerAvatar}</span>
                {food.owner}
              </Badge>
            </div>
          </div>
          <div className="ml-3 text-right flex-shrink-0">
            <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-xl ${style.daysBg}`}>
              <span className={`text-sm font-bold tabular-nums ${style.daysText}`}>
                {formatRemainingDays()}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              到期 {freshness.expireDate}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleAction('consume')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 transition-all active:scale-95"
          >
            <Utensils size={16} />
            吃掉
          </button>
          <button
            onClick={() => handleAction('discard')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-95"
          >
            <Trash2 size={16} />
            丢弃
          </button>
        </div>
      </div>

      <input type="hidden" value={FRESHNESS_LABELS[freshness.status]} />
    </div>
  );
}
