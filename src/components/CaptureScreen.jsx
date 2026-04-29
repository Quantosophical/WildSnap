import React, { useRef, useState, useEffect } from 'react';
import { Camera, AlertTriangle, X } from 'lucide-react';
import { identifyAnimal } from '../utils/api';
import { triggerParticleBurst } from '../utils/particles';
import { useGameFeedback } from '../hooks/useGameFeedback';
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
  
  const { feedbackClick, triggerHaptic } = useGameFeedback();

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

  const fetchLocationData = async () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: null, lng: null, location_name: 'Location Unknown', city_region: 'Unknown Region', weatherData: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        let location_name = 'Unknown Area';
        let city_region = 'Unknown Region';
        let weatherData = null;

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          location_name = data.address?.city || data.address?.town || data.address?.suburb || data.address?.county || 'Unknown Area';
          city_region = data.address?.city || data.address?.state || data.address?.region || data.address?.country || 'Unknown Region';
        } catch (e) {
          console.error("Nominatim error", e);
        }

        try {
           const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weathercode,temperature_2m,precipitation&timezone=auto`);
           const wData = await weatherRes.json();
           weatherData = {
              weatherCode: wData.current?.weathercode,
              temp: wData.current?.temperature_2m
           };
        } catch(e) {
           console.error("Open-Meteo error", e);
        }

        resolve({ lat: latitude, lng: longitude, location_name, city_region, weatherData });
      }, () => {
        resolve({ lat: null, lng: null, location_name: 'Location Unknown', city_region: 'Unknown Region', weatherData: null });
      }, { timeout: 10000 });
    });
  };

  const handleCapture = async () => {
    if (!videoRef.current || isScanning) return;
    
    setFlash(true);
    feedbackClick();
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
      
      if (!data.is_animal) {
        setIsScanning(false);
        triggerHaptic('heavy');
        setError("NOT AN ANIMAL 🚫 — Only wildlife counts");
      } else if (data.screen_detected) {
        setIsScanning(false);
        triggerHaptic('heavy');
        setError("SCREEN DETECTED 🖥️ — Capture real animals only");
      } else if (data.zoo_detected) {
        setIsScanning(false);
        triggerHaptic('heavy');
        setError(`ZOO DETECTED 🏛️ — ${data.zoo_reason || 'Captive animals do not count.'}`);
      } else if (data.confidence < 40) {
        setIsScanning(false);
        triggerHaptic('heavy');
        setError("TOO UNCLEAR 🌫️ — Get closer");
      } else if (!data.detected) {
        setIsScanning(false);
        triggerHaptic('heavy');
        setError("NOTHING CAPTURED 🔍");
      } else {
        // --- NEW LOGIC: Prevent duplicate species ---
        const alreadyCaptured = gameState.captures.some(
          c => c.species.toLowerCase() === data.species.toLowerCase()
        );

        if (alreadyCaptured) {
          setIsScanning(false);
          triggerHaptic('heavy');
          setError(`Already documented the ${data.species}! Find a new species.`);
          return;
        }

        // Proceed if new species
        const imageUrl = await uploadImage(base64Image);
        const { weatherData, ...loc } = await fetchLocationData();
        setIsScanning(false);
        handleSuccess({ ...data, ...loc }, imageUrl, weatherData);
      }
    } catch (err) {
      setIsScanning(false);
      setError(err.message || "Failed to analyze image. Check connection.");
    }
  };

  const handleSuccess = async (data, imageUrl, weatherData) => {
    triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, data.rarity);
    
    const finalCaptureData = await gameState.addCapture({
      ...data,
      image: imageUrl
    }, weatherData);
    
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
            <div className="blob-panel" style={{ padding: '12px 20px', borderRadius: '50px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-primary)' }} />
              <span style={{ fontWeight: 900, letterSpacing: '0.05em', color: 'var(--text-main)', fontSize: '0.85rem' }}>AR ACTIVE</span>
            </div>
            <div className="blob-panel" style={{ padding: '12px 20px', borderRadius: '50px', fontWeight: 900, color: 'var(--text-main)', fontSize: '0.9rem' }}>
              LVL {gameState.level}
            </div>
          </div>

          {/* Center AR Reticle */}
          <div className={`ar-reticle ${isScanning ? 'scanning' : ''}`} style={{ borderRadius: isScanning ? '50%' : '40px' }} />

          {/* Error Toast */}
          {error && (
            <div style={{ position: 'absolute', top: '100px', left: '20px', right: '20px', pointerEvents: 'auto' }}>
              <div className="blob-panel animate-pop-in" style={{ 
                border: '4px solid var(--rarity-legendary)',
                padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start',
                boxShadow: '0 12px 32px rgba(244,63,94,0.2)'
              }}>
                <AlertTriangle color="var(--rarity-legendary)" size={28} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: '1rem', color: 'var(--text-main)', fontWeight: 800 }}>{error}</div>
                <button onClick={() => { feedbackClick(); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={24} strokeWidth={3} />
                </button>
              </div>
            </div>
          )}

          {/* Bottom Controls - Massive 3D Shutter */}
          <div style={{ marginTop: 'auto', paddingBottom: '120px', display: 'flex', justifyContent: 'center', pointerEvents: 'auto' }}>
            {isScanning ? (
              <div className="blob-panel animate-pop-in" style={{ padding: '24px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', borderRadius: '50px' }}>
                <div className="spinner" />
                <div style={{ color: 'var(--text-main)', letterSpacing: '0.1em', fontWeight: 900, fontSize: '1.2rem' }}>ANALYZING...</div>
              </div>
            ) : (
              <button 
                onClick={handleCapture}
                className="btn-3d btn-circle"
                style={{
                  width: '100px', height: '100px',
                  background: 'white',
                  border: '8px solid rgba(255,255,255,0.4)',
                  backgroundClip: 'padding-box',
                  boxShadow: '0 12px 0 rgba(0,0,0,0.2), 0 24px 48px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--accent-primary)', border: '4px solid white', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.2)' }} />
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
