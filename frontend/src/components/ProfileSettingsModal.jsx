import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Briefcase,
  Sparkles,
  Award,
  Trash2,
  CheckCircle2,
  Save,
  Sliders,
  ShieldAlert,
  Zap,
  Building,
  GraduationCap,
  Smile,
  LogOut,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

const AVATAR_EMOJIS = ['💼', '💻', '🚀', '🤖', '🎓', '⚡', '🌟', '🧠'];

const AVATAR_GRADIENTS = [
  { id: 'indigo', name: 'Indigo Aura', gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' },
  { id: 'cyan', name: 'Cyan Flux', gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' },
  { id: 'emerald', name: 'Emerald Peak', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  { id: 'rose', name: 'Rose Glow', gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)' },
  { id: 'amber', name: 'Amber Surge', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }
];

const CAREER_TRACKS = [
  { id: 'swe', label: 'Software Engineer' },
  { id: 'pm', label: 'Product Manager' },
  { id: 'data', label: 'Data & AI Engineer' },
  { id: 'general', label: 'Leadership & HR' }
];

const EXPERIENCE_LEVELS = [
  'Junior / Entry-Level (0-2 yrs)',
  'Mid-Level (3-5 yrs)',
  'Senior (6-9 yrs)',
  'Staff / Principal / Director (10+ yrs)'
];

const TARGET_COMPANIES = [
  'Big Tech & FAANG',
  'High-Growth Startups (Series A-C)',
  'Enterprise & Fortune 500',
  'Fintech & Quant',
  'Consulting & Strategy'
];

export function ProfileSettingsModal({ isOpen, onClose, user, onUpdateUser, onLogout }) {
  if (!isOpen || !user) return null;

  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [headline, setHeadline] = useState(user.headline || 'Candidate');
  const [selectedEmoji, setSelectedEmoji] = useState(user.avatarEmoji || '');
  const [selectedGradient, setSelectedGradient] = useState(user.avatarGradient || 'indigo');
  const [track, setTrack] = useState(user.track || 'swe');
  const [experience, setExperience] = useState(user.experience || EXPERIENCE_LEVELS[1]);
  const [targetCompany, setTargetCompany] = useState(user.targetCompany || TARGET_COMPANIES[0]);

  // Practice Preferences
  const [strictStar, setStrictStar] = useState(user.preferences?.strictStar ?? true);
  const [showPacingTimer, setShowPacingTimer] = useState(user.preferences?.showPacingTimer ?? true);
  const [gazeSensitivity, setGazeSensitivity] = useState(user.preferences?.gazeSensitivity ?? 'Normal');

  const [saveSuccess, setSaveSuccess] = useState(false);

  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return str.slice(0, 2).toUpperCase();
  };

  const currentGradientObj = AVATAR_GRADIENTS.find((g) => g.id === selectedGradient) || AVATAR_GRADIENTS[0];

  const handleSave = (e) => {
    e.preventDefault();

    const updatedProfile = {
      ...user,
      name: name.trim() || 'Candidate',
      email: email.trim(),
      headline: headline.trim(),
      avatarEmoji: selectedEmoji,
      avatarGradient: selectedGradient,
      track: track,
      experience: experience,
      targetCompany: targetCompany,
      preferences: {
        strictStar,
        showPacingTimer,
        gazeSensitivity
      }
    };

    onUpdateUser(updatedProfile);
    setSaveSuccess(true);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#6366f1', '#10b981', '#a855f7']
    });

    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your local session cache? Past SQLite data on server will remain intact.')) {
      try {
        localStorage.removeItem('ai_coach_history_cache');
      } catch (e) {}
      alert('Local session cache cleared successfully.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px',
          position: 'relative',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                background: currentGradientObj.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
              }}
            >
              <Sliders size={22} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Candidate Profile & Settings</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Manage your identity, target career goals, and AI coach evaluation preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '8px', borderRadius: '50%', minWidth: 'auto' }}
          >
            <X size={18} />
          </button>
        </div>

        {saveSuccess && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={18} />
            <span>Profile and settings updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Section 1: Avatar & Identity Customizer */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              marginBottom: '20px'
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} color="var(--primary-light)" />
              <span>Avatar & Visual Identity</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '18px' }}>
              {/* Live Avatar Preview */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: currentGradientObj.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: selectedEmoji ? '1.8rem' : '1.4rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
                  flexShrink: 0
                }}
              >
                {selectedEmoji || getInitials(name)}
              </div>

              {/* Emoji Picker */}
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Choose Avatar Badge / Emoji (or Click to Clear for Initials):
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {AVATAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(selectedEmoji === emoji ? '' : emoji)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: `1px solid ${selectedEmoji === emoji ? '#818cf8' : 'var(--border-subtle)'}`,
                        background: selectedEmoji === emoji ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                  {selectedEmoji && (
                    <button
                      type="button"
                      onClick={() => setSelectedEmoji('')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px dashed rgba(244, 63, 94, 0.4)',
                        background: 'rgba(244, 63, 94, 0.1)',
                        color: '#fb7185',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Use Initials
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Gradient Theme Picker */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Avatar Color Theme:
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {AVATAR_GRADIENTS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGradient(g.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      borderRadius: '9999px',
                      border: `1px solid ${selectedGradient === g.id ? '#fff' : 'var(--border-subtle)'}`,
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: selectedGradient === g.id ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: selectedGradient === g.id ? '0 0 10px rgba(255, 255, 255, 0.2)' : 'none'
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: g.gradient
                      }}
                    />
                    <span>{g.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Personal Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div className="auth-input-group">
              <label className="auth-input-label">Candidate Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="auth-input-field"
                style={{ padding: '10px 14px' }}
              />
            </div>

            <div className="auth-input-group">
              <label className="auth-input-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@example.com"
                className="auth-input-field"
                style={{ padding: '10px 14px' }}
              />
            </div>
          </div>

          <div className="auth-input-group" style={{ marginBottom: '20px' }}>
            <label className="auth-input-label">Professional Headline / Target Role</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Senior Full-Stack Engineer | Distributed Systems"
              className="auth-input-field"
              style={{ padding: '10px 14px' }}
            />
          </div>

          {/* Section 3: Career Goals & Experience */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              marginBottom: '20px'
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={16} color="#ec4899" />
              <span>Career Track & Interview Targeting</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div className="auth-input-group">
                <label className="auth-input-label">Primary Interview Track</label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  className="auth-input-field"
                  style={{ padding: '10px 12px' }}
                >
                  {CAREER_TRACKS.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label">Experience Level</label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="auth-input-field"
                  style={{ padding: '10px 12px' }}
                >
                  {EXPERIENCE_LEVELS.map((exp) => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="auth-input-group">
              <label className="auth-input-label">Target Industry / Company Type</label>
              <select
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                className="auth-input-field"
                style={{ padding: '10px 12px' }}
              >
                {TARGET_COMPANIES.map((tc) => (
                  <option key={tc} value={tc}>{tc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 4: Practice Preferences */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              marginBottom: '24px'
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color="#f59e0b" />
              <span>AI Coaching Preferences</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <div>
                  <strong>Strict STAR Method Evaluation</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Require Situation, Task, Action, and Result in behavioral questions</div>
                </div>
                <input
                  type="checkbox"
                  checked={strictStar}
                  onChange={(e) => setStrictStar(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <div>
                  <strong>Real-Time Pacing Velocity Indicator</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Highlight 120-160 WPM ideal cadence benchmarks in report</div>
                </div>
                <input
                  type="checkbox"
                  checked={showPacingTimer}
                  onChange={(e) => setShowPacingTimer(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
              </label>
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onLogout}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '8px 14px', color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                title="Clear local session cache"
              >
                <RefreshCw size={14} />
                <span>Clear Cache</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 22px' }}>
                <Save size={16} />
                <span>Save Profile</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
