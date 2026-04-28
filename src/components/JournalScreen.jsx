import React, { useState } from 'react';
import { Filter, ChevronRight, Calendar, MapPin } from 'lucide-react';

const JournalScreen = ({ gameState, onJumpToMap }) => {
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  const filters = ['ALL', 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
  
  const filteredCaptures = gameState.captures.filter(c => 
    filter === 'ALL' || c.rarity.toUpperCase() === filter
  );

  // Group by species to count unique
  const uniqueSpecies = new Set(gameState.captures.map(c => c.species)).size;
  const totalPossible = 8000; // Fake number of total species

  return (
    <div className="content-area" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="heading-xl text-gradient">JOURNAL</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginTop: '8px' }}>
          <span className="text-sm" style={{ fontWeight: 600 }}>{uniqueSpecies} / {totalPossible} DISCOVERED</span>
          <span className="text-sm" style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{(uniqueSpecies/totalPossible*100).toFixed(4)}%</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.max(1, (uniqueSpecies/totalPossible*100))}%`, background: 'var(--accent-primary)', boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)', borderRadius: '3px', transition: 'width 1s ease' }} />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '16px', scrollbarWidth: 'none' }}>
        <Filter size={20} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '6px' }} />
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 20px', borderRadius: '24px', border: `1px solid ${filter === f ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)'}`,
              background: filter === f ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-glass)',
              color: filter === f ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer', flexShrink: 0,
              transition: 'all 0.2s ease', backdropFilter: 'blur(16px)'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '16px' }}>
        {filteredCaptures.map(capture => {
          const isExpanded = expandedId === capture.id;
          const rarityColor = `var(--rarity-${capture.rarity.toLowerCase()})`;
          
          if (isExpanded) {
            return (
              <div key={capture.id} className={`glass-panel border-${capture.rarity.toLowerCase()} animate-fade-in`} style={{ gridColumn: '1 / -1', padding: '20px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                  {capture.lat !== undefined && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onJumpToMap(capture.lat, capture.lng); }}
                      style={{ background: 'rgba(59, 130, 246, 0.2)', borderRadius: '50%', padding: '6px', border: '1px solid rgba(59, 130, 246, 0.5)', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <MapPin size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => setExpandedId(null)}
                    style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', padding: '4px', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronRight size={20} style={{ transform: 'rotate(-90deg)' }} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '88px', height: '88px', borderRadius: '16px', border: `2px solid ${rarityColor}`, overflow: 'hidden', flexShrink: 0, background: 'rgba(0,0,0,0.2)' }}>
                    {capture.image.startsWith('data:') || capture.image.startsWith('http') ? (
                      <img src={capture.image} alt={capture.animal} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                        {capture.image}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, paddingRight: '24px' }}>
                    <div className="text-xs" style={{ color: rarityColor, fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>{capture.rarity.toUpperCase()}</div>
                    <h3 className="heading-md" style={{ marginBottom: '2px' }}>{capture.animal}</h3>
                    <div className="text-sm text-muted" style={{ fontStyle: 'italic' }}>{capture.species}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    <Calendar size={14} /> {new Date(capture.date).toLocaleDateString()}
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <MapPin size={14} style={{ flexShrink: 0 }} /> {capture.location_name || 'Wild'}
                  </div>
                  <div className="heading-md" style={{ color: 'var(--accent-primary)' }}>
                    +{capture.points} XP
                  </div>
                </div>
                
                {capture.stats && (
                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '80px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>SPEED</span>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${capture.stats.speed || 0}%`, height: '100%', background: '#3b82f6' }} />
                      </div>
                      <span style={{ width: '24px', fontSize: '0.75rem', fontWeight: 700, textAlign: 'right' }}>{capture.stats.speed || 0}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '80px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>STEALTH</span>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${capture.stats.stealth || 0}%`, height: '100%', background: '#8b5cf6' }} />
                      </div>
                      <span style={{ width: '24px', fontSize: '0.75rem', fontWeight: 700, textAlign: 'right' }}>{capture.stats.stealth || 0}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '80px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>AGGRESSION</span>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${capture.stats.aggression || 0}%`, height: '100%', background: '#ef4444' }} />
                      </div>
                      <span style={{ width: '24px', fontSize: '0.75rem', fontWeight: 700, textAlign: 'right' }}>{capture.stats.aggression || 0}</span>
                    </div>
                  </div>
                )}
                
                {capture.fun_fact && (
                  <p className="text-sm text-muted" style={{ marginTop: '16px', lineHeight: 1.6, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                    {capture.fun_fact}
                  </p>
                )}
              </div>
            );
          }

          return (
            <div 
              key={capture.id} 
              className={`glass-panel border-${capture.rarity.toLowerCase()} animate-fade-in`}
              style={{ padding: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.2s ease', gap: '8px' }}
              onClick={() => setExpandedId(capture.id)}
            >
              <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
                {capture.image.startsWith('data:') || capture.image.startsWith('http') ? (
                  <img src={capture.image} alt={capture.animal} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                    {capture.image}
                  </div>
                )}
              </div>
              <div style={{ width: '100%', padding: '0 4px', paddingBottom: '4px' }}>
                <div className="text-xs" style={{ color: rarityColor, fontWeight: 700 }}>{capture.rarity.toUpperCase()}</div>
                <div className="text-sm" style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>{capture.animal}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredCaptures.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', background: 'var(--bg-glass)', borderRadius: '24px', marginTop: '20px' }}>
          No captures found for this rarity.
        </div>
      )}
    </div>
  );
};

export default JournalScreen;
