import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const TABS = [
  { id: 'snap',     icon: '📷', label: 'SNAP' },
  { id: 'journal',  icon: '📖', label: 'JOURNAL' },
  { id: 'wildmap',  icon: '🗺', label: 'WILDMAP' },
  { id: 'ranks',    icon: '🏆', label: 'RANKS' },
  { id: 'profile',  icon: '👤', label: 'PROFILE' },
  { id: 'alerts',   icon: '🔔', label: 'ALERTS' },
];

export default function BottomNav({ activeTab, setActiveTab }) {
  const { unreadCount } = useContext(AppContext);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '80px',
      background: 'rgba(10, 26, 15, 0.95)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingBottom: 'safe-area-inset-bottom',
      zIndex: 9999
    }}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'transparent',
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '4px',
              color: isActive ? 'var(--accent-main)' : 'var(--text-muted)',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
              position: 'relative'
            }}
          >
            <span style={{ fontSize: '1.5rem', filter: isActive ? 'drop-shadow(0 0 8px rgba(57,255,106,0.5))' : 'none' }}>
              {tab.icon}
            </span>
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>
              {tab.label}
            </span>
            
            {/* Notification Badge */}
            {tab.id === 'alerts' && unreadCount > 0 && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: 'calc(50% - 20px)',
                background: 'var(--rarity-legendary)',
                color: 'white',
                fontSize: '0.6rem',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '10px',
                border: '2px solid var(--bg-deep)'
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
