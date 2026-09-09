import React, { useEffect, useState } from 'react';
import { Mic, Sparkles, History, LogOut, Sliders, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../config.js';

export function Header({ currentScreen, onNavigate, onOpenHistory, onOpenProfileSettings, historyCount = 0, user = null, onLogout }) {
  const [backendStatus, setBackendStatus] = useState('checking');

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

  const getTrackLabel = (trackId) => {
    switch (trackId) {
      case 'swe': return 'Software Eng';
      case 'pm': return 'Product Mgr';
      case 'data': return 'Data & AI';
      case 'general': return 'Leadership';
      default: return 'Candidate';
    }
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

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        marginBottom: '28px',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-glass)'
      }}
    >
      {/* Brand Logo & Title */}
      <div
        onClick={() => user && onNavigate('category')}
        style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: user ? 'pointer' : 'default' }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}
        >
          <Mic size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              AI Interview <span className="gradient-text">Coach</span>
            </h1>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.4)'
              }}
            >
              PRO
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
            Multimodal Speech, Content & Eye-Contact Feedback
          </p>
        </div>
      </div>

      {/* Action Buttons, Profile & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Backend Connectivity Status Pill */}
        <div
          title={backendStatus === 'connected' ? 'FastAPI Backend Live' : 'Backend connection issues'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: backendStatus === 'connected' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            color: backendStatus === 'connected' ? '#34d399' : '#fb7185',
            border: `1px solid ${backendStatus === 'connected' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: backendStatus === 'connected' ? '#10b981' : '#f43f5e',
              boxShadow: backendStatus === 'connected' ? '0 0 8px #10b981' : '0 0 8px #f43f5e'
            }}
          />
          <span>{backendStatus === 'connected' ? 'Engine Ready' : 'Connecting...'}</span>
        </div>

        {/* Practice History Button (When logged in) */}
        {user && (
          <button
            onClick={onOpenHistory}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '7px 12px' }}
          >
            <History size={16} color="var(--primary-light)" />
            <span>History</span>
            {historyCount > 0 && (
              <span
                style={{
                  marginLeft: 4,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  fontSize: '0.7rem',
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

        {/* Settings & Profile Button (When logged in) */}
        {user && onOpenProfileSettings && (
          <button
            onClick={onOpenProfileSettings}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '7px 12px' }}
            title="Profile & AI Coach Settings"
          >
            <Sliders size={16} color="#a855f7" />
            <span>Settings</span>
          </button>
        )}

        {/* User Profile Pill */}
        {user ? (
          <div
            className="user-profile-badge"
            style={{ cursor: onOpenProfileSettings ? 'pointer' : 'default' }}
            onClick={() => onOpenProfileSettings && onOpenProfileSettings()}
            title="Click to edit profile & settings"
          >
            <div
              className="user-avatar-circle"
              style={{
                background: getAvatarGradient(user.avatarGradient),
                fontSize: user.avatarEmoji ? '1.1rem' : '0.8rem'
              }}
            >
              {user.avatarEmoji || getInitials(user.name)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user.name}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#a5b4fc', fontWeight: 600 }}>
                {getTrackLabel(user.track)} {user.isGuest ? '(Guest)' : ''}
              </span>
            </div>
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
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                marginLeft: '4px',
                borderRadius: '6px',
                transition: 'color var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#f43f5e'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}


