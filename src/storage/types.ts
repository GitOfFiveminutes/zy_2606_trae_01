export type StorageProviderType = 'local' | 'rest-api';

export interface StorageAdapterConfig {
  type: StorageProviderType;
  baseUrl: string;
  apiKey: string;
  headers: Record<string, string>;
  timeout: number;
}

export interface StorageAdapter {
  readonly type: StorageProviderType;
  load<T>(key: string, defaultValue: T): Promise<T>;
  save<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  testConnection?(): Promise<boolean>;
}

export interface StorageSyncStatus {
  loading: boolean;
  syncing: boolean;
  error: string | null;
  lastSyncAt: string | null;
  provider: StorageProviderType;
  connected: boolean;
}

export const DEFAULT_REST_CONFIG: StorageAdapterConfig = {
  type: 'rest-api',
  baseUrl: '',
  apiKey: '',
  headers: {},
  timeout: 10000,
};
