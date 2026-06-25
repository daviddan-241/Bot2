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
import MVPGeneratorPage from './pages/MVPGeneratorPage.jsx';
import KanbanPage from './pages/KanbanPage.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen min-h-dvh flex items-center justify-center" style={{ background: '#0A0A14' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center animate-pulse"
          style={{ background: 'linear-gradient(135deg,#5c67ff,#7c3aed)' }}>
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path d="M12 3 L20 18 L12 14 L4 18 Z" fill="white"/>
          </svg>
        </div>
        <p className="text-sm text-slate-500">Loading FlowAI…</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<Navigate to="/ai" replace />} />
      <Route path="/dashboard" element={<Navigate to="/ai" replace />} />
      <Route path="/kanban" element={<Protected><KanbanPage /></Protected>} />
      <Route path="/leads" element={<Protected><LeadsPage /></Protected>} />
      <Route path="/leads/:id" element={<Protected><LeadDetailPage /></Protected>} />
      <Route path="/scraper" element={<Protected><ScraperPage /></Protected>} />
      <Route path="/campaigns" element={<Protected><CampaignsPage /></Protected>} />
      <Route path="/ai" element={<Protected><AIPage /></Protected>} />
      <Route path="/generate" element={<Protected><MVPGeneratorPage /></Protected>} />
      <Route path="/connections" element={<Protected><ConnectionsPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
