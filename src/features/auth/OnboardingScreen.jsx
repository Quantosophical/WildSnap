import React, { useState } from 'react';

export default function OnboardingScreen() {
  const [url, setUrl] = useState(localStorage.getItem('SUPABASE_URL') || '');
  const [key, setKey] = useState(localStorage.getItem('SUPABASE_ANON_KEY') || '');
  const [nim, setNim] = useState(localStorage.getItem('NIM_API_KEY') || '');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url || !key) {
      setError('Supabase URL and Key are required.');
      return;
    }
    localStorage.setItem('SUPABASE_URL', url.trim());
    localStorage.setItem('SUPABASE_ANON_KEY', key.trim());
    if (nim) localStorage.setItem('NIM_API_KEY', nim.trim());
    window.location.reload();
  };

  return (
    <div className="screen-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2.5rem', color: 'var(--accent-main)' }}>
          SYSTEM SETUP
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          Please configure your backend connections.
        </p>

        {error && (
          <div style={{ background: 'rgba(255,69,0,0.2)', color: '#ff4500', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SUPABASE URL</label>
            <input 
              type="text" 
              placeholder="https://xxxx.supabase.co" 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SUPABASE ANON KEY</label>
            <input 
              type="password" 
              placeholder="eyJh..." 
              value={key} 
              onChange={e => setKey(e.target.value)} 
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>NVIDIA NIM API KEY</label>
            <input 
              type="password" 
              placeholder="nvapi-..." 
              value={nim} 
              onChange={e => setNim(e.target.value)} 
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
            SAVE & CONTINUE
          </button>
        </form>
      </div>
    </div>
  );
}
