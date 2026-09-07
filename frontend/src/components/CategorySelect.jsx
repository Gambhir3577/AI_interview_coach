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
  Award
} from 'lucide-react';
import { API_BASE } from '../config.js';

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

  // Fetch question for selected category
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
  }, [selectedCategory]);

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setShowQuestionList(false);
  };

  const handleStartPractice = () => {
    if (currentQuestion) {
      onSelectQuestion(currentQuestion);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Hero Welcome Banner */}
      <div
        className="glass-card"
        style={{
          padding: '36px 32px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ maxWidth: '750px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="badge badge-success">
              <Sparkles size={12} /> Ready for Practice
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              • 3-Factor Multimodal AI Evaluation
            </span>
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px', lineHeight: 1.2 }}>
            Master Your Next Interview with <br />
            <span className="gradient-text">Real-Time Speech & Content AI</span>
          </h2>

          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
            Practice realistic webcam interview responses. Our AI engine transcribes your speech via Whisper, detects filler words & speaking pace (WPM), analyzes eye contact via MediaPipe, and generates structured executive feedback with Anthropic Claude.
          </p>

          {/* Quick Feature Pillars */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#e2e8f0' }}>
              <div style={{ width: 24, height: 24, borderRadius: '6px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={14} color="#818cf8" />
              </div>
              <span>Speech Pace & Fillers</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#e2e8f0' }}>
              <div style={{ width: 24, height: 24, borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Video size={14} color="#34d399" />
              </div>
              <span>Gaze & Engagement Proxy</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#e2e8f0' }}>
              <div style={{ width: 24, height: 24, borderRadius: '6px', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={14} color="#c084fc" />
              </div>
              <span>STAR Method Scoring</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Category Selection Cards */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>1. Choose Interview Domain</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Select the interview style you want to practice today</p>
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
                      <CheckCircle2 size={14} /> Selected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Question Display & Control */}
      <div
        className="glass-card"
        style={{
          padding: '28px 32px',
          border: '1px solid var(--border-subtle)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Selected Practice Question
            </span>
            {currentQuestion && (
              <span className={`badge badge-${currentQuestion.category}`}>
                {currentQuestion.category}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => fetchRandomQuestion(selectedCategory)}
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
              <span>{showQuestionList ? 'Hide All' : 'Browse Bank (10)'}</span>
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
                  marginBottom: '24px'
                }}
              >
                <Lightbulb size={18} color="#818cf8" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  <strong style={{ color: '#a5b4fc' }}>Coach Tip: </strong>
                  {currentQuestion.tips}
                </div>
              </div>
            )}

            {/* Browse specific question modal/list if opened */}
            {showQuestionList && (
              <div
                style={{
                  marginBottom: '24px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Select from {selectedCategory.toUpperCase()} question bank:
                </div>
                {allQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestion(q);
                      setShowQuestionList(false);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      background: currentQuestion.id === q.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      color: currentQuestion.id === q.id ? '#ffffff' : '#94a3b8',
                      marginBottom: '4px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = currentQuestion.id === q.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent'}
                  >
                    <span style={{ color: 'var(--primary-light)', marginRight: 8, fontWeight: 700 }}>#{idx + 1}</span>
                    {q.question_text}
                  </div>
                ))}
              </div>
            )}

            {/* Start Practice Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleStartPractice}
                className="btn btn-primary btn-lg"
                style={{ minWidth: '220px' }}
              >
                <Video size={20} />
                <span>Start Practice Recording</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
