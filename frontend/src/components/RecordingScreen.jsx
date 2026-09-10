import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  RotateCcw, 
  Send, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle,
  Clock,
  Eye,
  Activity,
  CheckCircle2,
  Volume2,
  VolumeX,
  MessageSquare,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { API_BASE } from '../config.js';
import { PressureTimerDial } from './Gauges.jsx';

const ANALYSIS_STEPS = [
  { id: 1, title: "Uploading video & extracting 16kHz audio track...", detail: "FFmpeg extraction" },
  { id: 2, title: "Transcribing speech with OpenAI Whisper STT...", detail: "Local neural speech-to-text" },
  { id: 3, title: "Calculating pace (WPM), hesitation & filler rate...", detail: "Cadence & silence analysis" },
  { id: 4, title: "Tracking iris alignment & head posture stability...", detail: "MediaPipe Vision Mesh" },
  { id: 5, title: "Evaluating multi-dimensional rubric & model answer...", detail: "Claude AI content coach" }
];

export function RecordingScreen({ question, onBack, onAnalysisComplete }) {
  const [stream, setStream] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const [recordingState, setRecordingState] = useState('idle'); // 'idle' | 'recording' | 'stopped' | 'followup' | 'analyzing'
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [activeStep, setActiveStep] = useState(1);
  const [analysisError, setAnalysisError] = useState(null);

  // AI Voice Narration
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Practice Modes
  const practiceMode = question?.practiceMode || 'voice_multiturn';
  const timerLimit = question?.timerLimit || 90;

  // Multi-Turn Follow-up Probing state
  const [followUpQuestion, setFollowUpQuestion] = useState(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpHistory, setFollowUpHistory] = useState([]);

  const liveVideoRef = useRef(null);
  const playbackVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // AI Voice Reader
  const speakQuestion = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setVoicePlaying(true);
    utterance.onend = () => setVoicePlaying(false);
    utterance.onerror = () => setVoicePlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  // Play audio on mount
  useEffect(() => {
    if (question?.question_text && practiceMode === 'voice_multiturn') {
      const timeout = setTimeout(() => {
        speakQuestion(question.question_text);
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [question]);

  // Camera & Mic setup
  useEffect(() => {
    let localStream = null;

    const startMedia = async () => {
      try {
        setPermissionError(null);
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });

        localStream = userStream;
        setStream(userStream);

        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = userStream;
        }

        // Web Audio visualizer
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          const audioCtx = new AudioCtx();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          const source = audioCtx.createMediaStreamSource(userStream);
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            }
            animationFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        } catch (audioErr) {
          console.warn("Web Audio API visualizer note:", audioErr);
        }

      } catch (err) {
        console.error("Camera/Mic access error:", err);
        setPermissionError(
          "Camera & Microphone access is required. Please grant browser permissions and ensure your webcam is connected."
        );
      }
    };

    startMedia();

    return () => {
      window.speechSynthesis?.cancel();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, []);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = () => {
    if (!stream) return;
    window.speechSynthesis?.cancel();

    setRecordedBlob(null);
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }
    recordedChunksRef.current = [];
    setTimerSeconds(0);
    setAnalysisError(null);

    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/mp4';
        }
      }
    }

    try {
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setRecordingState('stopped');

        // If Multi-Turn Voice mode, automatically fetch follow-up question
        if (practiceMode === 'voice_multiturn' && !followUpQuestion) {
          fetchFollowUpProbe();
        }
      };

      recorder.start(500);
      setRecordingState('recording');

      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      setAnalysisError("Failed to initialize video recording on this device.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const fetchFollowUpProbe = async () => {
    setFollowUpLoading(true);
    try {
      const res = await fetch(`${API_BASE}/interview/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: question.id,
          question_text: question.question_text,
          category: question.category,
          role: question.role || 'general',
          difficulty: question.difficulty || 'Intermediate',
          transcript: "Candidate delivered first response regarding architecture and metrics."
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFollowUpQuestion(data);
        speakQuestion(data.follow_up_question);
      }
    } catch (e) {
      console.error("Failed to fetch follow-up:", e);
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleReRecord = () => {
    window.speechSynthesis?.cancel();
    setRecordedBlob(null);
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }
    setRecordingState('idle');
    setTimerSeconds(0);
    setAnalysisError(null);
    if (liveVideoRef.current && stream) {
      liveVideoRef.current.srcObject = stream;
    }
  };

  const handleSubmitForAnalysis = async () => {
    if (!recordedBlob || !question) return;

    window.speechSynthesis?.cancel();
    setRecordingState('analyzing');
    setActiveStep(1);
    setAnalysisError(null);

    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < 5 ? prev + 1 : prev));
    }, 3200);

    const formData = new FormData();
    const filename = `interview_${question.id}_${Date.now()}.webm`;
    formData.append('video', recordedBlob, filename);
    formData.append('question_id', question.id);
    formData.append('category', question.category || 'general');
    formData.append('role', question.role || 'general');
    formData.append('difficulty', question.difficulty || 'Intermediate');
    formData.append('company_preset', question.company_preset || 'general');
    formData.append('timer_limit_sec', timerLimit);
    formData.append('question_text', question.question_text);
    formData.append('follow_up_qa_json', JSON.stringify(followUpHistory));

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server error: ${response.status}`);
      }

      const reportData = await response.json();
      onAnalysisComplete(reportData);
    } catch (err) {
      clearInterval(stepInterval);
      console.error("Analysis submission error:", err);
      setAnalysisError(err.message || "Failed to analyze video. Please try again.");
      setRecordingState('stopped');
    }
  };

  // STAR Progress calculation for Guided STAR mode
  const getStarActiveStage = () => {
    if (timerSeconds < 15) return 'S';
    if (timerSeconds < 30) return 'T';
    if (timerSeconds < 65) return 'A';
    return 'R';
  };
  const activeStarStage = getStarActiveStage();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          <ArrowLeft size={16} />
          <span>Change Track / Question</span>
        </button>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className={`badge badge-${question?.category || 'behavioral'}`}>
            {question?.role?.toUpperCase() || 'SWE'}
          </span>
          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#e2e8f0' }}>
            {question?.difficulty || 'Intermediate'}
          </span>
          {question?.company_preset !== 'general' && (
            <span className="badge badge-behavioral">
              {question?.company_preset?.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Main Studio Card */}
      <div className="glass-card" style={{ padding: '24px', border: '1px solid var(--border-subtle)' }}>
        {/* Question Header Banner with Voice Narrator Controls */}
        <div
          style={{
            padding: '16px 20px',
            background: 'rgba(99, 102, 241, 0.08)',
            borderLeft: '4px solid #6366f1',
            borderRadius: '0 12px 12px 0',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#a5b4fc', letterSpacing: '0.05em' }}>
              Current Prompt
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginTop: '2px', lineHeight: 1.4 }}>
              "{question?.question_text}"
            </h2>
          </div>

          <button
            onClick={() => speakQuestion(question?.question_text)}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px', background: voicePlaying ? 'rgba(99, 102, 241, 0.3)' : undefined }}
            title="Read question out loud with AI voice narrator"
          >
            {voicePlaying ? <Volume2 size={16} className="animate-spin" color="#818cf8" /> : <Volume2 size={16} />}
            <span>{voicePlaying ? 'Playing Voice...' : 'Replay Voice'}</span>
          </button>
        </div>

        {/* Guided STAR Checklist (If in STAR Guided Mode) */}
        {practiceMode === 'star_guided' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {[
              { key: 'S', label: '1. Situation', time: '0-15s', desc: 'Set company context' },
              { key: 'T', label: '2. Task', time: '15-30s', desc: 'Core objective & roadblock' },
              { key: 'A', label: '3. Action', time: '30-65s', desc: 'Technical & leadership steps' },
              { key: 'R', label: '4. Result', time: '65-90s', desc: 'Quantified metrics & impact' }
            ].map((st) => {
              const isCurrent = recordingState === 'recording' && activeStarStage === st.key;
              return (
                <div
                  key={st.key}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: isCurrent ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                    border: isCurrent ? '1px solid #a855f7' : '1px solid var(--border-subtle)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isCurrent ? '#f8fafc' : 'var(--text-muted)' }}>
                    {st.label} ({st.time})
                  </div>
                  <div style={{ fontSize: '0.68rem', color: isCurrent ? '#e2e8f0' : 'var(--text-secondary)' }}>
                    {st.desc}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Video Viewport */}
        <div className="video-preview-wrapper" style={{ position: 'relative' }}>
          {recordingState === 'stopped' && recordedVideoUrl ? (
            <video ref={playbackVideoRef} src={recordedVideoUrl} controls className="video-playback-element" />
          ) : (
            <video ref={liveVideoRef} autoPlay playsInline muted className="video-preview-element" />
          )}

          {/* Live Overlay: Timer, Dial & Live Mic */}
          {recordingState === 'recording' && (
            <div
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                right: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pointerEvents: 'none'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(244, 63, 94, 0.4)'
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f43f5e' }} className="pulse-recording" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fb7185' }}>REC</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>
                  {formatTimer(timerSeconds)}
                </span>
              </div>

              {/* Pressure Timer Dial (if Timed Pressure Mode) */}
              {practiceMode === 'timed_pressure' && (
                <div style={{ background: 'rgba(0,0,0,0.7)', borderRadius: '50%', padding: '2px' }}>
                  <PressureTimerDial timeLeftSeconds={timerLimit - timerSeconds} totalLimitSeconds={timerLimit} />
                </div>
              )}

              {/* Mic visualizer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Mic size={14} color="#34d399" />
                <div style={{ width: 60, height: 6, background: 'rgba(255, 255, 255, 0.15)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${audioLevel}%`,
                      backgroundColor: audioLevel > 75 ? '#f59e0b' : '#10b981',
                      transition: 'width 0.1s ease'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Analyzing Fullscreen Overlay */}
          {recordingState === 'analyzing' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(9, 13, 22, 0.94)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '30px',
                zIndex: 10
              }}
            >
              <div style={{ maxWidth: '460px', width: '100%', textAlign: 'center' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px auto',
                    boxShadow: '0 0 35px rgba(99, 102, 241, 0.5)'
                  }}
                  className="animate-spin"
                >
                  <Sparkles size={32} color="#ffffff" />
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
                  Evaluating Multimodal Response
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '22px' }}>
                  Whisper STT &bull; MediaPipe Posture &bull; Claude Rubric & Model Answer...
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                  {ANALYSIS_STEPS.map((step) => {
                    const isDone = activeStep > step.id;
                    const isCurrent = activeStep === step.id;

                    return (
                      <div
                        key={step.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: isCurrent ? 'rgba(99, 102, 241, 0.15)' : isDone ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          border: isCurrent ? '1px solid rgba(99, 102, 241, 0.4)' : isDone ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255, 255, 255, 0.04)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isDone ? (
                            <CheckCircle2 size={15} color="#10b981" />
                          ) : isCurrent ? (
                            <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%' }} />
                          ) : (
                            <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid #64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#64748b' }}>
                              {step.id}
                            </span>
                          )}
                          <span style={{ fontSize: '0.8rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#ffffff' : isDone ? '#cbd5e1' : '#64748b' }}>
                            {step.title}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{step.detail}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Probing Follow-Up Card (When follow-up generated) */}
        {followUpQuestion && recordingState === 'stopped' && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.35)',
              borderRadius: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f472b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🎙️ Interviewer Follow-Up Probing Turn
              </span>
              <button
                onClick={() => speakQuestion(followUpQuestion.follow_up_question)}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                <Volume2 size={13} />
                <span>Replay Probe</span>
              </button>
            </div>

            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
              "{followUpQuestion.follow_up_question}"
            </div>
            <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
              <strong>Focus:</strong> {followUpQuestion.suggested_focus}
            </div>
          </div>
        )}

        {/* Control Actions Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            paddingTop: '16px',
            flexWrap: 'wrap'
          }}
        >
          {recordingState === 'idle' && (
            <button
              onClick={startRecording}
              className="btn btn-danger btn-lg"
              style={{ minWidth: '220px', padding: '16px 32px' }}
            >
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff' }} />
              <span>Start Recording</span>
            </button>
          )}

          {recordingState === 'recording' && (
            <button
              onClick={stopRecording}
              className="btn btn-danger btn-lg pulse-recording"
              style={{ minWidth: '220px', padding: '16px 32px' }}
            >
              <Square size={18} fill="#ffffff" />
              <span>Stop Recording ({formatTimer(timerSeconds)})</span>
            </button>
          )}

          {recordingState === 'stopped' && (
            <>
              <button onClick={handleReRecord} className="btn btn-secondary" style={{ padding: '14px 22px', fontSize: '0.95rem' }}>
                <RotateCcw size={18} />
                <span>Re-record</span>
              </button>

              <button
                onClick={handleSubmitForAnalysis}
                className="btn btn-primary btn-lg"
                style={{ minWidth: '240px' }}
              >
                <Sparkles size={18} />
                <span>Submit for AI Evaluation</span>
                <Send size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
