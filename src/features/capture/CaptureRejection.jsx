import React from 'react';

export default function CaptureRejection({ result, onRetry }) {
  let title = "NOTHING FOUND 🔍";
  let message = "No recognizable animal detected.";
  let bgColor = "var(--rarity-common)";

  if (result.error) {
    title = "CONNECTION FAILED 📡";
    message = result.rejection_reason || "Check your internet connection and try again.";
    bgColor = "var(--rarity-legendary)"; // Red-ish
  } else if (!result.is_animal) {
    title = "NOT AN ANIMAL 🚫";
    message = `Looks like: ${result.what_object || 'something else'}. Only real wildlife counts. Try again outside!`;
    bgColor = "var(--rarity-uncommon)";
  } else if (result.screen_detected) {
    title = "SCREEN DETECTED 🖥";
    message = "That animal is on a screen. Find it in the wild!";
    bgColor = "var(--rarity-epic)";
  } else if (result.zoo_detected) {
    title = "ZOO DETECTED 🏛";
    message = "Zoo animals don't count. Find wildlife in the wild!";
    bgColor = "var(--rarity-epic)";
  } else if (result.confidence < 40) {
    title = "TOO UNCLEAR 🌫";
    message = "Get closer and try again.";
    bgColor = "var(--text-muted)";
  }

  return (
    <div className="animate-slide-up" style={{
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      background: 'rgba(15, 31, 18, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: `4px solid ${bgColor}`,
      borderTopLeftRadius: '24px',
      borderTopRightRadius: '24px',
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      zIndex: 100
    }}>
      <h2 style={{ color: bgColor, fontSize: '2rem', textAlign: 'center' }}>{title}</h2>
      <p style={{ textAlign: 'center', fontSize: '1.1rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
        {message}
      </p>
      
      <button 
        onClick={onRetry}
        className="btn-primary" 
        style={{ width: '100%', marginTop: '16px', height: '56px' }}
      >
        TRY AGAIN
      </button>
    </div>
  );
}
