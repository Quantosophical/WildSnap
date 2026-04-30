import React from 'react';

export default function AnimalCard({ capture, onClick }) {
  const isLegendary = capture.rarity.toLowerCase() === 'legendary';
  const rarityColors = {
    common: 'var(--rarity-common)',
    uncommon: 'var(--rarity-uncommon)',
    rare: 'var(--rarity-rare)',
    epic: 'var(--rarity-epic)',
    legendary: 'var(--rarity-legendary)'
  };
  const color = rarityColors[capture.rarity.toLowerCase()] || 'var(--text-main)';

  return (
    <div 
      className={`glass-card ${isLegendary ? 'pulse-glow-legendary' : ''}`}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '12px',
        borderTop: `3px solid ${color}`,
        position: 'relative',
        transition: 'transform 0.2s'
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.5)', marginBottom: '12px' }}>
        {capture.photo_url ? (
          <img src={capture.photo_url} alt={capture.animal_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Photo</div>
        )}
      </div>

      <h3 style={{ fontSize: '1.2rem', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {capture.animal_name}
      </h3>
      
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', flex: 1 }}>
        {new Date(capture.created_at).toLocaleDateString()}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <span style={{ fontSize: '0.75rem', background: color, color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
          {capture.rarity.toUpperCase()}
        </span>
        <span style={{ fontSize: '1rem', fontFamily: 'var(--font-display)', color: 'var(--accent-main)' }}>
          {capture.points_earned} XP
        </span>
      </div>
    </div>
  );
}
