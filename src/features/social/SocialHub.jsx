import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../../supabaseClient';
import { AppContext } from '../../context/AppContext';

export default function SocialHub() {
  const { user } = useContext(AppContext);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSocialData = async () => {
    if (!user) return;
    
    // Fetch pending requests
    const { data: reqData } = await supabase
      .from('friend_requests')
      .select('*, sender:users!sender_id(id, username, avatar_color, rank_title)')
      .eq('receiver_id', user.id)
      .eq('status', 'pending');
    if (reqData) setRequests(reqData);

    // Fetch friends
    const { data: fData } = await supabase
      .from('friendships')
      .select('*, friend:users!friend_id(id, username, avatar_color, rank_title, current_streak, total_points)')
      .eq('user_id', user.id)
      .order('friendship_streak', { ascending: false });
    if (fData) setFriends(fData);

    setLoading(false);
  };

  useEffect(() => {
    fetchSocialData();
    // Subscribe to friend_requests
    const channel = supabase.channel(`public:friend_requests:receiver_id=eq.${user?.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friend_requests', filter: `receiver_id=eq.${user?.id}` }, fetchSocialData)
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!friendCodeInput.trim()) return;
    
    const { data, error } = await supabase
      .from('users')
      .select('id, username, level, rank_title, avatar_color')
      .eq('friend_code', friendCodeInput.trim().toUpperCase())
      .single();
      
    if (!error && data) {
      setSearchResult(data);
    } else {
      setSearchResult('not_found');
    }
  };

  const sendRequest = async (targetId) => {
    if (!user || !targetId) return;
    await supabase.from('friend_requests').insert({
      sender_id: user.id,
      receiver_id: targetId,
      status: 'pending'
    });
    setSearchResult('sent');
  };

  const acceptRequest = async (req) => {
    // 1. Update status
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', req.id);
    
    // 2. Create bilateral friendships
    await supabase.from('friendships').insert([
      { user_id: user.id, friend_id: req.sender_id },
      { user_id: req.sender_id, friend_id: user.id }
    ]);
    
    fetchSocialData();
  };

  const declineRequest = async (reqId) => {
    await supabase.from('friend_requests').update({ status: 'declined' }).eq('id', reqId);
    fetchSocialData();
  };

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading social hub...</div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Add Friend Section */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '12px', color: 'var(--accent-amber)' }}>ADD HUNTER</h3>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="Friend Code (e.g. WOLF-4X7K)" 
            value={friendCodeInput}
            onChange={e => setFriendCodeInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '12px 16px' }}>SEARCH</button>
        </form>

        {searchResult === 'not_found' && (
          <div style={{ marginTop: '12px', color: '#ff4500', fontSize: '0.9rem' }}>No hunter found with that code.</div>
        )}
        {searchResult === 'sent' && (
          <div style={{ marginTop: '12px', color: 'var(--accent-main)', fontSize: '0.9rem' }}>Request sent successfully!</div>
        )}
        {searchResult && searchResult !== 'not_found' && searchResult !== 'sent' && (
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: searchResult.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>
              {searchResult.username.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold' }}>{searchResult.username}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{searchResult.rank_title}</div>
            </div>
            <button onClick={() => sendRequest(searchResult.id)} style={{ background: 'var(--accent-main)', color: '#000', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold' }}>
              ADD
            </button>
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {requests.length > 0 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '12px', color: 'var(--accent-main)' }}>
            PENDING REQUESTS ({requests.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {requests.map(req => (
              <div key={req.id} className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: req.sender?.avatar_color || 'gray' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{req.sender?.username}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.sender?.rank_title}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => acceptRequest(req)} style={{ background: 'var(--accent-main)', color: '#000', padding: '8px', borderRadius: '8px', fontWeight: 'bold' }}>✓</button>
                  <button onClick={() => declineRequest(req.id)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '8px', borderRadius: '8px', fontWeight: 'bold' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '12px', color: 'var(--text-main)' }}>
          MY PACK ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>You haven't added any friends yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {friends.map(f => (
              <div key={f.id} className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: f.friend?.avatar_color || 'gray', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {f.friend?.username?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{f.friend?.username}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{f.friend?.rank_title}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--accent-orange)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    🔥 {f.friendship_streak} DAY
                  </div>
                  <div style={{ color: 'var(--accent-main)', fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>
                    {f.friend?.total_points} XP
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
