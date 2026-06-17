import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatDate, getTodayString, calculateFreshness, addDays } from '@/utils/date';

describe('Date 工具函数', () => {
  describe('formatDate', () => {
    it('【数据预设】日期对象 + YYYY-MM-DD 格式 → 【预期结果】返回格式化日期字符串', () => {
      const date = new Date(2024, 0, 15, 10, 30, 0);
      const result = formatDate(date, 'YYYY-MM-DD');
      expect(result).toBe('2024-01-15');
    });

    it('【数据预设】ISO 日期字符串 + YYYY-MM-DD 格式 → 【预期结果】返回格式化日期字符串', () => {
      const result = formatDate('2024-06-18T12:00:00Z', 'YYYY-MM-DD');
      expect(result).toBe('2024-06-18');
    });

    it('【数据预设】日期对象 + full 格式 → 【预期结果】返回完整日期时间字符串', () => {
      const date = new Date(2024, 0, 15, 10, 30, 0);
      const result = formatDate(date, 'full');
      expect(result).toBe('2024-01-15 10:30');
    });

    it('【数据预设】相对时间格式 - 刚刚 → 【预期结果】返回"刚刚"', () => {
      const now = new Date();
      const result = formatDate(now, 'relative');
      expect(result).toBe('刚刚');
    });

    it('【数据预设】相对时间格式 - 30分钟前 → 【预期结果】返回"30分钟前"', () => {
      const date = new Date(Date.now() - 30 * 60 * 1000);
      const result = formatDate(date, 'relative');
      expect(result).toBe('30分钟前');
    });

    it('【数据预设】相对时间格式 - 5小时前 → 【预期结果】返回"5小时前"', () => {
      const date = new Date(Date.now() - 5 * 60 * 60 * 1000);
      const result = formatDate(date, 'relative');
      expect(result).toBe('5小时前');
    });

    it('【数据预设】相对时间格式 - 3天前 → 【预期结果】返回"3天前"', () => {
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = formatDate(date, 'relative');
      expect(result).toBe('3天前');
    });

    it('【数据预设】相对时间格式 - 超过7天 → 【预期结果】返回YYYY-MM-DD格式', () => {
      const date = new Date(2024, 0, 1);
      const result = formatDate(date, 'relative');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('【数据预设】默认格式参数 → 【预期结果】使用 YYYY-MM-DD 格式', () => {
      const date = new Date(2024, 5, 20);
      const result = formatDate(date);
      expect(result).toBe('2024-06-20');
    });
  });

  describe('getTodayString', () => {
    it('【数据预设】无参数 → 【预期结果】返回今天的 YYYY-MM-DD 格式日期', () => {
      const mockDate = new Date(2024, 5, 18);
      vi.setSystemTime(mockDate);
      const result = getTodayString();
      expect(result).toBe('2024-06-18');
      vi.useRealTimers();
    });
  });

  describe('calculateFreshness', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 5, 18, 12, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('【数据预设】购买于今天前10天，保质期7天 → 【预期结果】状态为 expired，剩余天数为 -3', () => {
      const result = calculateFreshness('2024-06-08', 7);
      expect(result.status).toBe('expired');
      expect(result.remainingDays).toBe(-3);
      expect(result.expireDate).toBe('2024-06-15');
    });

    it('【数据预设】购买于今天前6天，保质期7天 → 【预期结果】状态为 expired，剩余天数为 0', () => {
      const result = calculateFreshness('2024-06-11', 7);
      expect(result.status).toBe('expired');
      expect(result.remainingDays).toBe(0);
      expect(result.expireDate).toBe('2024-06-18');
    });

    it('【数据预设】购买于今天前5天，保质期7天 → 【预期结果】状态为 expiring，剩余天数为 2', () => {
      const result = calculateFreshness('2024-06-13', 7);
      expect(result.status).toBe('expiring');
      expect(result.remainingDays).toBe(2);
      expect(result.expireDate).toBe('2024-06-20');
    });

    it('【数据预设】购买于今天前4天，保质期7天 → 【预期结果】状态为 fresh，剩余天数为 3', () => {
      const result = calculateFreshness('2024-06-14', 7);
      expect(result.status).toBe('fresh');
      expect(result.remainingDays).toBe(3);
      expect(result.expireDate).toBe('2024-06-21');
    });

    it('【数据预设】购买于今天前1天，保质期7天 → 【预期结果】状态为 fresh，剩余天数为 6', () => {
      const result = calculateFreshness('2024-06-17', 7);
      expect(result.status).toBe('fresh');
      expect(result.remainingDays).toBe(6);
      expect(result.expireDate).toBe('2024-06-24');
    });

    it('【数据预设】购买于今天，保质期30天 → 【预期结果】状态为 fresh，剩余天数为 30', () => {
      const result = calculateFreshness('2024-06-18', 30);
      expect(result.status).toBe('fresh');
      expect(result.remainingDays).toBe(30);
      expect(result.expireDate).toBe('2024-07-18');
    });

    it('【数据预设】购买于昨天，保质期3天 → 【预期结果】状态为 expiring，剩余天数为 2', () => {
      const result = calculateFreshness('2024-06-17', 3);
      expect(result.status).toBe('expiring');
      expect(result.remainingDays).toBe(2);
    });
  });

  describe('addDays', () => {
    it('【数据预设】2024-01-15 + 5天 → 【预期结果】2024-01-20', () => {
      const result = addDays('2024-01-15', 5);
      expect(result).toBe('2024-01-20');
    });

    it('【数据预设】2024-01-31 + 1天 → 【预期结果】2024-02-01（跨月）', () => {
      const result = addDays('2024-01-31', 1);
      expect(result).toBe('2024-02-01');
    });

    it('【数据预设】2024-02-28 + 2天（闰年） → 【预期结果】2024-03-01', () => {
      const result = addDays('2024-02-28', 2);
      expect(result).toBe('2024-03-01');
    });

    it('【数据预设】2024-12-31 + 1天 → 【预期结果】2025-01-01（跨年）', () => {
      const result = addDays('2024-12-31', 1);
      expect(result).toBe('2025-01-01');
    });

    it('【数据预设】2024-01-15 + (-3)天 → 【预期结果】2024-01-12（负数天数）', () => {
      const result = addDays('2024-01-15', -3);
      expect(result).toBe('2024-01-12');
    });

    it('【数据预设】2024-01-15 + 0天 → 【预期结果】2024-01-15', () => {
      const result = addDays('2024-01-15', 0);
      expect(result).toBe('2024-01-15');
    });
  });
});
