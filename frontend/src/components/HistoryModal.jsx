import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Award, Activity, Eye, ChevronRight, Sparkles, Filter } from 'lucide-react';
import { API_BASE } from '../config.js';

export function HistoryModal({ isOpen, onClose, onSelectPastSession }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/history?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to load session history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/history/${sessionId}`);
      if (res.ok) {
        const fullReport = await res.json();
        onSelectPastSession(fullReport);
        onClose();
      }
    } catch (err) {
      console.error('Failed to fetch full past session report:', err);
    }
  };

  if (!isOpen) return null;

  const filteredHistory = history.filter(
    (item) => categoryFilter === 'all' || item.category.toLowerCase() === categoryFilter.toLowerCase()
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Practice History</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Review past mock interview responses and track performance trends
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '8px', borderRadius: '50%', width: 36, height: 36 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['all', 'hr', 'technical', 'behavioral'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid',
                background: categoryFilter === cat ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                color: categoryFilter === cat ? '#ffffff' : 'var(--text-secondary)',
                borderColor: categoryFilter === cat ? 'var(--primary)' : 'var(--border-subtle)',
                transition: 'all 0.15s ease'
              }}
            >
              {cat === 'all' ? 'All Domains' : cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* History List Container */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '8px' }}>
                <Sparkles size={24} color="var(--primary)" />
              </div>
              <p style={{ fontSize: '0.88rem' }}>Loading past sessions...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: '1px dashed var(--border-subtle)'
              }}
            >
              <Award size={36} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                No past interview sessions found
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Complete your first practice recording to view performance history here!
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectSession(item.id)}
                className="glass-card"
                style={{
                  padding: '16px 18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className={`badge badge-${item.category}`}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.created_at}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.35, marginBottom: '8px' }}>
                    "{item.question_text}"
                  </h4>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>🗣️ {item.wpm} WPM ({item.wpm_status})</span>
                    <span>🛑 {item.filler_count} Fillers</span>
                    <span>👀 {item.eye_contact_percentage}% Eye Contact</span>
                    <span>⏱️ {item.duration_seconds}s</span>
                  </div>
                </div>

                {/* Score badge & Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-heading)',
                        color: item.overall_score >= 80 ? '#34d399' : item.overall_score >= 60 ? '#fbbf24' : '#fb7185'
                      }}
                    >
                      {item.overall_score}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Overall Index
                    </div>
                  </div>
                  <ChevronRight size={18} color="var(--text-muted)" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
