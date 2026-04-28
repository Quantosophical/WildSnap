import React, { useState, useEffect } from 'react';
import { Camera, BookOpen, Trophy, Activity, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useGameState } from '../hooks/useGameState';
import CaptureScreen from './CaptureScreen';
import JournalScreen from './JournalScreen';
import LeaderboardScreen from './LeaderboardScreen';
import FeedScreen from './FeedScreen';
import ProfileScreen from './ProfileScreen';

const GameDashboard = () => {
  const [activeTab, setActiveTab] = useState('snap');
  const navigate = useNavigate();
  
  // GameState is now async / tied to Supabase
  const gameState = useGameState();

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
    await supabase.auth.signOut();
    navigate('/');
  };

  const renderTab = () => {
    if (gameState.loading) {
       return <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>Loading Game Data...</div>;
    }

    switch (activeTab) {
      case 'snap': return <CaptureScreen gameState={gameState} />;
      case 'journal': return <JournalScreen gameState={gameState} />;
      case 'ranks': return <LeaderboardScreen gameState={gameState} />;
      case 'feed': return <FeedScreen gameState={gameState} />;
      case 'profile': return <ProfileScreen gameState={gameState} onLogout={handleLogout} />;
      default: return <CaptureScreen gameState={gameState} />;
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
      <canvas id="particle-canvas" />

      <div className="content-area">
        {renderTab()}
      </div>

      <nav className="bottom-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div 
              key={item.id} 
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={24} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default GameDashboard;
