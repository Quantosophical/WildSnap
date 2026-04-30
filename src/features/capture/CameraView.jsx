import React, { useEffect, useRef } from 'react';

export default function CameraView({ onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied or unavailable", err);
      }
    }
    setupCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Scale down to max 800px width for performance/storage
    const maxWidth = 800;
    const scale = Math.min(1, maxWidth / canvas.width);
    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;
    
    const scaleCanvas = document.createElement('canvas');
    scaleCanvas.width = scaledWidth;
    scaleCanvas.height = scaledHeight;
    const scaleCtx = scaleCanvas.getContext('2d');
    scaleCtx.drawImage(canvas, 0, 0, scaledWidth, scaledHeight);
    
    const base64Image = scaleCanvas.toDataURL('image/jpeg', 0.8);
    onCapture(base64Image);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />
      
      {/* Capture Button */}
      <button
        onClick={handleCapture}
        style={{
          position: 'absolute',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.3)',
          border: '4px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}
      >
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'white'
        }} />
      </button>

      {/* Frame overlay */}
      <div style={{
        position: 'absolute',
        top: '10%', bottom: '20%', left: '10%', right: '10%',
        border: '2px dashed rgba(255,255,255,0.4)',
        borderRadius: '24px',
        pointerEvents: 'none'
      }} />
    </div>
  );
}
