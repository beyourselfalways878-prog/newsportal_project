import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/SupabaseAuthContext.jsx';
import HomePage from '@/pages/HomePage.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';
import ProtectedRoute from '@/components/admin/ProtectedRoute.jsx';
import ArticlePage from '@/pages/ArticlePage.jsx';
import CategoryPage from '@/pages/CategoryPage.jsx';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen transition-colors duration-500 font-hindi">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/category/:categoryKey" element={<CategoryPage />} />
            <Route path="/article/:id" element={<ArticlePage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
