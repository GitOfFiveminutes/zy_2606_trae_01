import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('lib/utils - cn 函数', () => {
  it('【数据预设】单个字符串类名 → 【预期结果】返回原样', () => {
    const result = cn('text-red-500');
    expect(result).toBe('text-red-500');
  });

  it('【数据预设】多个字符串类名 → 【预期结果】用空格连接', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('【数据预设】包含 undefined 值 → 【预期结果】忽略 undefined', () => {
    const result = cn('text-red-500', undefined, 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('【数据预设】包含 null 值 → 【预期结果】忽略 null', () => {
    const result = cn('text-red-500', null, 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('【数据预设】包含 false 值 → 【预期结果】忽略 false', () => {
    const result = cn('text-red-500', false, 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('【数据预设】包含对象条件类名 { active: true } → 【预期结果】包含 active', () => {
    const result = cn('base', { active: true });
    expect(result).toBe('base active');
  });

  it('【数据预设】包含对象条件类名 { active: false } → 【预期结果】不包含 active', () => {
    const result = cn('base', { active: false });
    expect(result).toBe('base');
  });

  it('【数据预设】包含多个条件类名 → 【预期结果】仅包含条件为 true 的', () => {
    const result = cn('base', { 'text-red': true, 'text-blue': false, 'font-bold': true });
    expect(result).toBe('base text-red font-bold');
  });

  it('【数据预设】包含数组类名 → 【预期结果】展开数组', () => {
    const result = cn('base', ['nested-1', 'nested-2']);
    expect(result).toBe('base nested-1 nested-2');
  });

  it('【数据预设】混合类型输入 → 【预期结果】正确合并所有有效类名', () => {
    const result = cn(
      'base',
      undefined,
      null,
      false,
      { 'cond-true': true, 'cond-false': false },
      ['arr-1', 'arr-2'],
      'final'
    );
    expect(result).toBe('base cond-true arr-1 arr-2 final');
  });

  it('【数据预设】冲突的 Tailwind 类（p-4 和 p-2） → 【预期结果】保留后面的 p-2', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('【数据预设】冲突的 text 颜色类 → 【预期结果】保留后面的颜色', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('【数据预设】空参数 → 【预期结果】返回空字符串', () => {
    const result = cn();
    expect(result).toBe('');
  });
});
