import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Sparkles, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Play, 
  Building,
  Target,
  Sliders
} from 'lucide-react';
import { API_BASE } from '../config.js';

export function ResumeJDModal({ isOpen, onClose, onLaunchQuestion }) {
  const [role, setRole] = useState('Software Engineer');
  const [seniority, setSeniority] = useState('Senior');
  const [company, setCompany] = useState('Tech Innovations Inc');
  const [resumeText, setResumeText] = useState(
    "Senior Full-Stack Engineer with 5+ years experience building scalable backend microservices in Python, Node.js, and PostgreSQL. Led migration to AWS Kubernetes, reducing P99 latency by 35% and managing a team of 4 engineers."
  );
  const [jdText, setJdText] = useState(
    "We are seeking a Senior Software Engineer to design high-throughput distributed transaction systems. Requirements: Deep experience with distributed caching, Kafka event streaming, relational DB sharding, and cross-functional leadership."
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!resumeText.trim() || !jdText.trim()) {
      setError("Please provide both Resume background notes and Job Description text.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/interview/generate-from-jd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: resumeText,
          jd_text: jdText,
          role,
          seniority,
          company,
          target_count: 5
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Resume/JD Generation error:", err);
      setError("Failed to generate tailored questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTailoredQuestion = (q) => {
    const questionObj = {
      id: Math.floor(Math.random() * 90000) + 10000,
      category: q.category || 'technical',
      role: role.toLowerCase().includes('pm') ? 'pm' : 'swe',
      company_preset: company.toLowerCase().includes('amazon') ? 'amazon' : 'general',
      difficulty: q.difficulty || seniority,
      question_text: q.question_text,
      tips: q.tips || `Tailored probe focusing on ${q.why_relevant || 'core job requirements'}.`
    };
    onLaunchQuestion(questionObj);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '880px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 32px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85)',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={22} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Resume & JD Question Matcher</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Auto-generate tailored interview questions based on actual job descriptions and your resume
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '8px', borderRadius: '50%', width: 36, height: 36 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Target Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="auth-input"
              placeholder="e.g. Senior Backend Engineer"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Seniority Tier
            </label>
            <select
              value={seniority}
              onChange={(e) => setSeniority(e.target.value)}
              className="auth-input"
              style={{ background: 'rgba(15, 23, 42, 0.95)', color: '#f8fafc', cursor: 'pointer' }}
            >
              <option value="Junior" style={{ background: '#0f172a', color: '#f8fafc' }}>Junior / Entry</option>
              <option value="Intermediate" style={{ background: '#0f172a', color: '#f8fafc' }}>Mid-Level</option>
              <option value="Senior" style={{ background: '#0f172a', color: '#f8fafc' }}>Senior</option>
              <option value="Lead" style={{ background: '#0f172a', color: '#f8fafc' }}>Lead / Staff / Principal</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Company Name
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="auth-input"
              placeholder="e.g. Stripe, Amazon, StartUp"
            />
          </div>
        </div>

        {/* Text Areas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#a5b4fc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <FileText size={15} /> Your Resume Summary / Core Experience
            </label>
            <textarea
              rows={5}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="auth-input"
              style={{ width: '100%', resize: 'vertical', fontSize: '0.85rem', lineHeight: 1.5 }}
              placeholder="Paste bullet points from your resume..."
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Briefcase size={15} /> Target Job Description (JD)
            </label>
            <textarea
              rows={5}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="auth-input"
              style={{ width: '100%', resize: 'vertical', fontSize: '0.85rem', lineHeight: 1.5 }}
              placeholder="Paste responsibilities and requirements from the job posting..."
            />
          </div>
        </div>

        {/* Generate Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ minWidth: '220px' }}
          >
            <Sparkles size={18} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Analyzing Fit & Generating...' : 'Generate 5 Tailored Questions'}</span>
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#fb7185', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '16px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '12px'
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '6px' }}>
                AI Match Synthesis: {result.role_summary}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.78rem' }}>
                <div style={{ color: '#34d399' }}>
                  <strong>Key Strengths:</strong> {result.detected_strengths?.join(', ')}
                </div>
                <div style={{ color: '#fbbf24' }}>
                  <strong>Identified Gaps:</strong> {result.identified_gaps?.join(', ')}
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
              Select a Tailored Question to Practice:
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {result.questions?.map((q, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectTailoredQuestion(q)}
                  className="glass-card"
                  style={{
                    padding: '14px 18px',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className={`badge badge-${q.category || 'technical'}`}>
                        {q.category?.toUpperCase()}
                      </span>
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#cbd5e1' }}>
                        {q.difficulty || seniority}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        🎯 {q.why_relevant}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', lineHeight: 1.4 }}>
                      "{q.question_text}"
                    </div>
                  </div>

                  <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem', flexShrink: 0 }}>
                    <Play size={14} fill="#ffffff" />
                    <span>Practice</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
