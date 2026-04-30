import React from 'react';

export default function CaptureResult({ result, finalPoints, onContinue }) {
  const getRarityColor = (rarity) => {
    switch(rarity?.toLowerCase()) {
      case 'common': return 'var(--rarity-common)';
      case 'uncommon': return 'var(--rarity-uncommon)';
      case 'rare': return 'var(--rarity-rare)';
      case 'epic': return 'var(--rarity-epic)';
      case 'legendary': return 'var(--rarity-legendary)';
      default: return 'var(--text-main)';
    }
  };

  const isLegendary = result.rarity?.toLowerCase() === 'legendary';

  return (
    <div className="animate-slide-up" style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(10, 26, 15, 0.98)',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className={`glass-card ${isLegendary ? 'pulse-glow-legendary' : ''}`} style={{
        width: '100%',
        maxWidth: '400px',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          background: getRarityColor(result.rarity),
          color: '#000',
          padding: '4px 12px',
          borderRadius: '16px',
          fontFamily: 'var(--font-display)',
          fontSize: '1.2rem',
          letterSpacing: '2px'
        }}>
          {result.rarity?.toUpperCase()} DISCOVERY
        </div>

        <h1 style={{ fontSize: '3rem', textAlign: 'center', lineHeight: 1.1, margin: 0 }}>
          {result.animal?.toUpperCase()}
        </h1>
        
        <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', margin: '-10px 0 0 0' }}>
          {result.species}
        </p>

        {result.behavior_description && (
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', width: '100%', textAlign: 'center' }}>
            <span style={{ color: 'var(--accent-amber)', fontWeight: 'bold' }}>Behavior: </span>
            {result.behavior_description}
          </div>
        )}

        <div style={{ fontSize: '4rem', fontFamily: 'var(--font-display)', color: 'var(--accent-main)', textShadow: '0 0 20px rgba(57,255,106,0.5)' }}>
          +{finalPoints} XP
        </div>

        {result.fun_fact && (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', textAlign: 'center', lineHeight: 1.5 }}>
            <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>Did you know? </span>
            {result.fun_fact}
          </p>
        )}

        <button 
          onClick={onContinue}
          className="btn-primary" 
          style={{ width: '100%', marginTop: '16px' }}
        >
          CONTINUE HUNTING
        </button>
      </div>
    </div>
  );
}
