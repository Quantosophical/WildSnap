import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Sparkles } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useGameFeedback } from '../hooks/useGameFeedback';

const LandingPage = () => {
  const navigate = useNavigate();
  const { feedbackClick } = useGameFeedback();

  useEffect(() => {
    // Auto-login: if session exists, go straight to dashboard
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/app');
      }
    };
    checkSession();
  }, [navigate]);

  const handleStart = () => {
    feedbackClick();
    navigate('/auth');
  };

  return (
    <div className="app-container" style={{
      background: 'radial-gradient(circle at center, #38bdf8 0%, #0ea5e9 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      
      {/* Background Decorative Elements */}
      <div className="animate-float" style={{ position: 'absolute', top: '15%', left: '10%', opacity: 0.5 }}>
        <Sparkles size={64} color="white" />
      </div>
      <div className="animate-float" style={{ position: 'absolute', top: '25%', right: '15%', opacity: 0.3, animationDelay: '1s' }}>
        <Sparkles size={48} color="white" />
      </div>

      <div className="content-area animate-pop-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', paddingBottom: '0' }}>
        
        {/* Massive Logo Area */}
        <div style={{ textAlign: 'center', marginBottom: '80px', position: 'relative' }}>
          <h1 style={{ 
            fontSize: '5rem', 
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            lineHeight: 1,
            color: 'white',
            textShadow: '0 12px 32px rgba(0,0,0,0.2)',
            letterSpacing: '-0.02em',
            transform: 'rotate(-2deg)'
          }}>
            WILD
            <br/>
            <span style={{ color: 'var(--accent-tertiary)' }}>SNAP</span>
          </h1>
          <div style={{
            background: 'white', color: 'var(--accent-secondary)', padding: '8px 24px',
            borderRadius: '24px', fontWeight: 900, fontSize: '0.9rem', marginTop: '16px',
            display: 'inline-block', boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            transform: 'rotate(2deg)'
          }}>
            THE WORLD IS YOUR POKÉDEX
          </div>
        </div>

        {/* Floating Giant CTA Button */}
        <div style={{ position: 'absolute', bottom: '15%' }} className="animate-float">
          <button 
            onClick={handleStart}
            className="btn-3d btn-3d-tertiary btn-circle"
            style={{ 
              width: '120px', height: '120px', 
              background: 'var(--accent-tertiary)',
              boxShadow: '0 12px 0 var(--accent-tertiary-dark), 0 24px 48px rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Play size={48} color="white" fill="white" style={{ marginLeft: '8px' }} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default LandingPage;
