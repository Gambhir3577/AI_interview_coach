import React, { useState } from 'react';
import { 
  FileCheck, 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  Mail, 
  Calendar, 
  Building, 
  Award,
  ArrowRight
} from 'lucide-react';
import { API_BASE } from '../config.js';

export function DebriefView({ onBack }) {
  const [company, setCompany] = useState('Amazon');
  const [role, setRole] = useState('Senior Solutions Architect');
  const [interviewDate, setInterviewDate] = useState(new Date().toISOString().split('T')[0]);
  const [roundsDescription, setRoundsDescription] = useState('Technical Architecture and Customer Obsession LP Round');
  const [candidateNotes, setCandidateNotes] = useState(
    "The interviewer asked about migrating legacy monoliths to microservices with DynamoDB. I walked through the Strangler Fig pattern and DynamoDB single-table design. Felt very strong on the technical trade-offs. On the Customer Obsession question, I hesitated for a moment picking the best example, but ended up describing our SLA monitoring project that saved a $2M enterprise client."
  );

  const [loading, setLoading] = useState(false);
  const [debriefResult, setDebriefResult] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleAnalyzeDebrief = async () => {
    if (!candidateNotes.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/debrief/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          role,
          interview_date: interviewDate,
          rounds_description: roundsDescription,
          candidate_notes: candidateNotes
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDebriefResult(data);
      }
    } catch (err) {
      console.error("Debrief analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = () => {
    if (!debriefResult?.thank_you_email_draft) return;
    navigator.clipboard.writeText(debriefResult.thank_you_email_draft);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            📝 Post-Interview <span className="gradient-text">Debrief & Follow-Up Studio</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Log what happened in your real interview. Get an AI diagnosis of strengths, risks, pass probability, and a tailored thank-you email.
          </p>
        </div>

        <button onClick={onBack} className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
          <span>Back to Tracks</span>
        </button>
      </div>

      {/* Input Form */}
      <div className="glass-card" style={{ padding: '24px', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="auth-input"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Role Title
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="auth-input"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Interview Date
            </label>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="auth-input"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Rounds / Topics Discussed
            </label>
            <input
              type="text"
              value={roundsDescription}
              onChange={(e) => setRoundsDescription(e.target.value)}
              className="auth-input"
            />
          </div>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '0.82rem', color: '#a5b4fc', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            Recount Your Real Interview Experience & Tricky Moments:
          </label>
          <textarea
            rows={5}
            value={candidateNotes}
            onChange={(e) => setCandidateNotes(e.target.value)}
            className="auth-input"
            style={{ width: '100%', resize: 'vertical', fontSize: '0.88rem', lineHeight: 1.5 }}
            placeholder="What questions were asked? Where did you feel confident? Where did you hesitate or need hints?..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleAnalyzeDebrief}
            disabled={loading || !candidateNotes.trim()}
            className="btn btn-primary btn-lg"
            style={{ minWidth: '220px' }}
          >
            <Sparkles size={18} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Diagnosing Real Interview...' : 'Analyze Debrief & Draft Email'}</span>
          </button>
        </div>
      </div>

      {/* Analysis Results */}
      {debriefResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Probability Score & Summary */}
          <div
            className="glass-card"
            style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                Estimated Round Pass Probability
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: debriefResult.pass_probability_pct >= 70 ? '#34d399' : '#fbbf24' }}>
                {debriefResult.pass_probability_pct}%
              </div>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px' }}>
                Based on your recounted technical depth, storytelling structure, and panel engagement.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>Observed Strengths:</div>
              {debriefResult.strengths_observed?.map((s, idx) => (
                <div key={idx} style={{ fontSize: '0.82rem', color: '#e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <CheckCircle2 size={14} color="#34d399" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{s}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24' }}>Risks & Next Round Tips:</div>
              {debriefResult.next_round_strategy?.map((t, idx) => (
                <div key={idx} style={{ fontSize: '0.82rem', color: '#e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>•</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Thank You Email Drafter */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={18} color="#818cf8" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  Custom Post-Interview Thank You Email
                </h4>
              </div>

              <button
                onClick={handleCopyEmail}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                {copiedEmail ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedEmail ? 'Copied Email' : 'Copy Draft'}</span>
              </button>
            </div>

            <div
              style={{
                padding: '16px 18px',
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                lineHeight: 1.65,
                color: '#e2e8f0',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {debriefResult.thank_you_email_draft}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
