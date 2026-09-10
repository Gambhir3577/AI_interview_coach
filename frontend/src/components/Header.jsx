import React, { useEffect, useState } from 'react';
import { 
  Mic, 
  Sparkles, 
  History, 
  LogOut, 
  Sliders, 
  CheckCircle2, 
  Globe, 
  FileText, 
  DollarSign, 
  BookOpen, 
  FileCheck, 
  TrendingUp,
  Award
} from 'lucide-react';
import { API_BASE } from '../config.js';
import { LANGUAGES } from '../i18n.js';

export function Header({
  currentScreen,
  onNavigate,
  onOpenHistory,
  onOpenProfileSettings,
  onOpenResumeJD,
  onOpenNegotiation,
  onOpenCheatSheets,
  onOpenDebrief,
  onOpenAnalytics,
  currentLang = 'en',
  onSelectLang,
  historyCount = 0,
  user = null,
  onLogout
}) {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`);
        if (res.ok) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      } catch (err) {
        setBackendStatus('disconnected');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarGradient = (gradientId) => {
    switch (gradientId) {
      case 'cyan': return 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)';
      case 'emerald': return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      case 'rose': return 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)';
      case 'amber': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      default: return 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)';
    }
  };

  const activeLangObj = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <header
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '24px',
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-glass)',
        padding: '16px 22px'
      }}
    >
      {/* Top Main Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        {/* Brand Logo & Title */}
        <div
          onClick={() => user && onNavigate('category')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: user ? 'pointer' : 'default' }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Mic size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                AI Interview <span className="gradient-text">Coach Pro</span>
              </h1>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.4)'
                }}
              >
                PRO 2.0
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Multimodal Speech, Content, Vision & Negotiation AI
            </p>
          </div>
        </div>

        {/* Right Action Hub: Lang, Connectivity, History, Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Multilingual Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 10px' }}
              title="Change Interface Language"
            >
              <Globe size={14} color="#38bdf8" />
              <span>{activeLangObj.flag} {activeLangObj.code.toUpperCase()}</span>
            </button>

            {isLangMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '10px',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 100,
                  minWidth: '140px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.7)'
                }}
              >
                {LANGUAGES.map((lang) => (
                  <div
                    key={lang.code}
                    onClick={() => {
                      onSelectLang(lang.code);
                      setIsLangMenuOpen(false);
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: currentLang === lang.code ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                      color: currentLang === lang.code ? '#ffffff' : 'var(--text-secondary)'
                    }}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Backend Engine Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              background: backendStatus === 'connected' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
              color: backendStatus === 'connected' ? '#34d399' : '#fb7185',
              border: `1px solid ${backendStatus === 'connected' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: backendStatus === 'connected' ? '#10b981' : '#f43f5e'
              }}
            />
            <span>{backendStatus === 'connected' ? 'AI Ready' : 'Connecting...'}</span>
          </div>

          {/* History Drawer Button */}
          {user && (
            <button
              onClick={onOpenHistory}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 10px' }}
            >
              <History size={14} color="var(--primary-light)" />
              <span>History</span>
              {historyCount > 0 && (
                <span
                  style={{
                    marginLeft: 2,
                    padding: '1px 5px',
                    borderRadius: '9999px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    background: 'var(--primary)',
                    color: '#fff'
                  }}
                >
                  {historyCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile Badge */}
          {user ? (
            <div
              className="user-profile-badge"
              style={{ cursor: onOpenProfileSettings ? 'pointer' : 'default', padding: '4px 10px' }}
              onClick={() => onOpenProfileSettings && onOpenProfileSettings()}
            >
              <div
                className="user-avatar-circle"
                style={{
                  width: 26,
                  height: 26,
                  background: getAvatarGradient(user.avatarGradient),
                  fontSize: '0.75rem'
                }}
              >
                {user.avatarEmoji || getInitials(user.name)}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                title="Sign Out"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Navigation Sub-Tabs (Studio, JD Matcher, Negotiation, Cheat Sheets, Debrief, Analytics) */}
      {user && (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => onNavigate('category')}
            className={`btn ${currentScreen === 'category' || currentScreen === 'recording' || currentScreen === 'report' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
          >
            <Mic size={14} />
            <span>Practice Studio</span>
          </button>

          <button
            onClick={onOpenResumeJD}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
          >
            <FileText size={14} color="#818cf8" />
            <span>Resume & JD Matcher</span>
          </button>

          <button
            onClick={() => onNavigate('negotiation')}
            className={`btn ${currentScreen === 'negotiation' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
          >
            <DollarSign size={14} color="#fbbf24" />
            <span>Salary Negotiation</span>
          </button>

          <button
            onClick={() => onNavigate('cheatsheet')}
            className={`btn ${currentScreen === 'cheatsheet' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
          >
            <BookOpen size={14} color="#22d3ee" />
            <span>Role Cheat Sheets</span>
          </button>

          <button
            onClick={() => onNavigate('debrief')}
            className={`btn ${currentScreen === 'debrief' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
          >
            <FileCheck size={14} color="#34d399" />
            <span>Interview Debrief</span>
          </button>

          <button
            onClick={onOpenAnalytics}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
          >
            <TrendingUp size={14} color="#f472b6" />
            <span>Analytics & Badges</span>
          </button>
        </div>
      )}
    </header>
  );
}
