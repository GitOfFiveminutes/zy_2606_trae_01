import type { StorageAdapter } from './types';

const PREFIX = 'fridge-manager-';

function getKey(key: string): string {
  return `${PREFIX}${key}`;
}

export class LocalStorageAdapter implements StorageAdapter {
  readonly type = 'local' as const;

  async load<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const item = localStorage.getItem(getKey(key));
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`[LocalStorage] 读取失败: ${key}`, error);
      return defaultValue;
    }
  }

  async save<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(getKey(key), JSON.stringify(value));
    } catch (error) {
      console.warn(`[LocalStorage] 写入失败: ${key}`, error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(getKey(key));
    } catch (error) {
      console.warn(`[LocalStorage] 删除失败: ${key}`, error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const testKey = getKey('__connection_test__');
      localStorage.setItem(testKey, 'ok');
      const result = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return result === 'ok';
    } catch {
      return false;
    }
  }
}
