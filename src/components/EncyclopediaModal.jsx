import React, { useState, useEffect } from 'react';
import { X, Globe, ShieldAlert, HeartPulse, Sparkles, Network } from 'lucide-react';
import { generateLore, generateEncyclopediaStats } from '../utils/api';
import { useGameFeedback } from '../hooks/useGameFeedback';

const IUCN_COLORS = {
  'Extinct': '#000000',
  'Critically Endangered': '#ef4444', // red
  'Endangered': '#f97316', // orange
  'Vulnerable': '#f59e0b', // amber
  'Near Threatened': '#eab308', // yellow
  'Least Concern': '#22c55e', // green
  'Data Deficient': '#94a3b8' // gray
};

const EcosystemMap = ({ animal, captures }) => {
  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
         <Network size={16} color="var(--accent-primary)" />
         <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)' }}>ECOSYSTEM CONNECTIONS</span>
      </div>
      <div style={{ position: 'relative', height: '120px', width: '100%', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)', fontSize: '2rem' }}>
           {animal.image.startsWith('http') || animal.image.startsWith('data:') ? (
              <img src={animal.image} alt={animal.animal} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
           ) : animal.image}
         </div>
         {/* Simple visualization based on number of captures */}
         <div style={{ position: 'absolute', width: '80px', height: '2px', background: 'rgba(255,255,255,0.2)', left: '50%', zIndex: 1 }} />
         <div style={{ position: 'absolute', left: 'calc(50% + 80px)', width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
           🌿
         </div>
         {captures.length > 5 && (
            <>
               <div style={{ position: 'absolute', width: '2px', height: '60px', background: 'rgba(255,255,255,0.2)', top: '50%', zIndex: 1 }} />
               <div style={{ position: 'absolute', top: 'calc(50% + 60px)', width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                 💧
               </div>
            </>
         )}
      </div>
      <div className="text-xs text-muted" style={{ textAlign: 'center', marginTop: '8px' }}>Ecosystem graph expands as you capture more species.</div>
    </div>
  );
};

const EncyclopediaModal = ({ animal, captures, onClose }) => {
  const [lore, setLore] = useState(null);
  const [loadingLore, setLoadingLore] = useState(false);
  const [data, setData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const { feedbackClick } = useGameFeedback();

  // Track mastery
  const capturesOfThis = captures.filter(c => c.species === animal.species).length;
  const showLore = capturesOfThis >= 3;

  useEffect(() => {
    // Fetch base stats dynamically
    const fetchBaseStats = async () => {
      setLoadingData(true);
      const cacheKey = `stats_${animal.species}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
         setData(JSON.parse(cached));
         setLoadingData(false);
      } else {
         try {
            const stats = await generateEncyclopediaStats(animal.animal || animal.species);
            setData(stats);
            localStorage.setItem(cacheKey, JSON.stringify(stats));
         } catch (e) {
            console.error('Failed to generate stats:', e);
            setData({
               scientific: animal.species || 'Unknown',
               class: 'Unknown', order: 'Unknown', family: 'Unknown',
               iucn: 'Data Deficient',
               population: 'Unknown',
               diet: 'Unknown',
               lifespan: 'Unknown',
               threats: 'Unknown',
               migration: 'Unknown',
               activity: 'Unknown',
               facts: ["Requires further field research to gather data."]
            });
         }
         setLoadingData(false);
      }
    };
    
    fetchBaseStats();
  }, [animal]);

  useEffect(() => {
    if (showLore && !lore) {
      // Check cache
      const cached = localStorage.getItem(`lore_${animal.species}`);
      if (cached) {
        setLore(cached);
      } else {
        const fetchLore = async () => {
          setLoadingLore(true);
          try {
            const text = await generateLore(animal.animal);
            setLore(text);
            localStorage.setItem(`lore_${animal.species}`, text);
          } catch (e) {
            console.error(e);
            setLore("Failed to retrieve ancient archives.");
          }
          setLoadingLore(false);
        };
        fetchLore();
      }
    }
  }, [animal.species, animal.animal, showLore, lore]);

  const iucnColor = data ? (IUCN_COLORS[data.iucn] || '#94a3b8') : '#94a3b8';

  return (
    <div className="animate-slide-up" style={{
      position: 'fixed', inset: 0, zIndex: 300, 
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-deep)', padding: '24px', overflowY: 'auto',
      paddingBottom: '80px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="heading-xl text-gradient">ENCYCLOPEDIA</h1>
        <button 
          onClick={() => { feedbackClick(); onClose(); }}
          style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', padding: '8px', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
         <div style={{ width: '120px', height: '120px', borderRadius: '24px', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', flexShrink: 0, boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }}>
            {animal.image.startsWith('http') || animal.image.startsWith('data:') ? (
              <img src={animal.image} alt={animal.animal} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '24px' }} />
            ) : animal.image}
         </div>
         <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 className="heading-lg" style={{ lineHeight: 1.1, marginBottom: '4px' }}>{animal.animal}</h2>
            {loadingData ? (
               <div className="text-xs text-muted">Retrieving data...</div>
            ) : (
               <>
                  <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>{data.scientific}</div>
                  <div className="text-xs text-muted">{data.class} • {data.order} • {data.family}</div>
               </>
            )}
         </div>
      </div>

      {loadingData ? (
         <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
      ) : (
         <>
            {/* IUCN Status */}
            <div style={{ background: 'var(--bg-glass)', borderRadius: '16px', padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: `4px solid ${iucnColor}` }}>
               <ShieldAlert size={24} color={iucnColor} />
               <div>
                  <div className="text-xs text-muted" style={{ fontWeight: 800 }}>IUCN STATUS</div>
                  <div style={{ color: iucnColor, fontWeight: 900, fontSize: '1.1rem' }}>{data.iucn.toUpperCase()}</div>
               </div>
               <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div className="text-xs text-muted" style={{ fontWeight: 800 }}>EST. POPULATION</div>
                  <div style={{ fontWeight: 800 }}>{data.population}</div>
               </div>
            </div>

            {/* Grid Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
               <div className="glass-panel" style={{ padding: '12px' }}>
                  <div className="text-xs text-muted" style={{ fontWeight: 800, marginBottom: '4px' }}>DIET</div>
                  <div style={{ fontWeight: 600 }}>{data.diet}</div>
               </div>
               <div className="glass-panel" style={{ padding: '12px' }}>
                  <div className="text-xs text-muted" style={{ fontWeight: 800, marginBottom: '4px' }}>LIFESPAN</div>
                  <div style={{ fontWeight: 600 }}>{data.lifespan}</div>
               </div>
               <div className="glass-panel" style={{ padding: '12px' }}>
                  <div className="text-xs text-muted" style={{ fontWeight: 800, marginBottom: '4px' }}>ACTIVITY</div>
                  <div style={{ fontWeight: 600 }}>{data.activity}</div>
               </div>
               <div className="glass-panel" style={{ padding: '12px' }}>
                  <div className="text-xs text-muted" style={{ fontWeight: 800, marginBottom: '4px' }}>MIGRATION</div>
                  <div style={{ fontWeight: 600 }}>{data.migration}</div>
               </div>
               <div className="glass-panel" style={{ padding: '12px', gridColumn: '1 / -1' }}>
                  <div className="text-xs text-muted" style={{ fontWeight: 800, marginBottom: '4px' }}>PRIMARY THREATS</div>
                  <div style={{ fontWeight: 600 }}>{data.threats}</div>
               </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
               <h3 className="heading-sm" style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>FASCINATING FACTS</h3>
               <ul style={{ paddingLeft: '20px', color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {data.facts?.map((f, i) => <li key={i} style={{ marginBottom: '8px' }}>{f}</li>)}
               </ul>
            </div>
         </>
      )}

      {/* Ecosystem Map */}
      <EcosystemMap animal={animal} captures={captures} />

      {/* Lore Section */}
      <div style={{ marginTop: '24px', padding: '20px', background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.1), transparent)', borderRadius: '24px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
           <Sparkles size={20} color="var(--accent-primary)" />
           <h3 className="heading-sm" style={{ color: 'var(--accent-primary)' }}>LORE</h3>
        </div>
        {showLore ? (
           loadingLore ? (
             <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Consulting archives...</div>
           ) : (
             <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-main)', fontStyle: 'italic' }}>
               {lore}
             </p>
           )
        ) : (
           <div style={{ textAlign: 'center', padding: '20px' }}>
             <div className="text-muted" style={{ marginBottom: '8px' }}>You need 3 captures of this species to unlock its Lore.</div>
             <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
               <div style={{ height: '100%', width: `${(capturesOfThis/3)*100}%`, background: 'var(--text-muted)' }} />
             </div>
             <div className="text-xs" style={{ marginTop: '8px', fontWeight: 800 }}>{capturesOfThis} / 3 CAPTURES</div>
           </div>
        )}
      </div>

    </div>
  );
};

export default EncyclopediaModal;
