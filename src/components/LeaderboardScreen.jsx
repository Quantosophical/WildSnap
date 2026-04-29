import React, { useState, useEffect } from 'react';
import { Crown, Flame, Medal, Users, Leaf, Droplets, Sun } from 'lucide-react';
import { supabase } from '../utils/supabase';
import ExpeditionBanner from './ExpeditionBanner';
import FeedScreen from './FeedScreen';
import { useGameFeedback } from '../hooks/useGameFeedback';

const CLANS = [
  { id: 'canopy', name: 'The Canopy Syndicate', icon: Leaf, color: '#10b981', desc: 'Jungle & Forest Focus' },
  { id: 'vanguard', name: 'Deep Blue Vanguard', icon: Droplets, color: '#3b82f6', desc: 'Water & Coastal Focus' },
  { id: 'horizon', name: 'Crimson Horizon', icon: Sun, color: '#f59e0b', desc: 'Desert & Savanna Focus' }
];

const LeaderboardScreen = ({ gameState }) => {
  const [tab, setTab] = useState('GLOBAL');
  const [leaderboard, setLeaderboard] = useState([]);
  const [clanMembers, setClanMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userClan, setUserClan] = useState(null);
  const { playClick } = useGameFeedback();

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
          rank: index + 1
        }));
        setLeaderboard(mapped);

        // Fetch User Clan
        const { data: clanData } = await supabase
           .from('clan_members')
           .select('clan_id')
           .eq('user_id', currentUserId)
           .single();
           
        if (clanData) {
           setUserClan(clanData.clan_id);
           
           // Fetch Clan Leaderboard
           const { data: cMembers } = await supabase
             .from('clan_members')
             .select('user_id, contribution_points, users(username, avatar_url, streak)')
             .eq('clan_id', clanData.clan_id)
             .order('contribution_points', { ascending: false })
             .limit(50);
             
           if (cMembers) {
             setClanMembers(cMembers.map((cm, idx) => ({
                id: cm.user_id,
                name: cm.users?.username,
                points: cm.contribution_points,
                streak: cm.users?.streak || 0,
                avatarUrl: cm.users?.avatar_url,
                isUser: cm.user_id === currentUserId,
                rank: idx + 1
             })));
           }
        }
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [gameState.xp]);

  const handleJoinClan = async (clanId) => {
    playClick();
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('clan_members').insert([{ user_id: session.user.id, clan_id: clanId }]);
    setUserClan(clanId);
    setTab('CLAN');
  };

  const getRankDisplay = (index, rank) => {
    if (index === 0) return <Crown color="var(--rarity-epic)" size={24} style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))' }} />;
    if (index === 1) return <Medal color="#94a3b8" size={24} />;
    if (index === 2) return <Medal color="#b45309" size={24} />;
    return <span className="text-muted" style={{ fontWeight: 700 }}>{rank}</span>;
  };

  const renderLeaderboard = (list) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
      ) : (
        list.map((player, index) => {
          const isTop3 = index < 3;
          const bgClass = player.isUser ? 'var(--bg-glass-hover)' : 'var(--bg-glass)';
          const borderStyle = player.isUser ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)';

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
                {getRankDisplay(index, player.rank)}
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
  );

  const displayList = tab === 'GLOBAL' ? leaderboard : (tab === 'CLAN' ? clanMembers : leaderboard.filter(p => p.isFriend || p.isUser));
  const currentUserEntry = displayList.find(p => p.isUser);
  const userRank = currentUserEntry ? currentUserEntry.rank : '-';

  return (
    <div className="content-area" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="heading-xl text-gradient" style={{ marginBottom: '24px' }}>RANKS & SOCIAL</h1>
        
        <ExpeditionBanner />
        
        {/* Toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '6px', marginTop: '16px', border: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {['GLOBAL', 'CLAN', 'FRIENDS', 'FIELD NOTES'].map(t => (
            <button
              key={t}
              onClick={() => { playClick(); setTab(t); }}
              style={{
                flex: 1, padding: '12px 16px', border: 'none', borderRadius: '18px', whiteSpace: 'nowrap',
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

      {tab === 'FIELD NOTES' ? (
         <FeedScreen gameState={gameState} />
      ) : tab === 'CLAN' && !userClan ? (
         <div className="animate-fade-in" style={{ padding: '20px', textAlign: 'center' }}>
            <Users size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h2 className="heading-lg" style={{ marginBottom: '8px' }}>CHOOSE YOUR CLAN</h2>
            <p className="text-muted" style={{ marginBottom: '32px' }}>Join a global research faction to compete in territory wars and clan leaderboards.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {CLANS.map(clan => {
                  const Icon = clan.icon;
                  return (
                    <div key={clan.id} className="glass-panel" style={{ padding: '24px', borderRadius: '24px', border: `2px solid ${clan.color}40`, textAlign: 'left', display: 'flex', gap: '16px', alignItems: 'center' }}>
                       <div style={{ background: `${clan.color}20`, padding: '16px', borderRadius: '50%', color: clan.color }}>
                          <Icon size={32} />
                       </div>
                       <div style={{ flex: 1 }}>
                          <h3 className="heading-sm" style={{ color: clan.color, marginBottom: '4px' }}>{clan.name}</h3>
                          <div className="text-sm text-muted">{clan.desc}</div>
                       </div>
                       <button onClick={() => handleJoinClan(clan.id)} className="btn-3d btn-pill" style={{ background: clan.color, padding: '12px 24px', fontSize: '0.9rem' }}>
                          JOIN
                       </button>
                    </div>
                  );
               })}
            </div>
         </div>
      ) : (
         <>
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

          {renderLeaderboard(displayList)}
         </>
      )}
    </div>
  );
};

export default LeaderboardScreen;
