import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Key, Check, Loader2, AlertTriangle } from 'lucide-react';
import { reinitSupabase } from '../utils/supabase';

const AppSetup = () => {
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('SUPABASE_URL') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('SUPABASE_ANON_KEY') || '');
  const [nimKey, setNimKey] = useState(localStorage.getItem('NIM_API_KEY') || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!supabaseUrl.trim() || !supabaseKey.trim() || !nimKey.trim()) {
        throw new Error('All fields are required');
      }

      // Save to localStorage
      localStorage.setItem('SUPABASE_URL', supabaseUrl.trim());
      localStorage.setItem('SUPABASE_ANON_KEY', supabaseKey.trim());
      localStorage.setItem('NIM_API_KEY', nimKey.trim());

      // Re-initialize Supabase client
      const initSuccess = reinitSupabase();
      if (!initSuccess) {
        throw new Error('Failed to initialize Supabase client');
      }

      // We should ideally test the connection here, but just importing reinitSupabase 
      // creates the client. We assume it's correct for now, or auth will fail next.
      
      setSuccess(true);
      setTimeout(() => {
        // Force reload so that all hooks pick up the initialized supabase client properly
        window.location.href = '/auth';
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg-deep)' }}>
      <div className="blob-panel animate-pop-in" style={{ padding: '32px 24px', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: 900, textAlign: 'center', marginBottom: '24px', color: 'var(--text-main)' }}>
          SYSTEM SETUP
        </h2>

        <p className="text-muted text-sm" style={{ textAlign: 'center', marginBottom: '24px', lineHeight: 1.5 }}>
          Welcome to WildSnap. Please configure your backend connections to proceed.
        </p>

        {error && (
          <div className="animate-slide-up" style={{ background: 'var(--rarity-legendary)', color: 'white', padding: '12px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 800 }}>
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="animate-slide-up" style={{ background: 'var(--rarity-epic)', color: 'white', padding: '12px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 800 }}>
            <Check size={18} />
            Keys saved! Initializing...
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="text-xs text-muted" style={{ fontWeight: 800 }}>SUPABASE URL</label>
            <div style={{ position: 'relative' }}>
              <Database size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="https://xxxx.supabase.co" 
                value={supabaseUrl} 
                onChange={(e) => setSupabaseUrl(e.target.value)}
                style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '2px solid rgba(128,128,128,0.2)', background: 'var(--bg-surface)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="text-xs text-muted" style={{ fontWeight: 800 }}>SUPABASE ANON KEY</label>
            <div style={{ position: 'relative' }}>
              <Key size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                placeholder="eyJh..." 
                value={supabaseKey} 
                onChange={(e) => setSupabaseKey(e.target.value)}
                style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '2px solid rgba(128,128,128,0.2)', background: 'var(--bg-surface)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="text-xs text-muted" style={{ fontWeight: 800 }}>NIM API KEY (AI)</label>
            <div style={{ position: 'relative' }}>
              <Key size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                placeholder="nvapi-..." 
                value={nimKey} 
                onChange={(e) => setNimKey(e.target.value)}
                style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '2px solid rgba(128,128,128,0.2)', background: 'var(--bg-surface)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || success} 
            className="btn-3d btn-3d-primary btn-pill" 
            style={{ marginTop: '16px', width: '100%', height: '56px' }}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'SAVE & CONTINUE'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AppSetup;
