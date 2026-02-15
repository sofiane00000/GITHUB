import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Calendar, GraduationCap, MessageSquare, 
  BookOpen, FileText, Users, Brain, Settings, LogOut,
  ChevronLeft, ChevronRight, Sparkles, Trophy, Bell
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store/useStore';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';

const navItems = {
  student: [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard' },
    { icon: Calendar, label: 'Emploi du temps', path: '/timetable' },
    { icon: GraduationCap, label: 'Notes', path: '/grades' },
    { icon: BookOpen, label: 'Devoirs', path: '/homework' },
    { icon: FileText, label: 'Ressources', path: '/resources' },
    { icon: Brain, label: 'Quiz & Soutien', path: '/tutoring' },
    { icon: MessageSquare, label: 'Messagerie', path: '/messages' },
    { icon: Users, label: 'Forum', path: '/forum' },
  ],
  teacher: [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard' },
    { icon: Calendar, label: 'Emploi du temps', path: '/timetable' },
    { icon: GraduationCap, label: 'Notes', path: '/grades' },
    { icon: BookOpen, label: 'Devoirs', path: '/homework' },
    { icon: FileText, label: 'Ressources', path: '/resources' },
    { icon: Brain, label: 'Générateur Quiz', path: '/tutoring' },
    { icon: MessageSquare, label: 'Messagerie', path: '/messages' },
    { icon: Users, label: 'Forum', path: '/forum' },
  ],
  parent: [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard' },
    { icon: Calendar, label: 'Emploi du temps', path: '/timetable' },
    { icon: GraduationCap, label: 'Notes', path: '/grades' },
    { icon: BookOpen, label: 'Devoirs', path: '/homework' },
    { icon: MessageSquare, label: 'Messagerie', path: '/messages' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard' },
    { icon: Users, label: 'Utilisateurs', path: '/admin/users' },
    { icon: Calendar, label: 'Emploi du temps', path: '/timetable' },
    { icon: GraduationCap, label: 'Notes', path: '/grades' },
    { icon: BookOpen, label: 'Devoirs', path: '/homework' },
    { icon: FileText, label: 'Ressources', path: '/resources' },
    { icon: MessageSquare, label: 'Messagerie', path: '/messages' },
  ],
};

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, toggleAIChat } = useUIStore();
  const navigate = useNavigate();
  
  const items = navItems[user?.role] || navItems.student;
  const xpProgress = ((user?.xp_points || 0) % 100);
  const level = Math.floor((user?.xp_points || 0) / 100) + 1;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 280 : 80 }}
      className="fixed left-0 top-0 h-screen bg-card border-r border-border z-40 flex flex-col"
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-hidden"
            >
              <h1 className="font-bold text-xl gradient-text">Papillon</h1>
              <p className="text-xs text-muted-foreground">L'école qui vous donne des ailes</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-medium truncate"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* AI Assistant Button */}
      <div className="p-3 border-t border-border">
        <Button
          onClick={toggleAIChat}
          className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-xl gap-2 active:scale-95"
          data-testid="ai-assistant-btn"
        >
          <Brain className="w-5 h-5" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Assistant Papillon
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>

      {/* XP Progress */}
      {user?.role === 'student' && sidebarOpen && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Niveau {level}</span>
            </div>
            <span className="text-xs text-muted-foreground">{user?.xp_points || 0} XP</span>
          </div>
          <Progress value={xpProgress} className="h-2 xp-gradient" />
        </div>
      )}

      {/* User & Settings */}
      <div className="p-3 border-t border-border space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )
          }
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium"
              >
                Paramètres
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
          data-testid="logout-btn"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium"
              >
                Déconnexion
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center shadow-lg hover:bg-muted transition-colors"
        data-testid="sidebar-toggle"
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
    </motion.aside>
  );
}
