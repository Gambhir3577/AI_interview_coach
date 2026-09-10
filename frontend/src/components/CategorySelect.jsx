import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Code2, 
  Compass, 
  Sparkles, 
  Shuffle, 
  ArrowRight, 
  Lightbulb, 
  CheckCircle2, 
  Video, 
  Activity,
  Award,
  PlusCircle,
  Camera,
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Flame,
  Clock,
  Target,
  Eye,
  Sliders,
  Layers,
  Database,
  Briefcase,
  TrendingUp,
  DollarSign,
  FileText,
  FileCheck,
  Building2,
  Mic,
  Volume2
} from 'lucide-react';
import { API_BASE } from '../config.js';
import { CustomQuestionModal } from './CustomQuestionModal.jsx';
import { DeviceCheckModal } from './DeviceCheckModal.jsx';

const CAREER_TRACKS = [
  { id: 'swe', title: 'Software Engineering', icon: Code2, color: '#06b6d4', category: 'technical', count: '15+ Prompts', desc: 'Algorithms, distributed systems, API architecture, and concurrency.' },
  { id: 'pm', title: 'Product Management', icon: Briefcase, color: '#ec4899', category: 'product', count: '10+ Prompts', desc: 'Product sense, metrics/execution, user empathy, and prioritization.' },
  { id: 'data_science', title: 'Data Science & ML', icon: Database, color: '#8b5cf6', category: 'data_science', count: '10+ Prompts', desc: 'Machine learning, A/B testing, MLOps, statistical modeling, and SQL.' },
  { id: 'system_design', title: 'System Design', icon: Layers, color: '#3b82f6', category: 'system_design', count: '8+ Prompts', desc: 'High-availability, sharding, caching, microservices, and consensus.' },
  { id: 'behavioral', title: 'Behavioral & STAR', icon: Compass, color: '#a855f7', category: 'behavioral', count: '15+ Prompts', desc: 'Leadership, ownership, conflict resolution, and resilience storytelling.' },
  { id: 'general', title: 'HR & Culture Fit', icon: Users, color: '#6366f1', category: 'hr', count: '10+ Prompts', desc: 'Career milestones, motivation, culture alignment, and work style.' },
  { id: 'marketing', title: 'Growth & Marketing', icon: TrendingUp, color: '#f59e0b', category: 'hr', count: '6+ Prompts', desc: 'Multi-channel acquisition, CAC/LTV, funnel conversion, and brand strategy.' },
  { id: 'finance', title: 'Finance & FinTech', icon: DollarSign, color: '#10b981', category: 'technical', count: '6+ Prompts', desc: 'Underwriting models, risk assessment, fraud detection, and valuation.' }
];

const COMPANY_PRESETS = [
  { id: 'general', label: 'All Companies / Standard' },
  { id: 'amazon', label: 'Amazon (16 Leadership Principles)' },
  { id: 'google', label: 'Google (Googleyness & Systems)' },
  { id: 'meta', label: 'Meta (Move Fast & High Impact)' },
  { id: 'mckinsey', label: 'McKinsey & Case (MECE Structure)' }
];

const DIFFICULTY_TIERS = ['all', 'Junior', 'Intermediate', 'Senior', 'Lead'];

const PRACTICE_MODES = [
  { id: 'standard', title: 'Standard Practice Drill', desc: 'Single question recording with AI multimodal scorecard', icon: Video, color: '#6366f1' },
  { id: 'voice_multiturn', title: 'Voice Mock (Multi-Turn)', desc: 'AI interviewer speaks out loud and probes with dynamic follow-ups', icon: Mic, color: '#ec4899' },
  { id: 'star_guided', title: 'Guided STAR Round', desc: 'Live stage hints (Situation -> Task -> Action -> Result)', icon: Sparkles, color: '#a855f7' },
  { id: 'timed_pressure', title: 'Timed Pressure Round', desc: 'Simulate high-stakes pressure with 30s-5m countdown timer', icon: Clock, color: '#f59e0b' }
];

