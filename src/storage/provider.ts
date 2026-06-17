import type { StorageAdapter, StorageAdapterConfig, StorageProviderType } from './types';
import { DEFAULT_REST_CONFIG } from './types';
import { LocalStorageAdapter } from './local-adapter';
import { RestApiAdapter } from './rest-adapter';
import { CachedStorageAdapter } from './cached-adapter';

const CONFIG_STORAGE_KEY = 'fridge-manager-storage-config';

class StorageProvider {
  private adapter: StorageAdapter;
  private cachedAdapter: CachedStorageAdapter | null = null;

  constructor() {
    this.adapter = new LocalStorageAdapter();
  }

  getAdapter(): StorageAdapter {
    return this.adapter;
  }

  getProviderType(): StorageProviderType {
    return this.adapter.type;
  }

  isConnected(): boolean {
    if (this.cachedAdapter) return this.cachedAdapter.connected;
    return true;
  }

  async init(): Promise<void> {
    const config = this.loadConfig();
    if (config && config.type !== 'local') {
      await this.switchProvider(config);
    }
  }

  async switchProvider(config: StorageAdapterConfig): Promise<boolean> {
    try {
      if (config.type === 'local') {
        this.adapter = new LocalStorageAdapter();
        this.cachedAdapter = null;
        this.saveConfig(config);
        return true;
      }

      if (config.type === 'rest-api') {
        if (!config.baseUrl) {
          console.warn('[StorageProvider] REST API 需要配置 baseUrl');
          return false;
        }

        const restAdapter = new RestApiAdapter(config);
        const cached = new CachedStorageAdapter(restAdapter);
        const testResult = await cached.testConnection();

        if (!testResult) {
          console.warn('[StorageProvider] REST API 连接测试失败，仍将启用（使用缓存降级）');
        }

        this.adapter = cached;
        this.cachedAdapter = cached;
        this.saveConfig(config);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[StorageProvider] 切换存储方案失败:', error);
      return false;
    }
  }

  async testConnection(config: StorageAdapterConfig): Promise<boolean> {
    if (config.type === 'local') {
      const local = new LocalStorageAdapter();
      return local.testConnection ? await local.testConnection() : true;
    }

    if (config.type === 'rest-api') {
      if (!config.baseUrl) return false;
      const restAdapter = new RestApiAdapter(config);
      return restAdapter.testConnection ? await restAdapter.testConnection() : false;
    }

    return false;
  }

  getCurrentConfig(): StorageAdapterConfig {
    if (this.adapter.type === 'local') {
      return { type: 'local', baseUrl: '', apiKey: '', headers: {}, timeout: 0 };
    }

    if (this.adapter.type === 'rest-api' && this.cachedAdapter) {
      const remote = this.cachedAdapter.getAdapter();
      if (remote instanceof RestApiAdapter) {
        return remote.getConfig();
      }
    }

    return { ...DEFAULT_REST_CONFIG };
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

  private loadConfig(): StorageAdapterConfig | null {
    try {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StorageAdapterConfig;
    } catch {
      return null;
    }
  }

  private saveConfig(config: StorageAdapterConfig): void {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn('[StorageProvider] 保存配置失败:', error);
    }
  }
}

export const storageProvider = new StorageProvider();
