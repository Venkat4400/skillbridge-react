import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/auth/AuthForm';
import { Layout } from './components/layout/Layout';
import { VolunteerDashboard } from './components/dashboard/VolunteerDashboard';
import { NGODashboard } from './components/dashboard/NGODashboard';
import { OpportunitiesList } from './components/opportunities/OpportunitiesList';
import { OpportunityForm } from './components/opportunities/OpportunityForm';
import { ApplicationsList } from './components/applications/ApplicationsList';
import { ApplicationForm } from './components/applications/ApplicationForm';
import { MessagesPage } from './components/messages/MessagesPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [showOpportunityForm, setShowOpportunityForm] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('opportunity/')) {
        setCurrentView('opportunities');
      } else if (hash === 'create-opportunity') {
        setShowOpportunityForm(true);
      } else if (hash) {
        setCurrentView(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  function handleApply(opportunityId: string) {
    setSelectedOpportunityId(opportunityId);
    setShowApplicationForm(true);
  }

  function handleApplicationSuccess() {
    setShowApplicationForm(false);
    setSelectedOpportunityId(null);
    window.location.hash = 'applications';
  }

  function handleOpportunitySuccess() {
    setShowOpportunityForm(false);
    window.location.hash = 'opportunities';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <Layout>
      {currentView === 'dashboard' && (
        user.role === 'volunteer' ? <VolunteerDashboard /> : <NGODashboard />
      )}

      {currentView === 'opportunities' && (
        <OpportunitiesList onApply={user.role === 'volunteer' ? handleApply : undefined} />
      )}

      {currentView === 'applications' && <ApplicationsList />}

      {currentView === 'messages' && <MessagesPage />}

      {showOpportunityForm && (
        <OpportunityForm
          onClose={() => setShowOpportunityForm(false)}
          onSuccess={handleOpportunitySuccess}
        />
      )}

      {showApplicationForm && selectedOpportunityId && (
        <ApplicationForm
          opportunityId={selectedOpportunityId}
          onClose={() => {
            setShowApplicationForm(false);
            setSelectedOpportunityId(null);
          }}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
