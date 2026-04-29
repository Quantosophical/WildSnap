import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { supabase } from '../utils/supabase';

const FeedScreen = ({ gameState }) => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

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
    const fetchFeed = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('captures')
        .select(`
          id,
          animal_name,
          rarity,
          created_at,
          users (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        const mapped = data.map(c => ({
          id: c.id,
          user: c.users?.username || 'Unknown Hunter',
          avatarUrl: c.users?.avatar_url,
          action: 'caught a',
          animal: c.animal_name,
          rarity: c.rarity,
          timeStr: getTimeAgo(new Date(c.created_at))
        }));
        setFeed(mapped);
      }
      setLoading(false);
    };

    fetchFeed();

    // Setup Realtime subscription
    const channel = supabase.channel('feed_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'captures' }, () => {
        fetchFeed();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading && feed.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner" />
          </div>
        ) : feed.length === 0 ? (
          <div className="text-muted" style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-glass)', borderRadius: '24px' }}>No activity yet. Go catch something!</div>
        ) : (
          feed.map((item) => {
            const borderClass = `border-${item.rarity?.toLowerCase() || 'common'}`;
            
            return (
              <div key={item.id} className={`animate-slide-up glass-panel ${borderClass}`} style={{ 
                padding: '16px', display: 'flex', gap: '16px', alignItems: 'center'
              }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                  overflow: 'hidden', flexShrink: 0
                }}>
                  {item.avatarUrl ? (
                    <img src={item.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    '📷'
                  )}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.95rem', lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.user}</span>{' '}
                    <span className="text-muted">{item.action}</span>{' '}
                    <span style={{ color: `var(--rarity-${item.rarity?.toLowerCase() || 'common'})`, fontWeight: 700 }}>{item.animal}</span>
                  </div>
                  <div className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontWeight: 500 }}>
                    <Clock size={12} strokeWidth={2.5} /> {item.timeStr}
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
