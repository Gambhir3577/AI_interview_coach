import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Layers, 
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import { API_BASE } from '../config.js';

export function CheatSheetView({ onBack }) {
  const [role, setRole] = useState('Software Engineer');
  const [seniority, setSeniority] = useState('Senior');
  const [company, setCompany] = useState('General Tech');
  const [industry, setIndustry] = useState('Cloud & SaaS');
  const [loading, setLoading] = useState(false);
  const [cheatSheet, setCheatSheet] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/cheatsheet/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          seniority,
          company,
          industry
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCheatSheet(data);
      }
    } catch (err) {
      console.error("Cheat sheet generator error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    if (!cheatSheet) return;
    const text = `
=== ${cheatSheet.seniority} ${cheatSheet.role_title} Interview Playbook ===
Company Target: ${cheatSheet.target_company}

OVERVIEW:
${cheatSheet.overview}

TOP INTERVIEW QUESTIONS & FRAMEWORKS:
${cheatSheet.top_questions.map((q, i) => `
${i + 1}. [${q.category}] ${q.question}
Framework: ${q.framework}
Key Points:
${q.ideal_response_bullet_points.map(p => `  • ${p}`).join('\n')}
Pitfalls to Avoid: ${q.pitfalls_to_avoid.join(', ')}
Key Buzzwords/Metrics: ${q.key_metrics_or_buzzwords.join(', ')}
`).join('\n')}

QUESTIONS TO ASK THE INTERVIEWER:
${cheatSheet.top_questions_to_ask_interviewer.map(q => `• ${q}`).join('\n')}

DAY-BEFORE CHECKLIST:
${cheatSheet.day_before_checklist.map(c => `[ ] ${c}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            📚 Role-Specific <span className="gradient-text">Q&A Cheat Sheet Generator</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Generate high-impact answer frameworks, buzzwords, pitfalls, and reverse questions tailored to your exact role & seniority.
          </p>
        </div>

        <button onClick={onBack} className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
          <span>Back to Tracks</span>
        </button>
      </div>

      {/* Configuration Controls */}
      <div
        className="glass-card"
        style={{
          padding: '20px 24px',
          border: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          alignItems: 'flex-end'
        }}
      >
        <div>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
            Target Role
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="auth-input"
            placeholder="e.g. Product Manager, Backend Engineer"
          />
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
            Seniority
          </label>
          <select
            value={seniority}
            onChange={(e) => setSeniority(e.target.value)}
            className="auth-input"
            style={{ background: 'rgba(15, 23, 42, 0.95)', color: '#f8fafc', cursor: 'pointer' }}
          >
            <option value="Junior" style={{ background: '#0f172a', color: '#f8fafc' }}>Junior</option>
            <option value="Intermediate" style={{ background: '#0f172a', color: '#f8fafc' }}>Mid-Level</option>
            <option value="Senior" style={{ background: '#0f172a', color: '#f8fafc' }}>Senior</option>
            <option value="Lead" style={{ background: '#0f172a', color: '#f8fafc' }}>Lead / Principal</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
            Target Company / Preset
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="auth-input"
            placeholder="e.g. Amazon, Google, Startups"
          />
        </div>

        <div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px 16px', fontSize: '0.88rem' }}
          >
            <Sparkles size={16} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Compiling Playbook...' : 'Generate Cheat Sheet'}</span>
          </button>
        </div>
      </div>

      {/* Render Cheat Sheet Playbook */}
      {cheatSheet && (
        <div id="printable-cheatsheet" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={handleCopyText} className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button onClick={handlePrint} className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
          </div>

          {/* Overview Banner */}
          <div
            className="glass-card"
            style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-technical">{cheatSheet.seniority.toUpperCase()}</span>
              <span className="badge badge-behavioral">{cheatSheet.target_company}</span>
            </div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '8px' }}>
              {cheatSheet.seniority} {cheatSheet.role_title} Interview Master Playbook
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              {cheatSheet.overview}
            </p>
          </div>

          {/* Top Questions & Frameworks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
              🎯 Core Interview Question Breakdowns
            </h4>

            {cheatSheet.top_questions.map((q, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '20px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--primary-light)', fontWeight: 800 }}>#{idx + 1}</span>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#e2e8f0' }}>{q.category}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 700 }}>
                    ⚡ Framework: {q.framework}
                  </span>
                </div>

                <h5 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
                  "{q.question}"
                </h5>

                {/* Response Bullets */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                    Ideal Answer Blueprint:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {q.ideal_response_bullet_points.map((pt, pIdx) => (
                      <div key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem', color: '#e2e8f0' }}>
                        <CheckCircle2 size={14} color="#10b981" style={{ marginTop: '3px', flexShrink: 0 }} />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pitfalls & Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#fb7185' }}>
                    <strong>⚠️ Pitfalls to Avoid:</strong> {q.pitfalls_to_avoid.join('; ')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#38bdf8' }}>
                    <strong>🔑 Key Metrics/Terms:</strong> {q.key_metrics_or_buzzwords.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reverse Questions & Checklist */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {/* Reverse Questions */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={16} /> Strategic Questions to Ask the Interviewer
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cheatSheet.top_questions_to_ask_interviewer.map((q, idx) => (
                  <div key={idx} style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.4, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                    <strong>{idx + 1}.</strong> {q}
                  </div>
                ))}
              </div>
            </div>

            {/* Day Before Checklist */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> Day-Before Interview Readiness Checklist
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cheatSheet.day_before_checklist.map((item, idx) => (
                  <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked={idx === 0} style={{ accentColor: '#10b981' }} />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
