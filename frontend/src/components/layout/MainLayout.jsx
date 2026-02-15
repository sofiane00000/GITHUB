import { Outlet, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore, useUIStore } from '../../store/useStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIChat } from '../features/AIChat';

export function MainLayout({ title = 'Tableau de bord' }) {
  const { isAuthenticated } = useAuthStore();
  const { sidebarOpen, aiChatOpen } = useUIStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header title={title} />
      
      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarOpen ? '280px' : '80px' }}
        transition={{ duration: 0.2 }}
        className="p-6"
      >
        <Outlet />
      </motion.main>

      {/* AI Chat Panel */}
      <AIChat isOpen={aiChatOpen} />
    </div>
  );
}
