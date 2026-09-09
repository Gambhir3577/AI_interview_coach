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
  Sliders
} from 'lucide-react';
import { API_BASE } from '../config.js';
import { CustomQuestionModal } from './CustomQuestionModal.jsx';
import { DeviceCheckModal } from './DeviceCheckModal.jsx';

const CATEGORIES = [
  {
    id: 'hr',
    title: 'HR & Culture Fit',
    icon: Users,
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%)',
    border: 'rgba(99, 102, 241, 0.3)',
    description: 'Master introductory storytelling, strengths, career trajectory, and workplace cultural alignment.',
    badgeClass: 'badge-hr',
    count: '10 Curated Prompts'
  },
  {
    id: 'technical',
    title: 'Technical & Systems',
    icon: Code2,
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.05) 100%)',
    border: 'rgba(6, 182, 212, 0.3)',
    description: 'Articulate OOP fundamentals, SQL vs NoSQL, distributed systems, Big-O complexity, and APIs clearly.',
    badgeClass: 'badge-technical',
    count: '10 Curated Prompts'
  },
  {
    id: 'behavioral',
    title: 'Behavioral & Leadership',
    icon: Compass,
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.05) 100%)',
    border: 'rgba(168, 85, 247, 0.3)',
    description: 'Demonstrate leadership, conflict resolution, and resilience evaluated with the STAR method framework.',
    badgeClass: 'badge-behavioral',
    count: '10 Curated Prompts'
  }
];

