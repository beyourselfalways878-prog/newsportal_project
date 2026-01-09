import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import UserManagement from '@/components/admin/UserManagement';
import { contentData } from '@/lib/data';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const language = 'hi';
  const currentContent = contentData[language];

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | न्यूज़ इंडियन 24x7</title>
        <meta name="description" content="Admin dashboard for managing users and content." />
      </Helmet>
      <Header currentContent={currentContent} language={language} darkMode={false} toggleDarkMode={() => {}} onLogoClick={handleBackToHome} />
      <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-280px)]">
        <div className="space-y-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          {profile && <UserManagement currentUserProfile={profile} />}
        </div>
      </main>
      <Footer currentContent={currentContent} onNavigate={() => {}} onSelectCategory={() => {}} />
    </>
  );
};

export default DashboardPage;
