import type { Food, OperationLog, Roommate } from '@/types';
import { getTodayString, addDays } from '@/utils/date';

export const DEFAULT_ROOMMATES: Roommate[] = [
  { name: '小明', avatar: '👨', color: 'bg-blue-500' },
  { name: '小红', avatar: '👩', color: 'bg-pink-500' },
  { name: '小刚', avatar: '🧑', color: 'bg-purple-500' },
  { name: '小李', avatar: '👱', color: 'bg-amber-500' },
];

const today = getTodayString();

export const DEFAULT_FOODS: Food[] = [
  {
    id: 'food-milk',
    name: '鲜牛奶',
    purchaseDate: addDays(today, -5),
    shelfLifeDays: 7,
    storageArea: 'fridge',
    owners: ['小明'],
    status: 'active',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'food-egg',
    name: '土鸡蛋',
    purchaseDate: addDays(today, -1),
    shelfLifeDays: 30,
    storageArea: 'door',
    owners: ['小红', '小明'],
    status: 'active',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'food-yogurt',
    name: '希腊酸奶',
    purchaseDate: addDays(today, -10),
    shelfLifeDays: 10,
    storageArea: 'fridge',
    owners: ['小刚'],
    status: 'active',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'food-dumpling',
    name: '速冻水饺',
    purchaseDate: addDays(today, -30),
    shelfLifeDays: 180,
    storageArea: 'freezer',
    owners: ['小李', '小刚'],
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'food-bread',
    name: '全麦面包',
    purchaseDate: addDays(today, -4),
    shelfLifeDays: 5,
    storageArea: 'fridge',
    owners: ['小明'],
    status: 'active',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'food-beef',
    name: '澳洲牛排',
    purchaseDate: addDays(today, -2),
    shelfLifeDays: 3,
    storageArea: 'fridge',
    owners: ['小红'],
    status: 'active',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'food-icecream',
    name: '哈根达斯冰淇淋',
    purchaseDate: addDays(today, -15),
    shelfLifeDays: 365,
    storageArea: 'freezer',
    owners: ['小刚', '小红', '小明'],
    status: 'active',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'food-sauce',
    name: '番茄酱',
    purchaseDate: addDays(today, -60),
    shelfLifeDays: 120,
    storageArea: 'door',
    owners: ['小李'],
    status: 'active',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'food-leftover',
    name: '剩菜红烧肉',
    purchaseDate: addDays(today, -3),
    shelfLifeDays: 2,
    storageArea: 'fridge',
    owners: ['小明', '小李'],
    status: 'active',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

export const DEFAULT_LOGS: OperationLog[] = [
  {
    id: 'log-1',
    foodId: 'old-food-1',
    foodName: '过期草莓',
    operator: '小明',
    action: 'discard',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'log-2',
    foodId: 'old-food-2',
    foodName: '苹果汁',
    operator: '小红',
    action: 'consume',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
];
