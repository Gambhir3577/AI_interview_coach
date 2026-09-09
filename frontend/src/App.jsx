import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.jsx';
import { AuthScreen } from './components/AuthScreen.jsx';
import { CategorySelect } from './components/CategorySelect.jsx';
import { RecordingScreen } from './components/RecordingScreen.jsx';
import { FeedbackReport } from './components/FeedbackReport.jsx';
import { HistoryModal } from './components/HistoryModal.jsx';
import { ProfileSettingsModal } from './components/ProfileSettingsModal.jsx';
import { API_BASE } from './config.js';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_coach_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [currentScreen, setCurrentScreen] = useState('category'); // 'category' | 'recording' | 'report'
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  // Fetch initial history count
  const refreshHistoryCount = async () => {
    try {
      const res = await fetch(`${API_BASE}/history?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setHistoryCount(data.length);
      }
    } catch (e) {
      // Backend may be starting
    }
  };

  useEffect(() => {
    if (user) {
      refreshHistoryCount();
    }
  }, [user]);

  const handleLoginSuccess = (userProfile) => {
    setUser(userProfile);
    try {
      localStorage.setItem('ai_coach_user', JSON.stringify(userProfile));
    } catch (e) {}
    setCurrentScreen('category');
  };

  const handleUpdateUser = (updatedProfile) => {
    setUser(updatedProfile);
    try {
      localStorage.setItem('ai_coach_user', JSON.stringify(updatedProfile));
    } catch (e) {}
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('ai_coach_user');
    } catch (e) {}
    setSelectedQuestion(null);
    setCurrentReport(null);
    setIsProfileSettingsOpen(false);
    setCurrentScreen('category');
  };

  const handleSelectQuestion = (question) => {
    setSelectedQuestion(question);
    setCurrentScreen('recording');
  };

  const handleAnalysisComplete = (report) => {
    setCurrentReport(report);
    setCurrentScreen('report');
    refreshHistoryCount();
  };

  const handleTryAnotherQuestion = () => {
    setCurrentScreen('category');
    setCurrentReport(null);
  };

  const handleRetrySameQuestion = () => {
    setCurrentScreen('recording');
  };

  const handleSelectPastSession = (pastReport) => {
    setCurrentReport(pastReport);
    setCurrentScreen('report');
  };

  return (
    <div className="app-container">
      {/* App Header */}
      <Header
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenProfileSettings={() => setIsProfileSettingsOpen(true)}
        historyCount={historyCount}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Screen Content */}
      <main>
        {!user ? (
          <AuthScreen onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {currentScreen === 'category' && (
              <CategorySelect
                onSelectQuestion={handleSelectQuestion}
                defaultCategory="behavioral"
              />
            )}

            {currentScreen === 'recording' && (
              <RecordingScreen
                question={selectedQuestion}
                onBack={() => setCurrentScreen('category')}
                onAnalysisComplete={handleAnalysisComplete}
              />
            )}

            {currentScreen === 'report' && (
              <FeedbackReport
                report={currentReport}
                onTryAnother={handleTryAnotherQuestion}
                onRetrySame={handleRetrySameQuestion}
                onOpenHistory={() => setIsHistoryOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Session History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectPastSession={handleSelectPastSession}
      />

      {/* Profile & Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
      />

      {/* Subtle App Footer */}
      <footer
        style={{
          marginTop: '60px',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          alignItems: 'center'
        }}
      >
        <div>
          AI Interview Coach &bull; Local OpenAI Whisper + MediaPipe Face Mesh + Anthropic Claude Orchestration
        </div>
        <div style={{ fontSize: '0.72rem', color: '#475569' }}>
          Engineered for high-impact mock interview preparation &bull; Fully on-device video extraction & speech metrics
        </div>
      </footer>
    </div>
  );
}
