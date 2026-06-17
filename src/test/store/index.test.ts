import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';
import type { Food, FoodStatus, OperationLog, Roommate, FoodFormData, ActionType, Stats, FreshnessInfo } from '@/types';

const MOCK_ROOMMATES: Roommate[] = [
  { name: '小明', avatar: '👨', color: 'bg-blue-500' },
  { name: '小红', avatar: '👩', color: 'bg-pink-500' },
  { name: '小刚', avatar: '🧑', color: 'bg-purple-500' },
  { name: '小李', avatar: '👱', color: 'bg-amber-500' },
];

function makeMockFoods(): Food[] {
  const today = new Date(2024, 5, 18);
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmtLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const iso = (d: Date) => `${fmtLocal(d)}T00:00:00.000Z`;
  const day = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return fmtLocal(d);
  };
  return [
    {
      id: 'food-fresh',
      name: '鲜牛奶',
      purchaseDate: day(-1),
      shelfLifeDays: 7,
      storageArea: 'fridge',
      owners: ['小明'],
      status: 'active',
      createdAt: iso(today),
    },
    {
      id: 'food-expiring',
      name: '澳洲牛排',
      purchaseDate: day(-2),
      shelfLifeDays: 3,
      storageArea: 'fridge',
      owners: ['小红'],
      status: 'active',
      createdAt: iso(today),
    },
    {
      id: 'food-expired',
      name: '希腊酸奶',
      purchaseDate: day(-10),
      shelfLifeDays: 7,
      storageArea: 'fridge',
      owners: ['小刚'],
      status: 'active',
      createdAt: iso(today),
    },
    {
      id: 'food-shared',
      name: '土鸡蛋',
      purchaseDate: day(-1),
      shelfLifeDays: 30,
      storageArea: 'door',
      owners: ['小红', '小明'],
      status: 'active',
      createdAt: iso(today),
    },
  ];
}

