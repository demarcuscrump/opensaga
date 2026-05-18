import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Compass, PlusCircle, Activity, User, Moon, Sun, Wand2, LogIn, LogOut } from 'lucide-react';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { useAuth } from '../lib/auth';
import { useUIStore } from '../store/uiStore';

const LandingView = lazy(() => import('../features/worlds/LandingView').then(module => ({ default: module.LandingView })));
const LoginView = lazy(() => import('../features/auth/LoginView').then(module => ({ default: module.LoginView })));
const DiscoveryView = lazy(() => import('../features/worlds/DiscoveryView').then(module => ({ default: module.DiscoveryView })));
const WorldHubView = lazy(() => import('../features/worlds/WorldHubView').then(module => ({ default: module.WorldHubView })));
const ActivityFeed = lazy(() => import('../features/worlds/ActivityFeed').then(module => ({ default: module.ActivityFeed })));
const UserProfileView = lazy(() => import('../features/users/UserProfileView').then(module => ({ default: module.UserProfileView })));
const CreateView = lazy(() => import('../features/proposals/CreateView').then(module => ({ default: module.CreateView })));
const CreatorStudioView = lazy(() => import('../features/ai-assist/CreatorStudioView').then(module => ({ default: module.CreatorStudioView })));

const RouteFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border border-border border-t-accent-primary animate-spin" />
  </div>
);

const DesktopSidebar: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useUIStore();
  const { isAuthenticated, profile, signOut } = useAuth();
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: Wand2, label: 'Studio', path: '/studio' },
    { icon: Activity, label: 'Activity', path: '/activity' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen bg-surface-elevated border-r border-border fixed left-0 top-0 z-50 transition-colors duration-300">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <Link to="/">
          <img 
            src={theme === 'noir' ? '/logo-lockup-white.png' : '/logo-lockup-black.png'} 
            alt="OpenSaga" 
            className="h-10 w-auto"
          />
        </Link>
        <p className="text-[10px] text-text-tertiary mt-2 tracking-widest uppercase">Stories that evolve together</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive 
                  ? 'bg-accent-muted text-accent-primary font-medium' 
                  : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'
              }`}
            >
              <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle + Auth + Create */}
      <div className="p-4 border-t border-border space-y-3">
        {/* Noir / Paper Toggle */}
        <button 
          onClick={toggleTheme}
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-overlay hover:text-text-primary transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            {theme === 'noir' ? <Moon size={16} strokeWidth={1.5} /> : <Sun size={16} strokeWidth={1.5} />}
            <span>{theme === 'noir' ? 'Noir' : 'Paper'}</span>
          </div>
          <div className={`w-8 h-[18px] rounded-full border border-border-subtle relative transition-colors duration-300 ${theme === 'paper' ? 'bg-accent-primary' : 'bg-surface-overlay'}`}>
            <div className={`absolute top-[2px] w-3 h-3 rounded-full transition-all duration-300 ${
              theme === 'paper' 
                ? 'left-[14px] bg-surface-base' 
                : 'left-[2px] bg-text-secondary'
            }`} />
          </div>
        </button>

        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-text-secondary">
              <div className="w-6 h-6 rounded-full bg-accent-muted flex items-center justify-center text-accent-primary text-xs font-bold">
                {profile?.display_name?.charAt(0)?.toUpperCase() || 'W'}
              </div>
              <span className="truncate">{profile?.display_name || 'Wanderer'}</span>
            </div>
            <Link 
              to="/create"
              className="flex items-center justify-center gap-2 w-full bg-accent-primary hover:bg-accent-hover text-surface-base py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
            >
              <PlusCircle size={16} />
              <span>Forge</span>
            </Link>
            <button
              onClick={signOut}
              className="flex items-center justify-center gap-2 w-full text-text-tertiary hover:text-text-primary py-2 rounded-lg text-xs transition-all duration-200"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </>
        ) : (
          <Link 
            to="/login"
            className="flex items-center justify-center gap-2 w-full bg-accent-primary hover:bg-accent-hover text-surface-base py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
          >
            <LogIn size={16} />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </aside>
  );
};

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: Wand2, label: 'Studio', path: '/studio' },
    { icon: PlusCircle, label: 'Create', path: '/create', highlight: true },
    { icon: User, label: 'You', path: '/profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-elevated/95 backdrop-blur-md border-t border-border z-50 px-2 py-1.5 transition-colors duration-300">
      <div className="flex justify-between items-center max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all duration-200 ${
                isActive ? 'text-accent-primary' : 'text-text-tertiary'
              }`}
            >
              <div className={`${item.highlight ? 'bg-accent-primary text-surface-base p-2 rounded-full -mt-5 shadow-lg border-2 border-surface-base' : ''}`}>
                <item.icon size={item.highlight ? 20 : 22} strokeWidth={isActive ? 2 : 1.5} />
              </div>
              {!item.highlight && <span className="text-[10px] font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary font-sans antialiased transition-colors duration-300">
      <DesktopSidebar />
      <main className="md:pl-60 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<LandingView />} />
            <Route path="/login" element={<LoginView />} />
            <Route path="/explore" element={<DiscoveryView />} />
            <Route path="/world/:id" element={<WorldHubView />} />
            <Route path="/create" element={<ProtectedRoute><CreateView /></ProtectedRoute>} />
            <Route path="/studio" element={<ProtectedRoute><CreatorStudioView /></ProtectedRoute>} />
            <Route path="/activity" element={<div className="p-8"><ActivityFeed /></div>} />
            <Route path="/profile" element={<ProtectedRoute><UserProfileView /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  );
};

export default App;
