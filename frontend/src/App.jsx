import React, { useState } from 'react';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import WalletsPage from './pages/WalletsPage';
import BudgetsPage from './pages/BudgetsPage';
import GoalsPage from './pages/GoalsPage';
import RecurringPage from './pages/RecurringPage';
import AnalyticsPage from './pages/AnalyticsPage';

/**
 * Root Application component managing active navigation tab and page rendering
 */
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActiveTab} />;
      case 'transactions':
        return <TransactionsPage />;
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
    <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderPage()}
    </MainLayout>
  );
}

export default App;
