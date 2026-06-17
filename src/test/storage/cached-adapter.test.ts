import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CachedStorageAdapter } from '@/storage/cached-adapter';
import type { StorageAdapter, StorageProviderType } from '@/storage/types';

class MockRemoteAdapter implements StorageAdapter {
  type: StorageProviderType = 'rest-api';
  private store: Record<string, string> = {};
  shouldFail: boolean = false;
  failCount: number = 0;

  async load<T>(key: string, defaultValue: T): Promise<T> {
    if (this.shouldFail && this.failCount++ >= 0) {
      throw new Error('Remote connection failed');
    }
    const raw = this.store[key];
    if (raw === undefined) return defaultValue;
    return JSON.parse(raw) as T;
  }

  async save<T>(key: string, value: T): Promise<void> {
    if (this.shouldFail && this.failCount++ >= 0) {
      throw new Error('Remote connection failed');
    }
    this.store[key] = JSON.stringify(value);
  }

  async remove(key: string): Promise<void> {
    if (this.shouldFail && this.failCount++ >= 0) {
      throw new Error('Remote connection failed');
    }
    delete this.store[key];
  }

  async testConnection(): Promise<boolean> {
    return !this.shouldFail;
  }
}

describe('CachedStorageAdapter', () => {
  let remote: MockRemoteAdapter;
  let adapter: CachedStorageAdapter;

  beforeEach(() => {
    remote = new MockRemoteAdapter();
    adapter = new CachedStorageAdapter(remote);
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  describe('type 属性', () => {
    it('【数据预设】使用 rest-api 远程适配器 → 【预期结果】type 为 "rest-api"', () => {
      expect(adapter.type).toBe('rest-api');
    });
  });

  describe('connected 属性', () => {
    it('【数据预设】初始状态 → 【预期结果】connected 为 false', () => {
      expect(adapter.connected).toBe(false);
    });
  });

  describe('load 方法 - 远程正常', () => {
    it('【数据预设】远程有数据 → 【预期结果】返回远程数据，connected=true，本地缓存同步', async () => {
      await remote.save('foods', ['remote-apple']);

      const result = await adapter.load<string[]>('foods', []);

      expect(result).toEqual(['remote-apple']);
      expect(adapter.connected).toBe(true);

      const localRaw = window.localStorage.getItem('fridge-manager-foods');
      expect(JSON.parse(localRaw!)).toEqual(['remote-apple']);
    });

    it('【数据预设】远程无数据 → 【预期结果】返回默认值，connected=true', async () => {
      const result = await adapter.load<string[]>('nonexistent', ['default']);
      expect(result).toEqual(['default']);
      expect(adapter.connected).toBe(true);
    });
  });

  describe('load 方法 - 远程失败降级', () => {
    it('【数据预设】远程失败，本地有缓存 → 【预期结果】返回本地缓存，connected=false', async () => {
      window.localStorage.setItem('fridge-manager-foods', JSON.stringify(['local-cache']));
      remote.shouldFail = true;

      const result = await adapter.load<string[]>('foods', []);

      expect(result).toEqual(['local-cache']);
      expect(adapter.connected).toBe(false);
    });

    it('【数据预设】远程失败，本地无缓存 → 【预期结果】返回默认值，connected=false', async () => {
      remote.shouldFail = true;

      const result = await adapter.load<string[]>('nonexistent', ['fallback']);

      expect(result).toEqual(['fallback']);
      expect(adapter.connected).toBe(false);
    });
  });

  describe('save 方法 - 远程正常', () => {
    it('【数据预设】远程正常，保存数据 → 【预期结果】远程和本地均有数据，connected=true', async () => {
      await adapter.save('foods', ['apple', 'banana']);

      expect(adapter.connected).toBe(true);

      const remoteData = await remote.load<string[]>('foods', []);
      expect(remoteData).toEqual(['apple', 'banana']);

      const localRaw = window.localStorage.getItem('fridge-manager-foods');
      expect(JSON.parse(localRaw!)).toEqual(['apple', 'banana']);
    });
  });

  describe('save 方法 - 远程失败', () => {
    it('【数据预设】远程失败，保存数据 → 【预期结果】仅本地有数据，connected=false', async () => {
      remote.shouldFail = true;

      await adapter.save('foods', ['apple']);

      expect(adapter.connected).toBe(false);

      const localRaw = window.localStorage.getItem('fridge-manager-foods');
      expect(JSON.parse(localRaw!)).toEqual(['apple']);

      remote.shouldFail = false;
      const remoteData = await remote.load<string[]>('foods', []);
      expect(remoteData).toEqual([]);
    });
  });

  describe('remove 方法 - 远程正常', () => {
    it('【数据预设】远程正常，删除数据 → 【预期结果】远程和本地均被删除，connected=true', async () => {
      await adapter.save('to-remove', 'value');

      await adapter.remove('to-remove');

      expect(adapter.connected).toBe(true);
      expect(window.localStorage.getItem('fridge-manager-to-remove')).toBeNull();
      expect(await remote.load<string>('to-remove', 'default')).toBe('default');
    });
  });

  describe('remove 方法 - 远程失败', () => {
    it('【数据预设】远程失败，删除数据 → 【预期结果】仅本地被删除，connected=false', async () => {
      await remote.save('to-remove', 'remote-value');
      window.localStorage.setItem('fridge-manager-to-remove', JSON.stringify('local-value'));

      remote.shouldFail = true;
      await adapter.remove('to-remove');

      expect(adapter.connected).toBe(false);
      expect(window.localStorage.getItem('fridge-manager-to-remove')).toBeNull();

      remote.shouldFail = false;
      const stillExists = await remote.load<string>('to-remove', '');
      expect(stillExists).toBe('remote-value');
    });
  });

  describe('testConnection 方法', () => {
    it('【数据预设】远程正常 → 【预期结果】返回 true，connected=true', async () => {
      const result = await adapter.testConnection();
      expect(result).toBe(true);
      expect(adapter.connected).toBe(true);
    });

    it('【数据预设】远程异常 → 【预期结果】返回 false，connected=false', async () => {
      remote.shouldFail = true;
      const result = await adapter.testConnection();
      expect(result).toBe(false);
      expect(adapter.connected).toBe(false);
    });
  });

  describe('setRemoteAdapter 方法', () => {
    it('【数据预设】切换远程适配器 → 【预期结果】后续请求走新适配器', async () => {
      const newRemote = new MockRemoteAdapter();
      await newRemote.save('key', 'new-value');

      adapter.setRemoteAdapter(newRemote);
      const result = await adapter.load<string>('key', '');
      expect(result).toBe('new-value');
    });
  });
});
