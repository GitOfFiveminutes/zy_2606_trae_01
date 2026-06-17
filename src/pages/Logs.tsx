import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { LogItem } from '@/components/logs/LogItem';
import { useAppStore } from '@/store';
import { useState } from 'react';
import type { ActionType } from '@/types';

export default function Logs() {
  const { logs, roommates } = useAppStore();
  const [filterOperator, setFilterOperator] = useState<string | 'all'>('all');
  const [filterAction, setFilterAction] = useState<ActionType | 'all'>('all');

  const filteredLogs = logs.filter(log => {
    if (filterOperator !== 'all' && log.operator !== filterOperator) return false;
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <Header />

      <main className="container py-6 lg:py-8 max-w-3xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-all hover:shadow-md"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">操作日志</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  共 {filteredLogs.length} 条历史记录
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-4 card-shadow">
            <p className="text-sm font-semibold text-gray-700">筛选条件</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterOperator('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterOperator === 'all'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                全部室友
              </button>
              {roommates.map(r => (
                <button
                  key={r.name}
                  onClick={() => setFilterOperator(r.name)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filterOperator === r.name
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {r.avatar} {r.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterAction('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterAction === 'all'
                    ? 'bg-gray-800 text-white shadow-md'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                全部动作
              </button>
              <button
                onClick={() => setFilterAction('consume')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterAction === 'consume'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                🍽️ 吃掉
              </button>
              <button
                onClick={() => setFilterAction('discard')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterAction === 'discard'
                    ? 'bg-gray-600 text-white shadow-md'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                🗑️ 丢弃
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 card-shadow">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-6xl mb-5">📭</span>
                <p className="text-gray-600 font-semibold mb-1 text-lg">暂无操作记录</p>
                <p className="text-sm text-gray-400">吃掉或丢弃食物后会在这里显示</p>
              </div>
            ) : (
              filteredLogs.map((log, i) => (
                <LogItem key={log.id} log={log} index={i} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
