import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Award, 
  RotateCcw, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Eye, 
  MessageSquare, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Copy, 
  Check, 
  ShieldCheck, 
  FileText,
  Volume2,
  HelpCircle,
  BarChart2,
  Share2,
  Printer,
  Download,
  Zap,
  CheckCheck
} from 'lucide-react';

import { CircularScoreGauge, WpmSpeedometer, EngagementTimeline, ContentDimensionPillars } from './Gauges.jsx';
import { MentorReviewModal } from './MentorReviewModal.jsx';

export function FeedbackReport({ report, onTryAnother, onRetrySame, onOpenHistory }) {
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [showFillerHighlights, setShowFillerHighlights] = useState(true);
  const [activeTab, setActiveTab] = useState('model_comparison'); // 'model_comparison' | 'strengths_improvements' | 'speech_vision'
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (report?.overall_score >= 80) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [report]);

  if (!report) return null;

  const {
    session_id,
    question_id,
    category,
    role = "general",
    company_preset = "general",
    difficulty = "Intermediate",
    question_text,
    transcript,
    tokens = [],
    speech_metrics,
    eye_contact_metrics,
    content_feedback,
    overall_score = 75
  } = report;

  let gradeLabel = "Good Performance";
  let gradeColor = "#10b981";
  if (overall_score >= 88) {
    gradeLabel = "Exceptional Interview Delivery";
    gradeColor = "#34d399";
  } else if (overall_score >= 75) {
    gradeLabel = "Strong & Articulate";
    gradeColor = "#60a5fa";
  } else if (overall_score >= 60) {
    gradeLabel = "Promising Foundation";
    gradeColor = "#fbbf24";
  } else {
    gradeLabel = "Needs Structured Practice";
    gradeColor = "#f43f5e";
  }

  const handleCopyTranscript = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `interview_report_${session_id.slice(0,8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="printable-report" style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      
      {/* Top Hero Performance Banner */}
      <div
        className="glass-card glass-card-glow"
        style={{
          padding: '32px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.98) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className={`badge badge-${category || 'behavioral'}`}>
              {role.toUpperCase()}
            </span>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1' }}>
              {difficulty}
            </span>
            {company_preset !== 'general' && (
              <span className="badge badge-behavioral">
                {company_preset.toUpperCase()}
              </span>
            )}
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px', lineHeight: 1.25 }}>
            {gradeLabel}
          </h2>

          <p style={{ fontSize: '0.94rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '16px' }}>
            "{question_text}"
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.8rem' }}>
            <div style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
              ⏱️ Duration: <strong>{speech_metrics?.duration_seconds || 0}s</strong>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
              💬 Total Words: <strong>{speech_metrics?.total_words || 0}</strong>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', fontWeight: 600 }}>
              🎭 Tone: <strong>{speech_metrics?.sentiment_tone || 'Calm & Professional'}</strong>
            </div>
          </div>
        </div>

        {/* Overall Composite Score Gauge & Pillar Breakdown */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
          <CircularScoreGauge
            value={overall_score}
            max={100}
            size={145}
            strokeWidth={12}
            color={gradeColor}
            label="Overall Performance Index"
            sublabel="/ 100"
          />

          <div style={{ minWidth: '180px', flex: 1 }}>
            <ContentDimensionPillars
              relevance={content_feedback?.relevance_score || 8}
              structure={content_feedback?.structure_score || 8}
              clarity={content_feedback?.clarity_score || 7}
              depth={content_feedback?.depth_score || 7}
            />
          </div>
        </div>
      </div>

      {/* Tabs Navigation: Model Answer Comparison vs Rubrics vs Vision */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        {[
          { id: 'model_comparison', label: '★ Rewritten Model Answer Comparison' },
          { id: 'strengths_improvements', label: '🎯 Strengths & Actionable Tips' },
          { id: 'speech_vision', label: '🎙️ Speech Cadence & Body Language' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === tab.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SIDE-BY-SIDE MODEL ANSWER COMPARISON */}
      {activeTab === 'model_comparison' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* Candidate Spoken Transcript */}
          <div className="glass-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#818cf8' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                  Your Spoken Answer
                </h4>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {speech_metrics?.total_words || 0} words &bull; {speech_metrics?.wpm || 0} WPM
              </span>
            </div>

            <div
              style={{
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                lineHeight: 1.7,
                color: '#cbd5e1',
                maxHeight: '260px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap'
              }}
            >
              {tokens && tokens.length > 0 && showFillerHighlights ? (
                tokens.map((tok, idx) => (
                  <span
                    key={idx}
                    className={tok.is_filler ? "token-filler" : ""}
                    title={tok.is_filler ? `Filler word: "${tok.filler_type}"` : undefined}
                  >
                    {tok.text}
                  </span>
                ))
              ) : (
                transcript || "(No audible words detected)"
              )}
            </div>
          </div>

          {/* Expert Rewritten Model Answer */}
          <div
            className="glass-card"
            style={{
              padding: '22px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#34d399" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399' }}>
                  AI Coach Rewritten Model Answer
                </h4>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#6ee7b7', fontWeight: 700 }}>
                ★ Tightened & Quantified
              </span>
            </div>

            <div
              style={{
                padding: '16px',
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '10px',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                fontSize: '0.9rem',
                lineHeight: 1.7,
                color: '#e2e8f0',
                maxHeight: '260px',
                overflowY: 'auto'
              }}
            >
              {content_feedback?.model_answer || (
                "In my last role, our system faced severe database latency during peak traffic. I led the migration to an asynchronous Redis caching layer and optimized SQL joins. As a result, P99 latency dropped by 45% and system uptime reached 99.99%."
              )}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px' }}>
              💡 Notice how the model answer opens with crisp context, emphasizes personal ownership ("I led"), and concludes with a quantifiable metric.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STRENGTHS & ACTIONABLE COACHING TIPS */}
      {activeTab === 'strengths_improvements' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* Strengths */}
          <div className="glass-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} color="#34d399" />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399' }}>
                Observed Strengths
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {content_feedback?.strengths?.map((str, idx) => (
                <div key={idx} style={{ padding: '10px 12px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '8px', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.45 }}>
                  ✓ {str}
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Tips */}
          <div className="glass-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} color="#fbbf24" />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fbbf24' }}>
                Actionable Coaching Points
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {content_feedback?.improvements?.map((imp, idx) => (
                <div key={idx} style={{ padding: '10px 12px', background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '8px', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.45 }}>
                  <strong style={{ color: '#fde68a' }}>#{idx + 1}: </strong>
                  {imp}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SPEECH CADENCE & BODY LANGUAGE */}
      {activeTab === 'speech_vision' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Card 1: Speedometer & Fillers */}
          <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#818cf8" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Speaking Pace & Fillers</h4>
              </div>
              <span className="badge badge-hr">Whisper STT</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <WpmSpeedometer wpm={speech_metrics?.wpm || 0} status={speech_metrics?.wpm_status || 'Ideal Pace'} />
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Filler Words:</span>
                <span style={{ fontWeight: 800, color: speech_metrics?.filler_count > 3 ? '#fb7185' : '#34d399' }}>
                  {speech_metrics?.filler_count || 0} ({speech_metrics?.filler_rate_per_100 || 0} per 100 words)
                </span>
              </div>

              {speech_metrics?.filler_breakdown && Object.keys(speech_metrics.filler_breakdown).length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                  {Object.entries(speech_metrics.filler_breakdown).map(([w, c]) => (
                    <span key={w} style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', background: 'rgba(244,63,94,0.15)', color: '#fb7185' }}>
                      "{w}" × {c}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#34d399' }}>✓ Minimal or zero filler words detected!</div>
              )}
            </div>
          </div>

          {/* Card 2: Confidence Tone & Sentiment */}
          <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} color="#f59e0b" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Confidence & Tone</h4>
              </div>
              <span className="badge badge-behavioral">Vocal Analytics</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <CircularScoreGauge
                value={speech_metrics?.confidence_score || 75}
                max={100}
                size={120}
                strokeWidth={9}
                color="#f59e0b"
                label="Vocal Confidence Index"
                sublabel="/ 100"
              />
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Sentiment Mood:</span>
                <strong style={{ color: '#ffffff' }}>{speech_metrics?.sentiment_tone || 'Calm & Professional'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cadence Flow:</span>
                <strong style={{ color: '#34d399' }}>{speech_metrics?.cadence_consistency || 'Steady & Controlled'}</strong>
              </div>
            </div>
          </div>

          {/* Card 3: Eye Contact & Head Posture */}
          <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} color="#34d399" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Gaze & Head Posture</h4>
              </div>
              <span className="badge badge-success">MediaPipe</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <CircularScoreGauge
                value={eye_contact_metrics?.eye_contact_percentage || 0}
                max={100}
                size={120}
                strokeWidth={9}
                unit="%"
                color={eye_contact_metrics?.eye_contact_percentage >= 70 ? '#10b981' : '#f59e0b'}
                label="Camera Gaze Ratio"
              />
            </div>

            <EngagementTimeline timeline={eye_contact_metrics?.timeline_sampled || []} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', padding: '0 4px' }}>
              <span>Posture Stability:</span>
              <strong style={{ color: '#ffffff' }}>{eye_contact_metrics?.posture_status || 'Centered & Stable'} ({eye_contact_metrics?.posture_score || 85}/100)</strong>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar: Print, Export, Share & Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onRetrySame} className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
            <RotateCcw size={15} />
            <span>Retry This Question</span>
          </button>

          <button onClick={() => setIsShareModalOpen(true)} className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
            <Share2 size={15} color="#818cf8" />
            <span>Share with Mentor</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handlePrintPDF} className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
            <Printer size={15} />
            <span>Print PDF Report</span>
          </button>

          <button onClick={handleExportJSON} className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
            <Download size={15} />
            <span>Export JSON</span>
          </button>

          <button onClick={onTryAnother} className="btn btn-primary btn-lg" style={{ padding: '12px 24px' }}>
            <span>Practice Another Track</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Mentor Review Modal */}
      <MentorReviewModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        sessionReport={report}
      />
    </div>
  );
}
