import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageAdapter } from '@/storage/local-adapter';

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    adapter = new LocalStorageAdapter();
    window.localStorage.clear();
  });

  describe('type 属性', () => {
    it('【数据预设】新创建实例 → 【预期结果】type 为 "local"', () => {
      expect(adapter.type).toBe('local');
    });
  });

  describe('load 方法', () => {
    it('【数据预设】key 不存在，默认值为字符串 → 【预期结果】返回默认字符串', async () => {
      const result = await adapter.load('nonexistent', 'default');
      expect(result).toBe('default');
    });

    it('【数据预设】key 不存在，默认值为数组 → 【预期结果】返回默认数组', async () => {
      const result = await adapter.load<string[]>('nonexistent', []);
      expect(result).toEqual([]);
    });

    it('【数据预设】key 不存在，默认值为对象 → 【预期结果】返回默认对象', async () => {
      const defaultValue = { count: 0, items: [] };
      const result = await adapter.load('nonexistent', defaultValue);
      expect(result).toEqual(defaultValue);
    });

    it('【数据预设】先保存再读取字符串 → 【预期结果】返回保存的值', async () => {
      await adapter.save('test-key', 'test-value');
      const result = await adapter.load('test-key', '');
      expect(result).toBe('test-value');
    });

    it('【数据预设】先保存再读取对象 → 【预期结果】返回保存的对象', async () => {
      const data = { name: 'apple', price: 5.5 };
      await adapter.save('fruit', data);
      const result = await adapter.load('fruit', { name: '', price: 0 });
      expect(result).toEqual(data);
    });

    it('【数据预设】先保存再读取数组 → 【预期结果】返回保存的数组', async () => {
      const data = [1, 2, 3, 4, 5];
      await adapter.save('numbers', data);
      const result = await adapter.load('numbers', [] as number[]);
      expect(result).toEqual(data);
    });

    it('【数据预设】存储内容为非法 JSON → 【预期结果】返回默认值，不抛异常', async () => {
      window.localStorage.setItem('fridge-manager-bad', 'not-json');
      const result = await adapter.load('bad', { fallback: true });
      expect(result).toEqual({ fallback: true });
    });

    it('【数据预设】不同 key 互不干扰 → 【预期结果】读取各自的值', async () => {
      await adapter.save('key1', 'value1');
      await adapter.save('key2', 'value2');
      expect(await adapter.load('key1', '')).toBe('value1');
      expect(await adapter.load('key2', '')).toBe('value2');
    });
  });

  describe('save 方法', () => {
    it('【数据预设】保存字符串 → 【预期结果】localStorage 中有带前缀的对应数据', async () => {
      await adapter.save('test', 'hello');
      const raw = window.localStorage.getItem('fridge-manager-test');
      expect(raw).toBe(JSON.stringify('hello'));
    });

    it('【数据预设】保存 null → 【预期结果】存储为 "null"', async () => {
      await adapter.save('null-key', null);
      const raw = window.localStorage.getItem('fridge-manager-null-key');
      expect(raw).toBe('null');
    });

    it('【数据预设】保存数字 0 → 【预期结果】存储为 "0"', async () => {
      await adapter.save('zero', 0);
      const raw = window.localStorage.getItem('fridge-manager-zero');
      expect(raw).toBe('0');
    });

    it('【数据预设】保存 false → 【预期结果】存储为 "false"', async () => {
      await adapter.save('false-key', false);
      const raw = window.localStorage.getItem('fridge-manager-false-key');
      expect(raw).toBe('false');
    });

    it('【数据预设】覆盖已有值 → 【预期结果】返回新值', async () => {
      await adapter.save('key', 'old');
      await adapter.save('key', 'new');
      const result = await adapter.load('key', '');
      expect(result).toBe('new');
    });
  });

  describe('remove 方法', () => {
    it('【数据预设】key 存在 → 【预期结果】删除后读取返回默认值', async () => {
      await adapter.save('to-remove', 'value');
      expect(await adapter.load('to-remove', '')).toBe('value');
      await adapter.remove('to-remove');
      expect(await adapter.load('to-remove', 'default')).toBe('default');
    });

    it('【数据预设】key 不存在 → 【预期结果】不抛出异常', async () => {
      await expect(adapter.remove('nonexistent')).resolves.not.toThrow();
    });

    it('【数据预设】删除一个 key → 【预期结果】其他 key 不受影响', async () => {
      await adapter.save('keep', 'keep-value');
      await adapter.save('remove', 'remove-value');
      await adapter.remove('remove');
      expect(await adapter.load('keep', '')).toBe('keep-value');
      expect(await adapter.load('remove', 'default')).toBe('default');
    });
  });

  describe('testConnection 方法', () => {
    it('【数据预设】正常环境 → 【预期结果】返回 true', async () => {
      const result = await adapter.testConnection();
      expect(result).toBe(true);
    });

    it('【数据预设】testConnection 不残留测试数据 → 【预期结果】localStorage 中无测试 key', async () => {
      await adapter.testConnection();
      const keys = Object.keys((window.localStorage as any).store);
      const hasTestKey = keys.some(k => k.includes('__connection_test__'));
      expect(hasTestKey).toBe(false);
    });
  });
});
