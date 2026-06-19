import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LeadsPage from './pages/LeadsPage.jsx';
import LeadDetailPage from './pages/LeadDetailPage.jsx';
import ScraperPage from './pages/ScraperPage.jsx';
import CampaignsPage from './pages/CampaignsPage.jsx';
import AIPage from './pages/AIPage.jsx';
import ConnectionsPage from './pages/ConnectionsPage.jsx';
import LandingPage from './pages/LandingPage.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-50 text-slate-500 dark:bg-slate-950">Loading LeadFlow AI…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/dashboard" element={<Navigate to="/app" replace />} />
      <Route path="/leads" element={<Protected><LeadsPage /></Protected>} />
      <Route path="/leads/:id" element={<Protected><LeadDetailPage /></Protected>} />
      <Route path="/scraper" element={<Protected><ScraperPage /></Protected>} />
      <Route path="/campaigns" element={<Protected><CampaignsPage /></Protected>} />
      <Route path="/ai" element={<Protected><AIPage /></Protected>} />
      <Route path="/connections" element={<Protected><ConnectionsPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
