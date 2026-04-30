import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Flame, Search, Gift, ShieldAlert, Check, X, Shield, Swords } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useGameFeedback } from '../hooks/useGameFeedback';
import { useSocialState } from '../hooks/useSocialState';

const FriendsScreen = ({ gameState }) => {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'add', 'requests'
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState('');

  const { friendRequests, setFriendRequests } = useSocialState(gameState.userId, gameState.userRecord?.clan_id);
  const { feedbackClick, feedbackSuccess } = useGameFeedback();

  useEffect(() => {
    fetchFriends();
  }, [gameState.userId]);

  const fetchFriends = async () => {
    if (!gameState.userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('friendships')
      .select(`
        *,
        friend:users!friendships_friend_id_fkey(
          id, username, level, rank_title, 
          current_streak, total_captures,
          rarest_catch, last_seen, avatar_url, avatar_color
        )
      `)
      .eq('user_id', gameState.userId)
      .eq('status', 'accepted');
      
    if (data) setFriends(data);
    setLoading(false);
  };

  const isOnline = (lastSeen) => {
    if (!lastSeen) return false;
    const diff = new Date() - new Date(lastSeen);
    return diff < 15 * 60 * 1000; // 15 mins
  };

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 3) return setSearchResults([]);
    
    setLoading(true);
    const { data } = await supabase
      .from('users')
      .select('id, username, level, rank_title, total_captures, avatar_url')
      .ilike('username', `%${q}%`)
      .neq('id', gameState.userId)
      .limit(20);
      
    setSearchResults(data || []);
    setLoading(false);
  };

  const handleSearchByCode = async () => {
    if (!friendCodeInput) return;
    setLoadingCode(true);
    const { data } = await supabase
      .from('users')
      .select('id, username, level, rank_title, total_captures, avatar_url')
      .eq('friend_code', friendCodeInput.toUpperCase())
      .single();
      
    if (data && data.id !== gameState.userId) {
      setSearchResults([data]);
    } else {
      setSearchResults([]);
    }
    setLoadingCode(false);
  };

  const sendRequest = async (targetId) => {
    feedbackClick();
    const { error } = await supabase.from('friend_requests').insert({
      sender_id: gameState.userId,
      receiver_id: targetId
    });
    
    if (!error) {
      await supabase.from('notifications').insert({
        user_id: targetId,
        type: 'friend_request',
        message: `${gameState.username} wants to hunt with you`
      });
      feedbackSuccess();
      alert('Request sent!');
    } else {
      alert('Could not send request or already pending.');
    }
  };

  const respondToRequest = async (request, accept) => {
    feedbackClick();
    if (accept) {
      await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', request.id);
      await supabase.from('friendships').insert([
        { user_id: request.receiver_id, friend_id: request.sender_id, status: 'accepted' },
        { user_id: request.sender_id, friend_id: request.receiver_id, status: 'accepted' }
      ]);
      await supabase.from('notifications').insert({
        user_id: request.sender_id,
        type: 'friend_accepted',
        message: `${gameState.username} accepted your request!`
      });
      feedbackSuccess();
      fetchFriends();
    } else {
      await supabase.from('friend_requests').update({ status: 'declined' }).eq('id', request.id);
    }
    setFriendRequests(prev => prev.filter(r => r.id !== request.id));
  };

  const sendCheer = async (friendId) => {
    feedbackClick();
    const { error } = await supabase.from('cheers').insert({
      sender_id: gameState.userId,
      receiver_id: friendId,
      message: 'Great hunt!'
    });
    if (!error) {
      feedbackSuccess();
      alert('Cheer sent!');
    }
  };

  return (
    <div className="content-area" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="heading-xl text-gradient">FRIENDS</h1>
        <p className="text-muted" style={{ fontWeight: 600 }}>Hunt together. Streak together.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '50px' }}>
        {['list', 'add', 'requests'].map(t => (
          <button 
            key={t}
            onClick={() => { feedbackClick(); setActiveTab(t); }}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '50px', border: 'none', fontWeight: 800, fontSize: '0.9rem',
              background: activeTab === t ? 'white' : 'transparent',
              color: activeTab === t ? 'black' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
          >
            {t.toUpperCase()} {t === 'requests' && friendRequests.length > 0 && `(${friendRequests.length})`}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? <div className="spinner" /> : friends.length === 0 ? (
              <div className="text-muted" style={{ textAlign: 'center', padding: '40px' }}>No friends yet. Go add some!</div>
            ) : (
              friends.map(f => (
                <div key={f.id} className="glass-panel" style={{ padding: '16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: f.friend.avatar_color || 'var(--bg-surface)', overflow: 'hidden', border: `3px solid ${isOnline(f.friend.last_seen) ? 'var(--rarity-rare)' : 'rgba(255,255,255,0.1)'}` }}>
                      {f.friend.avatar_url ? <img src={f.friend.avatar_url} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                    </div>
                    {isOnline(f.friend.last_seen) && <div style={{ position: 'absolute', bottom: 0, right: 0, width: '16px', height: '16px', background: 'var(--rarity-rare)', borderRadius: '50%', border: '3px solid var(--bg-deep)' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="heading-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {f.friend.username}
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>LVL {f.friend.level}</span>
                    </div>
                    <div className="text-xs text-muted" style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--rarity-epic)' }}><Flame size={12}/> Streak: {f.friendship_streak}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12}/> Captures: {f.friend.total_captures}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={() => sendCheer(f.friend_id)} className="btn-3d btn-circle" style={{ width: '36px', height: '36px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)' }}>
                      <Gift size={16} />
                    </button>
                    {/* Placeholder for 1v1 challenge button */}
                    <button className="btn-3d btn-circle" style={{ width: '36px', height: '36px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                      <Swords size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', textAlign: 'center' }}>
              <div className="text-xs text-muted" style={{ fontWeight: 800, marginBottom: '8px' }}>YOUR FRIEND CODE</div>
              <div className="heading-lg" style={{ color: 'var(--accent-primary)', letterSpacing: '0.1em', marginBottom: '16px' }}>{gameState.userRecord?.friend_code || '...'}</div>
              <button 
                onClick={() => { navigator.clipboard.writeText(gameState.userRecord?.friend_code); alert('Copied!'); }}
                className="btn-3d btn-pill" style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}
              >
                COPY CODE
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" placeholder="Enter Friend Code" 
                value={friendCodeInput} onChange={e => setFriendCodeInput(e.target.value)}
                style={{ flex: 1, padding: '16px', borderRadius: '12px', background: 'var(--bg-surface)', border: 'none', color: 'white', outline: 'none' }}
              />
              <button onClick={handleSearchByCode} className="btn-3d" style={{ padding: '0 24px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '12px' }}>
                {loadingCode ? <div className="spinner" /> : <Search size={20} />}
              </button>
            </div>

            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>OR SEARCH BY NAME</div>

            <input 
              type="text" placeholder="Type username..." 
              value={searchQuery} onChange={handleSearch}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--bg-surface)', border: 'none', color: 'white', outline: 'none' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {searchResults.map(user => (
                <div key={user.id} className="glass-panel" style={{ padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-deep)', overflow: 'hidden' }}>
                    {user.avatar_url && <img src={user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="av" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="heading-sm">{user.username}</div>
                    <div className="text-xs text-muted">LVL {user.level} • {user.total_captures} captures</div>
                  </div>
                  <button onClick={() => sendRequest(user.id)} className="btn-3d" style={{ padding: '8px 16px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '50px', fontWeight: 800, fontSize: '0.8rem' }}>
                    ADD
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {friendRequests.length === 0 ? (
              <div className="text-muted" style={{ textAlign: 'center', padding: '40px' }}>No pending requests.</div>
            ) : (
              friendRequests.map(req => (
                <div key={req.id} className="glass-panel" style={{ padding: '16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div className="heading-sm">{req.sender?.username}</div>
                    <div className="text-xs text-muted">LVL {req.sender?.level} wants to be friends</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => respondToRequest(req, false)} className="btn-3d btn-circle" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                      <X size={20} />
                    </button>
                    <button onClick={() => respondToRequest(req, true)} className="btn-3d btn-circle" style={{ width: '40px', height: '40px', background: 'var(--accent-primary)', color: 'white' }}>
                      <Check size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsScreen;
