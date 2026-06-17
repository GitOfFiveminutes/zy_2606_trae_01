import type { StorageAdapter, StorageProviderType } from './types';
import { LocalStorageAdapter } from './local-adapter';

export class CachedStorageAdapter implements StorageAdapter {
  readonly type: StorageProviderType;
  private remote: StorageAdapter;
  private local: LocalStorageAdapter;
  private _connected: boolean = false;

  constructor(remote: StorageAdapter) {
    this.remote = remote;
    this.type = remote.type;
    this.local = new LocalStorageAdapter();
  }

  get connected(): boolean {
    return this._connected;
  }

  setRemoteAdapter(remote: StorageAdapter): void {
    this.remote = remote;
  }

  async load<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const remoteData = await this.remote.load<T>(key, defaultValue);
      await this.local.save(key, remoteData);
      this._connected = true;
      return remoteData;
    } catch (error) {
      this._connected = false;
      console.warn(`[CachedStorage] 远程加载失败，降级到本地缓存: ${key}`, error);
      return this.local.load<T>(key, defaultValue);
    }
  }

  async save<T>(key: string, value: T): Promise<void> {
    await this.local.save(key, value);
    try {
      await this.remote.save(key, value);
      this._connected = true;
    } catch (error) {
      this._connected = false;
      console.warn(`[CachedStorage] 远程保存失败，数据仅保存在本地: ${key}`, error);
    }
  }

  async remove(key: string): Promise<void> {
    await this.local.remove(key);
    try {
      await this.remote.remove(key);
      this._connected = true;
    } catch (error) {
      this._connected = false;
      console.warn(`[CachedStorage] 远程删除失败: ${key}`, error);
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.remote.testConnection) return false;
    const result = await this.remote.testConnection();
    this._connected = result;
    return result;
  }
}
