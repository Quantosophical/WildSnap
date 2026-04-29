import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Target, Layers, Navigation, ShieldAlert, Swords } from 'lucide-react';
import { useGameFeedback } from '../hooks/useGameFeedback';
import { supabase } from '../utils/supabase';

const RARITY_COLORS = {
  'Common': '#39ff6a',
  'Uncommon': '#00bfff',
  'Rare': '#c084fc',
  'Epic': '#ffb830',
  'Legendary': '#ff4500'
};

const WildMapScreen = ({ gameState, mapTarget, setMapTarget }) => {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const heatLayerRef = useRef(null);
  const territoryLayerRef = useRef(null);
  const [activeLayer, setActiveLayer] = useState('DISCOVERIES'); // DISCOVERIES, HEATZONE, TERRITORY
  const [filter, setFilter] = useState('ALL');
  const [heatSpecies, setHeatSpecies] = useState('ALL');
  const [selectedPin, setSelectedPin] = useState(null);
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [globalCaptures, setGlobalCaptures] = useState([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const { playClick, triggerHaptic } = useGameFeedback();

  const filters = ['ALL', 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];

  useEffect(() => {
    const fetchGlobalMapData = async () => {
      setLoadingGlobal(true);
      const { data, error } = await supabase
        .from('captures')
        .select(`
          id, animal_name, species, rarity, lat, lng, location_name, city_region, image_url, user_id, created_at,
          users ( username, avatar_url, color_theme )
        `)
        .not('lat', 'is', null)
        .limit(1000);
        
      if (data) {
        setGlobalCaptures(data.map(c => ({
          ...c,
          image: c.image_url,
          animal: c.animal_name,
          username: c.users?.username || 'Unknown',
          avatarUrl: c.users?.avatar_url,
          colorTheme: c.users?.color_theme || '#ef4444'
        })));
      }
      setLoadingGlobal(false);
    };
    fetchGlobalMapData();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!window.L || mapRef.current || !containerRef.current) return;

    const map = window.L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([20, 0], 2);

    window.L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    window.L.control.zoom({ position: 'bottomright' }).addTo(map);

    markersLayerRef.current = window.L.layerGroup().addTo(map);
    heatLayerRef.current = window.L.layerGroup().addTo(map);
    territoryLayerRef.current = window.L.layerGroup().addTo(map);

    mapRef.current = map;
    setInitialized(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle Layer Switching
  useEffect(() => {
    if (!mapRef.current || !initialized) return;
    
    const map = mapRef.current;
    markersLayerRef.current.clearLayers();
    heatLayerRef.current.clearLayers();
    territoryLayerRef.current.clearLayers();

    if (activeLayer === 'DISCOVERIES') {
      setSelectedTerritory(null);
      const validCaptures = globalCaptures.filter(c => c.lat !== undefined && c.lng !== undefined && c.lat !== null);
      
      const bounds = window.L.latLngBounds();
      let hasBounds = false;

      validCaptures.forEach(c => {
        const isVisible = filter === 'ALL' || c.rarity.toUpperCase() === filter;
        const color = RARITY_COLORS[c.rarity] || '#ffffff';
        const isMine = c.user_id === gameState.userId;
        
        // Custom HTML Marker
        const iconHtml = `
          <div style="
            width: 30px; height: 30px; 
            background: var(--bg-deep); 
            border: 3px solid ${isMine ? 'var(--accent-primary)' : color};
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 14px;
            box-shadow: 0 0 10px ${isMine ? 'var(--accent-primary)' : color}80;
            opacity: ${isVisible ? '1' : '0.2'};
            transition: opacity 0.3s;
            ${c.rarity === 'Legendary' && isVisible ? `animation: pulse-ring 2s infinite;` : ''}
          ">
            ${c.image && !c.image.startsWith('http') && !c.image.startsWith('data:') ? c.image : '📍'}
          </div>
          <style>
            @keyframes pulse-ring {
              0% { box-shadow: 0 0 0 0 ${color}80; }
              70% { box-shadow: 0 0 0 15px ${color}00; }
              100% { box-shadow: 0 0 0 0 ${color}00; }
            }
          </style>
        `;

        const icon = window.L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = window.L.marker([c.lat, c.lng], { icon, interactive: isVisible });
        marker.on('click', () => {
          playClick();
          setSelectedPin(c);
          map.flyTo([c.lat, c.lng], 10, { duration: 0.5 });
        });
        
        markersLayerRef.current.addLayer(marker);
        if (isVisible) {
          bounds.extend([c.lat, c.lng]);
          hasBounds = true;
        }
      });

      if (mapTarget) {
        map.flyTo([mapTarget.lat, mapTarget.lng], 12, { duration: 1 });
        setMapTarget(null);
      } else if (hasBounds && filter === 'ALL' && !selectedPin) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 });
      }

    } else if (activeLayer === 'HEATZONE') {
      setSelectedPin(null);
      setSelectedTerritory(null);
      let heatData = [];
      
      const validCaptures = globalCaptures.filter(c => c.lat !== undefined && c.lng !== undefined && c.lat !== null);
      if (heatSpecies === 'ALL') {
         heatData = validCaptures.map(c => [c.lat, c.lng, 1]);
      } else {
         heatData = validCaptures.filter(c => c.species === heatSpecies || c.animal === heatSpecies).map(c => [c.lat, c.lng, 1]);
      }

      if (window.L.heatLayer && heatData.length > 0) {
        const heat = window.L.heatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 10,
          gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
        });
        heatLayerRef.current.addLayer(heat);
        
        const bounds = window.L.latLngBounds(heatData.map(d => [d[0], d[1]]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 4 });
      }
    } else if (activeLayer === 'TERRITORY') {
      setSelectedPin(null);
      // Group captures by city_region
      const zones = {};
      globalCaptures.forEach(c => {
         const region = c.city_region || c.location_name || 'Unknown Zone';
         if (!zones[region]) {
           zones[region] = {
             name: region,
             lat: 0, lng: 0, count: 0,
             players: {},
             allCaptures: []
           };
         }
         zones[region].lat += c.lat;
         zones[region].lng += c.lng;
         zones[region].count += 1;
         zones[region].players[c.user_id] = (zones[region].players[c.user_id] || 0) + 1;
         zones[region].allCaptures.push(c);
      });

      const bounds = window.L.latLngBounds();
      let hasBounds = false;

      Object.values(zones).forEach(zone => {
         zone.lat /= zone.count;
         zone.lng /= zone.count;

         // Find owner (most captures)
         let ownerId = null;
         let ownerCount = 0;
         let ownerDetails = null;

         Object.entries(zone.players).forEach(([pid, cnt]) => {
           if (cnt > ownerCount) {
             ownerCount = cnt;
             ownerId = pid;
           }
         });

         const firstCaptureByOwner = zone.allCaptures.find(c => c.user_id === ownerId);
         ownerDetails = {
           id: ownerId,
           username: firstCaptureByOwner?.username || 'Unknown',
           colorTheme: firstCaptureByOwner?.colorTheme || '#3b82f6'
         };
         
         const isMine = ownerId === gameState.userId;
         const myCount = zone.players[gameState.userId] || 0;
         const isContested = !isMine && (ownerCount - myCount <= 2);

         const radius = 5000 + (zone.count * 1000); // Scale with count
         const color = isMine ? 'var(--rarity-epic)' : (isContested ? '#ef4444' : ownerDetails.colorTheme);
         
         const circle = window.L.circle([zone.lat, zone.lng], {
           color: color,
           fillColor: color,
           fillOpacity: 0.2,
           radius: radius,
           className: isContested ? 'territory-contested' : ''
         });

         circle.on('click', () => {
           playClick();
           setSelectedTerritory({ ...zone, ownerDetails, isMine, myCount, ownerCount });
           map.flyTo([zone.lat, zone.lng], 11, { duration: 0.5 });
         });

         territoryLayerRef.current.addLayer(circle);
         bounds.extend([zone.lat, zone.lng]);
         hasBounds = true;
      });

      if (hasBounds) {
         map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
      }

      // Add CSS for flashing contested territories
      if (!document.getElementById('territory-styles')) {
        const style = document.createElement('style');
        style.id = 'territory-styles';
        style.innerHTML = `
          @keyframes flash-red {
             0% { stroke: #ef4444; stroke-width: 2; }
             50% { stroke: #ff0000; stroke-width: 6; }
             100% { stroke: #ef4444; stroke-width: 2; }
          }
          .territory-contested path {
             animation: flash-red 1.5s infinite;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [activeLayer, filter, globalCaptures, initialized, heatSpecies, mapTarget, gameState.userId]);

  const totalPins = activeLayer === 'DISCOVERIES' ? globalCaptures.length : 0;
  const uniqueLocations = new Set(globalCaptures.map(c => c.location_name)).size;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Controls Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Layer Toggle */}
        <div className="glass-panel" style={{ display: 'flex', padding: '4px', borderRadius: '30px' }}>
          <button 
            onClick={() => { playClick(); setActiveLayer('DISCOVERIES'); }}
            style={{ flex: 1, padding: '8px 4px', fontSize: '0.75rem', borderRadius: '26px', border: 'none', background: activeLayer === 'DISCOVERIES' ? 'var(--accent-primary)' : 'transparent', color: activeLayer === 'DISCOVERIES' ? '#fff' : 'var(--text-muted)', fontWeight: 800, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <MapPin size={14} /> DISCOVERIES
          </button>
          <button 
            onClick={() => { playClick(); setActiveLayer('HEATZONE'); }}
            style={{ flex: 1, padding: '8px 4px', fontSize: '0.75rem', borderRadius: '26px', border: 'none', background: activeLayer === 'HEATZONE' ? '#ef4444' : 'transparent', color: activeLayer === 'HEATZONE' ? '#fff' : 'var(--text-muted)', fontWeight: 800, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <Layers size={14} /> HEATZONE
          </button>
          <button 
            onClick={() => { playClick(); setActiveLayer('TERRITORY'); }}
            style={{ flex: 1, padding: '8px 4px', fontSize: '0.75rem', borderRadius: '26px', border: 'none', background: activeLayer === 'TERRITORY' ? 'var(--rarity-epic)' : 'transparent', color: activeLayer === 'TERRITORY' ? '#fff' : 'var(--text-muted)', fontWeight: 800, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <ShieldAlert size={14} /> TERRITORY
          </button>
        </div>

        {/* Dynamic Secondary Bar */}
        {activeLayer === 'DISCOVERIES' && (
          <>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {filters.map(f => (
                <button
                  key={f}
                  onClick={() => { playClick(); setFilter(f); }}
                  style={{
                    padding: '6px 16px', borderRadius: '20px', border: `1px solid ${filter === f ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}`,
                    background: filter === f ? 'var(--accent-primary)' : 'var(--bg-glass)',
                    color: filter === f ? '#fff' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="glass-panel" style={{ padding: '6px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{totalPins} GLOBAL PINS</div>
            </div>
          </>
        )}
        
        {activeLayer === 'HEATZONE' && (
          <select 
            value={heatSpecies}
            onChange={(e) => { playClick(); setHeatSpecies(e.target.value); }}
            className="glass-panel"
            style={{ padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, appearance: 'none', outline: 'none' }}
          >
            <option value="ALL">ALL SPECIES (GLOBAL DENSITY)</option>
            {Array.from(new Set(globalCaptures.map(c => c.species))).filter(Boolean).map(species => (
              <option key={species} value={species}>{species.toUpperCase()}</option>
            ))}
          </select>
        )}
      </div>

      {/* Map Container */}
      <div ref={containerRef} style={{ flex: 1, width: '100%', background: '#0a0a0a' }} />

      {/* Selected Pin Popup Overlay */}
      {selectedPin && activeLayer === 'DISCOVERIES' && (
        <div className="animate-slide-up" style={{ position: 'absolute', bottom: '80px', left: '16px', right: '16px', zIndex: 1000 }}>
          <div className={`glass-panel border-${selectedPin.rarity.toLowerCase()}`} style={{ padding: '16px', display: 'flex', gap: '16px', position: 'relative' }}>
            <button onClick={() => setSelectedPin(null)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 24, height: 24, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            
            <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', border: `2px solid var(--rarity-${selectedPin.rarity.toLowerCase()})` }}>
              {selectedPin.image.startsWith('data:') || selectedPin.image.startsWith('http') ? (
                <img src={selectedPin.image} alt={selectedPin.animal} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>{selectedPin.image}</div>
              )}
            </div>
            
            <div style={{ flex: 1 }}>
              <div className="text-xs" style={{ color: `var(--rarity-${selectedPin.rarity.toLowerCase()})`, fontWeight: 800 }}>{selectedPin.rarity.toUpperCase()}</div>
              <div className="heading-sm" style={{ marginBottom: 4 }}>{selectedPin.animal}</div>
              <div className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Navigation size={10} /> {selectedPin.location_name}
              </div>
              <div className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                Found by: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{selectedPin.username}</span> {selectedPin.user_id === gameState.userId && '(You)'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Territory Overlay */}
      {selectedTerritory && activeLayer === 'TERRITORY' && (
        <div className="animate-slide-up" style={{ position: 'absolute', bottom: '80px', left: '16px', right: '16px', zIndex: 1000 }}>
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', borderTop: `4px solid ${selectedTerritory.ownerDetails.colorTheme}` }}>
            <button onClick={() => setSelectedTerritory(null)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 24, height: 24, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>✕</button>
            
            <div>
               <div className="text-xs text-muted" style={{ fontWeight: 800, letterSpacing: '0.05em' }}>TERRITORY ZONE</div>
               <div className="heading-md" style={{ color: 'var(--text-main)' }}>{selectedTerritory.name}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px' }}>
               <div>
                 <div className="text-xs text-muted" style={{ fontWeight: 600, marginBottom: 2 }}>CURRENT OWNER</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: selectedTerritory.ownerDetails.colorTheme }}>
                    {selectedTerritory.ownerDetails.username}
                 </div>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div className="heading-lg" style={{ color: selectedTerritory.ownerDetails.colorTheme }}>{selectedTerritory.ownerCount}</div>
                  <div className="text-xs text-muted">CAPTURES</div>
               </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div className="text-sm">
                  Your Captures: <span style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{selectedTerritory.myCount}</span>
               </div>
               <div className="text-sm">
                  Density: <span style={{ fontWeight: 800 }}>{selectedTerritory.count}</span> total
               </div>
            </div>

            {!selectedTerritory.isMine && (selectedTerritory.ownerCount - selectedTerritory.myCount <= 5) && (
              <button className="btn-3d btn-pill" style={{ background: '#ef4444', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', marginTop: '8px' }}>
                 <Swords size={18} /> INITIATE CHALLENGE
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WildMapScreen;
