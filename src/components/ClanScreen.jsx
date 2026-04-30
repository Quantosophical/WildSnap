import React, { useState, useEffect } from 'react';
import { Shield, Swords, Plus, Users, Search, MessageSquare, Trophy, AlertTriangle } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useGameFeedback } from '../hooks/useGameFeedback';
import { useSocialState } from '../hooks/useSocialState';

const ClanScreen = ({ gameState }) => {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'chat', 'wars', 'members'
  const [view, setView] = useState('none'); // 'none', 'create', 'search', 'clan'
  
  // Creation state
  const [newClanName, setNewClanName] = useState('');
  const [newClanTag, setNewClanTag] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Clan Data
  const [clanData, setClanData] = useState(null);
  const [members, setMembers] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const { clanMessages, setClanMessages, warData } = useSocialState(gameState.userId, clanData?.id);
  const { feedbackClick, feedbackSuccess } = useGameFeedback();

  useEffect(() => {
    if (gameState.userRecord?.clan_id) {
      setView('clan');
      fetchClanData(gameState.userRecord.clan_id);
    } else {
      setView('none');
    }
  }, [gameState.userRecord?.clan_id]);

  const fetchClanData = async (clanId) => {
    const { data: clan } = await supabase.from('clans').select('*').eq('id', clanId).single();
    if (clan) setClanData(clan);
    
    const { data: mems } = await supabase.from('users').select('id, username, level, clan_role, total_captures').eq('clan_id', clanId);
    if (mems) setMembers(mems);
  };

  const handleCreateClan = async () => {
    feedbackClick();
    if (!newClanName || !newClanTag) return alert('Name and Tag required');
    
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    
    const { data, error } = await supabase.from('clans').insert({
      name: newClanName,
      tag: newClanTag.toUpperCase(),
      emblem_config: { color: '#ef4444', icon: 'shield' },
      invite_code: code,
      founder_id: gameState.userId
    }).select().single();

    if (error) {
      alert('Error creating clan. Name/Tag might be taken.');
      return;
    }

    await supabase.from('users').update({ clan_id: data.id, clan_role: 'leader' }).eq('id', gameState.userId);
    feedbackSuccess();
    // Force reload state (in a real app, update context, here we just wait for next tick or manually update)
    setClanData(data);
    setView('clan');
  };

  const handleSearchClan = async () => {
    feedbackClick();
    const { data } = await supabase.from('clans').select('*, users(count)').ilike('name', `%${searchQuery}%`).limit(10);
    setSearchResults(data || []);
  };

  const joinClan = async (clanId) => {
    feedbackClick();
    const { error } = await supabase.from('users').update({ clan_id: clanId, clan_role: 'member' }).eq('id', gameState.userId);
    if (!error) {
      feedbackSuccess();
      fetchClanData(clanId);
      setView('clan');
    } else {
      alert('Could not join clan.');
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !clanData) return;
    feedbackClick();
    
    await supabase.from('clan_messages').insert({
      clan_id: clanData.id,
      user_id: gameState.userId,
      username: gameState.username,
      role: gameState.userRecord?.clan_role || 'member',
      message_type: 'text',
      message: chatInput
    });
    
    setChatInput('');
  };

  if (view === 'none') {
    return (
      <div className="content-area" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Shield size={64} color="var(--text-muted)" style={{ marginBottom: '24px' }} />
        <h1 className="heading-xl">NO CLAN</h1>
        <p className="text-muted" style={{ marginBottom: '40px' }}>Join forces with other hunters.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '300px' }}>
          <button onClick={() => { feedbackClick(); setView('create'); }} className="btn-3d btn-3d-primary btn-pill" style={{ padding: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <Plus /> CREATE CLAN
          </button>
          <button onClick={() => { feedbackClick(); setView('search'); }} className="btn-3d btn-pill" style={{ padding: '16px', display: 'flex', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <Search /> FIND CLAN
          </button>
        </div>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="content-area" style={{ padding: '24px' }}>
        <h1 className="heading-lg" style={{ marginBottom: '24px' }}>CREATE CLAN</h1>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input type="text" placeholder="Clan Name" value={newClanName} onChange={e => setNewClanName(e.target.value)} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-surface)', border: 'none', color: 'white', outline: 'none' }} />
          <input type="text" placeholder="Clan Tag (3-4 chars)" maxLength={4} value={newClanTag} onChange={e => setNewClanTag(e.target.value)} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-surface)', border: 'none', color: 'white', outline: 'none' }} />
          <button onClick={handleCreateClan} className="btn-3d btn-3d-primary" style={{ padding: '16px', borderRadius: '12px', marginTop: '16px' }}>CREATE</button>
          <button onClick={() => setView('none')} style={{ padding: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>CANCEL</button>
        </div>
      </div>
    );
  }

  if (view === 'search') {
    return (
      <div className="content-area" style={{ padding: '24px' }}>
        <h1 className="heading-lg" style={{ marginBottom: '24px' }}>FIND CLAN</h1>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <input type="text" placeholder="Search by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, padding: '16px', borderRadius: '12px', background: 'var(--bg-surface)', border: 'none', color: 'white', outline: 'none' }} />
          <button onClick={handleSearchClan} className="btn-3d btn-3d-primary" style={{ padding: '0 24px', borderRadius: '12px' }}><Search /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {searchResults.map(c => (
            <div key={c.id} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px' }}>
              <div>
                <div className="heading-sm">[{c.tag}] {c.name}</div>
                <div className="text-xs text-muted">LVL {c.level} • {c.users[0]?.count || 1}/10 Members</div>
              </div>
              <button onClick={() => joinClan(c.id)} className="btn-3d" style={{ padding: '8px 16px', background: 'white', color: 'black', borderRadius: '50px', fontWeight: 800 }}>JOIN</button>
            </div>
          ))}
          {searchResults.length === 0 && <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No clans found</div>}
        </div>
        <button onClick={() => setView('none')} style={{ width: '100%', padding: '16px', marginTop: '24px', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>CANCEL</button>
      </div>
    );
  }

  // view === 'clan'
  return (
    <div className="content-area" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Clan Header */}
      <div style={{ padding: '24px', background: 'linear-gradient(to bottom, rgba(239,68,68,0.2), transparent)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', background: '#ef4444', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--bg-deep)', boxShadow: '0 4px 20px rgba(239,68,68,0.4)' }}>
            <Shield size={32} color="white" />
          </div>
          <div>
            <h1 className="heading-lg" style={{ lineHeight: 1 }}>{clanData?.name}</h1>
            <div className="text-sm" style={{ color: '#ef4444', fontWeight: 800, marginTop: '4px' }}>[{clanData?.tag}] LVL {clanData?.level}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {['dashboard', 'chat', 'wars', 'members'].map(t => (
          <button 
            key={t} onClick={() => { feedbackClick(); setActiveTab(t); }}
            style={{ flex: 1, padding: '16px 0', border: 'none', background: 'transparent', color: activeTab === t ? 'white' : 'var(--text-muted)', fontWeight: 800, borderBottom: activeTab === t ? '2px solid #ef4444' : '2px solid transparent' }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="text-xs text-muted" style={{ fontWeight: 800 }}>CLAN TROPHIES</div>
                <div className="heading-lg" style={{ color: 'var(--rarity-epic)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={24} /> {clanData?.trophy_count}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="text-xs text-muted" style={{ fontWeight: 800 }}>MEMBERS</div>
                <div className="heading-lg">{members.length}/10</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <AlertTriangle color="var(--rarity-legendary)" size={20} />
                <h3 className="heading-sm">CLAN MISSIONS</h3>
              </div>
              <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                <div className="text-sm" style={{ fontWeight: 700 }}>Capture 50 Rare Animals</div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '12px', overflow: 'hidden' }}>
                  <div style={{ width: '45%', height: '100%', background: 'var(--rarity-epic)' }} />
                </div>
                <div className="text-xs text-muted" style={{ marginTop: '8px', textAlign: 'right' }}>22/50</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '24px' }}>
              {clanMessages.length === 0 ? (
                <div className="text-muted" style={{ textAlign: 'center', marginTop: '40px' }}>No messages yet.</div>
              ) : (
                clanMessages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.user_id === gameState.userId ? 'flex-end' : 'flex-start' }}>
                    <div className="text-xs text-muted" style={{ marginBottom: '4px' }}>{msg.user?.username} • {msg.user?.clan_role}</div>
                    <div style={{ padding: '12px 16px', background: msg.user_id === gameState.userId ? '#ef4444' : 'var(--bg-surface)', color: 'white', borderRadius: '16px', borderBottomRightRadius: msg.user_id === gameState.userId ? 0 : '16px', borderBottomLeftRadius: msg.user_id !== gameState.userId ? 0 : '16px', maxWidth: '80%' }}>
                      {msg.message}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <input type="text" placeholder="Message clan..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage()} style={{ flex: 1, padding: '16px', borderRadius: '50px', background: 'var(--bg-surface)', border: 'none', color: 'white', outline: 'none' }} />
              <button onClick={sendChatMessage} className="btn-3d btn-circle" style={{ width: '52px', height: '52px', background: '#ef4444', color: 'white' }}>
                <MessageSquare size={20} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'wars' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {warData ? (
              <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', border: '2px solid #ef4444' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div className="text-xs text-muted" style={{ fontWeight: 800, color: '#ef4444', letterSpacing: '0.1em' }}>ACTIVE WAR</div>
                  <h2 className="heading-lg" style={{ marginTop: '8px' }}>CLAN BATTLE</h2>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="text-sm text-muted">ATTACKER</div>
                    <div className="heading-xl" style={{ color: 'white' }}>{warData.attacker_score}</div>
                  </div>
                  <Swords size={32} color="#ef4444" />
                  <div style={{ textAlign: 'center' }}>
                    <div className="text-sm text-muted">DEFENDER</div>
                    <div className="heading-xl" style={{ color: 'white' }}>{warData.defender_score}</div>
                  </div>
                </div>

                <div style={{ width: '100%', height: '12px', background: 'var(--bg-surface)', borderRadius: '50px', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${(warData.attacker_score / (warData.attacker_score + warData.defender_score || 1)) * 100}%`, height: '100%', background: '#ef4444' }} />
                  <div style={{ width: `${(warData.defender_score / (warData.attacker_score + warData.defender_score || 1)) * 100}%`, height: '100%', background: '#3b82f6' }} />
                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '40px 24px', textAlign: 'center', borderRadius: '24px' }}>
                <Swords size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                <h3 className="heading-md">NO ACTIVE WARS</h3>
                <p className="text-muted" style={{ marginTop: '8px', marginBottom: '24px' }}>Your clan is at peace. Declare war to earn trophies!</p>
                {gameState.userRecord?.clan_role !== 'member' && (
                  <button className="btn-3d btn-3d-primary btn-pill" style={{ padding: '16px 32px' }}>DECLARE WAR</button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {members.map(m => (
              <div key={m.id} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {m.username.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="heading-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {m.username} 
                      {m.clan_role === 'leader' && <Shield size={14} color="#ef4444" />}
                    </div>
                    <div className="text-xs text-muted">LVL {m.level} • {m.total_captures} captures</div>
                  </div>
                </div>
                <div className="text-xs" style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '50px', fontWeight: 800 }}>
                  {m.clan_role.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ClanScreen;
