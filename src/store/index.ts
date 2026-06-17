import { create } from 'zustand';
import type { Food, FoodStatus, OperationLog, Roommate, FoodFormData, ActionType, Stats } from '@/types';
import type { StorageAdapterConfig, StorageProviderType, StorageSyncStatus } from '@/storage';
import { storageProvider } from '@/storage';
import { generateId } from '@/utils/id';
import { calculateFreshness } from '@/utils/date';
import { DEFAULT_FOODS, DEFAULT_LOGS, DEFAULT_ROOMMATES } from '@/data/mock';

function migrateFood(food: any): Food {
  if (food.owner && !food.owners) {
    return { ...food, owners: [food.owner] };
  }
  if (!food.owners) {
    return { ...food, owners: [] };
  }
  return food;
}

interface AppState {
  foods: Food[];
  logs: OperationLog[];
  roommates: Roommate[];
  currentUser: string;
  selectedOwner: string | 'all';
  logDrawerOpen: boolean;
  foodFormOpen: boolean;
  confirmData: { food: Food; action: ActionType } | null;
  storageSettingsOpen: boolean;
  syncStatus: StorageSyncStatus;

  init: () => Promise<void>;
  setCurrentUser: (name: string) => void;
  setSelectedOwner: (owner: string | 'all') => void;
  toggleLogDrawer: (open?: boolean) => void;
  toggleFoodForm: (open?: boolean) => void;
  openConfirm: (food: Food, action: ActionType) => void;
  closeConfirm: () => void;
  addFood: (data: FoodFormData) => void;
  handleAction: (foodId: string, action: ActionType, operator: string) => boolean;
  addRoommate: (name: string) => void;
  canOperateFood: (food: Food, userName: string) => boolean;
  getFilteredFoods: () => Food[];
  getStats: () => Stats;
  getFoodsByStatus: () => { expired: Food[]; expiring: Food[]; fresh: Food[] };
  toggleStorageSettings: (open?: boolean) => void;
  switchStorageProvider: (config: StorageAdapterConfig) => Promise<boolean>;
  testStorageConnection: (config: StorageAdapterConfig) => Promise<boolean>;
  getStorageConfig: () => StorageAdapterConfig;
}

const initialSyncStatus: StorageSyncStatus = {
  loading: false,
  syncing: false,
  error: null,
  lastSyncAt: null,
  provider: 'local',
  connected: true,
};

