import React, { useState, useEffect } from 'react';
import { Target, Globe, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '../utils/supabase';

const ExpeditionBanner = () => {
  const [bounties, setBounties] = useState([]);
  const [expedition, setExpedition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch Bounties
      const { data: bData } = await supabase
        .from('bounties')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (bData && bData.length > 0) {
        setBounties(bData);
      } else {
        // Fallback if none in DB yet
        setBounties([{ id: 1, target_species: 'Any Bird', reward_xp: 500, location_req: 'Parks', is_active: true }]);
      }

      // Fetch active Expedition
      const { data: eData } = await supabase
        .from('expeditions')
        .select('*')
        .eq('is_active', true)
        .order('end_time', { ascending: true })
        .limit(1)
        .single();
        
      if (eData) {
        setExpedition(eData);
      } else {
        // Fallback if none in DB
        setExpedition({
          title: 'GLOBAL SAFARI',
          description: 'Document any new species to unlock a community reward.',
          current_progress: 100,
          target_goal: 5000,
          end_time: new Date(Date.now() + 86400000).toISOString()
        });
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, []);

  if (loading) return null;

  const getTimeLeft = (endTime) => {
     const diff = new Date(endTime) - new Date();
     if (diff <= 0) return 'Ended';
     const d = Math.floor(diff / (1000 * 60 * 60 * 24));
     const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
     return `${d}d ${h}h`;
  };

  return (
    <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Daily Bounties Scroll */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Target size={18} color="var(--rarity-epic)" />
          <h2 className="heading-sm" style={{ color: 'var(--text-muted)' }}>DAILY BOUNTIES</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '8px' }}>
          {bounties.map((b) => (
            <div key={b.id} className="glass-panel" style={{ minWidth: '220px', padding: '16px', borderRadius: '20px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
               <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 12px', background: 'var(--rarity-epic)', color: '#fff', fontSize: '0.65rem', fontWeight: 900, borderBottomLeftRadius: '12px' }}>
                 ACTIVE
               </div>
               <div className="heading-md" style={{ marginBottom: '4px', marginTop: '8px' }}>{b.target_species}</div>
               {b.location_req && <div className="text-xs text-muted" style={{ marginBottom: '12px' }}>📍 {b.location_req}</div>}
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 800 }}>
                 {b.reward_xp} XP
                 <ChevronRight size={14} />
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Global Expedition */}
      {expedition && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px', border: '1px solid var(--accent-primary)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)', position: 'relative', overflow: 'hidden' }}>
           <div style={{ position: 'absolute', right: '-20px', top: '-20px', fontSize: '8rem', opacity: 0.1, filter: 'blur(4px)' }}>
              🌍
           </div>
           
           <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                   <Globe size={16} /> GLOBAL EXPEDITION
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--rarity-epic)', fontWeight: 800, fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                   <Clock size={12} /> {getTimeLeft(expedition.end_time)}
                 </div>
              </div>
              
              <h2 className="heading-lg" style={{ marginBottom: '8px' }}>{expedition.title}</h2>
              <p className="text-sm text-muted" style={{ marginBottom: '20px', maxWidth: '80%', lineHeight: 1.5 }}>
                 {expedition.description}
              </p>

              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 800 }}>
                    <span style={{ color: 'var(--text-main)' }}>{Math.min(100, (expedition.current_progress / expedition.target_goal * 100)).toFixed(1)}%</span>
                    <span style={{ color: 'var(--text-muted)' }}>{expedition.current_progress.toLocaleString()} / {expedition.target_goal.toLocaleString()}</span>
                 </div>
                 <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (expedition.current_progress / expedition.target_goal) * 100)}%`, background: 'var(--accent-primary)', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }} />
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default ExpeditionBanner;
