import React, { useEffect, useState } from 'react';
import { X, Sparkles, ChevronUp } from 'lucide-react';

const CaptureResult = ({ result, onClose }) => {
  const [points, setPoints] = useState(0);

  useEffect(() => {
    // Animated point counter
    const target = result.points;
    const duration = 1000;
    const steps = 30;
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
  }, [result.points]);

  const rarityColor = `var(--rarity-${result.rarity.toLowerCase()})`;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200, 
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)'
    }}>
      <div className={`animate-slide-up glass-panel border-${result.rarity.toLowerCase()}`} style={{
        height: '85%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
        padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: 'linear-gradient(to bottom, rgba(13, 24, 30, 0.95), rgba(5, 8, 12, 1))'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={30} />
        </button>

        <div style={{ fontFamily: 'var(--font-display)', color: rarityColor, fontSize: '1.2rem', letterSpacing: 3, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
          {result.rarity === 'Legendary' && <Sparkles size={16} />}
          {result.rarity.toUpperCase()} DISCOVERY
          {result.rarity === 'Legendary' && <Sparkles size={16} />}
        </div>

        <h2 style={{ fontSize: '2.5rem', textAlign: 'center', lineHeight: 1.1, marginBottom: 5 }}>
          {result.animal.toUpperCase()}
        </h2>
        <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: 20 }}>
          {result.species}
        </div>

        {/* Image/Avatar */}
        <div style={{ 
          width: 180, height: 180, borderRadius: '50%', marginBottom: 30,
          border: `4px solid ${rarityColor}`, overflow: 'hidden',
          boxShadow: `0 0 30px ${rarityColor}40`, position: 'relative'
        }}>
          {result.image.startsWith('data:') ? (
            <img src={result.image} alt={result.animal} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', background: 'rgba(255,255,255,0.05)' }}>
              {result.image}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'flex', gap: 10, width: '100%', marginBottom: 30 }}>
          <div className="glass-panel" style={{ flex: 1, padding: 15, textAlign: 'center', background: 'rgba(0,0,0,0.3)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-display)', letterSpacing: 1 }}>BASE POINTS</div>
            <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: rarityColor }}>+{result.points_base}</div>
          </div>
          <div className="glass-panel" style={{ flex: 1, padding: 15, textAlign: 'center', background: 'rgba(0,0,0,0.3)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-display)', letterSpacing: 1 }}>BONUSES</div>
            <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: 'var(--neon-green)' }}>
              {result.isFirstOfSpecies ? 'x2 FIRST!' : 'NONE'}
            </div>
          </div>
        </div>

        {/* Total Points Awarded */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 2 }}>TOTAL XP EARNED</div>
          <div style={{ fontSize: '4rem', fontFamily: 'var(--font-display)', color: 'var(--text-main)', textShadow: '0 0 20px rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronUp color="var(--neon-green)" size={40} />
            {points}
          </div>
          {result.levelUp && (
            <div className="animate-slide-up" style={{ color: 'var(--neon-amber)', fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: 2, marginTop: 10, textShadow: '0 0 10px var(--neon-amber)' }}>
              LEVEL UP!
            </div>
          )}
        </div>

        {/* Fun Fact */}
        <div className="glass-panel" style={{ padding: '15px 20px', width: '100%', borderLeft: `4px solid ${rarityColor}` }}>
          <div style={{ fontSize: '0.8rem', color: rarityColor, fontFamily: 'var(--font-display)', marginBottom: 5 }}>FIELD NOTES</div>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>"{result.fun_fact}"</p>
        </div>

      </div>
    </div>
  );
};

export default CaptureResult;
