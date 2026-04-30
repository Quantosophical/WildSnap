import React, { useState } from 'react';
import CameraView from '../features/capture/CameraView';
import CaptureRejection from '../features/capture/CaptureRejection';
import CaptureResult from '../features/capture/CaptureResult';
import { analyzeCapture } from '../features/capture/captureLogic';
import { useCapture } from '../hooks/useCapture';

export default function SnapScreen() {
  const [analyzing, setAnalyzing] = useState(false);
  const [rejection, setRejection] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [points, setPoints] = useState(0);
  
  const { saveCapture } = useCapture();

  const handleCapture = async (base64Image) => {
    setAnalyzing(true);
    setRejection(null);
    
    try {
      // 1. Analyze via NIM API
      const result = await analyzeCapture(base64Image);
      
      // 2. Reject states
      if (result.error || !result.is_animal || result.screen_detected || result.zoo_detected || result.confidence < 40 || !result.detected) {
        setRejection(result);
        return;
      }

      // 3. Success state: get fake location for now, save
      // In reality: navigator.geolocation.getCurrentPosition...
      const mockLocation = { lat: 40.7128, lng: -74.0060, name: 'Wilderness' };
      const finalPts = await saveCapture(base64Image, result, mockLocation);
      
      setPoints(finalPts);
      setSuccessResult(result);
      
    } catch (err) {
      console.error("Capture processing error:", err);
      // Fallback rejection
      setRejection({ error: true, rejection_reason: "Failed to save capture. " + err.message });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRetry = () => {
    setRejection(null);
    setSuccessResult(null);
  };

  return (
    <div className="screen-container" style={{ paddingBottom: 0, position: 'relative' }}>
      
      {/* Camera is always active in background unless a result is shown over it */}
      <CameraView onCapture={handleCapture} />

      {/* Analyzing Overlay */}
      {analyzing && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 26, 15, 0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            border: '4px solid var(--border-color)', borderTopColor: 'var(--accent-main)',
            animation: 'spin 1s linear infinite'
          }} />
          <h2 className="animate-pulse" style={{ marginTop: '24px', color: 'var(--accent-main)', letterSpacing: '2px' }}>
            ANALYZING WILDLIFE...
          </h2>
        </div>
      )}

      {/* Rejection Overlay */}
      {rejection && !analyzing && (
        <CaptureRejection result={rejection} onRetry={handleRetry} />
      )}

      {/* Success Overlay */}
      {successResult && !analyzing && (
        <CaptureResult result={successResult} finalPoints={points} onContinue={handleRetry} />
      )}
      
      {/* CSS spin animation inside component */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
      `}</style>
    </div>
  );
}
