import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  Flame, 
  Award, 
  Clock, 
  Target, 
  AlertTriangle, 
  Sparkles, 
  Zap, 
  Activity, 
  CheckCircle2,
  Lock,
  ChevronRight
} from 'lucide-react';
import { API_BASE } from '../config.js';

export function AnalyticsDashboardModal({ isOpen, onClose }) {
  const [trends, setTrends] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAnalyticsData();
    }
  }, [isOpen]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [trendsRes, gamRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/trends`),
        fetch(`${API_BASE}/gamification/profile`)
      ]);

      if (trendsRes.ok) {
        const tData = await trendsRes.json();
        setTrends(tData);
      }
      if (gamRes.ok) {
        const gData = await gamRes.json();
        setGamification(gData);
      }
    } catch (err) {
      console.error("Failed to load analytics trends:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '880px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 32px',
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85)',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                Candidate Performance & Badges Hub
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Track score progression, weak-area remediation, streaks, and gamification rewards
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

        {/* Top Gamification Bar */}
        {gamification && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
              marginBottom: '22px'
            }}
          >
            <div className="stat-card-mini">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <Flame size={20} color="#fbbf24" />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Practice Streak</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>{gamification.streak_days} Days 🔥</div>
              </div>
            </div>

            <div className="stat-card-mini">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                <Zap size={20} color="#818cf8" />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Level & XP</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>Lvl {gamification.current_level} <span style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>({gamification.xp_points} XP)</span></div>
              </div>
            </div>

            <div className="stat-card-mini">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <Award size={20} color="#34d399" />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Rank Title</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34d399', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{gamification.level_title}</div>
              </div>
            </div>

            <div className="stat-card-mini">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                <Clock size={20} color="#f472b6" />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Practice Time</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>{gamification.total_practice_minutes} mins</div>
              </div>
            </div>
          </div>
        )}

        {/* Score Progression History Chart */}
        {trends && trends.score_history_timeline?.length > 0 && (
          <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                Score Progression Timeline
              </div>
              <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                Avg: {trends.avg_overall_score} / 100
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px', paddingTop: '10px' }}>
              {trends.score_history_timeline.map((item, idx) => {
                const heightPct = Math.max(20, item.overall_score);
                const color = item.overall_score >= 80 ? '#34d399' : item.overall_score >= 65 ? '#fbbf24' : '#fb7185';
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '0.68rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '2px' }}>
                      {item.overall_score}
                    </div>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '28px',
                        height: `${heightPct}%`,
                        backgroundColor: color,
                        borderRadius: '4px 4px 0 0',
                        opacity: 0.85,
                        transition: 'height 0.6s ease'
                      }}
                      title={`Session ${item.session_number}: ${item.overall_score}/100 (${item.category})`}
                    />
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {item.date}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2-Column: Domain Proficiencies & Weak Spot Alerts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '22px' }}>
          {/* Domain Proficiencies */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#a5b4fc' }}>
                Track Proficiencies
              </h4>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Adaptive Level: <strong style={{ color: '#34d399' }}>{trends?.adaptive_recommended_level || 'Intermediate'}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {trends?.domain_proficiencies?.map((dp, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{dp.domain}</span>
                    <span style={{ color: '#ffffff', fontWeight: 700 }}>{dp.score}/100</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${dp.score}%`,
                        height: '100%',
                        background: dp.score >= 80 ? '#34d399' : '#818cf8',
                        borderRadius: 3
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Identified Weak Spots */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fbbf24', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} /> Targeted Improvement Alerts
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {trends?.identified_weak_spots?.map((ws, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.2)'
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fde68a', marginBottom: '2px' }}>
                    ⚠️ {ws.skill_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {ws.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Achievement Badges Showcase */}
        <div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="#fbbf24" /> Unlocked Achievement Badges
          </h4>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px'
            }}
          >
            {gamification?.badges?.map((badge) => (
              <div
                key={badge.id}
                className="glass-card"
                style={{
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: badge.unlocked ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: badge.unlocked ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-subtle)',
                  opacity: badge.unlocked ? 1 : 0.55
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: badge.unlocked ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    flexShrink: 0
                  }}
                >
                  {badge.unlocked ? badge.icon : <Lock size={16} color="var(--text-muted)" />}
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: badge.unlocked ? '#ffffff' : 'var(--text-muted)' }}>
                    {badge.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                    {badge.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
