// =====================================================
// Budget Manager 2025 - Layout Component
// Hauptlayout mit Navigation für Router-basierte App
// =====================================================

import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import { usePermissions } from '../stores/authStore'
import { LogOut, User, Settings, Shield } from 'lucide-react'

type PageType = 'dashboard' | 'budget-management' | 'project-management' | 'project-management-advanced' | 'budget-transfers' | 'ocr-processing' | 'admin';

interface NavigationItem {
  id: PageType;
  label: string;
  icon: string;
  description: string;
  badge?: string;
  path: string;
}

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  // Auth state
  const { user, isAuthenticated, logout, showLogin } = useAuth();
  const { hasPermission } = usePermissions();

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.user-menu')) {
        setShowUserMenu(false);
      }
      if (showProjectMenu && !(event.target as Element).closest('.project-menu')) {
        setShowProjectMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showProjectMenu]);
  
  // Aktuelle Seite basierend auf URL bestimmen
  const getCurrentPage = (): PageType => {
    const path = location.pathname;
    if (path.includes('/budget-management') || path.includes('/budget')) return 'budget-management';
    if (path.includes('/projects/advanced')) return 'project-management-advanced';
    if (path.includes('/project-management') || path.includes('/projects')) return 'project-management';
    if (path.includes('/budget-transfers') || path.includes('/transfers')) return 'budget-transfers';
    if (path.includes('/ocr-processing') || path.includes('/ocr')) return 'ocr-processing';
    return 'dashboard';
  };
  
  const currentPage = getCurrentPage();

  // Check if user is SuperAdmin
  const isSuperAdmin = user?.profile?.role === 'SUPERADMIN';

  // Navigation-Konfiguration mit deutschen Labels und Rollen-basierter Filterung
  const allNavigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'Echtzeit-Budget-Übersicht',
      badge: 'Live',
      path: '/'
    },
    {
      id: 'budget-management',
      label: 'Budget-Verwaltung',
      icon: '💰',
      description: 'Jahresbudgets verwalten',
      path: '/budget'
    },
    {
      id: 'project-management',
      label: 'Projekt-Verwaltung',
      icon: '📋',
      description: 'Deutsche Geschäftsprojekte verwalten',
      path: '/projects'
    },

    {
      id: 'budget-transfers',
      label: 'Budget-Transfers',
      icon: '🔄',
      description: 'Transfer-Management',
      path: '/transfers'
    },
    {
      id: 'ocr-processing',
      label: 'OCR-Verarbeitung',
      icon: '📄',
      description: 'Intelligente Rechnungsverarbeitung',
      badge: 'Epic 2',
      path: '/ocr'
    }
  ];

  // Admin-Navigation nur für SuperAdmins
  if (isSuperAdmin) {
    allNavigationItems.push({
      id: 'admin',
      label: 'Admin-Bereich',
      icon: '⚙️',
      description: 'System-Management & Konfiguration',
      badge: 'SuperAdmin',
      path: '/admin'
    });
  }

  const navigationItems = allNavigationItems;

  // Handle page change with loading state and routing
  const handlePageChange = (item: NavigationItem) => {
    if (item.id === currentPage || isLoading) return;
    
    setIsLoading(true);
    setIsMobileMenuOpen(false);
    
    // Simuliere kurze Ladezeit für bessere UX
    setTimeout(() => {
      navigate(item.path);
      setIsLoading(false);
    }, 150);
  };

  // Keyboard Navigation (Accessibility)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey) {
        switch (event.key) {
          case '1':
            navigate('/');
            break;
          case '2':
            navigate('/budget');
            break;
          case '3':
            navigate('/tracking');
            break;
          case '4':
            navigate('/transfers');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Mobile Menu schließen bei Resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header mit Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo und Titel */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">€</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Budget Manager 2025</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Deutsche Geschäfts-Budget-Verwaltung</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1" role="navigation" aria-label="Hauptnavigation">
              {navigationItems.map((item, index) => {
                // Special handling for project-management with dropdown
                // Direkte Navigation zur Projekt-Verwaltung (Epic 9)
                if (item.id === 'project-management') {
                  return (
                    <button
                      key={item.id}
                      data-testid={`nav-${item.id}`}
                      onClick={() => navigate('/projects')}
                      className={`group relative px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        currentPage === item.id || currentPage === 'project-management-advanced'
                          ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title={`${item.description} (Alt+${index + 1})`}
                      aria-current={currentPage === item.id || currentPage === 'project-management-advanced' ? 'page' : undefined}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{item.icon}</span>
                        <span className="hidden xl:inline">{item.label}</span>
                      </div>
                    </button>
                  );
                }

                // Regular navigation items
                return (
                  <button
                    key={item.id}
                    data-testid={`nav-${item.id}`}
                    onClick={() => handlePageChange(item)}
                    className={`group relative px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      currentPage === item.id
                        ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={`${item.description} (Alt+${index + 1})`}
                    aria-current={currentPage === item.id ? 'page' : undefined}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{item.icon}</span>
                      <span className="hidden xl:inline">{item.label}</span>
                      {item.badge && (
                        <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="relative user-menu">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    aria-expanded={showUserMenu}
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium">
                      {user?.profile?.first_name || user?.email?.split('@')[0] || 'Benutzer'}
                    </span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.profile?.first_name && user?.profile?.last_name 
                            ? `${user.profile.first_name} ${user.profile.last_name}`
                            : user?.email
                          }
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <div className="flex items-center mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {user?.profile?.role || 'USER'}
                          </span>
                          {user?.profile?.mfa_enabled && (
                            <Shield className="w-3 h-3 text-green-600 ml-2" title="MFA aktiviert" />
                          )}
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            // TODO: Open profile settings
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Profil-Einstellungen
                        </button>

                        {hasPermission('admin:access') && (
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              navigate('/admin');
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Shield className="w-4 h-4 mr-3" />
                            Admin-Bereich
                          </button>
                        )}

                        <hr className="my-1" />

                        <button
                          onClick={async () => {
                            setShowUserMenu(false);
                            await logout();
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Abmelden
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={showLogin}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Anmelden
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              data-testid="mobile-menu-button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors ml-2"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Navigation öffnen"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div id="mobile-menu" className="lg:hidden py-4 border-t border-gray-200">
              <nav className="space-y-2" role="navigation" aria-label="Mobile Navigation">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    data-testid={`mobile-nav-${item.id}`}
                    onClick={() => handlePageChange(item)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      currentPage === item.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl mr-3">{item.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                    {item.badge && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content mit Loading-State */}
      <main className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="flex items-center space-x-3 px-6 py-3 bg-white rounded-lg shadow-lg">
              <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-gray-700 font-medium">Seite wird geladen...</span>
            </div>
          </div>
        )}
        
        <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
          {children}
        </div>
      </main>

      {/* Footer mit verbessertem Design */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <p className="flex items-center space-x-2">
                <span>© 2025 Budget Manager</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>🇩🇪 Entwickelt mit deutscher Präzision</span>
              </p>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>System aktiv</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Powered by</span>
                <span className="font-medium text-blue-600">React + TypeScript + Tailwind CSS</span>
              </div>
            </div>
          </div>
          
          {/* Keyboard Shortcuts Hinweis */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              💡 Tipp: Verwende Alt+1-4 für schnelle Navigation zwischen den Seiten
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
