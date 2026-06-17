import { useState, useRef, useEffect } from 'react';
import { Plus, History, ChevronDown, UserPlus } from 'lucide-react';
import { useAppStore } from '@/store';
import { Button } from '@/components/common/Button';
import { getTodayString } from '@/utils/date';

export function Header() {
  const {
    roommates,
    currentUser,
    setCurrentUser,
    toggleFoodForm,
    toggleLogDrawer,
    addRoommate,
  } = useAppStore();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showAddRoommate, setShowAddRoommate] = useState(false);
  const [newRoommateName, setNewRoommateName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentRoommate = roommates.find(r => r.name === currentUser) ?? roommates[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
        setShowAddRoommate(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddRoommate = () => {
    if (newRoommateName.trim()) {
      addRoommate(newRoommateName);
      setNewRoommateName('');
      setShowAddRoommate(false);
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="container">
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <span className="text-xl">🧊</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">冰箱管家</h1>
              <p className="text-xs text-gray-500">{dateStr}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<History size={18} />}
              onClick={() => toggleLogDrawer(true)}
              className="hidden sm:inline-flex"
            >
              操作日志
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => toggleLogDrawer(true)}
              className="sm:hidden p-2"
              aria-label="操作日志"
            >
              <History size={20} />
            </Button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-all hover:shadow-md"
              >
                {currentRoommate && (
                  <>
                    <span className={`w-7 h-7 rounded-full ${currentRoommate.color} flex items-center justify-center text-sm text-white`}>
                      {currentRoommate.avatar}
                    </span>
                    <span className="text-sm font-medium text-gray-700 max-w-[60px] sm:max-w-none truncate">
                      {currentRoommate.name}
                    </span>
                  </>
                )}
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scale-in z-50">
                  <div className="p-2 max-h-64 overflow-y-auto scrollbar-thin">
                    <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      切换身份
                    </p>
                    {roommates.map(roommate => (
                      <button
                        key={roommate.name}
                        onClick={() => {
                          setCurrentUser(roommate.name);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                          currentUser === roommate.name
                            ? 'bg-brand-50 text-brand-700'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-full ${roommate.color} flex items-center justify-center text-sm text-white`}>
                          {roommate.avatar}
                        </span>
                        <span className="text-sm font-medium">{roommate.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 p-2">
                    {showAddRoommate ? (
                      <div className="space-y-2 p-2">
                        <input
                          type="text"
                          value={newRoommateName}
                          onChange={(e) => setNewRoommateName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddRoommate()}
                          placeholder="输入室友昵称"
                          className="input-base py-2 text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowAddRoommate(false);
                              setNewRoommateName('');
                            }}
                            className="flex-1 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleAddRoommate}
                            disabled={!newRoommateName.trim()}
                            className="flex-1 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
                          >
                            添加
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddRoommate(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <UserPlus size={16} />
                        添加新室友
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={18} />}
              onClick={() => toggleFoodForm(true)}
              className="shadow-lg shadow-brand-500/25"
            >
              <span className="hidden sm:inline">新增食物</span>
              <span className="sm:hidden">新增</span>
            </Button>
          </div>
        </div>
      </div>
      <input type="hidden" value={getTodayString()} />
    </header>
  );
}
