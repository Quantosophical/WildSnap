import React, { useState, useEffect } from 'react';
import { Clock, Globe, Shield, Users } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useGameFeedback } from '../hooks/useGameFeedback';

const FeedScreen = ({ gameState }) => {
  const [activeTab, setActiveTab] = useState('global'); // 'global', 'clan', 'friends'
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const { feedbackClick } = useGameFeedback();

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  };

  useEffect(() => {
    fetchFeed();
    
    // Subscribe to feed updates based on current tab
    const channel = supabase.channel(`feed_updates_${activeTab}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'captures' }, () => {
        fetchFeed();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, gameState.userId]);

  const fetchFeed = async () => {
    if (!gameState.userId) return;
    setLoading(true);
    let query = supabase.from('captures').select(`
      id, animal_name, rarity, created_at, user_id, image_url, points_earned,
      users!inner (username, avatar_url, clan_id, rank_title)
    `).order('created_at', { ascending: false }).limit(30);

    if (activeTab === 'global') {
      query = query.in('rarity', ['Epic', 'Legendary']); // Global only shows epic/legendary discoveries
    } else if (activeTab === 'clan') {
      if (!gameState.userRecord?.clan_id) {
        setFeed([]);
        setLoading(false);
        return;
      }
      query = query.eq('users.clan_id', gameState.userRecord.clan_id);
    } else if (activeTab === 'friends') {
      // Get friend IDs
      const { data: friendships } = await supabase.from('friendships').select('friend_id').eq('user_id', gameState.userId).eq('status', 'accepted');
      if (!friendships || friendships.length === 0) {
        setFeed([]);
        setLoading(false);
        return;
      }
      const friendIds = friendships.map(f => f.friend_id);
      friendIds.push(gameState.userId); // Show own captures too
      query = query.in('user_id', friendIds);
    }

    const { data, error } = await query;
    if (!error && data) {
      setFeed(data);
    } else {
      setFeed([]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '50px' }}>
          {[
            { id: 'global', icon: <Globe size={16} /> },
            { id: 'clan', icon: <Shield size={16} /> },
            { id: 'friends', icon: <Users size={16} /> }
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => { feedbackClick(); setActiveTab(t.id); }}
              style={{ 
                flex: 1, padding: '10px', borderRadius: '50px', border: 'none', fontWeight: 800, fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                background: activeTab === t.id ? 'white' : 'transparent',
                color: activeTab === t.id ? 'black' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
            >
              {t.icon} {t.id.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner" />
          </div>
        ) : feed.length === 0 ? (
          <div className="text-muted" style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-glass)', borderRadius: '24px' }}>
            {activeTab === 'global' ? 'No epic discoveries lately.' : 
             activeTab === 'clan' ? (gameState.userRecord?.clan_id ? 'Your clan is quiet.' : 'You are not in a clan.') : 
             'Add friends to see their captures!'}
          </div>
        ) : (
          feed.map((item) => {
            const borderClass = `border-${item.rarity?.toLowerCase() || 'common'}`;
            
            return (
              <div key={item.id} className={`animate-slide-up glass-panel ${borderClass}`} style={{ padding: '16px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {item.users?.avatar_url ? <img src={item.users.avatar_url} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{item.users?.username}</div>
                    <div className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontWeight: 500 }}>
                      <Clock size={12} strokeWidth={2.5} /> {getTimeAgo(new Date(item.created_at))}
                    </div>
                  </div>
                  <div style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 800 }}>
                    +{item.points_earned} PTS
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '16px' }}>
                   {item.image_url ? (
                     <img src={item.image_url} alt="capture" style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />
                   ) : (
                     <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'var(--bg-surface)' }} />
                   )}
                   <div>
                     <div className="text-xs text-muted" style={{ fontWeight: 800, marginBottom: '2px' }}>DISCOVERED</div>
                     <div className="heading-sm" style={{ color: `var(--rarity-${item.rarity?.toLowerCase() || 'common'})` }}>{item.animal_name}</div>
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>
  );
};

export default FeedScreen;