function mockCalculateFreshness(purchaseDate: string, shelfLifeDays: number): FreshnessInfo {
  const purchase = new Date(purchaseDate);
  purchase.setHours(0, 0, 0, 0);
  const expire = new Date(purchase);
  expire.setDate(expire.getDate() + shelfLifeDays);
  const today = new Date(2024, 5, 18);
  today.setHours(0, 0, 0, 0);
  const remainingDays = Math.ceil((expire.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  let status: 'expired' | 'expiring' | 'fresh';
  if (remainingDays <= 0) status = 'expired';
  else if (remainingDays <= 2) status = 'expiring';
  else status = 'fresh';
  const y = expire.getFullYear();
  const m = String(expire.getMonth() + 1).padStart(2, '0');
  const d = String(expire.getDate()).padStart(2, '0');
  return { status, remainingDays, expireDate: `${y}-${m}-${d}` };
}

let savedStore: Record<string, any> = {};
const mockStorageProvider = {
  init: vi.fn().mockResolvedValue(undefined),
  getProviderType: vi.fn().mockReturnValue('local'),
  isConnected: vi.fn().mockReturnValue(true),
  load: vi.fn().mockImplementation((key: string, defaultValue: any) => {
    return Promise.resolve(savedStore[key] ?? defaultValue);
  }),
  save: vi.fn().mockImplementation((key: string, value: any) => {
    savedStore[key] = value;
    return Promise.resolve();
  }),
  switchProvider: vi.fn().mockResolvedValue(true),
  testConnection: vi.fn().mockResolvedValue(true),
  getCurrentConfig: vi.fn().mockReturnValue({
    type: 'local' as const,
    baseUrl: '',
    apiKey: '',
    headers: {},
    timeout: 0,
  }),
};

vi.mock('@/storage', () => ({ storageProvider: mockStorageProvider }));
vi.mock('@/utils/id', () => ({ generateId: () => `mock-id-${Math.random().toString(36).slice(2, 8)}` }));
vi.mock('@/utils/date', () => ({
  calculateFreshness: mockCalculateFreshness,
  getTodayString: () => '2024-06-18',
  addDays: (dateStr: string, days: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  },
  formatDate: (d: any, fmt: string = 'YYYY-MM-DD') => {
    const date = typeof d === 'string' ? new Date(d) : d;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    if (fmt === 'YYYY-MM-DD') return `${y}-${m}-${dd}`;
    return `${y}-${m}-${dd}`;
  },
}));

import type { StorageAdapterConfig } from '@/storage/types';

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
  syncStatus: any;
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

function migrateFood(food: any): Food {
  if (food.owner && !food.owners) return { ...food, owners: [food.owner] };
  if (!food.owners) return { ...food, owners: [] };
  return food;
}

const DEFAULT_FOODS: Food[] = makeMockFoods();
const DEFAULT_LOGS: OperationLog[] = [];
const DEFAULT_ROOMMATES: Roommate[] = MOCK_ROOMMATES;

const initialSyncStatus = {
  loading: false, syncing: false, error: null, lastSyncAt: null,
  provider: 'local' as const, connected: true,
};

function createTestStore() {
  return create<AppState>((set, get) => ({
    foods: [], logs: [], roommates: [], currentUser: '',
    selectedOwner: 'all', logDrawerOpen: false, foodFormOpen: false,
    confirmData: null, storageSettingsOpen: false,
    syncStatus: { ...initialSyncStatus },

    init: async () => {
      set({ syncStatus: { ...initialSyncStatus, loading: true } });
      try {
        await mockStorageProvider.init();
        const loadedFoods = await mockStorageProvider.load<Food[]>('foods', DEFAULT_FOODS);
        const loadedLogs = await mockStorageProvider.load<OperationLog[]>('logs', DEFAULT_LOGS);
        const loadedRoommates = await mockStorageProvider.load<Roommate[]>('roommates', DEFAULT_ROOMMATES);
        const loadedCurrentUser = await mockStorageProvider.load<string>('current-user', DEFAULT_ROOMMATES[0].name);
        set({
          foods: loadedFoods.map(migrateFood).filter((f: Food) => f.status === 'active'),
          logs: loadedLogs, roommates: loadedRoommates, currentUser: loadedCurrentUser,
          syncStatus: {
            ...initialSyncStatus, loading: false, provider: 'local', connected: true,
            lastSyncAt: new Date().toISOString(),
          },
        });
      } catch (error: any) {
        set({
          syncStatus: {
            ...initialSyncStatus, loading: false,
            error: error.message || '初始化失败', connected: false,
          },
        });
      }
    },

    setCurrentUser: (name: string) => {
      set({ currentUser: name });
      mockStorageProvider.save('current-user', name);
    },
    setSelectedOwner: (owner) => set({ selectedOwner: owner }),
    toggleLogDrawer: (open) => set((s) => ({ logDrawerOpen: open ?? !s.logDrawerOpen })),
    toggleFoodForm: (open) => set((s) => ({ foodFormOpen: open ?? !s.foodFormOpen })),
    openConfirm: (food, action) => {
      const s = get();
      if (!s.canOperateFood(food, s.currentUser)) return;
      set({ confirmData: { food, action } });
    },
    closeConfirm: () => set({ confirmData: null }),

    addFood: (data) => {
      const newFood: Food = {
        id: `mock-id-${Date.now()}`, ...data, status: 'active',
        createdAt: new Date().toISOString(),
      };
      set((state) => {
        const newFoods = [newFood, ...state.foods];
        mockStorageProvider.save('foods', newFoods);
        return { foods: newFoods, foodFormOpen: false };
      });
      set((state) => ({
        syncStatus: {
          ...state.syncStatus, connected: true,
          lastSyncAt: new Date().toISOString(),
        },
      }));
    },

    handleAction: (foodId, action, operator) => {
      const s = get();
      const food = s.foods.find((f) => f.id === foodId);
      if (!food) return false;
      if (!s.canOperateFood(food, operator)) return false;
      const log: OperationLog = {
        id: `log-${Date.now()}`, foodId, foodName: food.name,
        operator, action, timestamp: new Date().toISOString(),
      };
      const newStatus: FoodStatus = action === 'consume' ? 'consumed' : 'discarded';
      const updatedFoods = s.foods.map((f) =>
        f.id === foodId ? { ...f, status: newStatus } : f
      );
      const newLogs = [log, ...s.logs];
      mockStorageProvider.save('foods', updatedFoods);
      mockStorageProvider.save('logs', newLogs);
      set({
        foods: updatedFoods.filter((f) => f.status === 'active'),
        logs: newLogs, confirmData: null,
      });
      set((state) => ({
        syncStatus: {
          ...state.syncStatus, connected: true,
          lastSyncAt: new Date().toISOString(),
        },
      }));
      return true;
    },

    addRoommate: (name) => {
      if (!name.trim()) return;
      const s = get();
      if (s.roommates.some((r) => r.name === name)) return;
      const colors = ['bg-cyan-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500', 'bg-violet-500'];
      const avatars = ['😊', '😎', '🤗', '🥳', '🤩', '😋'];
      const newRoommate: Roommate = {
        name: name.trim(),
        avatar: avatars[s.roommates.length % avatars.length],
        color: colors[s.roommates.length % colors.length],
      };
      const newRoommates = [...s.roommates, newRoommate];
      mockStorageProvider.save('roommates', newRoommates);
      set({ roommates: newRoommates });
    },

    canOperateFood: (food, userName) => food.owners.includes(userName),

    getFilteredFoods: () => {
      const s = get();
      if (s.selectedOwner === 'all') return s.foods;
      return s.foods.filter((f) => f.owners.includes(s.selectedOwner));
    },

    getStats: () => {
      const foods = get().getFilteredFoods();
      let expired = 0, expiring = 0, fresh = 0;
      foods.forEach((food) => {
        const info = mockCalculateFreshness(food.purchaseDate, food.shelfLifeDays);
        if (info.status === 'expired') expired++;
        else if (info.status === 'expiring') expiring++;
        else fresh++;
      });
      return { total: foods.length, expired, expiring, fresh };
    },

    getFoodsByStatus: () => {
      const foods = get().getFilteredFoods();
      const expired: Food[] = [], expiring: Food[] = [], fresh: Food[] = [];
      const enriched = foods.map((food) => ({
        food, freshness: mockCalculateFreshness(food.purchaseDate, food.shelfLifeDays),
      }));
      enriched.sort((a, b) => a.freshness.remainingDays - b.freshness.remainingDays);
      enriched.forEach(({ food, freshness }) => {
        if (freshness.status === 'expired') expired.push(food);
        else if (freshness.status === 'expiring') expiring.push(food);
        else fresh.push(food);
      });
      return { expired, expiring, fresh };
    },

    toggleStorageSettings: (open) => set((s) => ({ storageSettingsOpen: open ?? !s.storageSettingsOpen })),

    switchStorageProvider: async (config) => {
      set((s) => ({ syncStatus: { ...s.syncStatus, syncing: true, error: null } }));
      try {
        const success = await mockStorageProvider.switchProvider(config);
        if (success) {
          const loadedFoods = await mockStorageProvider.load<Food[]>('foods', DEFAULT_FOODS);
          const loadedLogs = await mockStorageProvider.load<OperationLog[]>('logs', DEFAULT_LOGS);
          const loadedRoommates = await mockStorageProvider.load<Roommate[]>('roommates', DEFAULT_ROOMMATES);
          const loadedCurrentUser = await mockStorageProvider.load<string>('current-user', DEFAULT_ROOMMATES[0].name);
          set({
            foods: loadedFoods.map(migrateFood).filter((f: Food) => f.status === 'active'),
            logs: loadedLogs, roommates: loadedRoommates, currentUser: loadedCurrentUser,
            syncStatus: {
              loading: false, syncing: false, error: null,
              lastSyncAt: new Date().toISOString(), provider: 'local', connected: true,
            },
          });
        } else {
          set((s) => ({ syncStatus: { ...s.syncStatus, syncing: false, error: '切换存储方案失败' } }));
        }
        return success;
      } catch (error: any) {
        set((s) => ({
          syncStatus: { ...s.syncStatus, syncing: false, error: error.message || '切换失败' },
        }));
        return false;
      }
    },

    testStorageConnection: async (config) => mockStorageProvider.testConnection(config),
    getStorageConfig: () => mockStorageProvider.getCurrentConfig(),
  }));
}

describe('Zustand Store - 状态管理', () => {
  let useStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 18, 12, 0, 0));
    savedStore = {};
    vi.clearAllMocks();
    useStore = createTestStore();
  });

  describe('初始状态', () => {
    it('【数据预设】未调用 init → 【预期结果】foods/logs/roommates 为空，selectedOwner 为 "all"', () => {
      const s = useStore.getState();
      expect(s.foods).toEqual([]);
      expect(s.logs).toEqual([]);
      expect(s.roommates).toEqual([]);
      expect(s.selectedOwner).toBe('all');
      expect(s.currentUser).toBe('');
    });
  });

  describe('init 方法', () => {
    it('【数据预设】无保存数据，加载默认值 → 【预期结果】加载默认食物/室友/日志', async () => {
      await useStore.getState().init();
      const s = useStore.getState();
      expect(s.foods.length).toBe(4);
      expect(s.roommates).toEqual(MOCK_ROOMMATES);
      expect(s.currentUser).toBe('小明');
      expect(s.syncStatus.loading).toBe(false);
      expect(s.syncStatus.connected).toBe(true);
    });
  });

  describe('setCurrentUser', () => {
    it('【数据预设】设置当前用户为 "小红" → 【预期结果】currentUser 更新并持久化', () => {
      useStore.getState().setCurrentUser('小红');
      expect(useStore.getState().currentUser).toBe('小红');
      expect(mockStorageProvider.save).toHaveBeenCalledWith('current-user', '小红');
    });
  });

  describe('setSelectedOwner / 筛选', () => {
    beforeEach(async () => {
      await useStore.getState().init();
    });

    it('【数据预设】selectedOwner = "all" → 【预期结果】getFilteredFoods 返回全部 4 条', () => {
      useStore.getState().setSelectedOwner('all');
      expect(useStore.getState().getFilteredFoods().length).toBe(4);
    });

    it('【数据预设】selectedOwner = "小明" → 【预期结果】getFilteredFoods 返回小明拥有的 2 条', () => {
      useStore.getState().setSelectedOwner('小明');
      const filtered = useStore.getState().getFilteredFoods();
      expect(filtered.length).toBe(2);
      filtered.forEach((f) => expect(f.owners).toContain('小明'));
    });

    it('【数据预设】selectedOwner = "小刚" → 【预期结果】getFilteredFoods 返回小刚拥有的 1 条', () => {
      useStore.getState().setSelectedOwner('小刚');
      const filtered = useStore.getState().getFilteredFoods();
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('希腊酸奶');
    });
  });

  describe('UI 开关类方法', () => {
    it('【数据预设】toggleLogDrawer() 无参数 → 【预期结果】在 false/true 之间切换', () => {
      const s = useStore.getState();
      expect(s.logDrawerOpen).toBe(false);
      s.toggleLogDrawer();
      expect(useStore.getState().logDrawerOpen).toBe(true);
      useStore.getState().toggleLogDrawer();
      expect(useStore.getState().logDrawerOpen).toBe(false);
    });

    it('【数据预设】toggleLogDrawer(true) → 【预期结果】强制设为 true', () => {
      useStore.getState().toggleLogDrawer(true);
      expect(useStore.getState().logDrawerOpen).toBe(true);
    });

    it('【数据预设】toggleFoodForm(false) → 【预期结果】强制设为 false', () => {
      useStore.getState().toggleFoodForm(true);
      useStore.getState().toggleFoodForm(false);
      expect(useStore.getState().foodFormOpen).toBe(false);
    });

    it('【数据预设】toggleStorageSettings() → 【预期结果】切换状态', () => {
      expect(useStore.getState().storageSettingsOpen).toBe(false);
      useStore.getState().toggleStorageSettings();
      expect(useStore.getState().storageSettingsOpen).toBe(true);
    });
  });

  describe('canOperateFood', () => {
    it('【数据预设】用户在 owners 中 → 【预期结果】返回 true', () => {
      const food: Food = {
        id: 'f1', name: '苹果', purchaseDate: '2024-06-17', shelfLifeDays: 5,
        storageArea: 'fridge', owners: ['小明', '小红'], status: 'active',
        createdAt: '2024-06-17T00:00:00Z',
      };
      expect(useStore.getState().canOperateFood(food, '小明')).toBe(true);
    });

    it('【数据预设】用户不在 owners 中 → 【预期结果】返回 false', () => {
      const food: Food = {
        id: 'f1', name: '苹果', purchaseDate: '2024-06-17', shelfLifeDays: 5,
        storageArea: 'fridge', owners: ['小明'], status: 'active',
        createdAt: '2024-06-17T00:00:00Z',
      };
      expect(useStore.getState().canOperateFood(food, '小刚')).toBe(false);
    });
  });

  describe('openConfirm / closeConfirm', () => {
    beforeEach(async () => {
      await useStore.getState().init();
    });

    it('【数据预设】当前用户是小明，打开小明拥有的食物 → 【预期结果】confirmData 被设置', () => {
      const s = useStore.getState();
      const food = s.foods.find((f) => f.id === 'food-fresh')!;
      s.openConfirm(food, 'consume');
      expect(useStore.getState().confirmData).not.toBeNull();
      expect(useStore.getState().confirmData!.food.id).toBe('food-fresh');
      expect(useStore.getState().confirmData!.action).toBe('consume');
    });

    it('【数据预设】当前用户是小明，打开小刚拥有的食物 → 【预期结果】confirmData 为 null（无权）', () => {
      const s = useStore.getState();
      const food = s.foods.find((f) => f.id === 'food-expired')!;
      s.openConfirm(food, 'discard');
      expect(useStore.getState().confirmData).toBeNull();
    });

    it('【数据预设】closeConfirm 被调用 → 【预期结果】confirmData 变为 null', () => {
      const s = useStore.getState();
      const food = s.foods.find((f) => f.id === 'food-fresh')!;
      s.openConfirm(food, 'consume');
      expect(useStore.getState().confirmData).not.toBeNull();
      useStore.getState().closeConfirm();
      expect(useStore.getState().confirmData).toBeNull();
    });
  });

  describe('addFood', () => {
    beforeEach(async () => {
      await useStore.getState().init();
    });

    it('【数据预设】新增一条食物 → 【预期结果】foods 数量 +1，form 关闭，持久化', () => {
      const beforeCount = useStore.getState().foods.length;
      useStore.getState().toggleFoodForm(true);
      useStore.getState().addFood({
        name: '测试食物',
        purchaseDate: '2024-06-18',
        shelfLifeDays: 10,
        storageArea: 'fridge',
        owners: ['小明'],
      });
      const s = useStore.getState();
      expect(s.foods.length).toBe(beforeCount + 1);
      expect(s.foods[0].name).toBe('测试食物');
      expect(s.foodFormOpen).toBe(false);
      expect(mockStorageProvider.save).toHaveBeenCalled();
    });
  });

  describe('handleAction - 吃掉/丢弃', () => {
    beforeEach(async () => {
      await useStore.getState().init();
    });

    it('【数据预设】小明吃掉自己的鲜牛奶 → 【预期结果】foods 数量 -1，新增一条 consume 日志', () => {
      const beforeFoods = useStore.getState().foods.length;
      const beforeLogs = useStore.getState().logs.length;
      const ok = useStore.getState().handleAction('food-fresh', 'consume', '小明');
      expect(ok).toBe(true);
      expect(useStore.getState().foods.length).toBe(beforeFoods - 1);
      expect(useStore.getState().foods.find((f) => f.id === 'food-fresh')).toBeUndefined();
      expect(useStore.getState().logs.length).toBe(beforeLogs + 1);
      expect(useStore.getState().logs[0].action).toBe('consume');
      expect(useStore.getState().logs[0].foodName).toBe('鲜牛奶');
    });

    it('【数据预设】小明丢弃不属于自己的希腊酸奶 → 【预期结果】返回 false，无变化', () => {
      const beforeFoods = useStore.getState().foods.length;
      const beforeLogs = useStore.getState().logs.length;
      const ok = useStore.getState().handleAction('food-expired', 'discard', '小明');
      expect(ok).toBe(false);
      expect(useStore.getState().foods.length).toBe(beforeFoods);
      expect(useStore.getState().logs.length).toBe(beforeLogs);
    });

    it('【数据预设】操作不存在的 foodId → 【预期结果】返回 false', () => {
      const ok = useStore.getState().handleAction('nonexistent', 'consume', '小明');
      expect(ok).toBe(false);
    });

    it('【数据预设】小红丢弃属于自己的牛排 → 【预期结果】新增 discard 日志，food 从列表移除', () => {
      const ok = useStore.getState().handleAction('food-expiring', 'discard', '小红');
      expect(ok).toBe(true);
      expect(useStore.getState().logs[0].action).toBe('discard');
      expect(useStore.getState().confirmData).toBeNull();
    });
  });

  describe('addRoommate', () => {
    beforeEach(async () => {
      await useStore.getState().init();
    });

    it('【数据预设】添加新室友 "小王" → 【预期结果】roommates 数量 +1，持久化', () => {
      const before = useStore.getState().roommates.length;
      useStore.getState().addRoommate('小王');
      const s = useStore.getState();
      expect(s.roommates.length).toBe(before + 1);
      expect(s.roommates[s.roommates.length - 1].name).toBe('小王');
      expect(mockStorageProvider.save).toHaveBeenCalledWith('roommates', expect.any(Array));
    });

    it('【数据预设】添加已存在的室友 → 【预期结果】不重复添加', () => {
      const before = useStore.getState().roommates.length;
      useStore.getState().addRoommate('小明');
      expect(useStore.getState().roommates.length).toBe(before);
    });

    it('【数据预设】添加空字符串 → 【预期结果】不添加', () => {
      const before = useStore.getState().roommates.length;
      useStore.getState().addRoommate('   ');
      expect(useStore.getState().roommates.length).toBe(before);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await useStore.getState().init();
    });

    it('【数据预设】all 筛选 → 【预期结果】total=4, expired=1, expiring=1, fresh=2', () => {
      const stats = useStore.getState().getStats();
      expect(stats.total).toBe(4);
      expect(stats.expired).toBe(1);
      expect(stats.expiring).toBe(1);
      expect(stats.fresh).toBe(2);
    });

    it('【数据预设】筛选"小明" → 【预期结果】total=2, expired=0, expiring=0, fresh=2', () => {
      useStore.getState().setSelectedOwner('小明');
      const stats = useStore.getState().getStats();
      expect(stats.total).toBe(2);
      expect(stats.expired).toBe(0);
      expect(stats.fresh).toBe(2);
    });
  });

  describe('getFoodsByStatus', () => {
    beforeEach(async () => {
      await useStore.getState().init();
    });

    it('【数据预设】all 筛选 → 【预期结果】分组正确且按剩余天数升序', () => {
      const groups = useStore.getState().getFoodsByStatus();
      expect(groups.expired.length).toBe(1);
      expect(groups.expired[0].id).toBe('food-expired');
      expect(groups.expiring.length).toBe(1);
      expect(groups.expiring[0].id).toBe('food-expiring');
      expect(groups.fresh.length).toBe(2);
    });
  });

  describe('存储配置相关', () => {
    it('【数据预设】getStorageConfig → 【预期结果】委托给 storageProvider', async () => {
      await useStore.getState().init();
      const config = useStore.getState().getStorageConfig();
      expect(config.type).toBe('local');
    });

    it('【数据预设】testStorageConnection → 【预期结果】委托给 storageProvider', async () => {
      const cfg: any = { type: 'local' };
      await useStore.getState().testStorageConnection(cfg);
      expect(mockStorageProvider.testConnection).toHaveBeenCalledWith(cfg);
    });
  });
});
