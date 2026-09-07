import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Sparkles,
  Eye,
  EyeOff,
  Briefcase,
  Code2,
  BrainCircuit,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Mic,
  Smile
} from 'lucide-react';
import confetti from 'canvas-confetti';

const CAREER_TRACKS = [
  { id: 'swe', label: 'Software Engineer', icon: Code2, color: '#6366f1' },
  { id: 'pm', label: 'Product Manager', icon: Compass, color: '#ec4899' },
  { id: 'data', label: 'Data & AI Engineer', icon: BrainCircuit, color: '#06b6d4' },
  { id: 'general', label: 'Leadership & HR', icon: Briefcase, color: '#10b981' }
];

export function AuthScreen({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState('swe');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#a855f7', '#ec4899', '#06b6d4']
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return;
    }
    if (authMode === 'signup' && !name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const userProfile = {
        name: authMode === 'signup' ? name.trim() : (email.split('@')[0] || 'Candidate'),
        email: email.trim(),
        track: selectedTrack,
        isGuest: false,
        joinedAt: new Date().toISOString()
      };

      triggerCelebration();
      onLoginSuccess(userProfile);
    }, 600);
  };

  const handleGuestDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const demoUser = {
        name: 'Alex Rivera',
        email: 'alex.rivera@example.com',
        track: selectedTrack,
        isGuest: true,
        joinedAt: new Date().toISOString()
      };
      triggerCelebration();
      onLoginSuccess(demoUser);
    }, 400);
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '82vh' }}>
      {/* Ambient Floating Orbs */}
      <div className="auth-bg-ambient">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="auth-container">
        {/* Left Side: Multimodal AI Showcase & Creative Animated Visualizer */}
        <div className="auth-hero-card">
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                color: 'var(--primary-light)',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: '18px'
              }}
            >
              <Sparkles size={15} />
              <span>Next-Gen Mock Interview Studio</span>
            </div>

            <h2 style={{ fontSize: '2rem', lineHeight: 1.2, marginBottom: '12px' }}>
              Master Your Next Interview with{' '}
              <span className="gradient-text">Real-Time Multimodal AI</span>
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Experience instant on-device speech fluency metrics, iris gaze alignment tracking, and structured STAR feedback powered by Anthropic Claude & OpenAI Whisper.
            </p>
          </div>

          {/* Animated AI HUD Interactive Widget */}
          <div className="ai-hud-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    boxShadow: '0 0 10px #10b981'
                  }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#cbd5e1' }}>
                  AI VISION & SPEECH SENSORS ACTIVE
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                30 FPS &bull; 16kHz
              </span>
            </div>

            {/* Radar & Animated Eye Iris */}
            <div className="ai-radar-circle">
              <div className="ai-iris-core">
                <div className="ai-iris-pupil" />
              </div>
            </div>

            {/* Sound Wave Equalizer */}
            <div className="sound-bars-container">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="sound-bar" />
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Tracking Iris Centering &bull; WPM Speaking Pace &bull; Filler Words
            </div>
          </div>

          {/* Key Feature Highlights */}
          <div>
            <div className="auth-feature-row">
              <Mic size={18} color="#818cf8" />
              <div style={{ fontSize: '0.82rem' }}>
                <strong style={{ color: '#f8fafc' }}>Local Whisper STT</strong> &bull; Zero transcription lag & private audio processing
              </div>
            </div>

            <div className="auth-feature-row">
              <Smile size={18} color="#ec4899" />
              <div style={{ fontSize: '0.82rem' }}>
                <strong style={{ color: '#f8fafc' }}>MediaPipe Eye Tracking</strong> &bull; 468-point facial mesh engagement gauge
              </div>
            </div>

            <div className="auth-feature-row" style={{ marginBottom: 0 }}>
              <BrainCircuit size={18} color="#06b6d4" />
              <div style={{ fontSize: '0.82rem' }}>
                <strong style={{ color: '#f8fafc' }}>Claude STAR Coach</strong> &bull; Actionable storytelling & relevance scoring
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Card */}
        <div className="auth-form-card">
          {/* Tab Switcher */}
          <div className="auth-tab-pill-container">
            <button
              type="button"
              className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('login');
                setErrorMessage('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage('');
              }}
            >
              Create Account
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
              {authMode === 'login' ? 'Welcome Back!' : 'Start Practicing Today'}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              {authMode === 'login'
                ? 'Sign in to access your customized interview practice sessions.'
                : 'Create your free candidate account to track fluency growth.'}
            </p>
          </div>

          {errorMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                color: '#fb7185',
                fontSize: '0.82rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ShieldCheck size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit}>
            {authMode === 'signup' && (
              <div className="auth-input-group">
                <label className="auth-input-label">
                  <User size={14} /> Full Name
                </label>
                <div className="auth-input-wrapper">
                  <User className="auth-input-icon" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="auth-input-field"
                  />
                </div>
              </div>
            )}

            <div className="auth-input-group">
              <label className="auth-input-label">
                <Mail size={14} /> Email Address
              </label>
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" size={18} />
                <input
                  type="email"
                  required
                  placeholder="candidate@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input-field"
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label className="auth-input-label">
                <Lock size={14} /> Password
              </label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input-field"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Target Career Track Selector */}
            <div className="auth-input-group" style={{ marginTop: '6px', marginBottom: '20px' }}>
              <label className="auth-input-label">
                <Briefcase size={14} /> Target Interview Track
              </label>
              <div className="role-chips-grid">
                {CAREER_TRACKS.map((track) => {
                  const Icon = track.icon;
                  const isSelected = selectedTrack === track.id;
                  return (
                    <div
                      key={track.id}
                      className={`role-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedTrack(track.id)}
                    >
                      <Icon size={15} color={isSelected ? track.color : 'var(--text-muted)'} />
                      <span>{track.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="spinner-sm" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>{authMode === 'login' ? 'Sign In to Studio' : 'Create Candidate Profile'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '20px 0 8px',
              color: 'var(--text-muted)',
              fontSize: '0.78rem'
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            <span>OR TRY INSTANTLY</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          </div>

          {/* Instant 1-Click Guest Demo Button */}
          <button type="button" onClick={handleGuestDemo} className="guest-access-btn" disabled={isLoading}>
            <Zap size={16} color="#f59e0b" />
            <span>Instant One-Click Guest Demo</span>
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '20px' }}>
            Protected by multimodal local analysis &bull; No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
