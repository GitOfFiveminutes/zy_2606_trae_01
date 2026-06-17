import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '@/hooks/useTheme';

describe('useTheme Hook', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = '';
    vi.clearAllMocks();
  });

  it('【数据预设】无保存主题，系统非暗色 → 【预期结果】初始为 light，isDark=false', () => {
    (window.matchMedia as any).mockReturnValue({ matches: false });
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('【数据预设】无保存主题，系统偏好暗色 → 【预期结果】初始为 dark，isDark=true', () => {
    (window.matchMedia as any).mockReturnValue({ matches: true });
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('【数据预设】localStorage 已保存 "dark" → 【预期结果】初始为 dark', () => {
    window.localStorage.setItem('theme', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('【数据预设】localStorage 已保存 "light" → 【预期结果】初始为 light', () => {
    window.localStorage.setItem('theme', 'light');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('【数据预设】初始为 light，调用 toggleTheme → 【预期结果】切换为 dark', () => {
    (window.matchMedia as any).mockReturnValue({ matches: false });
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('【数据预设】初始为 dark，调用 toggleTheme → 【预期结果】切换为 light', () => {
    window.localStorage.setItem('theme', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('【数据预设】切换主题 → 【预期结果】documentElement class 同步更新', () => {
    (window.matchMedia as any).mockReturnValue({ matches: false });
    const { result } = renderHook(() => useTheme());

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => {
      result.current.toggleTheme();
    });

    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('【数据预设】切换主题 → 【预期结果】localStorage 同步更新', () => {
    (window.matchMedia as any).mockReturnValue({ matches: false });
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(window.localStorage.getItem('theme')).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });

    expect(window.localStorage.getItem('theme')).toBe('light');
  });

  it('【数据预设】连续切换3次 → 【预期结果】最终为 dark，状态稳定', () => {
    (window.matchMedia as any).mockReturnValue({ matches: false });
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleTheme()); // light -> dark
    act(() => result.current.toggleTheme()); // dark -> light
    act(() => result.current.toggleTheme()); // light -> dark

    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(window.localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
