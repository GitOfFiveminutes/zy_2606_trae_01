import { describe, it, expect, beforeEach } from 'vitest';
import { getStorageKey, loadFromStorage, saveToStorage, removeFromStorage } from '@/utils/storage';

describe('Storage 工具函数', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('getStorageKey', () => {
    it('【数据预设】key 为 "foods" → 【预期结果】返回带前缀的 key "fridge-manager-foods"', () => {
      const result = getStorageKey('foods');
      expect(result).toBe('fridge-manager-foods');
    });

    it('【数据预设】key 为 "test-key" → 【预期结果】返回带前缀的 key "fridge-manager-test-key"', () => {
      const result = getStorageKey('test-key');
      expect(result).toBe('fridge-manager-test-key');
    });

    it('【数据预设】key 为空字符串 → 【预期结果】返回仅含前缀 "fridge-manager-"', () => {
      const result = getStorageKey('');
      expect(result).toBe('fridge-manager-');
    });
  });

  describe('saveToStorage', () => {
    it('【数据预设】保存字符串值 → 【预期结果】localStorage 中存在对应数据', () => {
      saveToStorage('test', 'hello');
      const raw = window.localStorage.getItem('fridge-manager-test');
      expect(raw).toBe(JSON.stringify('hello'));
    });

    it('【数据预设】保存对象值 → 【预期结果】以 JSON 格式保存', () => {
      const data = { name: 'test', value: 123 };
      saveToStorage('obj', data);
      const raw = window.localStorage.getItem('fridge-manager-obj');
      expect(JSON.parse(raw!)).toEqual(data);
    });

    it('【数据预设】保存数组值 → 【预期结果】以 JSON 格式保存', () => {
      const data = [1, 2, 3, 'a', 'b'];
      saveToStorage('arr', data);
      const raw = window.localStorage.getItem('fridge-manager-arr');
      expect(JSON.parse(raw!)).toEqual(data);
    });
  });

  describe('loadFromStorage', () => {
    it('【数据预设】key 存在，默认值任意 → 【预期结果】返回保存的值', () => {
      saveToStorage('foods', ['apple', 'banana']);
      const result = loadFromStorage<string[]>('foods', []);
      expect(result).toEqual(['apple', 'banana']);
    });

    it('【数据预设】key 不存在，默认值为 [] → 【预期结果】返回默认值 []', () => {
      const result = loadFromStorage<string[]>('nonexistent', []);
      expect(result).toEqual([]);
    });

    it('【数据预设】key 不存在，默认值为对象 → 【预期结果】返回默认对象', () => {
      const defaultValue = { name: 'default' };
      const result = loadFromStorage('nonexistent', defaultValue);
      expect(result).toEqual(defaultValue);
    });

    it('【数据预设】key 不存在，默认值为 null → 【预期结果】返回 null', () => {
      const result = loadFromStorage<string | null>('nonexistent', null);
      expect(result).toBeNull();
    });

    it('【数据预设】存储内容为非法 JSON → 【预期结果】返回默认值且不抛出异常', () => {
      window.localStorage.setItem('fridge-manager-bad', '{invalid json');
      const result = loadFromStorage('bad', { fallback: true });
      expect(result).toEqual({ fallback: true });
    });
  });

  describe('removeFromStorage', () => {
    it('【数据预设】key 存在 → 【预期结果】删除后 key 不存在', () => {
      saveToStorage('toRemove', 'value');
      expect(window.localStorage.getItem('fridge-manager-toRemove')).not.toBeNull();

      removeFromStorage('toRemove');
      expect(window.localStorage.getItem('fridge-manager-toRemove')).toBeNull();
    });

    it('【数据预设】key 不存在 → 【预期结果】不抛出异常', () => {
      expect(() => removeFromStorage('nonexistent')).not.toThrow();
    });

    it('【数据预设】删除一个 key → 【预期结果】不影响其他 key', () => {
      saveToStorage('keep', 'keep-value');
      saveToStorage('remove', 'remove-value');

      removeFromStorage('remove');

      expect(loadFromStorage('keep', '')).toBe('keep-value');
      expect(window.localStorage.getItem('fridge-manager-remove')).toBeNull();
    });
  });
});