export function CategorySelect({ onSelectQuestion, defaultCategory = 'behavioral' }) {
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);
  const [showQuestionList, setShowQuestionList] = useState(false);
  
  // New Feature States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isStarGuideOpen, setIsStarGuideOpen] = useState(false);

  // Candidate Analytics
  const [stats, setStats] = useState({
    totalSessions: 0,
    avgScore: 0,
    avgWpm: 0,
    avgEyeContact: 0,
    streak: 1
  });

  // Fetch candidate history to compute live analytics stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/history?limit=100`);
      if (res.ok) {
        const historyData = await res.json();
        if (historyData.length > 0) {
          const total = historyData.length;
          const sumScore = historyData.reduce((acc, curr) => acc + (curr.overall_score || 70), 0);
          const sumWpm = historyData.reduce((acc, curr) => acc + (curr.wpm || 135), 0);
          const sumEye = historyData.reduce((acc, curr) => acc + (curr.eye_contact_percentage || 75), 0);

          setStats({
            totalSessions: total,
            avgScore: Math.round(sumScore / total),
            avgWpm: Math.round(sumWpm / total),
            avgEyeContact: Math.round(sumEye / total),
            streak: Math.min(total, 7) || 1
          });
        }
      }
    } catch (e) {
      // Backend may be starting
    }
  };

  // Fetch random question for selected category
  const fetchRandomQuestion = async (category) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/questions?category=${category}`);
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

  // Fetch all questions for category browsing
  const fetchAllForCategory = async (category) => {
    try {
      const res = await fetch(`${API_BASE}/questions/all?category=${category}`);
      if (res.ok) {
        const data = await res.json();
        setAllQuestions(data);
      }
    } catch (err) {
      console.error('Failed to fetch all questions:', err);
    }
  };

  useEffect(() => {
    fetchRandomQuestion(selectedCategory);
    fetchAllForCategory(selectedCategory);
    fetchStats();
  }, [selectedCategory]);

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setShowQuestionList(false);
    setSearchQuery('');
  };

  const handleStartPractice = () => {
    if (currentQuestion) {
      onSelectQuestion(currentQuestion);
    }
  };

  const handleStartCustomQuestion = (customQ) => {
    setCurrentQuestion(customQ);
    onSelectQuestion(customQ);
  };

  // Filter questions based on search & difficulty
  const filteredQuestions = allQuestions.filter((q) => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.tips && q.tips.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDiff = selectedDifficulty === 'all' || 
      (q.difficulty && q.difficulty.toLowerCase() === selectedDifficulty.toLowerCase());
    return matchesSearch && matchesDiff;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* 1. Candidate Analytics & Fluency Progress Bar */}
      <div className="stats-bar-grid">
        <div className="stat-card-mini">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <Target size={22} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Practice Sessions
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
              {stats.totalSessions} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>completed</span>
            </div>
          </div>
        </div>

        <div className="stat-card-mini">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <Award size={22} color="#34d399" />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Avg Fluency Score
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
              {stats.avgScore > 0 ? `${stats.avgScore}/100` : '82/100'}
            </div>
          </div>
        </div>

        <div className="stat-card-mini">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
            <Activity size={22} color="#f472b6" />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Speaking Pace
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
              {stats.avgWpm > 0 ? `${stats.avgWpm} WPM` : '138 WPM'} <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>Ideal</span>
            </div>
          </div>
        </div>

        <div className="stat-card-mini">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <Flame size={22} color="#fbbf24" />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Practice Streak
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>
              {stats.streak} Days 🔥
            </div>
          </div>
        </div>
      </div>

      {/* 2. Hero Welcome Banner & Action Hub */}
      <div
        className="glass-card"
        style={{
          padding: '32px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ maxWidth: '680px', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className="badge badge-success">
                <Sparkles size={12} /> Real-Time Multimodal AI
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                • Whisper STT &bull; MediaPipe Iris &bull; Claude STAR Coach
              </span>
            </div>

            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '10px', lineHeight: 1.2 }}>
              Master Your Next Interview with <br />
              <span className="gradient-text">On-Device Speech & Vision AI</span>
            </h2>

            <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Practice live webcam responses. Get automated evaluations on filler words, WPM speech velocity, camera gaze engagement, and structured STAR storytelling.
            </p>

            {/* Quick Action Tools */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button
                onClick={() => setIsCustomModalOpen(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.84rem', padding: '8px 14px', background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.4)' }}
              >
                <PlusCircle size={16} color="#818cf8" />
                <span>+ Custom Question Prompt</span>
              </button>

              <button
                onClick={() => setIsDeviceModalOpen(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.84rem', padding: '8px 14px', background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)' }}
              >
                <Camera size={16} color="#34d399" />
                <span>Pre-flight Mic & Cam Check</span>
              </button>

              <button
                onClick={() => setIsStarGuideOpen(!isStarGuideOpen)}
                className="btn btn-secondary"
                style={{ fontSize: '0.84rem', padding: '8px 14px', background: 'rgba(168, 85, 247, 0.12)', borderColor: 'rgba(168, 85, 247, 0.35)' }}
              >
                <BookOpen size={16} color="#c084fc" />
                <span>STAR Method Cheat Sheet</span>
                {isStarGuideOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Collapsible STAR Method Guide */}
      {isStarGuideOpen && (
        <div className="star-guide-card">
          <div className="star-guide-header" onClick={() => setIsStarGuideOpen(false)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} color="#a855f7" />
              <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>
                STAR Method Mastery Guide (Situation &bull; Task &bull; Action &bull; Result)
              </strong>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 600 }}>Hide Guide ▲</span>
          </div>

          <div className="star-grid-4">
            <div className="star-pillar-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="star-letter-badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
                  S
                </div>
                <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>Situation</strong>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Set the scene in 1-2 concise sentences. Where were you working and what was the context?
              </p>
              <div style={{ fontSize: '0.75rem', color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.1)', padding: '6px 8px', borderRadius: '6px' }}>
                <em>"In my last role at TechCorp, our production API experienced 45% traffic surges..."</em>
              </div>
            </div>

            <div className="star-pillar-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="star-letter-badge" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.4)' }}>
                  T
                </div>
                <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>Task</strong>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Explain the specific objective or roadblock you personally needed to conquer.
              </p>
              <div style={{ fontSize: '0.75rem', color: '#67e8f9', background: 'rgba(6, 182, 212, 0.1)', padding: '6px 8px', borderRadius: '6px' }}>
                <em>"My task was to eliminate database write locks without dropping user transactions."</em>
              </div>
            </div>

            <div className="star-pillar-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="star-letter-badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                  A
                </div>
                <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>Action</strong>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Detail the exact technical or leadership steps you engineered. Focus on "I", not "We".
              </p>
              <div style={{ fontSize: '0.75rem', color: '#d8b4fe', background: 'rgba(168, 85, 247, 0.1)', padding: '6px 8px', borderRadius: '6px' }}>
                <em>"I designed an asynchronous Redis queue and refactored SQL queries to batch updates..."</em>
              </div>
            </div>

            <div className="star-pillar-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="star-letter-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                  R
                </div>
                <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>Result</strong>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Quantify the outcome. Mention measurable metric improvements, percentages, or learnings.
              </p>
              <div style={{ fontSize: '0.75rem', color: '#6ee7b7', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 8px', borderRadius: '6px' }}>
                <em>"As a result, latency dropped by 62% and our system achieved 99.99% uptime."</em>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Category Domain Selection Cards */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>1. Choose Interview Track</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Select the evaluation focus domain for today's mock session</p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '18px'
          }}
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`glass-card ${isSelected ? 'glass-card-glow' : ''}`}
                style={{
                  padding: '24px',
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${cat.color}` : '1px solid var(--border-subtle)',
                  background: isSelected ? cat.gradient : 'var(--bg-card)',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      backgroundColor: `${cat.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${cat.color}40`
                    }}
                  >
                    <Icon size={24} color={cat.color} />
                  </div>
                  <span className={`badge ${cat.badgeClass}`}>
                    {cat.id.toUpperCase()}
                  </span>
                </div>

                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', color: isSelected ? '#ffffff' : '#f1f5f9' }}>
                  {cat.title}
                </h4>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                  {cat.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>{cat.count}</span>
                  {isSelected && (
                    <span style={{ color: cat.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> Selected Track
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Question Display & Advanced Filter Hub */}
      <div
        className="glass-card"
        style={{
          padding: '28px 32px',
          border: '1px solid var(--border-subtle)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Target Question
            </span>
            {currentQuestion && (
              <>
                <span className={`badge badge-${currentQuestion.category}`}>
                  {currentQuestion.category}
                </span>
                <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#e2e8f0' }}>
                  {currentQuestion.difficulty || 'Intermediate'}
                </span>
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <Clock size={13} color="var(--primary-light)" />
              <span>Recommended: 60-90s</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => fetchRandomQuestion(selectedCategory)}
              disabled={loading}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              <Shuffle size={14} className={loading ? 'animate-spin' : ''} />
              <span>Shuffle Random</span>
            </button>
            <button
              onClick={() => setShowQuestionList(!showQuestionList)}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              <Sliders size={14} />
              <span>{showQuestionList ? 'Hide Browser' : `Browse & Filter (${allQuestions.length})`}</span>
            </button>
          </div>
        </div>

        {/* Question Text Display */}
        {loading ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '8px' }}>
              <Sparkles size={24} color="var(--primary)" />
            </div>
            <p style={{ fontSize: '0.9rem' }}>Selecting interview question...</p>
          </div>
        ) : currentQuestion ? (
          <div>
            <h3
              style={{
                fontSize: '1.45rem',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.4,
                marginBottom: '14px'
              }}
            >
              "{currentQuestion.question_text}"
            </h3>

            {/* Coach Tip Box */}
            {currentQuestion.tips && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px 18px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  borderLeft: '4px solid #6366f1',
                  borderRadius: '0 8px 8px 0',
                  marginBottom: '22px'
                }}
              >
                <Lightbulb size={18} color="#818cf8" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  <strong style={{ color: '#a5b4fc' }}>Coach Tip: </strong>
                  {currentQuestion.tips}
                </div>
              </div>
            )}

            {/* Browse & Filter Drawer if opened */}
            {showQuestionList && (
              <div
                style={{
                  marginBottom: '24px',
                  background: 'rgba(8, 12, 22, 0.85)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)'
                }}
              >
                {/* Search & Filter Bar */}
                <div className="question-filter-bar">
                  <div className="filter-search-wrapper">
                    <Search size={16} className="auth-input-icon" />
                    <input
                      type="text"
                      placeholder={`Search ${selectedCategory} questions by keyword...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="filter-search-input"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['all', 'General', 'Intermediate', 'Advanced'].map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        className={`difficulty-pill ${selectedDifficulty === diff ? 'active' : ''}`}
                        onClick={() => setSelectedDifficulty(diff)}
                      >
                        {diff.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {filteredQuestions.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No questions match "{searchQuery}".
                    </div>
                  ) : (
                    filteredQuestions.map((q, idx) => (
                      <div
                        key={q.id}
                        onClick={() => {
                          setCurrentQuestion(q);
                          setShowQuestionList(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.88rem',
                          background: currentQuestion.id === q.id ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                          color: currentQuestion.id === q.id ? '#ffffff' : '#94a3b8',
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = currentQuestion.id === q.id ? 'rgba(99, 102, 241, 0.25)' : 'transparent'}
                      >
                        <div>
                          <span style={{ color: 'var(--primary-light)', marginRight: 8, fontWeight: 700 }}>#{idx + 1}</span>
                          <span>{q.question_text}</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                          {q.difficulty || 'Intermediate'}
                        </span>
                      </div>
                    ))
                  )}
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
                <Video size={20} />
                <span>Start Practice Recording</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Modals */}
      <CustomQuestionModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onStartCustomQuestion={handleStartCustomQuestion}
      />

      <DeviceCheckModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
      />
    </div>
  );
}
