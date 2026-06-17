export type StorageArea = 'fridge' | 'freezer' | 'door';

export type FoodStatus = 'active' | 'consumed' | 'discarded';

export type ActionType = 'consume' | 'discard';

export type FreshnessStatus = 'expired' | 'expiring' | 'fresh';

export interface Food {
  id: string;
  name: string;
  purchaseDate: string;
  shelfLifeDays: number;
  storageArea: StorageArea;
  owner: string;
  status: FoodStatus;
  createdAt: string;
}

export interface OperationLog {
  id: string;
  foodId: string;
  foodName: string;
  operator: string;
  action: ActionType;
  timestamp: string;
}

export interface Roommate {
  name: string;
  avatar: string;
  color: string;
}

export interface FoodFormData {
  name: string;
  purchaseDate: string;
  shelfLifeDays: number;
  storageArea: StorageArea;
  owner: string;
}

export interface FreshnessInfo {
  status: FreshnessStatus;
  remainingDays: number;
  expireDate: string;
}

export interface Stats {
  total: number;
  expired: number;
  expiring: number;
  fresh: number;
}

export const STORAGE_AREA_LABELS: Record<StorageArea, string> = {
  fridge: '冷藏',
  freezer: '冷冻',
  door: '门架',
};

export const STORAGE_AREA_ICONS: Record<StorageArea, string> = {
  fridge: '❄️',
  freezer: '🧊',
  door: '🚪',
};

export const ACTION_LABELS: Record<ActionType, string> = {
  consume: '吃掉',
  discard: '丢弃',
};

export const FRESHNESS_LABELS: Record<FreshnessStatus, string> = {
  expired: '已过期',
  expiring: '临期',
  fresh: '正常',
};
