import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFreshness } from '@/hooks/useFreshness';

describe('useFreshness Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 18, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('【数据预设】购买于2024-06-17，保质期7天 → 【预期结果】fresh，剩余6天，过期2024-06-24', () => {
    const { result } = renderHook(() => useFreshness('2024-06-17', 7));
    expect(result.current.status).toBe('fresh');
    expect(result.current.remainingDays).toBe(6);
    expect(result.current.expireDate).toBe('2024-06-24');
  });

  it('【数据预设】购买于2024-06-16，保质期3天 → 【预期结果】expiring，剩余1天', () => {
    const { result } = renderHook(() => useFreshness('2024-06-16', 3));
    expect(result.current.status).toBe('expiring');
    expect(result.current.remainingDays).toBe(1);
  });

  it('【数据预设】购买于2024-06-10，保质期7天 → 【预期结果】expired，剩余1天前过期（-1）', () => {
    const { result } = renderHook(() => useFreshness('2024-06-10', 7));
    expect(result.current.status).toBe('expired');
    expect(result.current.remainingDays).toBe(-1);
  });

  it('【数据预设】购买于2024-06-18，保质期30天 → 【预期结果】fresh，剩余30天', () => {
    const { result } = renderHook(() => useFreshness('2024-06-18', 30));
    expect(result.current.status).toBe('fresh');
    expect(result.current.remainingDays).toBe(30);
    expect(result.current.expireDate).toBe('2024-07-18');
  });

  it('【数据预设】购买于2024-06-16，保质期4天 → 【预期结果】expiring，剩余2天', () => {
    const { result } = renderHook(() => useFreshness('2024-06-16', 4));
    expect(result.current.status).toBe('expiring');
    expect(result.current.remainingDays).toBe(2);
  });

  it('【数据预设】相同输入重复调用 → 【预期结果】使用 useMemo 缓存，结果一致', () => {
    const { result: r1, rerender } = renderHook(
      ({ date, days }) => useFreshness(date, days),
      { initialProps: { date: '2024-06-17', days: 7 } }
    );
    const firstResult = r1.current;
    rerender({ date: '2024-06-17', days: 7 });
    expect(r1.current).toBe(firstResult);
  });

  it('【数据预设】输入参数变化 → 【预期结果】结果重新计算', () => {
    const { result, rerender } = renderHook(
      ({ date, days }) => useFreshness(date, days),
      { initialProps: { date: '2024-06-17', days: 7 } }
    );
    expect(result.current.status).toBe('fresh');
    expect(result.current.remainingDays).toBe(6);

    rerender({ date: '2024-06-10', days: 7 });
    expect(result.current.status).toBe('expired');
    expect(result.current.remainingDays).toBe(-1);
  });
});
