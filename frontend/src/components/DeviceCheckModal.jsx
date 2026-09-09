import React, { useState, useEffect, useRef } from 'react';
import { X, Video, VideoOff, Mic, MicOff, CheckCircle2, AlertCircle, RefreshCw, Volume2 } from 'lucide-react';

export function DeviceCheckModal({ isOpen, onClose }) {
  const [stream, setStream] = useState(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [permissionError, setPermissionError] = useState('');
  
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startDeviceTest();
    } else {
      stopDeviceTest();
    }

    return () => {
      stopDeviceTest();
    };
  }, [isOpen]);

  const startDeviceTest = async () => {
    setPermissionError('');
    try {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true
      });

      setStream(userMedia);
      setHasCamera(userMedia.getVideoTracks().length > 0);
      setHasMic(userMedia.getAudioTracks().length > 0);

      if (videoRef.current) {
        videoRef.current.srcObject = userMedia;
      }

      // Initialize Web Audio API Analyser for live volume meter
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(userMedia);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setVolumeLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err) {
      console.error('Device access error:', err);
      setPermissionError(
        err.name === 'NotAllowedError'
          ? 'Camera/Microphone permission was denied. Please allow camera and microphone access in your browser settings.'
          : `Device check failed: ${err.message}`
      );
    }
  };

  const stopDeviceTest = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setVolumeLevel(0);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '28px',
          position: 'relative',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Video size={20} color="#34d399" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Device Readiness Check</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Test your camera framing and microphone levels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '6px', borderRadius: '50%', minWidth: 'auto' }}
          >
            <X size={18} />
          </button>
        </div>

        {permissionError ? (
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: '#fb7185',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Permission Required: </strong>
              {permissionError}
            </div>
          </div>
        ) : (
          <div>
            {/* Live Camera View */}
            <div className="camera-test-wrapper">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="video-preview-element"
              />
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: hasCamera ? '#34d399' : '#fb7185'
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: hasCamera ? '#10b981' : '#f43f5e'
                  }}
                />
                <span>{hasCamera ? 'Webcam Live & Centered' : 'Connecting Camera...'}</span>
              </div>
            </div>

            {/* Microphone Volume Meter */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 600 }}>
                  <Mic size={16} color={volumeLevel > 5 ? '#10b981' : 'var(--text-muted)'} />
                  <span>Microphone Audio Input:</span>
                </div>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: volumeLevel > 40 ? '#f59e0b' : volumeLevel > 5 ? '#10b981' : 'var(--text-muted)'
                  }}
                >
                  {volumeLevel > 5 ? `${volumeLevel}% Active` : 'Speak into mic...'}
                </span>
              </div>

              <div className="mic-meter-track">
                <div
                  className="mic-meter-fill"
                  style={{ width: `${Math.min(100, volumeLevel * 1.5)}%` }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Good lighting on your face for optimal MediaPipe iris engagement tracking.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Position yourself roughly arm's length from camera to match interview distance.</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} className="btn btn-primary" style={{ padding: '8px 20px' }}>
            <span>Looks Good, Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
