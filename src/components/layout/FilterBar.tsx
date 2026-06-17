import { useAppStore } from '@/store';
import { Funnel } from 'lucide-react';

export function FilterBar() {
  const { selectedOwner, setSelectedOwner, roommates } = useAppStore();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 stagger-item" style={{ animationDelay: '250ms' }}>
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">冰箱里都有啥？</h2>
        <p className="text-sm text-gray-500">
          按剩余天数排序，先处理快过期的食物
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Funnel size={16} />
          <span className="font-medium">筛选:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedOwner('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedOwner === 'all'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            全部
          </button>
          {roommates.map(roommate => (
            <button
              key={roommate.name}
              onClick={() => setSelectedOwner(roommate.name)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedOwner === roommate.name
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <span className={selectedOwner === roommate.name ? 'grayscale-0' : ''}>
                {roommate.avatar}
              </span>
              {roommate.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
