import { useAppStore } from '@/store';
import { Utensils, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  bgClass: string;
  iconBgClass: string;
  valueClass: string;
  delay: number;
}

function StatCard({ label, value, icon, bgClass, iconBgClass, valueClass, delay }: StatCardProps) {
  return (
    <div
      className={`${bgClass} rounded-3xl p-5 card-shadow transition-all duration-300 hover:-translate-y-1 hover:card-shadow-lg stagger-item`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className={`text-3xl font-bold ${valueClass} tabular-nums`}>
            {value}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-2xl ${iconBgClass} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function StatsCards() {
  const { getStats } = useAppStore();
  const stats = getStats();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="食物总数"
        value={stats.total}
        icon={<Utensils size={22} className="text-info-600" />}
        bgClass="bg-white"
        iconBgClass="bg-info-50"
        valueClass="text-info-600"
        delay={50}
      />
      <StatCard
        label="临期 (≤2天)"
        value={stats.expiring}
        icon={<AlertTriangle size={22} className="text-warning-600" />}
        bgClass="bg-gradient-to-br from-warning-50 to-white"
        iconBgClass="bg-warning-100"
        valueClass="text-warning-600"
        delay={100}
      />
      <StatCard
        label="已过期"
        value={stats.expired}
        icon={<XCircle size={22} className="text-danger-600" />}
        bgClass="bg-gradient-to-br from-danger-50 to-white"
        iconBgClass="bg-danger-100"
        valueClass="text-danger-600"
        delay={150}
      />
      <StatCard
        label="正常保存"
        value={stats.fresh}
        icon={<CheckCircle size={22} className="text-brand-600" />}
        bgClass="bg-gradient-to-br from-brand-50 to-white"
        iconBgClass="bg-brand-100"
        valueClass="text-brand-600"
        delay={200}
      />
    </div>
  );
}