export const useAppStore = create<AppState>((set, get) => ({
  foods: [],
  logs: [],
  roommates: [],
  currentUser: '',
  selectedOwner: 'all',
  logDrawerOpen: false,
  foodFormOpen: false,
  confirmData: null,
  storageSettingsOpen: false,
  syncStatus: { ...initialSyncStatus },

  init: async () => {
    set({ syncStatus: { ...initialSyncStatus, loading: true } });

    try {
      await storageProvider.init();

      const currentProvider = storageProvider.getProviderType();
      const connected = storageProvider.isConnected();

      const loadedFoods = await storageProvider.load<Food[]>('foods', DEFAULT_FOODS);
      const loadedLogs = await storageProvider.load<OperationLog[]>('logs', DEFAULT_LOGS);
      const loadedRoommates = await storageProvider.load<Roommate[]>('roommates', DEFAULT_ROOMMATES);
      const loadedCurrentUser = await storageProvider.load<string>('current-user', DEFAULT_ROOMMATES[0].name);

      set({
        foods: loadedFoods.map(migrateFood).filter(f => f.status === 'active'),
        logs: loadedLogs,
        roommates: loadedRoommates,
        currentUser: loadedCurrentUser,
        syncStatus: {
          ...initialSyncStatus,
          loading: false,
          provider: currentProvider,
          connected,
          lastSyncAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('[Store] 初始化失败:', error);
      set({
        syncStatus: {
          ...initialSyncStatus,
          loading: false,
          error: error instanceof Error ? error.message : '初始化失败',
          connected: false,
        },
      });
    }
  },

  setCurrentUser: (name: string) => {
    set({ currentUser: name });
    storageProvider.save('current-user', name);
  },

  setSelectedOwner: (owner) => {
    set({ selectedOwner: owner });
  },

  toggleLogDrawer: (open) => {
    set((state) => ({ logDrawerOpen: open ?? !state.logDrawerOpen }));
  },

  toggleFoodForm: (open) => {
    set((state) => ({ foodFormOpen: open ?? !state.foodFormOpen }));
  },

  openConfirm: (food, action) => {
    const state = get();
    if (!state.canOperateFood(food, state.currentUser)) {
      return;
    }
    set({ confirmData: { food, action } });
  },

  closeConfirm: () => {
    set({ confirmData: null });
  },

  addFood: (data) => {
    const newFood: Food = {
      id: generateId(),
      ...data,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const newFoods = [newFood, ...state.foods];
      storageProvider.save('foods', newFoods);
      return { foods: newFoods, foodFormOpen: false };
    });

    set((state) => ({
      syncStatus: {
        ...state.syncStatus,
        connected: storageProvider.isConnected(),
        lastSyncAt: new Date().toISOString(),
      },
    }));
  },

  handleAction: (foodId, action, operator) => {
    const state = get();
    const food = state.foods.find(f => f.id === foodId);
    if (!food) return false;

    if (!state.canOperateFood(food, operator)) {
      return false;
    }

    const log: OperationLog = {
      id: generateId(),
      foodId,
      foodName: food.name,
      operator,
      action,
      timestamp: new Date().toISOString(),
    };

    const newStatus: FoodStatus = action === 'consume' ? 'consumed' : 'discarded';
    const updatedFoods = state.foods.map(f =>
      f.id === foodId ? { ...f, status: newStatus } : f
    );
    const newLogs = [log, ...state.logs];

    storageProvider.save('foods', updatedFoods);
    storageProvider.save('logs', newLogs);

    set({
      foods: updatedFoods.filter(f => f.status === 'active'),
      logs: newLogs,
      confirmData: null,
    });

    set((state) => ({
      syncStatus: {
        ...state.syncStatus,
        connected: storageProvider.isConnected(),
        lastSyncAt: new Date().toISOString(),
      },
    }));

    return true;
  },

  addRoommate: (name) => {
    if (!name.trim()) return;
    const state = get();
    if (state.roommates.some(r => r.name === name)) return;

    const colors = ['bg-cyan-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500', 'bg-violet-500'];
    const avatars = ['😊', '😎', '🤗', '🥳', '🤩', '😋'];

    const newRoommate: Roommate = {
      name: name.trim(),
      avatar: avatars[state.roommates.length % avatars.length],
      color: colors[state.roommates.length % colors.length],
    };

    const newRoommates = [...state.roommates, newRoommate];
    storageProvider.save('roommates', newRoommates);
    set({ roommates: newRoommates });
  },

  canOperateFood: (food, userName) => {
    return food.owners.includes(userName);
  },

  getFilteredFoods: () => {
    const state = get();
    if (state.selectedOwner === 'all') return state.foods;
    return state.foods.filter(f => f.owners.includes(state.selectedOwner));
  },

  getStats: () => {
    const foods = get().getFilteredFoods();
    let expired = 0, expiring = 0, fresh = 0;

    foods.forEach(food => {
      const info = calculateFreshness(food.purchaseDate, food.shelfLifeDays);
      if (info.status === 'expired') expired++;
      else if (info.status === 'expiring') expiring++;
      else fresh++;
    });

    return { total: foods.length, expired, expiring, fresh };
  },

  getFoodsByStatus: () => {
    const foods = get().getFilteredFoods();
    const expired: Food[] = [];
    const expiring: Food[] = [];
    const fresh: Food[] = [];

    const enriched = foods.map(food => ({
      food,
      freshness: calculateFreshness(food.purchaseDate, food.shelfLifeDays),
    }));

    enriched.sort((a, b) => a.freshness.remainingDays - b.freshness.remainingDays);

    enriched.forEach(({ food, freshness }) => {
      if (freshness.status === 'expired') expired.push(food);
      else if (freshness.status === 'expiring') expiring.push(food);
      else fresh.push(food);
    });

    return { expired, expiring, fresh };
  },

  toggleStorageSettings: (open) => {
    set((state) => ({ storageSettingsOpen: open ?? !state.storageSettingsOpen }));
  },

  switchStorageProvider: async (config: StorageAdapterConfig) => {
    set((state) => ({
      syncStatus: { ...state.syncStatus, syncing: true, error: null },
    }));

    try {
      const success = await storageProvider.switchProvider(config);

      if (success) {
        const loadedFoods = await storageProvider.load<Food[]>('foods', DEFAULT_FOODS);
        const loadedLogs = await storageProvider.load<OperationLog[]>('logs', DEFAULT_LOGS);
        const loadedRoommates = await storageProvider.load<Roommate[]>('roommates', DEFAULT_ROOMMATES);
        const loadedCurrentUser = await storageProvider.load<string>('current-user', DEFAULT_ROOMMATES[0].name);

        set({
          foods: loadedFoods.map(migrateFood).filter(f => f.status === 'active'),
          logs: loadedLogs,
          roommates: loadedRoommates,
          currentUser: loadedCurrentUser,
          syncStatus: {
            loading: false,
            syncing: false,
            error: null,
            lastSyncAt: new Date().toISOString(),
            provider: storageProvider.getProviderType(),
            connected: storageProvider.isConnected(),
          },
        });
      } else {
        set((state) => ({
          syncStatus: {
            ...state.syncStatus,
            syncing: false,
            error: '切换存储方案失败',
          },
        }));
      }

      return success;
    } catch (error) {
      set((state) => ({
        syncStatus: {
          ...state.syncStatus,
          syncing: false,
          error: error instanceof Error ? error.message : '切换失败',
        },
      }));
      return false;
    }
  },

  testStorageConnection: async (config: StorageAdapterConfig) => {
    return storageProvider.testConnection(config);
  },

  getStorageConfig: () => {
    return storageProvider.getCurrentConfig();
  },
}));
