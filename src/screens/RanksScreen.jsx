import React, { useState } from 'react';
import GlobalLeaderboard from '../features/leaderboard/GlobalLeaderboard';
import SocialHub from '../features/social/SocialHub';

const TABS = ['GLOBAL', 'FRIENDS', 'CLANS', 'WARS', 'SOCIAL'];

export default function RanksScreen() {
  const [activeTab, setActiveTab] = useState('GLOBAL');

  const renderTabContent = () => {
    switch(activeTab) {
      case 'GLOBAL': return <GlobalLeaderboard />;
      case 'SOCIAL': return <SocialHub />;
      // placeholders for the rest
      case 'FRIENDS': return <div style={{color:'var(--text-muted)', textAlign:'center', marginTop: 40}}>Friends Leaderboard (Coming Soon)</div>;
      case 'CLANS': return <div style={{color:'var(--text-muted)', textAlign:'center', marginTop: 40}}>Clans Leaderboard (Coming Soon)</div>;
      case 'WARS': return <div style={{color:'var(--text-muted)', textAlign:'center', marginTop: 40}}>Active Wars (Coming Soon)</div>;
      default: return null;
    }
  };

  return (
    <div className="screen-container" style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ padding: '24px 24px 0 24px' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--accent-main)' }}>RANKS & SOCIAL</h1>
      </div>

      {/* Pill Nav */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        gap: '8px',
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-color)',
        WebkitOverflowScrolling: 'touch'
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              background: activeTab === tab ? 'var(--accent-main)' : 'rgba(255,255,255,0.1)',
              color: activeTab === tab ? '#000' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              fontSize: '1.1rem',
              whiteSpace: 'nowrap',
              border: '1px solid',
              borderColor: activeTab === tab ? 'var(--accent-main)' : 'var(--border-color)'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {renderTabContent()}
      </div>

    </div>
  );
}
