import React, { useState, useEffect } from 'react';
import { Swords, Shield, Zap, X, Trophy } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useGameFeedback } from '../hooks/useGameFeedback';
import { triggerParticleBurst } from '../utils/particles';

const ArenaScreen = ({ gameState }) => {
  const [selectedCapture, setSelectedCapture] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [battleState, setBattleState] = useState('SELECT'); // SELECT, MATCHING, BATTLE, RESULT
  const [winner, setWinner] = useState(null);
  const [loadingOpponent, setLoadingOpponent] = useState(false);
  const { playClick, playSuccess, triggerHaptic } = useGameFeedback();

  const handleSelect = (capture) => {
    playClick();
    setSelectedCapture(capture);
  };

  const findOpponent = async () => {
    playClick();
    setBattleState('MATCHING');
    setLoadingOpponent(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Try to find a random capture from someone else
      const { data, error } = await supabase
        .from('captures')
        .select('*, users(username)')
        .neq('user_id', session?.user?.id)
        .limit(50);

      let opp;
      if (data && data.length > 0) {
        // Pick random
        const randomDbOpp = data[Math.floor(Math.random() * data.length)];
        opp = {
          animal: randomDbOpp.animal_name,
          rarity: randomDbOpp.rarity,
          image: randomDbOpp.image_url,
          user: randomDbOpp.users?.username || 'Rival Hunter',
          stats: {
            speed: randomDbOpp.stat_speed || Math.floor(Math.random() * 80) + 20,
            stealth: randomDbOpp.stat_stealth || Math.floor(Math.random() * 80) + 20,
            aggression: randomDbOpp.stat_aggression || Math.floor(Math.random() * 80) + 20
          }
        };
      } else {
        // Fallback AI opponent
        opp = {
          animal: 'Wild Honey Badger',
          rarity: 'Epic',
          image: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=400&q=80',
          user: 'Wild AI',
          stats: { speed: 65, stealth: 50, aggression: 95 }
        };
      }

      setTimeout(() => {
        setOpponent(opp);
        setLoadingOpponent(false);
        startBattle(opp);
      }, 1500);

    } catch (err) {
      console.error(err);
      setBattleState('SELECT');
    }
  };

  const startBattle = (opp) => {
    setBattleState('BATTLE');
    triggerHaptic('heavy');
    
    // Calculate power levels
    const myPower = (selectedCapture.stats?.speed || 0) + (selectedCapture.stats?.stealth || 0) + (selectedCapture.stats?.aggression || 0);
    const oppPower = opp.stats.speed + opp.stats.stealth + opp.stats.aggression;

    setTimeout(() => {
      if (myPower >= oppPower) {
        setWinner('PLAYER');
        playSuccess();
        triggerParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 'Epic');
        // Add flat 50 XP
        supabase.auth.getSession().then(({ data: { session } }) => {
           if(session) {
             supabase.from('users').update({ xp: gameState.xp + 50 }).eq('id', session.user.id).then();
           }
        });
      } else {
        setWinner('OPPONENT');
        triggerHaptic('heavy');
      }
      setBattleState('RESULT');
    }, 3000);
  };

  const resetArena = () => {
    playClick();
    setSelectedCapture(null);
    setOpponent(null);
    setWinner(null);
    setBattleState('SELECT');
  };

  // 1. SELECT STATE
  if (battleState === 'SELECT') {
    return (
      <div className="content-area" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h1 className="heading-xl" style={{ color: '#ef4444', filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.4))' }}>ARENA</h1>
          <p className="text-muted" style={{ fontWeight: 600 }}>Select a champion to battle</p>
        </div>

        {selectedCapture ? (
          <div className="animate-pop-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className={`glass-panel border-${selectedCapture.rarity.toLowerCase()}`} style={{ padding: '24px', width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: `4px solid var(--rarity-${selectedCapture.rarity.toLowerCase()})` }}>
                <img src={selectedCapture.image} alt="champion" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h2 className="heading-lg" style={{ textAlign: 'center' }}>{selectedCapture.animal}</h2>
              
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3b82f6', fontWeight: 800 }}>
                  <span>SPD</span><span>{selectedCapture.stats?.speed || Math.floor(Math.random()*100)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8b5cf6', fontWeight: 800 }}>
                  <span>STL</span><span>{selectedCapture.stats?.stealth || Math.floor(Math.random()*100)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontWeight: 800 }}>
                  <span>AGR</span><span>{selectedCapture.stats?.aggression || Math.floor(Math.random()*100)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '16px' }}>
                <button onClick={() => setSelectedCapture(null)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700 }}>
                  CHANGE
                </button>
                <button onClick={findOpponent} style={{ flex: 2, padding: '12px', background: '#ef4444', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 800, boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)' }}>
                  FIND MATCH
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', overflowY: 'auto' }}>
            {gameState.captures.map(c => (
              <div key={c.id} onClick={() => handleSelect(c)} className={`glass-panel border-${c.rarity.toLowerCase()}`} style={{ padding: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src={c.image} alt={c.animal} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="text-sm text-center" style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.animal}</div>
              </div>
            ))}
            {gameState.captures.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No captures yet. Go snap some animals!</div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. MATCHING & BATTLE & RESULT STATE
  return (
    <div className="content-area" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.1) 0%, transparent 70%)' }}>
      
      {/* Opponent Card (Top) */}
      <div className={`glass-panel ${battleState === 'BATTLE' ? 'animate-rumble' : 'animate-slide-down'}`} style={{ width: '100%', maxWidth: '300px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: opponent ? `2px solid var(--rarity-${opponent.rarity.toLowerCase()})` : '2px dashed rgba(255,255,255,0.2)' }}>
        {loadingOpponent || !opponent ? (
          <div style={{ width: '100%', textAlign: 'center', padding: '20px' }}><div className="spinner" style={{ borderColor: '#ef4444', borderRightColor: 'transparent' }} /></div>
        ) : (
          <>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div className="text-xs text-muted">RIVAL</div>
              <div className="heading-sm">{opponent.user}</div>
              <div className="text-sm" style={{ fontWeight: 700, color: '#ef4444' }}>PWR: {opponent.stats.speed + opponent.stats.stealth + opponent.stats.aggression}</div>
            </div>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #ef4444' }}>
              <img src={opponent.image} alt="Opponent" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </>
        )}
      </div>

      {/* VS Badge */}
      <div style={{ margin: '32px 0', zIndex: 10, position: 'relative' }}>
        <div style={{ width: '60px', height: '60px', background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.5rem', boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)', border: '4px solid var(--bg-deep)' }}>
          VS
        </div>
      </div>

      {/* Player Card (Bottom) */}
      <div className={`glass-panel ${battleState === 'BATTLE' ? 'animate-rumble' : 'animate-slide-up'}`} style={{ width: '100%', maxWidth: '300px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: `2px solid var(--rarity-${selectedCapture.rarity.toLowerCase()})` }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-primary)' }}>
          <img src={selectedCapture.image} alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="text-xs text-muted">YOU</div>
          <div className="heading-sm">{selectedCapture.animal}</div>
          <div className="text-sm" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
            PWR: {(selectedCapture.stats?.speed || 0) + (selectedCapture.stats?.stealth || 0) + (selectedCapture.stats?.aggression || 0)}
          </div>
        </div>
      </div>

      {/* Result Overlay */}
      {battleState === 'RESULT' && (
        <div className="animate-pop-in" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          {winner === 'PLAYER' ? (
            <>
              <Trophy size={64} color="var(--rarity-epic)" style={{ marginBottom: '16px', filter: 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.6))' }} />
              <h1 className="heading-xl" style={{ color: 'var(--rarity-epic)', textAlign: 'center' }}>VICTORY!</h1>
              <p className="text-lg" style={{ color: 'white', marginTop: '8px' }}>Your champion prevailed.</p>
              <div className="heading-lg" style={{ color: 'var(--accent-primary)', marginTop: '24px' }}>+50 XP</div>
            </>
          ) : (
            <>
              <X size={64} color="#ef4444" style={{ marginBottom: '16px' }} />
              <h1 className="heading-xl" style={{ color: '#ef4444', textAlign: 'center' }}>DEFEAT</h1>
              <p className="text-lg" style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Your champion was overpowered.</p>
            </>
          )}

          <button onClick={resetArena} style={{ marginTop: '48px', padding: '16px 32px', background: 'white', color: 'black', fontWeight: 900, borderRadius: '50px', border: 'none', cursor: 'pointer' }}>
            CONTINUE
          </button>
        </div>
      )}
    </div>
  );
};

export default ArenaScreen;
