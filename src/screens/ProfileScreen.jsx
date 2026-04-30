import React, { useContext } from 'react';
import { supabase } from '../supabaseClient';
import { AppContext } from '../context/AppContext';

export default function ProfileScreen() {
  const { user, dispatch } = useContext(AppContext);

  if (!user) return <div style={{ color: 'white', textAlign: 'center', marginTop: 40 }}>Loading Profile...</div>;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'SIGN_OUT' });
    window.location.reload();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(user.friend_code);
    alert('Friend code copied!');
  };

  // Simple XP calculation: level * 1000 for next level
  const xpForNextLevel = user.level * 1000;
  const xpProgress = Math.min(100, (user.xp / xpForNextLevel) * 100);

  return (
    <div className="screen-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      
      {/* Header Info */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
        <div style={{
          width: '100px', height: '100px', borderRadius: '50%',
          background: user.avatar_color || 'var(--accent-main)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '3rem', fontFamily: 'var(--font-display)', color: '#000',
          border: '4px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>
          {user.username.charAt(0).toUpperCase()}
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', margin: 0, lineHeight: 1 }}>{user.username}</h1>
          <div style={{ color: 'var(--accent-main)', fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginTop: '4px' }}>
            {user.rank_title} • LEVEL {user.level}
          </div>
          <button 
            onClick={copyCode}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', padding: '4px 12px', borderRadius: '12px', marginTop: '8px', fontSize: '0.9rem' }}
          >
            CODE: {user.friend_code} 📋
          </button>
        </div>
      </div>

      {/* XP Bar */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>LEVEL {user.level} PROGRESS</span>
          <span style={{ color: 'var(--accent-main)', fontFamily: 'var(--font-display)' }}>{user.xp} / {xpForNextLevel} XP</span>
        </div>
        <div style={{ height: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${xpProgress}%`, background: 'var(--accent-main)', transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <StatCard label="TOTAL POINTS" value={user.total_points} color="var(--accent-amber)" />
        <StatCard label="CAPTURES" value={user.total_captures} color="var(--accent-main)" />
        <StatCard label="CURRENT STREAK" value={`${user.current_streak} 🔥`} color="var(--accent-orange)" />
        <StatCard label="BEST STREAK" value={`${user.best_streak} 🔥`} color="var(--text-muted)" />
        <StatCard label="RAREST CATCH" value={user.rarest_catch || 'None'} color="var(--accent-purple)" fullWidth />
      </div>

      {/* Settings / Actions */}
      <div className="glass-card" style={{ padding: '16px', marginTop: 'auto' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)', marginBottom: '16px' }}>SETTINGS</h3>
        <button 
          onClick={handleLogout}
          style={{ width: '100%', padding: '16px', background: 'rgba(255,69,0,0.2)', color: '#ff4500', borderRadius: '12px', fontWeight: 'bold' }}
        >
          SIGN OUT
        </button>
      </div>

    </div>
  );
}

function StatCard({ label, value, color, fullWidth }) {
  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: color, textAlign: 'center' }}>{value}</div>
    </div>
  );
}
