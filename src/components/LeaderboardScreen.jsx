import React, { useState, useEffect } from 'react';
import { Crown, Flame, ArrowUp, Medal } from 'lucide-react';
import { supabase } from '../utils/supabase';

const LeaderboardScreen = ({ gameState }) => {
  const [tab, setTab] = useState('GLOBAL');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('xp', { ascending: false })
        .limit(50);
        
      if (!error && data) {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;
        
        const mapped = data.map((u, index) => ({
          id: u.id,
          name: u.username || 'Unknown',
          points: u.xp || 0,
          streak: u.streak || 0,
          avatarUrl: u.avatar_url,
          isUser: u.id === currentUserId,
          isFriend: false, // Friends not implemented yet
          trend: 'up', // placeholder
          rank: index + 1
        }));
        setLeaderboard(mapped);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [gameState.xp]);

  const displayList = tab === 'GLOBAL' ? leaderboard : leaderboard.filter(p => p.isFriend || p.isUser);
  const currentUserEntry = leaderboard.find(p => p.isUser);
  const userRank = currentUserEntry ? currentUserEntry.rank : '-';

  return (
    <div className="content-area" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="heading-xl text-gradient">RANKS</h1>
        
        {/* Toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '6px', marginTop: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {['GLOBAL', 'FRIENDS'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '12px 0', border: 'none', borderRadius: '18px',
                background: tab === t ? 'var(--bg-glass-hover)' : 'transparent',
                color: tab === t ? 'var(--text-main)' : 'var(--text-muted)',
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.05em', cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: tab === t ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned User Bar */}
      {currentUserEntry && (
        <div className="glass-panel" style={{ 
          padding: '16px 20px', marginBottom: '24px', border: '1px solid var(--accent-primary)',
          display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(16, 185, 129, 0.05)'
        }}>
          <div className="heading-lg" style={{ color: 'var(--accent-primary)', width: '36px', textAlign: 'center' }}>
            #{userRank}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', overflow: 'hidden' }}>
              {currentUserEntry.avatarUrl ? (
                <img src={currentUserEntry.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                currentUserEntry.name.substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>YOU</div>
              <div className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: 500 }}>
                <Flame size={12} color="var(--rarity-epic)" /> {currentUserEntry.streak} Day Streak
              </div>
            </div>
          </div>
          <div className="heading-md" style={{ color: 'var(--text-main)' }}>
            {currentUserEntry.points.toLocaleString()}
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
        ) : (
          displayList.map((player, index) => {
            const isTop3 = index < 3;
            const bgClass = player.isUser ? 'var(--bg-glass-hover)' : 'var(--bg-glass)';
            const borderStyle = player.isUser ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)';
            
            let rankDisplay;
            if (index === 0) rankDisplay = <Crown color="var(--rarity-epic)" size={24} style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))' }} />;
            else if (index === 1) rankDisplay = <Medal color="#94a3b8" size={24} />;
            else if (index === 2) rankDisplay = <Medal color="#b45309" size={24} />;
            else rankDisplay = <span className="text-muted" style={{ fontWeight: 700 }}>{player.rank}</span>;

            return (
              <div 
                key={player.id}
                className="animate-slide-up"
                style={{ 
                  padding: '16px', border: borderStyle, borderRadius: '20px',
                  display: 'flex', alignItems: 'center', gap: '16px',
                  background: bgClass, backdropFilter: 'blur(16px)',
                  boxShadow: isTop3 ? '0 8px 24px rgba(0,0,0,0.2)' : 'none',
                  animationDelay: `${index * 0.05}s`
                }}
              >
                <div style={{ width: '32px', display: 'flex', justifyContent: 'center' }}>
                  {rankDisplay}
                </div>
                
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, overflow: 'hidden', border: isTop3 ? '2px solid rgba(255,255,255,0.2)' : 'none' }}>
                  {player.avatarUrl ? (
                    <img src={player.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    player.name.substring(0,2).toUpperCase()
                  )}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: player.isUser ? 'var(--accent-primary)' : 'var(--text-main)', fontSize: isTop3 ? '1.05rem' : '0.95rem' }}>
                    {player.name}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="heading-md" style={{ color: isTop3 ? 'white' : 'var(--text-muted)' }}>
                    {player.points.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LeaderboardScreen;
