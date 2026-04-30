import React from 'react';
import { Share2, Award, Flame, Star, Camera, LogOut, Shield, Leaf, HeartPulse, ShieldAlert, Trophy } from 'lucide-react';
import { useGameFeedback } from '../hooks/useGameFeedback';
import { getMasteryLevel } from '../hooks/useGameState';

const FIELD_RANKS = [
  { level: 1, name: 'NOVICE TRACKER', color: '#94a3b8' },
  { level: 5, name: 'FIELD RESEARCHER', color: '#3b82f6' },
  { level: 10, name: 'WILDLIFE BIOLOGIST', color: '#10b981' },
  { level: 25, name: 'VETERAN EXPLORER', color: '#f59e0b' },
  { level: 50, name: 'CONSERVATION MASTER', color: '#ef4444' },
  { level: 100, name: 'GLOBAL LEGEND', color: '#8b5cf6' }
];

const getFieldRank = (level) => {
  let rank = FIELD_RANKS[0];
  for (let i = 0; i < FIELD_RANKS.length; i++) {
    if (level >= FIELD_RANKS[i].level) {
      rank = FIELD_RANKS[i];
    }
  }
  return rank;
};

const ProfileScreen = ({ gameState, onLogout }) => {
  const { feedbackClick } = useGameFeedback();
  
  const totalCaptures = gameState.userRecord?.total_captures || gameState.captures.length || 0;
  
  const rarityCounts = gameState.captures.reduce((acc, curr) => {
    acc[curr.rarity] = (acc[curr.rarity] || 0) + 1;
    return acc;
  }, {});

  const currentRank = getFieldRank(gameState.level);

  // Stats Grid items
  const stats = [
    { label: 'TOTAL CAPTURES', value: totalCaptures, color: 'var(--accent-secondary)' },
    { label: 'LONGEST STREAK', value: gameState.maxStreak || gameState.streak, color: 'var(--rarity-epic)', icon: <Flame size={20} /> },
    { label: 'CONSERVATION XP', value: gameState.totalPoints || 0, color: 'var(--rarity-rare)', icon: <Leaf size={20} /> }
  ];

  // Masteries
  const masteriesArray = Object.entries(gameState.mastery || {})
    .map(([species, count]) => ({ species, count, ...getMasteryLevel(count) }))
    .sort((a, b) => b.level - a.level)
    .slice(0, 5); // top 5

  const [report, setReport] = React.useState(null);
  const [loadingReport, setLoadingReport] = React.useState(false);

  const handleGenerateReport = async () => {
     setLoadingReport(true);
     try {
        const { generateImpactReport } = await import('../utils/api');
        const rareCaptures = gameState.captures.filter(c => ['Rare', 'Epic', 'Legendary'].includes(c.rarity)).map(c => c.species).join(', ');
        const text = await generateImpactReport(`User has ${gameState.totalPoints || 0} conservation points and captured: ${rareCaptures}`);
        setReport(text);
     } catch (e) {
        setReport("Failed to generate report. Please try again later.");
     }
     setLoadingReport(false);
  };

  return (
    <div className="content-area" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 className="heading-xl text-gradient">PROFILE</h1>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={feedbackClick} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <Share2 size={24} />
          </button>
          <button onClick={onLogout} style={{ background: 'none', border: 'none', color: 'var(--rarity-legendary)', cursor: 'pointer' }}>
            <LogOut size={24} />
          </button>
        </div>
      </div>

      {/* Avatar & Level Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', border: `4px solid ${currentRank.color}`, overflow: 'hidden', boxShadow: `0 0 24px ${currentRank.color}40` }}>
            {gameState.avatarUrl ? (
              <img src={gameState.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (gameState.username || 'U').substring(0,2).toUpperCase()
            )}
          </div>
          <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: currentRank.color, color: 'white', padding: '6px 16px', borderRadius: '20px', fontWeight: 900, fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', whiteSpace: 'nowrap', border: '2px solid var(--bg-deep)' }}>
            LVL {gameState.level} • {currentRank.name}
          </div>
        </div>
        <h2 className="heading-lg" style={{ marginTop: '12px', marginBottom: '4px' }}>{gameState.username || 'HUNTER'}</h2>
        <div className="text-sm text-muted" style={{ fontWeight: 500 }}>{gameState.xp.toLocaleString()} XP TOTAL</div>
      </div>

      {/* Streaks & Shields */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rarity-epic)' }}>
               <Flame size={24} />
            </div>
            <div>
               <div className="text-xs text-muted" style={{ fontWeight: 800, letterSpacing: '0.05em' }}>ACTIVE STREAK</div>
               <div className="heading-lg" style={{ color: 'var(--rarity-epic)' }}>{gameState.streak} DAYS</div>
            </div>
         </div>
         <div style={{ textAlign: 'right' }}>
            <div className="text-xs text-muted" style={{ fontWeight: 800, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
               <ShieldAlert size={14} /> STREAK SHIELDS
            </div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px', justifyContent: 'flex-end' }}>
               {[1, 2, 3].map(i => (
                  <Shield key={i} size={18} color={i <= (gameState.shields || 0) ? '#3b82f6' : 'rgba(255,255,255,0.1)'} fill={i <= (gameState.shields || 0) ? '#3b82f6' : 'none'} />
               ))}
            </div>
         </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {stats.map((s, i) => (
          <div key={i} className="glass-panel" style={{ padding: '16px', textAlign: 'center', borderRadius: '20px' }}>
            <div className="text-xs text-muted" style={{ fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px', minHeight: '28px' }}>{s.label}</div>
            <div className="heading-md" style={{ color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {s.icon} {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Conservation Impact */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', borderLeft: '4px solid var(--rarity-rare)', background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <HeartPulse size={24} color="var(--rarity-rare)" />
            <h3 className="heading-md" style={{ color: 'var(--text-main)' }}>Conservation Impact</h3>
         </div>
         <p className="text-sm text-muted" style={{ lineHeight: 1.6, marginBottom: '16px' }}>
            Your field work has actively contributed to global wildlife monitoring. You've documented <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{gameState.totalPoints || 0}</span> endangered species sightings.
         </p>
         
         {report ? (
            <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 800 }}>
                  <Sparkles size={16} /> MONTHLY IMPACT REPORT
               </div>
               <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)', fontStyle: 'italic' }}>
                  {report}
               </p>
            </div>
         ) : (
            <button onClick={handleGenerateReport} disabled={loadingReport} className="btn-3d btn-pill" style={{ width: '100%', padding: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loadingReport ? 0.7 : 1 }}>
               {loadingReport ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Award size={16} />}
               {loadingReport ? 'GENERATING REPORT...' : 'GENERATE MONTHLY REPORT (NIM)'}
            </button>
         )}
      </div>

      {/* Top Masteries */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
         <h3 className="heading-md" style={{ marginBottom: '20px', color: 'var(--text-main)' }}>Animal Masteries</h3>
         {masteriesArray.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {masteriesArray.map((m, i) => (
                 <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: i === masteriesArray.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                       <div className="heading-sm" style={{ marginBottom: '4px' }}>{m.species}</div>
                       <div className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Trophy size={12} color="var(--rarity-epic)" /> {m.name} {m.badge}
                       </div>
                    </div>
                    <div className="heading-md" style={{ color: 'var(--accent-primary)' }}>{m.count}</div>
                 </div>
               ))}
            </div>
         ) : (
            <div className="text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>Capture animals multiple times to earn masteries.</div>
         )}
      </div>

    </div>
  );
};

export default ProfileScreen;
