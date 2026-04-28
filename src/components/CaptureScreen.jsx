import React, { useRef, useState, useEffect } from 'react';
import { Camera, AlertTriangle, X } from 'lucide-react';
import { identifyAnimal } from '../utils/api';
import { triggerParticleBurst } from '../utils/particles';
import { playSound } from '../utils/audio';
import CaptureResult from './CaptureResult';
import { supabase } from '../utils/supabase';

const CaptureScreen = ({ gameState }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(false);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1080 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setHasCamera(true);
    } catch (err) {
      console.error("Camera access denied or unavailable", err);
      setError("Camera not available. Please allow access or try a different device.");
    }
  };

  const uploadImage = async (base64Image) => {
    const res = await fetch(base64Image);
    const blob = await res.blob();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

    const { data, error } = await supabase.storage
      .from('captures')
      .upload(fileName, blob, { contentType: 'image/jpeg' });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('captures')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  const handleCapture = async () => {
    if (!videoRef.current || isScanning) return;
    
    setFlash(true);
    playSound('snap');
    setTimeout(() => setFlash(false), 400);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);

    setIsScanning(true);
    setError('');

    try {
      const data = await identifyAnimal(base64Image);
      
      if (data.detected) {
        if (data.zoo_detected) {
          setIsScanning(false);
          playSound('reject');
          setError(`ZOO DETECTED: ${data.zoo_reason}. Captive animals do not count.`);
        } else {
          const imageUrl = await uploadImage(base64Image);
          setIsScanning(false);
          handleSuccess(data, imageUrl);
        }
      } else {
        setIsScanning(false);
        setError("No animal detected. Get closer and ensure good lighting.");
      }
    } catch (err) {
      setIsScanning(false);
      setError(err.message || "Failed to analyze image. Check connection.");
    }
  };

  const handleSuccess = async (data, imageUrl) => {
    if (data.rarity === 'Legendary') playSound('legendary');
    else playSound('success');
    
    triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, data.rarity);
    
    const finalCaptureData = await gameState.addCapture({
      ...data,
      image: imageUrl
    });
    
    setResult(finalCaptureData);
  };

  return (
    <div style={{ flex: 1, position: 'relative', background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column' }}>
      {/* Viewfinder */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Flash Effect */}
      <div className={`shutter-effect ${flash ? 'active' : ''}`} />

      {/* AR Overlay */}
      {!result && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column' }}>
          
          {/* Top Bar */}
          <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-primary)' }} />
              <span className="text-xs" style={{ fontWeight: 600, letterSpacing: '0.05em' }}>AR ACTIVE</span>
            </div>
            <div className="glass-panel text-sm" style={{ padding: '8px 16px', borderRadius: '20px', fontWeight: 700 }}>
              LVL {gameState.level}
            </div>
          </div>

          {/* Center AR Reticle */}
          <div className={`ar-reticle ${isScanning ? 'scanning' : ''}`} />

          {/* Error Toast */}
          {error && (
            <div style={{ position: 'absolute', top: '100px', left: '20px', right: '20px', pointerEvents: 'auto' }}>
              <div className="glass-panel animate-slide-up" style={{ 
                background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--rarity-legendary)',
                padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start', borderRadius: '16px'
              }}>
                <AlertTriangle color="var(--rarity-legendary)" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1, fontSize: '0.9rem', color: '#f8fafc' }}>{error}</div>
                <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Bottom Controls */}
          <div style={{ marginTop: 'auto', paddingBottom: '120px', display: 'flex', justifyContent: 'center', pointerEvents: 'auto' }}>
            {isScanning ? (
              <div className="glass-panel" style={{ padding: '20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', borderRadius: '32px' }}>
                <div className="spinner" />
                <div className="text-xs" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>ANALYZING...</div>
              </div>
            ) : (
              <button 
                onClick={handleCapture}
                style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)', border: '3px solid white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', outline: 'none', padding: '4px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)',
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
                onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'white' }} />
              </button>
            )}
          </div>
        </div>
      )}

      {result && <CaptureResult result={result} onClose={() => setResult(null)} />}
    </div>
  );
};

export default CaptureScreen;
