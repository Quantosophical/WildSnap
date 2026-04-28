import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Map, Trophy, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <canvas id="particle-canvas" />
      
      <div className="content-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="animate-slide-up" style={{ textAlign: 'center', zIndex: 10, width: '100%', maxWidth: '340px' }}>
          <h1 className="text-gradient" style={{ 
            fontSize: '4.5rem', 
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            lineHeight: 1,
            marginBottom: '16px',
            letterSpacing: '-0.02em'
          }}>
            WILDSNAP
          </h1>
          <p className="text-muted text-sm" style={{ fontWeight: 600, letterSpacing: '0.1em', marginBottom: '48px' }}>
            THE WORLD IS YOUR POKÉDEX
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Camera color="var(--accent-primary)" size={24} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>SNAP WILDLIFE</div>
                <div className="text-xs text-muted" style={{ lineHeight: 1.4 }}>AI instantly identifies species & rarity.</div>
              </div>
            </div>
            
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Map color="var(--accent-secondary)" size={24} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>BUILD A COLLECTION</div>
                <div className="text-xs text-muted" style={{ lineHeight: 1.4 }}>Curate your field journal anywhere.</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trophy color="var(--rarity-epic)" size={24} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>CLIMB THE RANKS</div>
                <div className="text-xs text-muted" style={{ lineHeight: 1.4 }}>Compete globally for top XP.</div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/auth')}
            style={{
              width: '100%', padding: '20px', borderRadius: '32px', 
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              color: '#fff', fontWeight: 700, border: 'none', fontFamily: 'var(--font-display)',
              fontSize: '1.25rem', cursor: 'pointer', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)'; }}
            onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3)'; }}
          >
            START HUNTING <ArrowRight size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