export function CategorySelect({ onSelectQuestion, onOpenResumeJD, onOpenNegotiation, onOpenCheatSheets, onOpenDebrief, onOpenAnalytics }) {
  const [selectedTrack, setSelectedTrack] = useState('swe');
  const [selectedCompany, setSelectedCompany] = useState('general');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedMode, setSelectedMode] = useState('voice_multiturn');
  const [timerLimit, setTimerLimit] = useState(90); // default 90s

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isStarGuideOpen, setIsStarGuideOpen] = useState(false);

  // Candidate Analytics
  const [stats, setStats] = useState({
    totalSessions: 0,
    avgScore: 82,
    avgWpm: 138,
    streak: 3
  });

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/trends`);
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalSessions: data.total_sessions || 0,
          avgScore: data.avg_overall_score || 82,
          avgWpm: data.avg_wpm || 138,
          streak: 3
        });
      }
    } catch (e) {}
  };

  const fetchRandomQuestion = async (trackId, compPreset, diffTier) => {
    setLoading(true);
    try {
      const activeTrack = CAREER_TRACKS.find(t => t.id === trackId) || CAREER_TRACKS[0];
      let url = `${API_BASE}/questions?role=${trackId}&category=${activeTrack.category}`;
      if (compPreset && compPreset !== 'general') url += `&company_preset=${compPreset}`;
      if (diffTier && diffTier !== 'all') url += `&difficulty=${diffTier}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCurrentQuestion(data);
      }
    } catch (err) {
      console.error('Failed to fetch question:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllForTrack = async (trackId) => {
    try {
      const res = await fetch(`${API_BASE}/questions/all?role=${trackId}`);
      if (res.ok) {
        const data = await res.json();
        setAllQuestions(data);
      }
    } catch (err) {
      console.error('Failed to fetch all questions:', err);
    }
  };

  useEffect(() => {
    fetchRandomQuestion(selectedTrack, selectedCompany, selectedDifficulty);
    fetchAllForTrack(selectedTrack);
    fetchStats();
  }, [selectedTrack, selectedCompany, selectedDifficulty]);

  const handleStartPractice = () => {
    if (currentQuestion) {
      onSelectQuestion({
        ...currentQuestion,
        practiceMode: selectedMode,
        timerLimit: timerLimit
      });
    }
  };

  const filteredQuestions = allQuestions.filter((q) => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.tips && q.tips.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDiff = selectedDifficulty === 'all' || 
      (q.difficulty && q.difficulty.toLowerCase().includes(selectedDifficulty.toLowerCase()));
    return matchesSearch && matchesDiff;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* 1. Candidate Analytics & Quick Tools Bar */}
      <div className="stats-bar-grid">
        <div className="stat-card-mini" onClick={onOpenAnalytics} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <Target size={22} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Practice Sessions
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
              {stats.totalSessions} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>completed</span>
            </div>
          </div>
        </div>

        <div className="stat-card-mini" onClick={onOpenAnalytics} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <Award size={22} color="#34d399" />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Avg Performance
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399' }}>
              {stats.avgScore}/100
            </div>
          </div>
        </div>

        <div className="stat-card-mini" onClick={onOpenAnalytics} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
            <Activity size={22} color="#f472b6" />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Pace Gauge
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
              {stats.avgWpm} WPM <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>Ideal</span>
            </div>
          </div>
        </div>

        <div className="stat-card-mini" onClick={onOpenAnalytics} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <Flame size={22} color="#fbbf24" />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Practice Streak
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fbbf24' }}>
              {stats.streak} Days 🔥
            </div>
          </div>
        </div>
      </div>

      {/* 2. Hero Hub with Integrated Extra Utilities */}
      <div
        className="glass-card"
        style={{
          padding: '28px 32px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ maxWidth: '700px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span className="badge badge-success">
                <Sparkles size={12} /> Voice & Vision Multimodal AI
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                • Role Tracks &bull; Follow-Up Probing &bull; Model Answers &bull; Salary Simulator
              </span>
            </div>

            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '8px', lineHeight: 1.25 }}>
              Master Your Next Interview with <br />
              <span className="gradient-text">Role-Specific AI Coaching</span>
            </h2>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '18px' }}>
              Practice speaking out loud. Get real-time voice follow-ups, structural STAR feedback, eye-contact/posture analysis, and rewritten model answers.
            </p>

            {/* Quick Action Tools Hub */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button
                onClick={onOpenResumeJD}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '7px 12px', background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.4)' }}
              >
                <FileText size={15} color="#818cf8" />
                <span>Resume & JD Matcher</span>
              </button>

              <button
                onClick={onOpenNegotiation}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '7px 12px', background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
              >
                <DollarSign size={15} color="#fbbf24" />
                <span>Salary Negotiation Simulator</span>
              </button>

              <button
                onClick={onOpenCheatSheets}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '7px 12px', background: 'rgba(6, 182, 212, 0.15)', borderColor: 'rgba(6, 182, 212, 0.4)' }}
              >
                <BookOpen size={15} color="#22d3ee" />
                <span>Role Cheat Sheets</span>
              </button>

              <button
                onClick={onOpenDebrief}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '7px 12px', background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)' }}
              >
                <FileCheck size={15} color="#34d399" />
                <span>Post-Interview Debrief</span>
              </button>

              <button
                onClick={() => setIsStarGuideOpen(!isStarGuideOpen)}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '7px 12px', background: 'rgba(168, 85, 247, 0.15)', borderColor: 'rgba(168, 85, 247, 0.4)' }}
              >
                <Sparkles size={15} color="#c084fc" />
                <span>STAR Method Guide</span>
                {isStarGuideOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Collapsible STAR Guide */}
      {isStarGuideOpen && (
        <div className="star-guide-card">
          <div className="star-guide-header" onClick={() => setIsStarGuideOpen(false)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#a855f7" />
              <strong style={{ fontSize: '0.95rem', color: '#f8fafc' }}>
                STAR Method Storytelling Framework (Situation • Task • Action • Result)
              </strong>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#c084fc', fontWeight: 600 }}>Hide Guide ▲</span>
          </div>

          <div className="star-grid-4">
            <div className="star-pillar-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="star-letter-badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.4)' }}>S</div>
                <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>Situation (15%)</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Set context in 1-2 concise sentences. Where were you working and what was the challenge?
              </p>
            </div>

            <div className="star-pillar-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="star-letter-badge" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.4)' }}>T</div>
                <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>Task (15%)</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Explain the specific roadblock or outcome you personally needed to deliver.
              </p>
            </div>

            <div className="star-pillar-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="star-letter-badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)' }}>A</div>
                <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>Action (50%)</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Detail the technical or leadership steps you engineered. Focus on "I", not "We".
              </p>
            </div>

            <div className="star-pillar-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="star-letter-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' }}>R</div>
                <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>Result (20%)</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Quantify the outcome with percentages, latency drops, or revenue uplift.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Career Track Selection Grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>1. Select Career Track</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Choose the domain focus for today's mock interview</p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '14px'
          }}
        >
          {CAREER_TRACKS.map((track) => {
            const Icon = track.icon;
            const isSelected = selectedTrack === track.id;

            return (
              <div
                key={track.id}
                onClick={() => setSelectedTrack(track.id)}
                className={`glass-card ${isSelected ? 'glass-card-glow' : ''}`}
                style={{
                  padding: '18px 20px',
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${track.color}` : '1px solid var(--border-subtle)',
                  background: isSelected ? `linear-gradient(135deg, ${track.color}25 0%, rgba(15, 23, 42, 0.8) 100%)` : 'var(--bg-card)',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      backgroundColor: `${track.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${track.color}40`
                    }}
                  >
                    <Icon size={20} color={track.color} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{track.count}</span>
                </div>

                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: isSelected ? '#ffffff' : '#f1f5f9', marginBottom: '4px' }}>
                  {track.title}
                </h4>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {track.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Company Presets & Difficulty Bar */}
      <div
        className="glass-card"
        style={{
          padding: '18px 22px',
          border: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          alignItems: 'center'
        }}
      >
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            Company Style Preset
          </label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="auth-input"
            style={{ background: 'rgba(15, 23, 42, 0.95)', color: '#f8fafc', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            {COMPANY_PRESETS.map((p) => (
              <option key={p.id} value={p.id} style={{ background: '#0f172a', color: '#f8fafc' }}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            Difficulty Tier
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {DIFFICULTY_TIERS.map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedDifficulty(tier)}
                className={`difficulty-pill ${selectedDifficulty === tier ? 'active' : ''}`}
                style={{ flex: 1, padding: '6px 4px', fontSize: '0.72rem' }}
              >
                {tier.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            Practice Mode
          </label>
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="auth-input"
            style={{ background: 'rgba(15, 23, 42, 0.95)', color: '#f8fafc', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            {PRACTICE_MODES.map((m) => (
              <option key={m.id} value={m.id} style={{ background: '#0f172a', color: '#f8fafc' }}>{m.title}</option>
            ))}
          </select>
        </div>

        {selectedMode === 'timed_pressure' && (
          <div>
            <label style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              ⏱️ Timer Limit
            </label>
            <select
              value={timerLimit}
              onChange={(e) => setTimerLimit(parseInt(e.target.value))}
              className="auth-input"
              style={{ background: 'rgba(15, 23, 42, 0.95)', color: '#f8fafc', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <option value={30} style={{ background: '#0f172a', color: '#f8fafc' }}>30s (Rapid Drill)</option>
              <option value={60} style={{ background: '#0f172a', color: '#f8fafc' }}>60s (Concise Pitch)</option>
              <option value={90} style={{ background: '#0f172a', color: '#f8fafc' }}>90s (Standard STAR)</option>
              <option value={120} style={{ background: '#0f172a', color: '#f8fafc' }}>2 mins (Deep-Dive)</option>
              <option value={180} style={{ background: '#0f172a', color: '#f8fafc' }}>3 mins (Extended Story)</option>
              <option value={300} style={{ background: '#0f172a', color: '#f8fafc' }}>5 mins (Case / System)</option>
            </select>
          </div>
        )}
      </div>

      {/* 6. Question Studio Display & Launch */}
      <div className="glass-card" style={{ padding: '24px 28px', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Target Question
            </span>
            {currentQuestion && (
              <>
                <span className={`badge badge-${currentQuestion.category || 'technical'}`}>
                  {currentQuestion.role?.toUpperCase() || 'SWE'}
                </span>
                <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#e2e8f0' }}>
                  {currentQuestion.difficulty || 'Intermediate'}
                </span>
                {currentQuestion.company_preset !== 'general' && (
                  <span className="badge badge-behavioral">
                    {currentQuestion.company_preset?.toUpperCase()}
                  </span>
                )}
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => fetchRandomQuestion(selectedTrack, selectedCompany, selectedDifficulty)}
              disabled={loading}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              <Shuffle size={14} className={loading ? 'animate-spin' : ''} />
              <span>Shuffle Question</span>
            </button>
            <button
              onClick={() => setShowQuestionList(!showQuestionList)}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              <Sliders size={14} />
              <span>{showQuestionList ? 'Hide Browser' : `Browse Bank (${allQuestions.length})`}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '8px' }}>
              <Sparkles size={24} color="var(--primary)" />
            </div>
            <p style={{ fontSize: '0.9rem' }}>Selecting interview prompt...</p>
          </div>
        ) : currentQuestion ? (
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.4, marginBottom: '14px' }}>
              "{currentQuestion.question_text}"
            </h3>

            {currentQuestion.tips && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 16px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  borderLeft: '4px solid #6366f1',
                  borderRadius: '0 8px 8px 0',
                  marginBottom: '20px'
                }}
              >
                <Lightbulb size={16} color="#818cf8" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  <strong style={{ color: '#a5b4fc' }}>Coach Tip: </strong>
                  {currentQuestion.tips}
                </div>
              </div>
            )}

            {/* Question Browser Drawer */}
            {showQuestionList && (
              <div
                style={{
                  marginBottom: '20px',
                  background: 'rgba(8, 12, 22, 0.85)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(99, 102, 241, 0.25)'
                }}
              >
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder={`Search questions in ${selectedTrack}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="auth-input"
                    style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                  />
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {filteredQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      onClick={() => {
                        setCurrentQuestion(q);
                        setShowQuestionList(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        background: currentQuestion.id === q.id ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                        color: currentQuestion.id === q.id ? '#ffffff' : '#94a3b8',
                        marginBottom: '3px'
                      }}
                    >
                      <span style={{ color: 'var(--primary-light)', marginRight: 6 }}>#{idx + 1}</span>
                      <span>{q.question_text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Start Practice Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={handleStartPractice}
                className="btn btn-primary btn-lg"
                style={{ minWidth: '240px' }}
              >
                <Video size={18} />
                <span>Launch Practice Session</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Modals */}
      <CustomQuestionModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onStartCustomQuestion={(customQ) => onSelectQuestion(customQ)}
      />

      <DeviceCheckModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
      />
    </div>
  );
}
