import type { Food, FreshnessStatus } from '@/types';
import { FoodCard } from './FoodCard';
import { AlertTriangle, XCircle, Leaf } from 'lucide-react';

interface FoodColumnProps {
  status: FreshnessStatus;
  foods: Food[];
  title: string;
}

const columnConfig: Record<FreshnessStatus, {
  icon: React.ReactNode;
  headerClass: string;
  badgeClass: string;
  emptyIcon: string;
  emptyText: string;
}> = {
  expired: {
    icon: <XCircle size={20} />,
    headerClass: 'text-danger-600 bg-danger-50 border-danger-200',
    badgeClass: 'bg-danger-500',
    emptyIcon: '🎉',
    emptyText: '太棒了，没有过期食物！',
  },
  expiring: {
    icon: <AlertTriangle size={20} />,
    headerClass: 'text-warning-600 bg-warning-50 border-warning-200',
    badgeClass: 'bg-warning-500',
    emptyIcon: '✅',
    emptyText: '没有临期食物',
  },
  fresh: {
    icon: <Leaf size={20} />,
    headerClass: 'text-brand-600 bg-brand-50 border-brand-200',
    badgeClass: 'bg-brand-500',
    emptyIcon: '📦',
    emptyText: '还没有新鲜食物，添加一些吧',
  },
};

export function FoodColumn({ status, foods, title }: FoodColumnProps) {
  const config = columnConfig[status];

  return (
    <div className="flex flex-col min-h-0">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border mb-4 ${config.headerClass} stagger-item`}>
        <div className="flex items-center justify-center">
          {config.icon}
        </div>
        <h2 className="text-base font-bold flex-1">{title}</h2>
        <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-white text-xs font-bold ${config.badgeClass}`}>
          {foods.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 -mr-1 space-y-3 pb-4">
        {foods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-3 opacity-60">{config.emptyIcon}</span>
            <p className="text-sm text-gray-400 font-medium">{config.emptyText}</p>
          </div>
        ) : (
          foods.map((food, index) => (
            <FoodCard key={food.id} food={food} index={index} />
          ))
        )}
      </div>
    </div>
  );
}
