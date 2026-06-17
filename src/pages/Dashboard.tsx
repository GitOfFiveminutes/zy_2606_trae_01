import { Header } from '@/components/layout/Header';
import { StatsCards } from '@/components/layout/StatsCards';
import { FilterBar } from '@/components/layout/FilterBar';
import { FoodColumn } from '@/components/food/FoodColumn';
import { FoodForm } from '@/components/food/FoodForm';
import { ConfirmModal } from '@/components/food/ConfirmModal';
import { LogDrawer } from '@/components/logs/LogDrawer';
import { StorageSettings } from '@/components/storage/StorageSettings';
import { useAppStore } from '@/store';

export default function Dashboard() {
  const {
    foodFormOpen,
    toggleFoodForm,
    getFoodsByStatus,
  } = useAppStore();

  const { expired, expiring, fresh } = getFoodsByStatus();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <Header />

      <main className="container py-6 lg:py-8 max-w-7xl">
        <div className="space-y-6 lg:space-y-8">
          <StatsCards />

          <FilterBar />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-5 border border-gray-100 min-h-[400px] flex flex-col">
              <FoodColumn
                status="expired"
                title="已过期"
                foods={expired}
              />
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-5 border border-gray-100 min-h-[400px] flex flex-col">
              <FoodColumn
                status="expiring"
                title="临期 (≤2天)"
                foods={expiring}
              />
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-5 border border-gray-100 min-h-[400px] flex flex-col">
              <FoodColumn
                status="fresh"
                title="正常保存"
                foods={fresh}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-gray-400">
        <p>🍱 合租冰箱食物共享管家 · 让每一口食物都不被浪费</p>
      </footer>

      <FoodForm
        open={foodFormOpen}
        onClose={() => toggleFoodForm(false)}
      />

      <ConfirmModal />

      <LogDrawer />

      <StorageSettings />
    </div>
  );
}
