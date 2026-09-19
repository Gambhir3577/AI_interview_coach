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
import { Logo } from './Logo.jsx';
import { AnimatedBackground } from './AnimatedBackground.jsx';

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

  const handleInstantStart = (trackId = selectedTrack) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const demoUser = {
        name: 'Candidate Alex',
        email: 'alex.candidate@example.com',
        track: trackId,
        isGuest: true,
        joinedAt: new Date().toISOString()
      };
      triggerCelebration();
      onLoginSuccess(demoUser, { autoStart: true, track: trackId });
    }, 300);
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
      {/* Animated Multi-Layer Ambient Background */}
      <AnimatedBackground variant="login" />

      <div className="auth-container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Left Side: Multimodal AI Showcase & Creative Animated Visualizer */}
        <div className="auth-hero-card">
          <div>
            <div style={{ marginBottom: '20px' }}>
              <Logo size="large" showBadge={true} showSubtitle={false} />
            </div>

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
              <span>Next-Gen Real-Time AI Mock Studio</span>
            </div>

            <h2 style={{ fontSize: '2rem', lineHeight: 1.2, marginBottom: '12px' }}>
              Master Your Next Interview with{' '}
              <span className="gradient-text">Real-Time Multimodal AI</span>
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Experience instant on-device speech fluency metrics, iris gaze alignment tracking, and structured STAR feedback powered by Anthropic Claude & OpenAI Whisper.
            </p>

            {/* Instant Start Interview Callout in Hero */}
            <div
              style={{
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(236, 72, 153, 0.15) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '14px',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⚡ Quick Start • No Sign Up Required
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>Instant Launch</span>
              </div>

              {/* Career Track Quick Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
                {CAREER_TRACKS.map((track) => {
                  const Icon = track.icon;
                  const isSelected = selectedTrack === track.id;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => setSelectedTrack(track.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: isSelected ? `1px solid ${track.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.3)' : 'rgba(0, 0, 0, 0.25)',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <Icon size={14} color={track.color} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handleInstantStart(selectedTrack)}
                disabled={isLoading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #6366f1 100%)',
                  boxShadow: '0 4px 20px rgba(244, 63, 94, 0.45)',
                  fontSize: '0.95rem',
                  fontWeight: 700
                }}
              >
                <Zap size={18} />
                <span>Start Mock Interview Now</span>
                <ArrowRight size={18} />
              </button>
            </div>
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
                  <User size={14} color="#818cf8" /> Full Name
                </label>
                <div className="auth-input-wrapper">
                  <User className="auth-input-icon" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="auth-input-field"
                  />
                </div>
              </div>
            )}

            <div className="auth-input-group">
              <label className="auth-input-label">
                <Mail size={14} color="#818cf8" /> Email Address
              </label>
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" size={18} />
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input-field"
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label className="auth-input-label">
                <Lock size={14} color="#818cf8" /> Password
              </label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password (min 4 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input-field"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    borderRadius: '4px',
                    zIndex: 3
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
              margin: '20px 0 12px',
              color: 'var(--text-muted)',
              fontSize: '0.78rem'
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            <span>OR INSTANT PRACTICE</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          </div>

          {/* Instant Start Interview Direct Action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleInstantStart(selectedTrack)}
              className="guest-access-btn"
              style={{
                background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(99, 102, 241, 0.2) 100%)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                color: '#ffffff',
                fontWeight: 700
              }}
              disabled={isLoading}
            >
              <Zap size={16} color="#f43f5e" />
              <span>Start Interview Now (Instant Mode)</span>
            </button>

            <button
              type="button"
              onClick={handleGuestDemo}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '8px 12px', width: '100%' }}
              disabled={isLoading}
            >
              <span>Browse Question Bank as Guest</span>
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '20px' }}>
            Protected by multimodal local analysis &bull; No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
