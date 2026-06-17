import type { StorageAdapter, StorageAdapterConfig } from './types';

export class RestApiAdapter implements StorageAdapter {
  readonly type = 'rest-api' as const;
  private config: StorageAdapterConfig;

  constructor(config: StorageAdapterConfig) {
    this.config = config;
  }

  updateConfig(config: StorageAdapterConfig): void {
    this.config = config;
  }

  getConfig(): StorageAdapterConfig {
    return { ...this.config };
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };

    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }

    return headers;
  }

  private buildUrl(key: string): string {
    const base = this.config.baseUrl.replace(/\/+$/, '');
    return `${base}/data/${encodeURIComponent(key)}`;
  }

  private async request<T>(
    method: string,
    key: string,
    body?: unknown
  ): Promise<T | null> {
    const url = this.buildUrl(key);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const options: RequestInit = {
        method,
        headers: this.buildHeaders(),
        signal: controller.signal,
      };

      if (body !== undefined) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (response.status === 404) {
        return null;
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error('授权校验失败，请检查 API Key 是否正确');
      }

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      if (!text) return null;
      return JSON.parse(text) as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`请求超时 (${this.config.timeout}ms)`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async load<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const result = await this.request<{ data: T }>('GET', key);
      if (result === null) return defaultValue;
      return result.data ?? defaultValue;
    } catch (error) {
      console.warn(`[RestApi] 读取失败: ${key}`, error);
      throw error;
    }
  }

  async save<T>(key: string, value: T): Promise<void> {
    try {
      await this.request('PUT', key, { data: value });
    } catch (error) {
      console.warn(`[RestApi] 写入失败: ${key}`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.request('DELETE', key);
    } catch (error) {
      console.warn(`[RestApi] 删除失败: ${key}`, error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl.replace(/\/+$/, '')}/health`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}
