import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Mic, 
  Code, 
  GitFork, 
  History, 
  LogOut, 
  BrainCircuit,
  Menu,
  X
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Resume Analyzer', path: '/resume', icon: FileText },
    { name: 'Mock Interview', path: '/interview', icon: Mic },
    { name: 'Coding Arena', path: '/coding', icon: Code },
    { name: 'Learning Roadmap', path: '/roadmap', icon: GitFork },
    { name: 'History & Review', path: '/history', icon: History },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-soft" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-soft" />

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-premium border-r border-slate-800/80 z-20">
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/50">
          <BrainCircuit className="h-8 w-8 text-indigo-400 animate-pulse" />
          <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
            Interview Copilot
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-md shadow-indigo-900/30' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 border border-transparent hover:border-slate-800/30'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/50 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300 text-sm">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-300 truncate">{user?.username}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-all duration-200 font-medium text-sm text-left"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile menu trigger */}
      <div className="md:hidden absolute top-4 left-4 z-30">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-slate-100 focus:outline-none"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar - Mobile */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 flex">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-slate-900 border-r border-slate-800 h-full p-4">
            <div className="h-16 flex items-center gap-3 border-b border-slate-800 mb-6">
              <BrainCircuit className="h-8 w-8 text-indigo-400" />
              <span className="font-bold text-lg text-white">Interview Copilot</span>
            </div>

            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-4 border-t border-slate-800 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{user?.username}</p>
                  <p className="text-[10px] text-slate-400">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all font-medium text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto z-10 md:pl-0 pl-16">
        <header className="h-16 flex items-center justify-end px-8 border-b border-slate-900/50 glass bg-slate-950/20">
          <div className="flex items-center gap-4">
            <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-medium">
              Gemini 3.5 Flash Active
            </span>
          </div>
        </header>
        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
