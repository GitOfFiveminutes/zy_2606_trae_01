import { describe, it, expect } from 'vitest';
import { generateId } from '@/utils/id';

describe('ID 工具函数', () => {
  describe('generateId', () => {
    it('【数据预设】无参数 → 【预期结果】返回非空字符串', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('【数据预设】连续调用两次 → 【预期结果】返回不同的 ID（唯一性）', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('【数据预设】连续调用1000次 → 【预期结果】所有 ID 均不重复', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(1000);
    });

    it('【数据预设】ID 格式 → 【预期结果】包含连字符分隔符', () => {
      const id = generateId();
      expect(id).toContain('-');
    });

    it('【数据预设】ID 格式 → 【预期结果】格式为 timestamp-random', () => {
      const id = generateId();
      const parts = id.split('-');
      expect(parts.length).toBe(2);
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBe(8);
    });

    it('【数据预设】ID 字符 → 【预期结果】只包含小写字母、数字和连字符', () => {
      const id = generateId();
      expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    });
  });
});
