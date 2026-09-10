import React, { useState, useEffect, useRef } from 'react';
import { 
  DollarSign, 
  Send, 
  Sparkles, 
  TrendingUp, 
  ShieldAlert, 
  Award, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Mic, 
  MicOff,
  Briefcase,
  CheckCircle2,
  Building,
  ArrowRight
} from 'lucide-react';
import { API_BASE } from '../config.js';

export function SalaryNegotiationView({ onBack }) {
  const [role, setRole] = useState('Senior Software Engineer');
  const [company, setCompany] = useState('Stripe');
  const [baseTarget, setBaseTarget] = useState('$185,000');
  const [equityTarget, setEquityTarget] = useState('$65,000 / yr');
  const [bonusTarget, setBonusTarget] = useState('$25,000');
  
  const [messages, setMessages] = useState([
    {
      speaker: 'recruiter',
      message: "Hi there! We are thrilled to extend an offer for the Senior Software Engineer position at Stripe. Our initial package is $165,000 base salary, $45,000/yr equity (RSUs), and a $10,000 sign-on bonus. How does this sound to you?"
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  
  const [currentScore, setCurrentScore] = useState(78);
  const [leverageAssessment, setLeverageAssessment] = useState("Solid baseline. Use market data to anchor counter-offer.");
  const [toneFeedback, setToneFeedback] = useState("Collaborative & Professional");
  const [tacticalTips, setTacticalTips] = useState([
    "Always express genuine enthusiasm for the team before countering.",
    "Anchor your target with Levels.fyi / market percentiles.",
    "Request higher sign-on or equity if base bands are rigid."
  ]);
  const [offerStatus, setOfferStatus] = useState("Ongoing");

  const chatBottomRef = useRef(null);
  const speechRecognitionRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Web Speech Synthesis for Recruiter Voice
  const speakRecruiterMessage = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Speech Recognition setup
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    speechRecognitionRef.current = recognition;
    setIsListening(true);
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userMsg = inputText.trim();
    const updatedHistory = [...messages, { speaker: 'candidate', message: userMsg }];
    setMessages(updatedHistory);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/negotiation/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          company,
          base_salary_target: baseTarget,
          equity_target: equityTarget,
          bonus_target: bonusTarget,
          history: updatedHistory,
          candidate_message: userMsg
        })
      });

      if (!res.ok) throw new Error("Negotiation turn failed");

      const data = await res.json();
      setMessages([...updatedHistory, { speaker: 'recruiter', message: data.recruiter_response }]);
      setCurrentScore(data.negotiation_score);
      setLeverageAssessment(data.leverage_assessment);
      setToneFeedback(data.tone_feedback);
      setTacticalTips(data.tactical_tips);
      setOfferStatus(data.offer_status);

      speakRecruiterMessage(data.recruiter_response);
    } catch (err) {
      console.error("Negotiation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    window.speechSynthesis?.cancel();
    setMessages([
      {
        speaker: 'recruiter',
        message: `Hi there! We are thrilled to extend an offer for the ${role} position at ${company}. Our initial package is $165,000 base salary, $45,000/yr equity, and a $10,000 sign-on bonus. How does this sound to you?`
      }
    ]);
    setCurrentScore(78);
    setOfferStatus("Ongoing");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            💰 Salary Negotiation <span className="gradient-text-gold">Live Simulator</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Practice realistic counteroffers with an AI hiring manager. Master leverage, market justification, and diplomatic persuasion.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleReset} className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
            <RotateCcw size={14} />
            <span>Reset Round</span>
          </button>
          <button onClick={onBack} className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
            <span>Back to Tracks</span>
          </button>
        </div>
      </div>

      {/* Target Parameters Bar */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          alignItems: 'center'
        }}
      >
        <div>
          <span style={{ fontSize: '0.7rem', color: '#fde68a', textTransform: 'uppercase', fontWeight: 700 }}>Target Role</span>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="auth-input"
            style={{ padding: '4px 8px', fontSize: '0.82rem', marginTop: '2px' }}
          />
        </div>

        <div>
          <span style={{ fontSize: '0.7rem', color: '#fde68a', textTransform: 'uppercase', fontWeight: 700 }}>Company</span>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="auth-input"
            style={{ padding: '4px 8px', fontSize: '0.82rem', marginTop: '2px' }}
          />
        </div>

        <div>
          <span style={{ fontSize: '0.7rem', color: '#fde68a', textTransform: 'uppercase', fontWeight: 700 }}>Target Base</span>
          <input
            type="text"
            value={baseTarget}
            onChange={(e) => setBaseTarget(e.target.value)}
            className="auth-input"
            style={{ padding: '4px 8px', fontSize: '0.82rem', marginTop: '2px' }}
          />
        </div>

        <div>
          <span style={{ fontSize: '0.7rem', color: '#fde68a', textTransform: 'uppercase', fontWeight: 700 }}>Target Equity</span>
          <input
            type="text"
            value={equityTarget}
            onChange={(e) => setEquityTarget(e.target.value)}
            className="auth-input"
            style={{ padding: '4px 8px', fontSize: '0.82rem', marginTop: '2px' }}
          />
        </div>
      </div>

      {/* Main Grid: Chat Arena + Tactical Feedback */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Chat Thread */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '520px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }} />
              <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>HR Hiring Director ({company})</strong>
            </div>
            
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              title={voiceEnabled ? "Voice Speech Enabled" : "Voice Speech Muted"}
            >
              {voiceEnabled ? <Volume2 size={14} color="#34d399" /> : <VolumeX size={14} color="var(--text-muted)" />}
              <span>{voiceEnabled ? 'Voice ON' : 'Muted'}</span>
            </button>
          </div>

          {/* Messages Stream */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
            {messages.map((m, idx) => {
              const isRecruiter = m.speaker === 'recruiter';
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isRecruiter ? 'flex-start' : 'flex-end',
                    maxWidth: '82%',
                    padding: '12px 16px',
                    borderRadius: isRecruiter ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                    background: isRecruiter ? 'rgba(30, 41, 59, 0.9)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    border: isRecruiter ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: isRecruiter ? '#a5b4fc' : '#c7d2fe', marginBottom: '2px' }}>
                    {isRecruiter ? `Recruiter (${company})` : 'You (Candidate)'}
                  </div>
                  {m.message}
                </div>
              );
            })}
            {loading && (
              <div style={{ alignSelf: 'flex-start', padding: '10px 14px', background: 'rgba(30, 41, 59, 0.7)', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span className="animate-spin" style={{ display: 'inline-block', marginRight: '6px' }}>✨</span>
                Recruiter is reviewing your counteroffer...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Bar */}
          <div style={{ display: 'flex', gap: '8px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', marginTop: '12px' }}>
            <button
              onClick={toggleSpeechRecognition}
              className={`btn btn-secondary ${isListening ? 'pulse-recording' : ''}`}
              style={{ padding: '10px 12px' }}
              title="Speak answer via microphone"
            >
              {isListening ? <MicOff size={16} color="#f43f5e" /> : <Mic size={16} color="#818cf8" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="State your counteroffer (e.g. Based on market rate & competing offers...)"
              className="auth-input"
              style={{ flex: 1, fontSize: '0.88rem' }}
            />

            <button
              onClick={handleSend}
              disabled={loading || !inputText.trim()}
              className="btn btn-primary"
              style={{ padding: '10px 18px' }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Real-Time Negotiation Scorecard & Tactical Feedback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fde68a' }}>
                Tactical Negotiation Score
              </h4>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: offerStatus === 'Offer Improved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  color: offerStatus === 'Offer Improved' ? '#34d399' : '#a5b4fc',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {offerStatus.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '14px' }}>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: currentScore >= 80 ? '#34d399' : '#fbbf24', fontFamily: 'var(--font-heading)' }}>
                {currentScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Tone Alignment</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>{toneFeedback}</div>
              </div>
            </div>

            <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Leverage Diagnosis</div>
              <p style={{ fontSize: '0.84rem', color: '#cbd5e1', marginTop: '2px', lineHeight: 1.4 }}>{leverageAssessment}</p>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '6px' }}>AI Tactical Moves:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {tacticalTips.map((tip, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: '#e2e8f0' }}>
                    <CheckCircle2 size={14} color="#34d399" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Golden Rules Box */}
          <div className="glass-card" style={{ padding: '16px 20px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
              💡 Negotiation Playbook Rules
            </h5>
            <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: '18px', lineHeight: 1.6 }}>
              <li>Never negotiate against yourself; state the target number once and pause.</li>
              <li>Base salary has fixed internal bands; equity & sign-on bonuses have 3x more flexibility.</li>
              <li>Always frame increases around the immediate ROI you will deliver in the first 90 days.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
