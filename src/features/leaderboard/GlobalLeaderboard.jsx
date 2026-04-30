import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../../supabaseClient';
import { AppContext } from '../../context/AppContext';

export default function GlobalLeaderboard() {
  const { user } = useContext(AppContext);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaders() {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, rank_title, avatar_color, total_points, total_captures')
        .order('total_points', { ascending: false })
        .limit(100);
      
      if (!error && data) {
        setLeaders(data);
      }
      setLoading(false);
    }
    fetchLeaders();
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading ranks...</div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {leaders.map((leader, index) => {
        const isMe = user?.id === leader.id;
        
        return (
          <div key={leader.id} className="glass-card" style={{
            display: 'flex', alignItems: 'center', padding: '12px', gap: '16px',
            border: isMe ? '2px solid var(--accent-main)' : '1px solid var(--border-color)',
            background: isMe ? 'rgba(57, 255, 106, 0.1)' : 'rgba(15, 31, 18, 0.8)'
          }}>
            {/* Rank Number */}
            <div style={{
              width: '32px', textAlign: 'center', fontFamily: 'var(--font-display)',
              fontSize: '1.5rem', color: index < 3 ? 'var(--accent-amber)' : 'var(--text-muted)'
            }}>
              #{index + 1}
            </div>

            {/* Avatar */}
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: leader.avatar_color || 'var(--accent-main)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#000', fontFamily: 'var(--font-display)', fontSize: '1.5rem'
            }}>
              {leader.username.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {leader.username}
                </div>
                {isMe && <span style={{ fontSize: '0.7rem', background: 'var(--accent-main)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>YOU</span>}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {leader.rank_title} • {leader.total_captures} captures
              </div>
            </div>

            {/* Points */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--accent-main)' }}>
                {leader.total_points}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>XP</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
