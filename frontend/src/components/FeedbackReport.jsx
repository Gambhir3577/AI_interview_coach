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
  BarChart2
} from 'lucide-react';

import { CircularScoreGauge, WpmSpeedometer, EngagementTimeline } from './Gauges.jsx';

export function FeedbackReport({ report, onTryAnother, onRetrySame, onOpenHistory }) {
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [showFillerHighlights, setShowFillerHighlights] = useState(true);

  // Trigger celebration confetti for strong scores
  useEffect(() => {
    if (report?.overall_score >= 80) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Ignore if confetti not supported
      }
    }
  }, [report]);

  if (!report) return null;

  const {
    session_id,
    question_id,
    category,
    question_text,
    transcript,
    tokens = [],
    speech_metrics,
    eye_contact_metrics,
    content_feedback,
    overall_score = 75
  } = report;

  // Grade classification
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Hero Performance Banner */}
      <div
        className="glass-card glass-card-glow"
        style={{
          padding: '32px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span className={`badge badge-${category || 'behavioral'}`}>
              {category?.toUpperCase()}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Interview Analysis Report
            </span>
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', lineHeight: 1.25 }}>
            {gradeLabel}
          </h2>

          <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '16px' }}>
            "{question_text}"
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.82rem' }}>
            <div style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
              ⏱️ Duration: <strong>{speech_metrics?.duration_seconds || 0}s</strong>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
              💬 Total Words: <strong>{speech_metrics?.total_words || 0}</strong>
            </div>
            {content_feedback?.uses_star_method !== null && content_feedback?.uses_star_method !== undefined && (
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  background: content_feedback.uses_star_method ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: content_feedback.uses_star_method ? '#34d399' : '#fbbf24',
                  fontWeight: 600
                }}
              >
                {content_feedback.uses_star_method ? '★ STAR Method Followed' : '⚠️ STAR Method Recommended'}
              </div>
            )}
          </div>
        </div>

        {/* Overall Composite Score Gauge */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularScoreGauge
            value={overall_score}
            max={100}
            size={150}
            strokeWidth={12}
            color={gradeColor}
            label="Overall Performance Index"
            sublabel="/ 100"
          />
        </div>
      </div>

      {/* 3 Main Factor Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px'
        }}
      >
        {/* CARD 1: Speech Quality & Delivery */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} color="#818cf8" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Speech & Delivery</h3>
            </div>
            <span className="badge badge-hr">Whisper AI</span>
          </div>

          {/* WPM Speedometer */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
            <WpmSpeedometer
              wpm={speech_metrics?.wpm || 0}
              status={speech_metrics?.wpm_status || 'Ideal Pace'}
            />
          </div>

          {/* Filler Word Metrics */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filler Words Detected</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: speech_metrics?.filler_count > 3 ? '#fb7185' : '#34d399' }}>
                {speech_metrics?.filler_count || 0} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>({speech_metrics?.filler_rate_per_100 || 0}/100 words)</span>
              </span>
            </div>

            {/* Filler tags breakdown */}
            {speech_metrics?.filler_breakdown && Object.keys(speech_metrics.filler_breakdown).length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {Object.entries(speech_metrics.filler_breakdown).map(([word, count]) => (
                  <span
                    key={word}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      background: 'rgba(244, 63, 94, 0.12)',
                      color: '#fb7185',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      fontWeight: 600
                    }}
                  >
                    "{word}" × {count}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Minimal or no filler words detected!
              </div>
            )}
          </div>

          {/* Long Silence / Pause Detection */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '0 4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Long Pauses (&gt;3 seconds):</span>
            <span style={{ fontWeight: 700, color: speech_metrics?.pauses_over_3s > 0 ? '#fbbf24' : '#34d399' }}>
              {speech_metrics?.pauses_over_3s || 0} flagged
            </span>
          </div>
        </div>

        {/* CARD 2: Eye Contact & Engagement */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Eye size={20} color="#34d399" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Eye Contact & Gaze</h3>
            </div>
            <span className="badge badge-success">MediaPipe</span>
          </div>

          {/* Circular Eye Contact Gauge */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
            <CircularScoreGauge
              value={eye_contact_metrics?.eye_contact_percentage || 0}
              max={100}
              size={130}
              strokeWidth={10}
              color={
                eye_contact_metrics?.eye_contact_percentage >= 70
                  ? '#10b981'
                  : eye_contact_metrics?.eye_contact_percentage >= 45
                  ? '#f59e0b'
                  : '#f43f5e'
              }
              unit="%"
              label="Camera Alignment Ratio"
            />
          </div>

          {/* Engagement Timeline */}
          <EngagementTimeline timeline={eye_contact_metrics?.timeline_sampled || []} />

          {/* Proxy Metric Disclaimer */}
          <div
            style={{
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              lineHeight: 1.4,
              marginTop: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '2px' }}>
              <ShieldCheck size={12} color="#60a5fa" />
              <span>Engagement Proxy Metric</span>
            </div>
            {eye_contact_metrics?.disclaimer || "Calculated via facial landmark and iris alignment. Does not measure emotion."}
          </div>
        </div>

        {/* CARD 3: Content Relevance & Structure */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={20} color="#c084fc" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Content Quality</h3>
            </div>
            <span className="badge badge-behavioral">Claude LLM</span>
          </div>

          {/* Two Sub-gauges for Relevance & Structure */}
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0' }}>
            <CircularScoreGauge
              value={content_feedback?.relevance_score || 7}
              max={10}
              size={100}
              strokeWidth={8}
              color="#818cf8"
              sublabel="/ 10"
              label="Relevance"
            />
            <CircularScoreGauge
              value={content_feedback?.structure_score || 7}
              max={10}
              size={100}
              strokeWidth={8}
              color="#c084fc"
              sublabel="/ 10"
              label="Structure"
            />
          </div>

          {/* Coach's Executive Summary */}
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(168, 85, 247, 0.06)',
              borderLeft: '3px solid #a855f7',
              borderRadius: '0 8px 8px 0',
              fontSize: '0.85rem',
              color: '#e2e8f0',
              lineHeight: 1.5,
              marginTop: 'auto'
            }}
          >
            <div style={{ fontWeight: 700, color: '#d8b4fe', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={14} /> Executive Takeaway
            </div>
            {content_feedback?.overall_summary}
          </div>
        </div>
      </div>

      {/* Detailed Feedback Cards: Strengths vs Actionable Improvements */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px'
        }}
      >
        {/* Strengths Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} color="#34d399" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399' }}>
              Key Strengths
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {content_feedback?.strengths?.map((strength, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  fontSize: '0.88rem',
                  color: '#e2e8f0',
                  lineHeight: 1.45
                }}
              >
                <Check size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{strength}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Improvements Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} color="#fbbf24" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fbbf24' }}>
              Actionable Coaching Tips
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {content_feedback?.improvements?.map((improvement, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  fontSize: '0.88rem',
                  color: '#e2e8f0',
                  lineHeight: 1.45
                }}
              >
                <span
                  style={{
                    minWidth: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.25)',
                    color: '#fde68a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    marginTop: '1px',
                    flexShrink: 0
                  }}
                >
                  {idx + 1}
                </span>
                <span>{improvement}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Spoken Transcript Card with Filler Toggle */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="var(--primary-light)" />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Spoken Answer Transcript</h4>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showFillerHighlights}
                onChange={(e) => setShowFillerHighlights(e.target.checked)}
                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span>Highlight Fillers</span>
            </label>

            <button
              onClick={handleCopyTranscript}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              {copiedTranscript ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedTranscript ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>
        </div>

        {/* Transcript Body */}
        <div
          style={{
            padding: '18px 20px',
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.95rem',
            lineHeight: 1.7,
            color: '#cbd5e1',
            maxHeight: '260px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap'
          }}
        >
          {tokens && tokens.length > 0 && showFillerHighlights ? (
            tokens.map((tok, idx) => {
              if (tok.is_filler) {
                return (
                  <span
                    key={idx}
                    className="token-filler"
                    title={`Filler word: "${tok.filler_type || tok.text}"`}
                  >
                    {tok.text}
                  </span>
                );
              }
              return <span key={idx}>{tok.text}</span>;
            })
          ) : (
            transcript || "(No spoken words detected in audio track)"
          )}
        </div>
      </div>

      {/* Action Navigation Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '8px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <button onClick={onRetrySame} className="btn btn-secondary" style={{ padding: '12px 20px' }}>
          <RotateCcw size={16} />
          <span>Retry This Question</span>
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onOpenHistory} className="btn btn-secondary" style={{ padding: '12px 20px' }}>
            <BarChart2 size={16} />
            <span>Session History</span>
          </button>

          <button onClick={onTryAnother} className="btn btn-primary btn-lg" style={{ padding: '12px 28px' }}>
            <span>Practice Another Question</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
