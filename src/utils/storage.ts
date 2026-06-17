const PREFIX = 'fridge-manager-';

export function getStorageKey(key: string): string {
  return `${PREFIX}${key}`;
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(getStorageKey(key));
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`[Storage] 读取失败: ${key}`, error);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(value));
  } catch (error) {
    console.warn(`[Storage] 写入失败: ${key}`, error);
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(getStorageKey(key));
  } catch (error) {
    console.warn(`[Storage] 删除失败: ${key}`, error);
  }
}
