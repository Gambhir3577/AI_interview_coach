import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.jsx';
import { AuthScreen } from './components/AuthScreen.jsx';
import { CategorySelect } from './components/CategorySelect.jsx';
import { RecordingScreen } from './components/RecordingScreen.jsx';
import { FeedbackReport } from './components/FeedbackReport.jsx';
import { HistoryModal } from './components/HistoryModal.jsx';
import { ProfileSettingsModal } from './components/ProfileSettingsModal.jsx';
import { ResumeJDModal } from './components/ResumeJDModal.jsx';
import { SalaryNegotiationView } from './components/SalaryNegotiationView.jsx';
import { CheatSheetView } from './components/CheatSheetView.jsx';
import { DebriefView } from './components/DebriefView.jsx';
import { AnalyticsDashboardModal } from './components/AnalyticsDashboardModal.jsx';
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

  const [currentLang, setCurrentLang] = useState('en');
  const [currentScreen, setCurrentScreen] = useState('category'); // 'category' | 'recording' | 'report' | 'negotiation' | 'cheatsheet' | 'debrief'
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  
  // Modals
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [isResumeJDOpen, setIsResumeJDOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  const refreshHistoryCount = async () => {
    try {
      const res = await fetch(`${API_BASE}/history?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setHistoryCount(data.length);
      }
    } catch (e) {}
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
      {/* Top Application Header */}
      <Header
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenProfileSettings={() => setIsProfileSettingsOpen(true)}
        onOpenResumeJD={() => setIsResumeJDOpen(true)}
        onOpenNegotiation={() => setCurrentScreen('negotiation')}
        onOpenCheatSheets={() => setCurrentScreen('cheatsheet')}
        onOpenDebrief={() => setCurrentScreen('debrief')}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        currentLang={currentLang}
        onSelectLang={(lang) => setCurrentLang(lang)}
        historyCount={historyCount}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main View Container */}
      <main>
        {!user ? (
          <AuthScreen onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {currentScreen === 'category' && (
              <CategorySelect
                onSelectQuestion={handleSelectQuestion}
                onOpenResumeJD={() => setIsResumeJDOpen(true)}
                onOpenNegotiation={() => setCurrentScreen('negotiation')}
                onOpenCheatSheets={() => setCurrentScreen('cheatsheet')}
                onOpenDebrief={() => setCurrentScreen('debrief')}
                onOpenAnalytics={() => setIsAnalyticsOpen(true)}
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

            {currentScreen === 'negotiation' && (
              <SalaryNegotiationView
                onBack={() => setCurrentScreen('category')}
              />
            )}

            {currentScreen === 'cheatsheet' && (
              <CheatSheetView
                onBack={() => setCurrentScreen('category')}
              />
            )}

            {currentScreen === 'debrief' && (
              <DebriefView
                onBack={() => setCurrentScreen('category')}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectPastSession={handleSelectPastSession}
      />

      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
      />

      <ResumeJDModal
        isOpen={isResumeJDOpen}
        onClose={() => setIsResumeJDOpen(false)}
        onLaunchQuestion={handleSelectQuestion}
      />

      <AnalyticsDashboardModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      {/* App Footer */}
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
          AI Interview Coach Pro &bull; Local OpenAI Whisper + MediaPipe Mesh + Anthropic Claude Orchestration
        </div>
        <div style={{ fontSize: '0.72rem', color: '#475569' }}>
          Real-time speech transcription &bull; Follow-up probing &bull; STAR guidance &bull; Salary negotiation &bull; Multi-language
        </div>
      </footer>
    </div>
  );
}
