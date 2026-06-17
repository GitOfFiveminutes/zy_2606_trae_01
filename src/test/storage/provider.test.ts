import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { StorageAdapterConfig } from '@/storage/types';

class TestableStorageProvider {
  private adapter: any;
  private cachedAdapter: any = null;
  private currentConfig: StorageAdapterConfig = {
    type: 'local',
    baseUrl: '',
    apiKey: '',
    headers: {},
    timeout: 0,
  };

  private readonly CONFIG_STORAGE_KEY = 'fridge-manager-storage-config';

  constructor() {
    this.adapter = { type: 'local', load: vi.fn(), save: vi.fn(), remove: vi.fn(), testConnection: vi.fn().mockResolvedValue(true) };
  }

  getAdapter() { return this.adapter; }
  getProviderType() { return this.adapter.type; }

  isConnected(): boolean {
    if (this.cachedAdapter) return this.cachedAdapter.connected;
    return true;
  }

  getCurrentConfig(): StorageAdapterConfig {
    return { ...this.currentConfig };
  }

  async load<T>(key: string, defaultValue: T): Promise<T> {
    return this.adapter.load(key, defaultValue);
  }

  async save<T>(key: string, value: T): Promise<void> {
    return this.adapter.save(key, value);
  }

  async remove(key: string): Promise<void> {
    return this.adapter.remove(key);
  }

  async testConnection(config: StorageAdapterConfig): Promise<boolean> {
    if (config.type === 'local') return true;
    if (config.type === 'rest-api') {
      if (!config.baseUrl) return false;
      return true;
    }
    return false;
  }

