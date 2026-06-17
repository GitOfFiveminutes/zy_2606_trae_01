import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Logs from '@/pages/Logs';
import { useAppStore } from '@/store';
import { Loader2 } from 'lucide-react';

export default function App() {
  const init = useAppStore(state => state.init);
  const loading = useAppStore(state => state.syncStatus.loading);

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <span className="text-2xl">🧊</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm font-medium">加载数据中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/logs" element={<Logs />} />
      </Routes>
    </Router>
  );
}
