import { Wifi, WifiOff, CloudOff, HardDrive } from 'lucide-react';
import { useAppStore } from '@/store';

export function SyncIndicator() {
  const { syncStatus } = useAppStore();

  if (syncStatus.provider === 'local' && syncStatus.connected) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <HardDrive size={14} />
        <span className="hidden sm:inline">本地</span>
      </div>
    );
  }

  if (syncStatus.connected) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-success-600">
        <Wifi size={14} />
        <span className="hidden sm:inline">已同步</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-warning-600" title={syncStatus.error ?? '使用本地缓存'}>
      <CloudOff size={14} />
      <span className="hidden sm:inline">离线</span>
    </div>
  );
}
