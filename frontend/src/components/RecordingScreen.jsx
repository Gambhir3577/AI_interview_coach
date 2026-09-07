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
  CheckCircle2
} from 'lucide-react';
import { API_BASE } from '../config.js';

const ANALYSIS_STEPS = [
  { id: 1, title: "Uploading video & extracting 16kHz audio track...", detail: "FFmpeg extraction" },
  { id: 2, title: "Transcribing speech with OpenAI Whisper...", detail: "Local neural speech-to-text" },
  { id: 3, title: "Calculating speaking pace (WPM) & filler words...", detail: "Regex & silence metrics" },
  { id: 4, title: "Tracking iris alignment with MediaPipe Face Mesh...", detail: "Gaze engagement proxy" },
  { id: 5, title: "Generating structured feedback via Anthropic Claude...", detail: "Relevance & STAR scoring" }
];

export function RecordingScreen({ question, onBack, onAnalysisComplete }) {
  const [stream, setStream] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const [recordingState, setRecordingState] = useState('idle'); // 'idle' | 'recording' | 'stopped' | 'analyzing'
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [activeStep, setActiveStep] = useState(1);
  const [analysisError, setAnalysisError] = useState(null);

  const liveVideoRef = useRef(null);
  const playbackVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Initialize camera and mic
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

        // Web Audio visualizer setup
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

  // Format seconds to mm:ss
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = () => {
    if (!stream) return;

    setRecordedBlob(null);
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }
    recordedChunksRef.current = [];
    setTimerSeconds(0);
    setAnalysisError(null);

    // Determine supported mimeType
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
      };

      recorder.start(500); // chunk every 500ms
      setRecordingState('recording');

      // Timer
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      setAnalysisError("Failed to initialize video recording on this device.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  // Reset / Re-record
  const handleReRecord = () => {
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

  // Submit recording for backend analysis
  const handleSubmitForAnalysis = async () => {
    if (!recordedBlob || !question) return;

    setRecordingState('analyzing');
    setActiveStep(1);
    setAnalysisError(null);

    // Simulate animated step progression during server processing
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < 5 ? prev + 1 : prev));
    }, 3500);

    const formData = new FormData();
    const filename = `interview_${question.id}_${Date.now()}.webm`;
    formData.append('video', recordedBlob, filename);
    formData.append('question_id', question.id);
    formData.append('category', question.category);
    formData.append('question_text', question.question_text);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Bar: Back & Question context */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          <ArrowLeft size={16} />
          <span>Change Question / Category</span>
        </button>

        <span className={`badge badge-${question?.category || 'behavioral'}`}>
          {question?.category?.toUpperCase()}
        </span>
      </div>

      {/* Main Studio Card */}
      <div className="glass-card" style={{ padding: '24px', border: '1px solid var(--border-subtle)' }}>
        {/* Question Header Banner */}
        <div
          style={{
            padding: '16px 20px',
            background: 'rgba(99, 102, 241, 0.08)',
            borderLeft: '4px solid #6366f1',
            borderRadius: '0 12px 12px 0',
            marginBottom: '20px'
          }}
        >
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#a5b4fc', letterSpacing: '0.05em' }}>
            Current Question
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginTop: '4px', lineHeight: 1.4 }}>
            "{question?.question_text}"
          </h2>
        </div>

        {/* Permission Error State */}
        {permissionError ? (
          <div
            style={{
              padding: '32px 24px',
              textAlign: 'center',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <VideoOff size={44} color="#f43f5e" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.2rem', color: '#fb7185', marginBottom: '8px' }}>Camera & Mic Permission Needed</h3>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              {permissionError}
            </p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              <RotateCcw size={16} />
              <span>Retry Permissions</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            {/* Video Viewport */}
            <div className="video-preview-wrapper" style={{ position: 'relative' }}>
              {recordingState === 'stopped' && recordedVideoUrl ? (
                /* Playback after recording */
                <video
                  ref={playbackVideoRef}
                  src={recordedVideoUrl}
                  controls
                  className="video-playback-element"
                />
              ) : (
                /* Live Webcam feed */
                <video
                  ref={liveVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="video-preview-element"
                />
              )}

              {/* Live Overlay: Timer & Live Mic Bar */}
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
                  {/* Recording Status & Timer */}
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
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: '#f43f5e',
                        boxShadow: '0 0 10px #f43f5e'
                      }}
                      className="pulse-recording"
                    />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fb7185', letterSpacing: '0.05em' }}>
                      REC
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>
                      {formatTimer(timerSeconds)}
                    </span>
                  </div>

                  {/* Live Mic Level Visualizer */}
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
                    background: 'rgba(9, 13, 22, 0.92)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '30px',
                    zIndex: 10
                  }}
                >
                  <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
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
                      Analyzing Your Answer
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                      Processing audio, vision, and semantic content pipelines...
                    </p>

                    {/* Step-by-Step Progress Pipeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
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
                              padding: '10px 14px',
                              borderRadius: '10px',
                              background: isCurrent ? 'rgba(99, 102, 241, 0.15)' : isDone ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                              border: isCurrent ? '1px solid rgba(99, 102, 241, 0.4)' : isDone ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255, 255, 255, 0.04)',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {isDone ? (
                                <CheckCircle2 size={16} color="#10b981" />
                              ) : isCurrent ? (
                                <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%' }} />
                              ) : (
                                <span style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid #64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#64748b' }}>
                                  {step.id}
                                </span>
                              )}
                              <span style={{ fontSize: '0.82rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#ffffff' : isDone ? '#cbd5e1' : '#64748b' }}>
                                {step.title}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {step.detail}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error banner if analysis failed */}
            {analysisError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#fb7185',
                  fontSize: '0.88rem'
                }}
              >
                <AlertCircle size={18} />
                <span>{analysisError}</span>
              </div>
            )}

            {/* Control Actions Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                paddingTop: '8px',
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
                  <button
                    onClick={handleReRecord}
                    className="btn btn-secondary"
                    style={{ padding: '14px 24px', fontSize: '0.95rem' }}
                  >
                    <RotateCcw size={18} />
                    <span>Re-record</span>
                  </button>

                  <button
                    onClick={handleSubmitForAnalysis}
                    className="btn btn-primary btn-lg"
                    style={{ minWidth: '240px' }}
                  >
                    <Sparkles size={18} />
                    <span>Submit for AI Analysis</span>
                    <Send size={16} />
                  </button>
                </>
              )}
            </div>

            {/* Quick Tips Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <span>💡 Look directly into the camera lens for optimal eye contact</span>
              <span>🎙️ Speak clearly at a moderate pace (120-160 WPM)</span>
              <span>⏱️ Aim for 45 to 90 seconds per answer</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
