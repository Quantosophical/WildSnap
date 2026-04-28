import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { AlertTriangle, Loader2, Upload, ChevronLeft } from 'lucide-react';
import { useGameFeedback } from '../hooks/useGameFeedback';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { feedbackClick, feedbackSuccess } = useGameFeedback();

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      feedbackClick();
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    feedbackClick();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        feedbackSuccess();
        navigate('/app');
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password 
        });
        if (authError) throw authError;
        
        feedbackSuccess();
        setStep(2);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSetup = async (e) => {
    e.preventDefault();
    feedbackClick();
    setLoading(true);
    setError(null);

    try {
      if (!username.trim()) throw new Error("Username is required");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication failed. Please try again.");

      let avatarUrl = null;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);
          
        if (uploadError) {
          console.error("Avatar upload error:", uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          avatarUrl = publicUrlData.publicUrl;
        }
      }

      const { error: profileError } = await supabase
        .from('users')
        .insert([{ 
          id: session.user.id, 
          username: username.trim(),
          avatar_url: avatarUrl,
          xp: 0,
          level: 1,
          streak: 0
        }]);
        
      if (profileError) {
         throw new Error("Failed to create user profile. Please contact support.");
      }

      feedbackSuccess();
      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    feedbackClick();
    setIsLogin(!isLogin);
  };

  return (
    <div className="app-container" style={{ background: 'var(--accent-secondary)' }}>
      {/* Top Bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '24px', zIndex: 10 }}>
        <button 
          onClick={() => { feedbackClick(); navigate('/'); }}
          className="btn-3d btn-3d-secondary btn-circle"
          style={{ width: '48px', height: '48px', background: 'white', color: 'var(--text-main)', boxShadow: '0 4px 0 #e2e8f0' }}
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="content-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        
        <div className="blob-panel animate-pop-in" style={{ padding: '40px 24px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--text-main)', marginBottom: '32px', textAlign: 'center' }}>
            {step === 1 ? (isLogin ? 'WELCOME BACK' : 'JOIN THE HUNT') : 'SETUP HUNTER'}
          </h2>
          
          {error && (
            <div className="animate-slide-up" style={{ background: 'var(--rarity-legendary)', color: 'white', padding: '12px 20px', borderRadius: '50px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: 800, width: '100%', boxShadow: '0 4px 12px rgba(244,63,94,0.3)' }}>
              <AlertTriangle flexShrink={0} size={20} />
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
              <input 
                type="email" placeholder="Email Address" required
                value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '20px', borderRadius: '50px', border: '3px solid rgba(128,128,128,0.1)', background: 'var(--bg-surface)', color: 'var(--text-main)', outline: 'none', fontSize: '1.1rem', fontFamily: 'var(--font-display)', fontWeight: 800, textAlign: 'center' }}
              />
              <input 
                type="password" placeholder="Password (min 6 chars)" required minLength={6}
                value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '20px', borderRadius: '50px', border: '3px solid rgba(128,128,128,0.1)', background: 'var(--bg-surface)', color: 'var(--text-main)', outline: 'none', fontSize: '1.1rem', fontFamily: 'var(--font-display)', fontWeight: 800, textAlign: 'center' }}
              />
              
              <button type="submit" disabled={loading} className="btn-3d btn-3d-primary btn-pill" style={{ marginTop: '16px', width: '100%', height: '64px' }}>
                {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'LOGIN' : 'SIGN UP')}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button 
                  type="button"
                  onClick={toggleMode}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', cursor: 'pointer', fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}
                >
                  {isLogin ? "Need an account? Register" : "Already have an account? Login"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleProfileSetup} style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', width: '100%' }}>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="btn-3d"
                style={{
                  width: '120px', height: '120px', borderRadius: '50%', background: 'var(--bg-surface)',
                  border: '4px solid rgba(128,128,128,0.1)', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  boxShadow: '0 8px 0 rgba(128,128,128,0.2)', color: 'var(--accent-primary)'
                }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <Upload size={32} style={{ marginBottom: '4px' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>PIC</span>
                  </>
                )}
              </div>
              <input 
                type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarSelect}
                style={{ display: 'none' }}
              />
              
              <input 
                type="text" placeholder="Hunter Name" required
                value={username} onChange={e => setUsername(e.target.value)}
                style={{ width: '100%', padding: '20px', borderRadius: '50px', border: '3px solid rgba(128,128,128,0.1)', background: 'var(--bg-surface)', color: 'var(--text-main)', outline: 'none', fontSize: '1.2rem', fontFamily: 'var(--font-display)', fontWeight: 900, textAlign: 'center' }}
              />

              <button type="submit" disabled={loading} className="btn-3d btn-3d-primary btn-pill" style={{ marginTop: '12px', width: '100%', height: '64px' }}>
                {loading ? <Loader2 className="animate-spin" /> : 'COMPLETE'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
