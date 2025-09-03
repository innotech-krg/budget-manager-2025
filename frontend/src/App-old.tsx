// =====================================================
// Budget Manager 2025 - Main App Component
// React App mit verbessertem Layout und deutscher UX
// =====================================================

import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { BudgetManagement } from './pages/BudgetManagement'
import BudgetTracking from './pages/BudgetTracking'
import BudgetTransfers from './pages/BudgetTransfers'
import Dashboard from './pages/Dashboard'

type PageType = 'dashboard' | 'budget-management' | 'budget-tracking' | 'budget-transfers';

interface NavigationItem {
  id: PageType;
  label: string;
  icon: string;
  description: string;
  badge?: string;
}

// Navigation Component (mit Router-Integration)
function AppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Aktuelle Seite basierend auf URL bestimmen
  const getCurrentPage = (): PageType => {
    const path = location.pathname;
    if (path.includes('/budget-management') || path.includes('/budget')) return 'budget-management';
    if (path.includes('/budget-tracking') || path.includes('/tracking')) return 'budget-tracking';
    if (path.includes('/budget-transfers') || path.includes('/transfers')) return 'budget-transfers';
    return 'dashboard';
  };
  
  const currentPage = getCurrentPage();

  // Navigation-Konfiguration mit deutschen Labels
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'Echtzeit-Budget-Übersicht',
      badge: 'Live'
    },
    {
      id: 'budget-management',
      label: 'Budget-Verwaltung',
      icon: '💰',
      description: 'Jahresbudgets verwalten'
    },
    {
      id: 'budget-tracking',
      label: '3D Budget-Tracking',
      icon: '🎯',
      description: 'Dreidimensionale Verfolgung'
    },
    {
      id: 'budget-transfers',
      label: 'Budget-Transfers',
      icon: '🔄',
      description: 'Transfer-Management'
    }
  ];

  // Page-Wechsel mit Loading-State
  const handlePageChange = (pageId: PageType) => {
    if (pageId === currentPage || isLoading) return;
    
    setIsLoading(true);
    setIsMobileMenuOpen(false);
    
    // Route mapping
    const routes = {
      'dashboard': '/',
      'budget-management': '/budget',
      'budget-tracking': '/tracking', 
      'budget-transfers': '/transfers'
    };
    
    // Simuliere kurze Ladezeit für bessere UX
    setTimeout(() => {
      navigate(routes[pageId]);
      setIsLoading(false);
    }, 150);
  };

  // Keyboard Navigation (Accessibility)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey) {
        switch (event.key) {
          case '1':
            handlePageChange('dashboard');
            break;
          case '2':
            handlePageChange('budget-management');
            break;
          case '3':
            handlePageChange('budget-tracking');
            break;
          case '4':
            handlePageChange('budget-transfers');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      {/* Header mit verbesserter Navigation */}
      <header className="bg-white shadow-lg border-b-2 border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo und Branding */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">€</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Budget Manager 2025
                  </h1>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      🇩🇪 Deutsche Geschäftslogik
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      ✅ Produktionsbereit
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1" role="navigation" aria-label="Hauptnavigation">
              {navigationItems.map((item, index) => (
                <button
                  key={item.id}
                  data-testid={`nav-${item.id}`}
                  onClick={() => handlePageChange(item.id)}
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
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                        currentPage === item.id 
                          ? 'bg-white/20 text-white' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  
                  {/* Tooltip für Desktop */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap xl:hidden">
                    {item.label}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              data-testid="mobile-menu-button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
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

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div id="mobile-menu" className="lg:hidden pb-4 border-t border-gray-200">
              <div className="grid grid-cols-1 gap-2 mt-4">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handlePageChange(item.id)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      currentPage === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className={`text-sm ${
                        currentPage === item.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                    {item.badge && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        currentPage === item.id 
                          ? 'bg-white/20 text-white' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
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
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'budget-management' && <BudgetManagement />}
          {currentPage === 'budget-tracking' && <BudgetTracking />}
          {currentPage === 'budget-transfers' && <BudgetTransfers />}
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

export default App