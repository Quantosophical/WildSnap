import React, { useEffect, useState } from 'react';
import { X, Sparkles, ChevronUp, Star } from 'lucide-react';
import { useGameFeedback } from '../hooks/useGameFeedback';

const CaptureResult = ({ result, onClose }) => {
  const [points, setPoints] = useState(0);
  const { feedbackSuccess, feedbackClick } = useGameFeedback();

  useEffect(() => {
    // Play success sound and haptic when the capture result appears
    feedbackSuccess();

    // Animated point counter
    const target = result.points;
    const duration = 1200;
    const steps = 40;
    const stepTime = duration / steps;
    const increment = target / steps;
    
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setPoints(target);
        clearInterval(timer);
      } else {
        setPoints(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [result.points, feedbackSuccess]);

  const rarityColor = `var(--rarity-${result.rarity.toLowerCase()})`;

  const handleClose = () => {
    feedbackClick();
    onClose();
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200, 
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', padding: '24px'
    }}>
      <div className="animate-pop-in" style={{
        width: '100%', maxWidth: '400px',
        background: 'var(--bg-surface)',
        borderRadius: '32px',
        padding: '32px 24px', 
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
        position: 'relative',
        border: `4px solid ${rarityColor}`
      }}>
        
        {/* Confetti or Sparkles effect placeholder */}
        <div style={{ position: 'absolute', top: -20, color: rarityColor }}>
          <Star size={48} fill={rarityColor} />
        </div>

        <button 
          onClick={handleClose}
          style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '6px', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'transform 0.2s' }}
          onPointerDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
          onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <X size={24} strokeWidth={3} />
        </button>

        <div style={{ fontFamily: 'var(--font-display)', color: rarityColor, fontSize: '1.1rem', fontWeight: 800, letterSpacing: 2, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, marginTop: 24 }}>
          {result.rarity === 'Legendary' && <Sparkles size={18} />}
          {result.rarity.toUpperCase()} CATCH
          {result.rarity === 'Legendary' && <Sparkles size={18} />}
        </div>

        <h2 style={{ fontSize: '2.5rem', textAlign: 'center', lineHeight: 1.1, marginBottom: 4, color: 'var(--text-main)', fontWeight: 900 }}>
          {result.animal.toUpperCase()}
        </h2>
        <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: 16, fontWeight: 500 }}>
          {result.species}
        </div>

        {/* Location Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '16px', marginBottom: 24, fontSize: '0.8rem', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.1)' }}>
          📍 Logged at {result.location_name || 'Unknown Location'}
        </div>

        {/* Image/Avatar */}
        <div style={{ 
          width: 160, height: 160, borderRadius: '50%', marginBottom: 32,
          border: `6px solid ${rarityColor}`, overflow: 'hidden',
          boxShadow: `0 12px 32px ${rarityColor}40`, position: 'relative',
          background: 'var(--bg-deep)'
        }}>
          {result.image.startsWith('data:') ? (
            <img src={result.image} alt={result.animal} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', background: 'rgba(0,0,0,0.02)' }}>
              {result.image}
            </div>
          )}
        </div>

        {/* Behavior Badge */}
        {result.behavior && result.behavior !== 'unknown' && result.behavior !== 'resting' && (
           <div className="animate-pop-in" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid var(--rarity-epic)', padding: '8px 16px', borderRadius: '20px', marginBottom: 24, color: 'var(--rarity-epic)', fontWeight: 800 }}>
             🔥 {result.behavior.toUpperCase().replace('_', ' ')} · {result.behavior_multiplier}x BONUS
           </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-deep)', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)' }}>
             <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>BASE XP</span>
             <span style={{ fontWeight: 900, color: rarityColor }}>{Math.floor((result.points / (result.isFirstOfSpecies ? 2 : 1) / (result.behavior_multiplier || 1) / (result.weather_bonus || 1)))}</span>
          </div>
          
          {(result.isFirstOfSpecies || result.behavior_multiplier > 1 || result.weather_bonus > 1) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'var(--bg-deep)', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: 1, marginBottom: '4px' }}>MULTIPLIERS</div>
              {result.isFirstOfSpecies && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>First Discovery</span>
                  <span style={{ fontWeight: 900, color: 'var(--accent-primary)' }}>2.0x</span>
                </div>
              )}
              {result.behavior_multiplier > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Behavior ({result.behavior})</span>
                  <span style={{ fontWeight: 900, color: 'var(--rarity-epic)' }}>{result.behavior_multiplier}x</span>
                </div>
              )}
              {result.weather_bonus > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Weather Bonus</span>
                  <span style={{ fontWeight: 900, color: '#3b82f6' }}>{result.weather_bonus}x</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Total Points Awarded */}
        <div style={{ textAlign: 'center', marginBottom: 24, width: '100%', background: rarityColor, padding: '24px', borderRadius: '24px', color: '#fff', boxShadow: `0 8px 24px ${rarityColor}60` }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: 2, opacity: 0.9 }}>TOTAL XP EARNED</div>
          <div style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            <ChevronUp size={48} strokeWidth={3} />
            {points}
          </div>
          {result.levelUp && (
            <div className="animate-pop-in" style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: 2, marginTop: 8, background: '#fff', color: rarityColor, padding: '4px 12px', borderRadius: '12px', display: 'inline-block' }}>
              LEVEL UP!
            </div>
          )}
        </div>

        <button className="btn-3d btn-3d-primary btn-pill" style={{ width: '100%', padding: '20px' }} onClick={handleClose}>
          CONTINUE
        </button>

      </div>
    </div>
  );
};

export default CaptureResult;
