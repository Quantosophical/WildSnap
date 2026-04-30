import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppContext } from './context/AppContext';
import { supabase } from './supabaseClient';

// Layout & Navigation
import BottomNav from './navigation/BottomNav';

// Screens
import SnapScreen from './screens/SnapScreen';
import JournalScreen from './screens/JournalScreen';
import WildMapScreen from './screens/WildMapScreen';
import RanksScreen from './screens/RanksScreen';
import ProfileScreen from './screens/ProfileScreen';
import AlertsScreen from './screens/AlertsScreen';

// Auth
import AuthScreen from './features/auth/AuthScreen';
import OnboardingScreen from './features/auth/OnboardingScreen';

const isSetupComplete = () => {
  const hasSupabaseUrl = localStorage.getItem('SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL;
  const hasSupabaseKey = localStorage.getItem('SUPABASE_ANON_KEY') || import.meta.env.VITE_SUPABASE_ANON_KEY;
  return hasSupabaseUrl && hasSupabaseKey;
};

export default function App() {
  const { session, user, dispatch } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('snap');

  useEffect(() => {
    if (user && session) {
      const cleanup = setupRealtime(user.id, user.clan_id);
      return cleanup;
    }
  }, [user, session]);

  const setupRealtime = (userId, clanId) => {
    const channels = [];

    channels.push(
      supabase.channel('notifications-' + userId)
        .on('postgres_changes', {
          event: 'INSERT', table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, ({ new: n }) => {
          dispatch({ type: 'ADD_NOTIFICATION', payload: n });
          // Optional: playNotificationSound()
        }).subscribe()
    );

    if (clanId) {
      // Optional: clan chat & war real-time setup
    }

    return () => channels.forEach(c => supabase.removeChannel(c));
  };

  if (!isSetupComplete()) {
    return <OnboardingScreen />;
  }

  // Show Auth screen if not logged in
  if (!session) {
    return <AuthScreen />;
  }

  // Show Auth screen (username setup) if session exists but user record doesn't
  if (session && !user) {
    // Wait for user fetch or show username setup
    return <AuthScreen isSettingUsername={true} />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'snap': return <SnapScreen />;
      case 'journal': return <JournalScreen />;
      case 'wildmap': return <WildMapScreen />;
      case 'ranks': return <RanksScreen />;
      case 'profile': return <ProfileScreen />;
      case 'alerts': return <AlertsScreen />;
      default: return <SnapScreen />;
    }
  };

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {renderScreen()}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
