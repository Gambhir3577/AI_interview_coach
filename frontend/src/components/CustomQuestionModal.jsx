import React, { useState } from 'react';
import { X, Sparkles, PlusCircle, ArrowRight, Lightbulb, Briefcase, HelpCircle } from 'lucide-react';

export function CustomQuestionModal({ isOpen, onClose, onStartCustomQuestion }) {
  const [questionText, setQuestionText] = useState('');
  const [category, setCategory] = useState('behavioral');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [tips, setTips] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!questionText.trim() || questionText.trim().length < 8) {
      setError('Please provide a specific interview question (at least 8 characters).');
      return;
    }

    const customQuestion = {
      id: 9999 + Math.floor(Math.random() * 10000),
      category: category,
      question_text: questionText.trim(),
      difficulty: difficulty,
      tips: tips.trim() || 'Focus on concrete examples, clear structural transitions, and actionable results.',
      isCustom: true
    };

    onStartCustomQuestion(customQuestion);
    onClose();
  };

  const SAMPLE_TEMPLATES = [
    {
      title: 'System Design Scaling',
      category: 'technical',
      text: 'How would you design a distributed rate limiter for a high-traffic microservices API?',
      tips: 'Cover Token Bucket / Sliding Window algorithms, Redis cluster storage, and latency vs accuracy trade-offs.'
    },
    {
      title: 'Cross-functional Conflict',
      category: 'behavioral',
      text: 'Describe a situation where engineering and product management had conflicting deadlines. How did you resolve it?',
      tips: 'Use the STAR method: describe data-driven trade-offs, scoping down to an MVP, and maintaining psychological safety.'
    },
    {
      title: 'Company Mission & Value',
      category: 'hr',
      text: 'What excites you most about our company’s mission, and how does this role align with your 3-year career goals?',
      tips: 'Show genuine research into the product or recent milestones, connecting them to your personal strengths.'
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px',
          position: 'relative',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PlusCircle size={22} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Create Custom Question</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Practice any prompt from a job listing or company interview
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

        {/* Quick Sample Prompts */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
            QUICK TEMPLATES (CLICK TO INSERT):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SAMPLE_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setCategory(tpl.category);
                  setQuestionText(tpl.text);
                  setTips(tpl.tips);
                  setError('');
                }}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <strong style={{ color: 'var(--primary-light)', marginRight: 6 }}>{tpl.title}:</strong>
                {tpl.text}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#fb7185',
              fontSize: '0.82rem',
              marginBottom: '16px'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Domain & Difficulty Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div className="auth-input-group">
              <label className="auth-input-label">Category / Domain</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="auth-input-field"
                style={{ padding: '10px 12px' }}
              >
                <option value="behavioral">Behavioral & Leadership</option>
                <option value="technical">Technical & Architecture</option>
                <option value="hr">HR & Culture Fit</option>
              </select>
            </div>

            <div className="auth-input-group">
              <label className="auth-input-label">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="auth-input-field"
                style={{ padding: '10px 12px' }}
              >
                <option value="General">General / Junior</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced / Senior</option>
                <option value="Staff">Staff / Principal</option>
              </select>
            </div>
          </div>

          {/* Question Text Area */}
          <div className="auth-input-group">
            <label className="auth-input-label">Interview Question Prompt *</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Tell me about a time you had to migrate a production system with zero downtime..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="auth-input-field"
              style={{ padding: '12px', resize: 'vertical' }}
            />
          </div>

          {/* Coaching Tips */}
          <div className="auth-input-group" style={{ marginBottom: '24px' }}>
            <label className="auth-input-label">
              <Lightbulb size={14} color="#f59e0b" /> Key Evaluation Points / Coach Tips (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Look for backward compatibility, rollback strategy, canary deploy..."
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              className="auth-input-field"
              style={{ padding: '10px 12px' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>
              <span>Launch Custom Practice</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
