import { useState, useEffect } from 'react';
import { Database, Globe, HardDrive, Key, Wifi, WifiOff, Loader2, CheckCircle2, XCircle, Save } from 'lucide-react';
import type { StorageAdapterConfig, StorageProviderType } from '@/storage';
import { DEFAULT_REST_CONFIG } from '@/storage';
import { useAppStore } from '@/store';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

export function StorageSettings() {
  const {
    storageSettingsOpen,
    toggleStorageSettings,
    switchStorageProvider,
    testStorageConnection,
    getStorageConfig,
    syncStatus,
  } = useAppStore();

  const currentConfig = getStorageConfig();
  const [selectedType, setSelectedType] = useState<StorageProviderType>(currentConfig.type);
  const [baseUrl, setBaseUrl] = useState(currentConfig.baseUrl);
  const [apiKey, setApiKey] = useState(currentConfig.apiKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (storageSettingsOpen) {
      const config = getStorageConfig();
      setSelectedType(config.type);
      setBaseUrl(config.baseUrl);
      setApiKey(config.apiKey);
      setTestResult(null);
    }
  }, [storageSettingsOpen]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    const config = buildConfig();
    const result = await testStorageConnection(config);
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const config = buildConfig();
    await switchStorageProvider(config);
    setSaving(false);
    toggleStorageSettings(false);
  };

  const buildConfig = (): StorageAdapterConfig => {
    if (selectedType === 'local') {
      return { type: 'local', baseUrl: '', apiKey: '', headers: {}, timeout: 0 };
    }
    return {
      type: 'rest-api',
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      headers: {},
      timeout: 10000,
    };
  };

  const canSave = () => {
    if (selectedType === 'local') return true;
    return baseUrl.trim().length > 0;
  };

  const providerOptions: { type: StorageProviderType; icon: React.ReactNode; label: string; desc: string }[] = [
    {
      type: 'local',
      icon: <HardDrive size={24} />,
      label: '本地存储',
      desc: '数据保存在浏览器中，无需服务端',
    },
    {
      type: 'rest-api',
      icon: <Globe size={24} />,
      label: 'REST API',
      desc: '通过 HTTP 请求连接远程服务',
    },
  ];

  return (
    <Modal
      open={storageSettingsOpen}
      onClose={() => toggleStorageSettings(false)}
      title="存储设置"
      size="lg"
    >
      <div className="space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <Database size={16} className="text-brand-500" />
            存储方案
          </label>
          <div className="grid grid-cols-2 gap-3">
            {providerOptions.map(opt => (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  setSelectedType(opt.type);
                  setTestResult(null);
                }}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  selectedType === opt.type
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  selectedType === opt.type ? 'bg-brand-100' : 'bg-gray-100'
                }`}>
                  {opt.icon}
                </div>
                <span className="text-sm font-bold">{opt.label}</span>
                <span className="text-[11px] text-gray-500 text-center leading-tight">{opt.desc}</span>
                {selectedType === opt.type && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedType === 'rest-api' && (
          <>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Globe size={16} className="text-brand-500" />
                API 地址
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => {
                  setBaseUrl(e.target.value);
                  setTestResult(null);
                }}
                placeholder="https://your-api.example.com"
                className="input-base"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                接口需支持 GET/PUT/DELETE /data/:key 路由
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Key size={16} className="text-brand-500" />
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder="输入你的 API Key"
                className="input-base"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                将通过 X-API-Key 请求头发送进行授权校验
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !baseUrl.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Wifi size={16} />
                )}
                {testing ? '测试中...' : '测试连接'}
              </button>

              {testResult === true && (
                <div className="mt-2 flex items-center gap-2 text-xs text-success-600 bg-success-50 rounded-xl px-3 py-2">
                  <CheckCircle2 size={14} />
                  连接成功！授权校验通过
                </div>
              )}

              {testResult === false && (
                <div className="mt-2 flex items-center gap-2 text-xs text-danger-600 bg-danger-50 rounded-xl px-3 py-2">
                  <XCircle size={14} />
                  连接失败，请检查地址和 API Key
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <div className="flex-1 flex items-center gap-2 text-xs text-gray-400">
            {syncStatus.connected ? (
              <>
                <Wifi size={12} className="text-success-500" />
                <span>已连接 · {syncStatus.provider === 'local' ? '本地' : '远程'}</span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-danger-500" />
                <span>未连接 · 使用本地缓存</span>
              </>
            )}
            {syncStatus.error && (
              <span className="text-danger-500 ml-1">({syncStatus.error})</span>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => toggleStorageSettings(false)}
          >
            取消
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            onClick={handleSave}
            disabled={saving || !canSave()}
          >
            {saving ? '切换中...' : '应用'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
