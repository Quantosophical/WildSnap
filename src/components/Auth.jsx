import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { AlertTriangle, Loader2, Upload, User } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 1 = Auth, 2 = Profile
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/app');
      } else {
        // Just create the auth account first
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password 
        });
        if (authError) throw authError;
        
        // Move to profile setup step
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
    setLoading(true);
    setError(null);

    try {
      if (!username.trim()) throw new Error("Username is required");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication failed. Please try again.");

      let avatarUrl = null;

      // Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);
          
        if (uploadError) {
          console.error("Avatar upload error:", uploadError);
          // Continue without avatar on error
        } else {
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          avatarUrl = publicUrlData.publicUrl;
        }
      }

      // Create User Profile
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
         console.error("Profile error:", profileError);
         throw new Error("Failed to create user profile. Please contact support.");
      }

      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="content-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="glass-panel animate-slide-up" style={{ padding: '32px', width: '100%', maxWidth: '400px', borderTop: '2px solid var(--accent-primary)' }}>
          <h2 className="heading-lg" style={{ color: 'var(--text-main)', marginBottom: '24px', textAlign: 'center' }}>
            {step === 1 ? (isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT') : 'SETUP PROFILE'}
          </h2>
          
          {error && (
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--rarity-legendary)', padding: '12px', borderRadius: '12px', color: '#f8fafc', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
              <AlertTriangle color="var(--rarity-legendary)" flexShrink={0} size={18} />
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                type="email" placeholder="Email Address" required
                value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', fontSize: '1rem', fontFamily: 'var(--font-body)' }}
              />
              <input 
                type="password" placeholder="Password (min 6 chars)" required minLength={6}
                value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', fontSize: '1rem', fontFamily: 'var(--font-body)' }}
              />
              
              <button 
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--accent-primary)', color: 'white', fontWeight: 700, border: 'none', fontFamily: 'var(--font-display)', fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
              >
                {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'LOGIN' : 'CONTINUE')}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button 
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}
                >
                  {isLogin ? "Need an account? Register" : "Already have an account? Login"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleProfileSetup} style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(0,0,0,0.2)',
                  border: '2px dashed var(--accent-primary)', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <Upload color="var(--accent-primary)" size={32} style={{ marginBottom: '8px' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Upload Pic</span>
                  </>
                )}
              </div>
              <input 
                type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarSelect}
                style={{ display: 'none' }}
              />
              
              <input 
                type="text" placeholder="Hunter Name (Username)" required
                value={username} onChange={e => setUsername(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', fontSize: '1rem', fontFamily: 'var(--font-body)', textAlign: 'center' }}
              />

              <button 
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--accent-primary)', color: 'white', fontWeight: 700, border: 'none', fontFamily: 'var(--font-display)', fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
              >
                {loading ? <Loader2 className="animate-spin" /> : 'COMPLETE SETUP'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
