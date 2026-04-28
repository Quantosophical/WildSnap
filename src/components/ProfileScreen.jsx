import React from 'react';
import { Share2, Award, Flame, Star, Camera, LogOut } from 'lucide-react';

const ProfileScreen = ({ gameState, onLogout }) => {
  // Stats calculations
  const totalCaptures = gameState.captures.length;
  
  const rarityCounts = gameState.captures.reduce((acc, curr) => {
    acc[curr.rarity] = (acc[curr.rarity] || 0) + 1;
    return acc;
  }, {});

  const rarestCatch = gameState.captures.reduce((prev, current) => {
    const tierValue = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Epic': 4, 'Legendary': 5 };
    return (tierValue[current.rarity] > tierValue[prev?.rarity || 'Common']) ? current : prev;
  }, gameState.captures[0] || null);

  const achievements = [
    { id: 1, name: 'FIRST CATCH', icon: <Camera />, earned: totalCaptures > 0, color: 'var(--accent-primary)' },
    { id: 2, name: 'RARE HUNTER', icon: <Star />, earned: !!rarityCounts['Rare'], color: 'var(--rarity-rare)' },
    { id: 3, name: 'STREAK MASTER', icon: <Flame />, earned: gameState.streak >= 7, color: 'var(--rarity-epic)' },
    { id: 4, name: 'LEGENDARY', icon: <Award />, earned: !!rarityCounts['Legendary'], color: 'var(--rarity-legendary)' }
  ];

  // Calculate donut chart segments
  let cumulativePercent = 0;
  const donutSegments = Object.entries(rarityCounts).map(([rarity, count]) => {
    const percent = (count / totalCaptures) * 100;
    const start = cumulativePercent;
    cumulativePercent += percent;
    return { rarity, percent, start };
  });

  return (
    <div className="content-area" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 className="heading-xl text-gradient">PROFILE</h1>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}>
            <Share2 size={24} />
          </button>
          <button onClick={onLogout} style={{ background: 'none', border: 'none', color: 'var(--rarity-legendary)', cursor: 'pointer', transition: 'transform 0.2s' }} onPointerDown={e => e.currentTarget.style.transform='scale(0.9)'} onPointerUp={e => e.currentTarget.style.transform='scale(1)'}>
            <LogOut size={24} />
          </button>
        </div>
      </div>

      {/* Avatar & Level Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          {/* Level Ring SVG */}
          <svg width="128" height="128" style={{ position: 'absolute', top: -12, left: -12, transform: 'rotate(-90deg)' }}>
            <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
            <circle 
              cx="64" cy="64" r="58" fill="none" stroke="url(#levelGradient)" strokeWidth="4" 
              strokeDasharray="364.42" 
              strokeDashoffset={364.42 - (364.42 * ((gameState.xp % 500) / 500))}
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-primary)" />
                <stop offset="100%" stopColor="var(--accent-secondary)" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ width: 104, height: 104, borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', border: '2px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            {gameState.avatarUrl ? (
              <img src={gameState.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (gameState.username || 'U').substring(0,2).toUpperCase()
            )}
          </div>
          <div style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--accent-primary)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}>
            LVL {gameState.level}
          </div>
        </div>
        <h2 className="heading-lg" style={{ marginBottom: '4px' }}>{gameState.username || 'HUNTER'}</h2>
        <div className="text-sm" style={{ color: 'var(--accent-primary)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>WILDLIFE PHOTOGRAPHER</div>
        <div className="text-sm text-muted" style={{ fontWeight: 500 }}>{gameState.xp.toLocaleString()} XP TOTAL</div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div className="text-xs text-muted" style={{ fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>TOTAL CAPTURES</div>
          <div className="heading-xl" style={{ color: 'var(--accent-secondary)' }}>{totalCaptures}</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <div className="text-xs text-muted" style={{ fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>CURRENT STREAK</div>
          <div className="heading-xl" style={{ color: 'var(--rarity-epic)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Flame size={28} strokeWidth={2.5} /> {gameState.streak}
          </div>
        </div>
      </div>

      {/* Rarity Breakdown */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 className="heading-md" style={{ marginBottom: '24px', color: 'var(--text-main)' }}>Rarity Breakdown</h3>
        
        {totalCaptures > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ 
              width: 110, height: 110, borderRadius: '50%', flexShrink: 0,
              background: `conic-gradient(${donutSegments.map(s => `var(--rarity-${s.rarity.toLowerCase()}) ${s.start}% ${s.start + s.percent}%`).join(', ')})`,
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
              <div style={{ width: 86, height: 86, borderRadius: '50%', background: 'var(--bg-glass)', backdropFilter: 'blur(16px)' }} />
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'].map(r => {
                const count = rarityCounts[r] || 0;
                if (count === 0) return null;
                return (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '4px', background: `var(--rarity-${r.toLowerCase()})` }} />
                    <span className="text-muted" style={{ flex: 1, fontWeight: 500 }}>{r}</span>
                    <span style={{ fontWeight: 700 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>No captures yet.</div>
        )}
      </div>

      {/* Rarest Catch */}
      {rarestCatch && (
        <div className="glass-panel border-epic" style={{ padding: '24px', marginBottom: '32px', background: 'linear-gradient(to right, rgba(245, 158, 11, 0.05), transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="heading-md" style={{ color: 'var(--rarity-epic)' }}>Rarest Catch</h3>
            <span className="text-xs text-muted" style={{ fontWeight: 500 }}>{new Date(rarestCatch.date).toLocaleDateString()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--rarity-epic)', flexShrink: 0, background: 'rgba(0,0,0,0.2)' }}>
              {rarestCatch.image.startsWith('http') || rarestCatch.image.startsWith('data:') ? (
                 <img src={rarestCatch.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              ) : (
                 <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>{rarestCatch.image}</div>
              )}
            </div>
            <div>
              <div className="heading-md" style={{ marginBottom: '4px' }}>{rarestCatch.animal}</div>
              <div className="text-xs" style={{ color: `var(--rarity-${rarestCatch.rarity.toLowerCase()})`, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {rarestCatch.rarity}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements */}
      <div>
        <h3 className="heading-md" style={{ marginBottom: '20px', color: 'var(--text-main)' }}>Achievements</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
          {achievements.map(ach => (
            <div key={ach.id} className="glass-panel" style={{ 
              padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
              opacity: ach.earned ? 1 : 0.4,
              border: ach.earned ? `1px solid ${ach.color}` : '1px solid rgba(255,255,255,0.05)',
              background: ach.earned ? `radial-gradient(circle at top, ${ach.color}15, transparent)` : 'var(--bg-glass)'
            }}>
              <div style={{ color: ach.color, filter: ach.earned ? `drop-shadow(0 0 12px ${ach.color}80)` : 'grayscale(100%)', transform: ach.earned ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.3s' }}>
                {ach.icon}
              </div>
              <div className="text-xs" style={{ fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center', color: ach.earned ? 'var(--text-main)' : 'var(--text-muted)' }}>
                {ach.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
