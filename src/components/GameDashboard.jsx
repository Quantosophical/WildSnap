import React, { useState, useEffect } from 'react';
import { Camera, BookOpen, Trophy, Activity, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useGameState } from '../hooks/useGameState';
import { useGameFeedback } from '../hooks/useGameFeedback';
import CaptureScreen from './CaptureScreen';
import JournalScreen from './JournalScreen';
import LeaderboardScreen from './LeaderboardScreen';
import FeedScreen from './FeedScreen';
import ProfileScreen from './ProfileScreen';

const GameDashboard = () => {
  const [activeTab, setActiveTab] = useState('ranks'); // Default to achievements/ranks
  const navigate = useNavigate();
  const gameState = useGameState();
  const { feedbackClick } = useGameFeedback();

  // Protect route
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    feedbackClick();
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleTabChange = (tabId) => {
    if (activeTab !== tabId) {
      feedbackClick();
      setActiveTab(tabId);
    }
  };

  const renderTab = () => {
    if (gameState.loading) {
       return (
         <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
           <div className="spinner"></div>
           <div style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Loading...</div>
         </div>
       );
    }

    switch (activeTab) {
      case 'snap': return <CaptureScreen gameState={gameState} />;
      case 'journal': return <JournalScreen gameState={gameState} />;
      case 'ranks': return <LeaderboardScreen gameState={gameState} />;
      case 'feed': return <FeedScreen gameState={gameState} />;
      case 'profile': return <ProfileScreen gameState={gameState} onLogout={handleLogout} />;
      default: return <LeaderboardScreen gameState={gameState} />;
    }
  };

  const navItems = [
    { id: 'snap', label: 'SNAP', icon: Camera },
    { id: 'journal', label: 'JOURNAL', icon: BookOpen },
    { id: 'ranks', label: 'RANKS', icon: Trophy },
    { id: 'feed', label: 'FEED', icon: Activity },
    { id: 'profile', label: 'PROFILE', icon: User }
  ];

  return (
    <div className="app-container">
      <div className="content-area">
        {renderTab()}
      </div>

      <nav className="bottom-dock">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div 
              key={item.id} 
              className={`dock-item ${isActive ? 'active' : ''}`}
              onClick={() => handleTabChange(item.id)}
            >
              <Icon size={isActive ? 24 : 28} strokeWidth={isActive ? 3 : 2} />
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default GameDashboard;
