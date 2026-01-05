import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';
import TeamSelection from './components/TeamSelection';
import { ToastContainer } from './components/Toast';

function AppContent() {
  const { user, loading, hasTeam, userRole, refreshTeamStatus } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // System users don't need to select a team
    if (userRole === 'system_user') {
      return <Dashboard />;
    }

    // Regular users need to select a team first
    if (!hasTeam) {
      return (
        <TeamSelection
          userId={user.id}
          onTeamSelected={refreshTeamStatus}
        />
      );
    }

    return <Dashboard />;
  }

  return (
    <>
      <LandingPage
        onGetStarted={() => {
          setAuthModalMode('signin');
          setShowAuthModal(true);
        }}
        onSignUp={() => {
          setAuthModalMode('signup');
          setShowAuthModal(true);
        }}
      />
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          initialMode={authModalMode}
        />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <ToastContainer />
    </AuthProvider>
  );
}

export default App;
