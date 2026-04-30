import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function AuthScreen({ isSettingUsername }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  
  // Real-time username check
  useEffect(() => {
    if (isLogin && !isSettingUsername) return;
    
    const checkUsername = async () => {
      if (username.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setUsernameAvailable(false);
        return;
      }
      
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();
        
      setUsernameAvailable(!data);
    };

    const delayDebounceFn = setTimeout(() => {
      checkUsername();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [username, isLogin, isSettingUsername]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSettingUsername) {
        if (!usernameAvailable) throw new Error("Invalid or taken username");
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No session found");
        
        const prefix = username.slice(0, 4).toUpperCase();
        const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
        const friendCode = `${prefix}-${suffix}`;
        
        const { error: insertError } = await supabase.from('users').insert({
          id: session.user.id,
          username,
          friend_code: friendCode,
        });
        
        if (insertError) throw insertError;
        window.location.reload(); // Reload to trigger App.jsx context update
        return;
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!usernameAvailable) throw new Error("Invalid or taken username");
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.user) {
          const prefix = username.slice(0, 4).toUpperCase();
          const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
          const friendCode = `${prefix}-${suffix}`;
          
          await supabase.from('users').insert({
            id: data.user.id,
            username,
            friend_code: friendCode,
          });
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', color: 'var(--accent-main)' }}>
          {isSettingUsername ? 'SET USERNAME' : isLogin ? 'WELCOME BACK' : 'JOIN THE HUNT'}
        </h1>
        
        {error && (
          <div style={{ background: 'rgba(255,69,0,0.2)', color: '#ff4500', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isSettingUsername && (
            <>
              <input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </>
          )}

          {(!isLogin || isSettingUsername) && (
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Username (3-20 chars)" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                maxLength={20}
                required 
              />
              {username.length >= 3 && (
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                  {usernameAvailable === true ? '✅' : usernameAvailable === false ? '❌' : '⏳'}
                </span>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading || (!isLogin && usernameAvailable === false)}>
            {loading ? 'PROCESSING...' : isSettingUsername ? 'FINISH SETUP' : isLogin ? 'LOGIN' : 'SIGN UP'}
          </button>
        </form>

        {!isSettingUsername && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', color: 'var(--text-muted)', textDecoration: 'underline' }}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
