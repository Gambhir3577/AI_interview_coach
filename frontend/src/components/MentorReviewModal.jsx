import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Star, 
  CheckCircle2, 
  MessageSquare, 
  UserCheck, 
  Copy, 
  Check, 
  Send,
  Sparkles
} from 'lucide-react';
import { API_BASE } from '../config.js';

export function MentorReviewModal({ isOpen, onClose, sessionReport }) {
  const [shareUrl, setShareUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Reviewer Form State
  const [reviewerName, setReviewerName] = useState('Senior Mentor');
  const [reviewerRole, setReviewerRole] = useState('Staff Engineer @ Tech');
  const [structureRating, setStructureRating] = useState(4);
  const [clarityRating, setClarityRating] = useState(4);
  const [deliveryRating, setDeliveryRating] = useState(4);
  const [feedbackText, setFeedbackText] = useState(
    "Great technical depth on the architecture. Recommend starting with a 1-sentence high-level summary before diving into the caching layers."
  );
  const [actionableTip, setActionableTip] = useState("Quantify the memory and latency savings with hard numbers.");
  
  const [reviewsList, setReviewsList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    if (sessionReport?.session_id) {
      const url = `${window.location.origin}/?session_id=${sessionReport.session_id}`;
      setShareUrl(url);
      fetchReviews(sessionReport.session_id);
    }
  }, [sessionReport]);

  const fetchReviews = async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/share/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setReviewsList(data.reviews || []);
      }
    } catch (e) {
      // Ignored
    }
  };

  if (!isOpen || !sessionReport) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmitReview = async () => {
    if (!feedbackText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/share/${sessionReport.session_id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionReport.session_id,
          reviewer_name: reviewerName,
          reviewer_role: reviewerRole,
          overall_rating: Math.round((structureRating + clarityRating + deliveryRating) / 3),
          structure_rating: structureRating,
          clarity_rating: clarityRating,
          delivery_rating: deliveryRating,
          feedback_text: feedbackText,
          actionable_tips: actionableTip ? [actionableTip] : []
        })
      });

      if (res.ok) {
        setSubmittedSuccess(true);
        fetchReviews(sessionReport.session_id);
        setTimeout(() => setSubmittedSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Mentor review submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85)',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Share2 size={20} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Peer & Mentor Review Sharing</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Share your practice recording with peers or mentors for human scorecard evaluation
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

        {/* Shareable Link Box */}
        <div
          style={{
            padding: '14px 18px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '22px'
          }}
        >
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.72rem', color: '#a5b4fc', fontWeight: 700, textTransform: 'uppercase' }}>
              Session Share Link
            </div>
            <div style={{ fontSize: '0.84rem', color: '#ffffff', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {shareUrl}
            </div>
          </div>

          <button onClick={handleCopyLink} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem', flexShrink: 0 }}>
            {copiedLink ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Existing Mentor Reviews */}
        {reviewsList.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
              Mentor Evaluations ({reviewsList.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {reviewsList.map((rev) => (
                <div key={rev.id} className="glass-card" style={{ padding: '16px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>{rev.reviewer_name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({rev.reviewer_role})</span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px', color: '#fbbf24' }}>
                      {[...Array(rev.overall_rating)].map((_, i) => (
                        <Star key={i} size={14} fill="#fbbf24" />
                      ))}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5, marginBottom: '6px' }}>
                    "{rev.feedback_text}"
                  </p>

                  {rev.actionable_tips?.length > 0 && (
                    <div style={{ fontSize: '0.78rem', color: '#34d399' }}>
                      💡 <strong>Tip:</strong> {rev.actionable_tips.join('; ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Review Card */}
        <div className="glass-card" style={{ padding: '20px', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fde68a', marginBottom: '14px' }}>
            ✍️ Leave Mentor Scorecard & Feedback
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                Your Name
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="auth-input"
                style={{ padding: '6px 10px', fontSize: '0.84rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                Your Title / Company
              </label>
              <input
                type="text"
                value={reviewerRole}
                onChange={(e) => setReviewerRole(e.target.value)}
                className="auth-input"
                style={{ padding: '6px 10px', fontSize: '0.84rem' }}
              />
            </div>
          </div>

          {/* Star Ratings */}
          <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Structure (1-5)</div>
              <input
                type="number"
                min="1"
                max="5"
                value={structureRating}
                onChange={(e) => setStructureRating(parseInt(e.target.value) || 4)}
                className="auth-input"
                style={{ width: '50px', textAlign: 'center', padding: '4px' }}
              />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Clarity (1-5)</div>
              <input
                type="number"
                min="1"
                max="5"
                value={clarityRating}
                onChange={(e) => setClarityRating(parseInt(e.target.value) || 4)}
                className="auth-input"
                style={{ width: '50px', textAlign: 'center', padding: '4px' }}
              />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Delivery (1-5)</div>
              <input
                type="number"
                min="1"
                max="5"
                value={deliveryRating}
                onChange={(e) => setDeliveryRating(parseInt(e.target.value) || 4)}
                className="auth-input"
                style={{ width: '50px', textAlign: 'center', padding: '4px' }}
              />
            </div>
          </div>

          {/* Feedback text */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
              Detailed Feedback
            </label>
            <textarea
              rows={3}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="auth-input"
              style={{ width: '100%', resize: 'vertical', fontSize: '0.84rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSubmitReview}
              disabled={submitting || !feedbackText.trim()}
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.84rem' }}
            >
              <Send size={14} />
              <span>{submitting ? 'Submitting...' : submittedSuccess ? 'Feedback Submitted! ✓' : 'Submit Review'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
