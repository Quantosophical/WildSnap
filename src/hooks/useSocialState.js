import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export const useSocialState = (userId, clanId) => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [clanMessages, setClanMessages] = useState([]);
  const [warData, setWarData] = useState(null);

  useEffect(() => {
    if (!userId) return;

    // Fetch initial notifications
    const fetchInitialData = async () => {
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (notifs) {
        setNotifications(notifs);
        setUnreadNotifications(notifs.filter(n => !n.read).length);
      }

      const { data: requests } = await supabase
        .from('friend_requests')
        .select('*, sender:users!friend_requests_sender_id_fkey(username, avatar_url, level, rank_title)')
        .eq('receiver_id', userId)
        .eq('status', 'pending');
        
      if (requests) {
        setFriendRequests(requests);
      }

      if (clanId) {
        const { data: messages } = await supabase
          .from('clan_messages')
          .select('*, user:users(username, clan_role, avatar_url)')
          .eq('clan_id', clanId)
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (messages) {
          setClanMessages(messages.reverse()); // Show oldest to newest
        }

        const { data: activeWar } = await supabase
          .from('clan_wars')
          .select('*')
          .or(`attacker_clan_id.eq.${clanId},defender_clan_id.eq.${clanId}`)
          .eq('status', 'active')
          .gte('ends_at', new Date().toISOString())
          .maybeSingle();
          
        if (activeWar) {
          setWarData(activeWar);
        }
      }
    };

    fetchInitialData();

    // Setup Subscriptions
    const channels = [];

    // Notifications channel
    const notifChannel = supabase.channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadNotifications(prev => prev + 1);
        // Play sound if possible
      })
      .subscribe();
    channels.push(notifChannel);

    // Friend Requests channel
    const friendReqChannel = supabase.channel('friend-requests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friend_requests', filter: `receiver_id=eq.${userId}` }, async (payload) => {
        // Fetch sender details
        const { data: sender } = await supabase.from('users').select('username, avatar_url, level, rank_title').eq('id', payload.new.sender_id).single();
        const requestWithSender = { ...payload.new, sender };
        setFriendRequests(prev => [...prev, requestWithSender]);
      })
      .subscribe();
    channels.push(friendReqChannel);

    if (clanId) {
      // Clan Chat
      const chatChannel = supabase.channel('clan-chat')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clan_messages', filter: `clan_id=eq.${clanId}` }, async (payload) => {
          const { data: user } = await supabase.from('users').select('username, clan_role, avatar_url').eq('id', payload.new.user_id).single();
          const messageWithUser = { ...payload.new, user };
          setClanMessages(prev => [...prev, messageWithUser]);
        })
        .subscribe();
      channels.push(chatChannel);

      // Clan Wars
      if (warData) {
        const warChannel = supabase.channel('war-updates')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clan_wars', filter: `id=eq.${warData.id}` }, (payload) => {
            setWarData(payload.new);
          })
          .subscribe();
        channels.push(warChannel);
      }
    }

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [userId, clanId, warData?.id]);

  const markNotificationRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setUnreadNotifications(prev => Math.max(0, prev - 1));
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    setUnreadNotifications(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return {
    friendRequests,
    setFriendRequests,
    notifications,
    unreadNotifications,
    markNotificationRead,
    markAllRead,
    clanMessages,
    setClanMessages,
    warData
  };
};