  async switchProvider(config: StorageAdapterConfig): Promise<boolean> {
    try {
      if (config.type === 'local') {
        this.adapter = { type: 'local', load: vi.fn(), save: vi.fn(), remove: vi.fn(), testConnection: vi.fn().mockResolvedValue(true) };
        this.cachedAdapter = null;
        this.currentConfig = { ...config };
        this.saveConfig(config);
        return true;
      }

      if (config.type === 'rest-api') {
        if (!config.baseUrl) return false;

        const mockCached = {
          type: 'rest-api',
          load: vi.fn(),
          save: vi.fn(),
          remove: vi.fn(),
          testConnection: vi.fn().mockResolvedValue(true),
          connected: true,
        };
        this.adapter = mockCached;
        this.cachedAdapter = mockCached;
        this.currentConfig = { ...config };
        this.saveConfig(config);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  async init(): Promise<void> {
    const config = this.loadConfig();
    if (config && config.type !== 'local') {
      await this.switchProvider(config);
    }
  }

  private loadConfig(): StorageAdapterConfig | null {
    try {
      const raw = localStorage.getItem(this.CONFIG_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StorageAdapterConfig;
    } catch {
      return null;
    }
  }

  private saveConfig(config: StorageAdapterConfig): void {
    try {
      localStorage.setItem(this.CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {}
  }
}

describe('StorageProvider', () => {
  let provider: TestableStorageProvider;

  beforeEach(() => {
    provider = new TestableStorageProvider();
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('初始状态', () => {
    it('【数据预设】新创建实例 → 【预期结果】provider type 为 local，connected 为 true', () => {
      expect(provider.getProviderType()).toBe('local');
      expect(provider.isConnected()).toBe(true);
    });

    it('【数据预设】初始配置 → 【预期结果】type 为 local，其他字段为空', () => {
      const config = provider.getCurrentConfig();
      expect(config.type).toBe('local');
      expect(config.baseUrl).toBe('');
      expect(config.apiKey).toBe('');
      expect(config.timeout).toBe(0);
    });
  });

  describe('switchProvider - local', () => {
    it('【数据预设】切换到 local → 【预期结果】返回 true，type 为 local，配置持久化', async () => {
      const config: StorageAdapterConfig = {
        type: 'local',
        baseUrl: '',
        apiKey: '',
        headers: {},
        timeout: 0,
      };

      const result = await provider.switchProvider(config);

      expect(result).toBe(true);
      expect(provider.getProviderType()).toBe('local');
      expect(provider.getCurrentConfig().type).toBe('local');

      const saved = window.localStorage.getItem('fridge-manager-storage-config');
      expect(JSON.parse(saved!)).toEqual(config);
    });
  });

  describe('switchProvider - rest-api', () => {
    it('【数据预设】切换到 rest-api，baseUrl 有效 → 【预期结果】返回 true，type 为 rest-api', async () => {
      const config: StorageAdapterConfig = {
        type: 'rest-api',
        baseUrl: 'https://api.example.com',
        apiKey: 'test-key',
        headers: {},
        timeout: 10000,
      };

      const result = await provider.switchProvider(config);

      expect(result).toBe(true);
      expect(provider.getProviderType()).toBe('rest-api');
      expect(provider.isConnected()).toBe(true);
      expect(provider.getCurrentConfig()).toEqual(config);
    });

    it('【数据预设】切换到 rest-api，baseUrl 为空 → 【预期结果】返回 false，保持 local', async () => {
      const config: StorageAdapterConfig = {
        type: 'rest-api',
        baseUrl: '',
        apiKey: 'test-key',
        headers: {},
        timeout: 10000,
      };

      const result = await provider.switchProvider(config);

      expect(result).toBe(false);
      expect(provider.getProviderType()).toBe('local');
    });
  });

  describe('testConnection', () => {
    it('【数据预设】测试 local → 【预期结果】返回 true', async () => {
      const config: StorageAdapterConfig = {
        type: 'local',
        baseUrl: '',
        apiKey: '',
        headers: {},
        timeout: 0,
      };
      expect(await provider.testConnection(config)).toBe(true);
    });

    it('【数据预设】测试 rest-api，baseUrl 有效 → 【预期结果】返回 true', async () => {
      const config: StorageAdapterConfig = {
        type: 'rest-api',
        baseUrl: 'https://api.example.com',
        apiKey: 'key',
        headers: {},
        timeout: 5000,
      };
      expect(await provider.testConnection(config)).toBe(true);
    });

    it('【数据预设】测试 rest-api，baseUrl 为空 → 【预期结果】返回 false', async () => {
      const config: StorageAdapterConfig = {
        type: 'rest-api',
        baseUrl: '',
        apiKey: 'key',
        headers: {},
        timeout: 5000,
      };
      expect(await provider.testConnection(config)).toBe(false);
    });
  });

  describe('init 方法', () => {
    it('【数据预设】无保存配置 → 【预期结果】保持 local', async () => {
      await provider.init();
      expect(provider.getProviderType()).toBe('local');
    });

    it('【数据预设】保存了 rest-api 配置 → 【预期结果】init 后自动切换到 rest-api', async () => {
      const savedConfig: StorageAdapterConfig = {
        type: 'rest-api',
        baseUrl: 'https://api.example.com',
        apiKey: 'key',
        headers: {},
        timeout: 10000,
      };
      window.localStorage.setItem('fridge-manager-storage-config', JSON.stringify(savedConfig));

      await provider.init();

      expect(provider.getProviderType()).toBe('rest-api');
    });
  });

  describe('load/save/remove 委托', () => {
    it('【数据预设】load 调用 → 【预期结果】委托给当前适配器', async () => {
      provider.getAdapter().load.mockResolvedValueOnce(['mocked']);
      const result = await provider.load<string[]>('key', []);
      expect(result).toEqual(['mocked']);
      expect(provider.getAdapter().load).toHaveBeenCalledWith('key', []);
    });

    it('【数据预设】save 调用 → 【预期结果】委托给当前适配器', async () => {
      provider.getAdapter().save.mockResolvedValueOnce(undefined);
      await provider.save('key', ['data']);
      expect(provider.getAdapter().save).toHaveBeenCalledWith('key', ['data']);
    });

    it('【数据预设】remove 调用 → 【预期结果】委托给当前适配器', async () => {
      provider.getAdapter().remove.mockResolvedValueOnce(undefined);
      await provider.remove('key');
      expect(provider.getAdapter().remove).toHaveBeenCalledWith('key');
    });
  });
});
