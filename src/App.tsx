import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Logs from '@/pages/Logs';
import { useAppStore } from '@/store';

export default function App() {
  const init = useAppStore(state => state.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/logs" element={<Logs />} />
      </Routes>
    </Router>
  );
}
