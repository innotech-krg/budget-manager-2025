// =====================================================
// Budget Manager 2025 - Main App Component with Router
// React App mit URL-basiertem Routing für E2E Tests
// =====================================================

import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ConnectionStatus from './components/ConnectionStatus'
import AuthProvider, { useAuth } from './components/auth/AuthProvider'
import BudgetManagement from './pages/BudgetManagement'

import BudgetTransfers from './pages/BudgetTransfers'
import Dashboard from './pages/Dashboard'
import ProjectManagement from './pages/ProjectManagement'
import ProjectManagementAdvanced from './pages/ProjectManagementAdvanced'
import ProjectView from './pages/ProjectView'
import OCRPage from './pages/OCRPage'
import AdminPage from './pages/AdminPage'
import AdminRoute from './components/admin/AdminRoute'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Bitte melden Sie sich an</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ConnectionStatus />
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Budget Management Routes */}
            <Route path="/budget" element={
              <ProtectedRoute>
                <BudgetManagement />
              </ProtectedRoute>
            } />

            <Route path="/budget-management" element={
              <ProtectedRoute>
                <BudgetManagement />
              </ProtectedRoute>
            } />

            {/* Project Management Routes - Optimierte Version mit 3D Budget Tracking */}
            <Route path="/projects" element={
              <ProtectedRoute>
                <ProjectManagement />
              </ProtectedRoute>
            } />

            <Route path="/project-management" element={
              <ProtectedRoute>
                <ProjectManagement />
              </ProtectedRoute>
            } />

            {/* Epic 9: Advanced Project Creation Form */}
            <Route path="/projects/advanced" element={
              <ProtectedRoute>
                <ProjectManagementAdvanced />
              </ProtectedRoute>
            } />

            {/* Epic 9: Project Detail View */}
            <Route path="/projects/:id" element={
              <ProtectedRoute>
                <ProjectView />
              </ProtectedRoute>
            } />

            <Route path="/projects/:id/edit" element={
              <ProtectedRoute>
                <ProjectManagementAdvanced />
              </ProtectedRoute>
            } />



            {/* Transfer Routes */}
            <Route path="/transfers" element={
              <ProtectedRoute>
                <BudgetTransfers />
              </ProtectedRoute>
            } />

            <Route path="/budget-transfers" element={
              <ProtectedRoute>
                <BudgetTransfers />
              </ProtectedRoute>
            } />

            {/* OCR Routes */}
            <Route path="/ocr" element={
              <ProtectedRoute>
                <OCRPage />
              </ProtectedRoute>
            } />

            <Route path="/ocr-processing" element={
              <ProtectedRoute>
                <OCRPage />
              </ProtectedRoute>
            } />

            <Route path="/ocr-direct" element={
              <ProtectedRoute>
                <OCRPage />
              </ProtectedRoute>
            } />

            {/* Admin Routes - Protected for SuperAdmin only */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              </ProtectedRoute>
            } />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App
