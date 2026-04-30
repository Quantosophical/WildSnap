import React, { useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { AppContext } from '../context/AppContext';

export default function AlertsScreen() {
  const { user, notifications, dispatch } = useContext(AppContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) return;
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (!error && data) {
        dispatch({ type: 'SET_NOTIFICATIONS', payload: data });
      }
      setLoading(false);
    }
    fetchNotifications();
  }, [user, dispatch]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    dispatch({ type: 'MARK_READ' });
  };

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    // Locally update
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    dispatch({ type: 'SET_NOTIFICATIONS', payload: updated });
  };

  const getIcon = (type) => {
    switch(type) {
      case 'friend_request': return '🤝';
      case 'friend_accepted': return '🎉';
      case 'cheer': return '🔥';
      case 'war_started': return '⚔️';
      case 'mission_complete': return '🏆';
      default: return '🔔';
    }
  };

  return (
    <div className="screen-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--accent-main)', margin: 0 }}>ALERTS</h1>
        {notifications.some(n => !n.read) && (
          <button onClick={markAllRead} style={{ background: 'none', color: 'var(--text-muted)', textDecoration: 'underline', padding: '4px' }}>
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>Loading alerts...</div>
      ) : notifications.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>
          No new alerts.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '24px' }}>
          {notifications.map(n => (
            <div 
              key={n.id} 
              onClick={() => !n.read && markAsRead(n.id)}
              className="glass-card" 
              style={{
                padding: '16px',
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                borderLeft: !n.read ? '4px solid var(--accent-main)' : '1px solid var(--border-color)',
                opacity: n.read ? 0.7 : 1,
                cursor: !n.read ? 'pointer' : 'default'
              }}
            >
              <div style={{ fontSize: '2rem' }}>{getIcon(n.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-main)', lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
