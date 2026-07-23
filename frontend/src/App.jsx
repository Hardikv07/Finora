import React, { useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import WalletsPage from './pages/WalletsPage';
import BudgetsPage from './pages/BudgetsPage';
import GoalsPage from './pages/GoalsPage';
import RecurringPage from './pages/RecurringPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage from './pages/LoginPage';

/**
 * Root Application component managing active navigation tab and page rendering
 */
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  useEffect(() => {
    // Simple mock check for active session
    const token = localStorage.getItem('finora_auth_token');
    const storedUser = localStorage.getItem('finora_user');
    if (token) {
      setIsAuthenticated(true);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActiveTab} />;
      case 'transactions':
        return <TransactionsPage defaultSearchQuery={globalSearchQuery} onClearSearch={() => setGlobalSearchQuery('')} />;
      case 'wallets':
        return <WalletsPage />;
      case 'budgets':
        return <BudgetsPage />;
      case 'goals':
        return <GoalsPage />;
      case 'recurring':
        return <RecurringPage />;
      case 'analytics':
        return <AnalyticsPage />;
      default:
        return <DashboardPage onNavigate={setActiveTab} />;
    }
  };

  return (
    <MainLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      globalSearchQuery={globalSearchQuery}
      setGlobalSearchQuery={setGlobalSearchQuery}
    >
      {renderPage()}
    </MainLayout>
  );
}

export default App;
