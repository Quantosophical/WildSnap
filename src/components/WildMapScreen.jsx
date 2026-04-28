import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Target, Layers, Navigation } from 'lucide-react';
import { useGameFeedback } from '../hooks/useGameFeedback';

// Massive mock dataset for Heatzone
const MOCK_HEATZONE_DATA = {
  'Snow Leopard': Array.from({length: 15}, () => [27.98 + (Math.random()-0.5)*10, 86.92 + (Math.random()-0.5)*10, Math.random()]),
  'African Elephant': Array.from({length: 40}, () => [-2.33 + (Math.random()-0.5)*20, 34.83 + (Math.random()-0.5)*20, Math.random()]),
  'Red Fox': Array.from({length: 80}, () => [51.5 + (Math.random()-0.5)*30, -0.1 + (Math.random()-0.5)*40, Math.random()]),
  'Bald Eagle': Array.from({length: 30}, () => [45.0 + (Math.random()-0.5)*20, -100.0 + (Math.random()-0.5)*30, Math.random()]),
  'Komodo Dragon': Array.from({length: 8}, () => [-8.58 + (Math.random()-0.5)*2, 119.48 + (Math.random()-0.5)*2, Math.random()]),
  'Polar Bear': Array.from({length: 20}, () => [75.0 + (Math.random()-0.5)*10, -90.0 + (Math.random()-0.5)*60, Math.random()]),
  'Jaguar': Array.from({length: 25}, () => [-3.46 + (Math.random()-0.5)*20, -62.21 + (Math.random()-0.5)*20, Math.random()]),
  'Giant Panda': Array.from({length: 12}, () => [30.66 + (Math.random()-0.5)*5, 104.06 + (Math.random()-0.5)*5, Math.random()]),
  'Bengal Tiger': Array.from({length: 18}, () => [22.0 + (Math.random()-0.5)*10, 80.0 + (Math.random()-0.5)*10, Math.random()]),
  'Orangutan': Array.from({length: 15}, () => [0.96 + (Math.random()-0.5)*5, 114.55 + (Math.random()-0.5)*5, Math.random()])
};

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
  const [activeLayer, setActiveLayer] = useState('DISCOVERIES'); // DISCOVERIES or HEATZONE
  const [filter, setFilter] = useState('ALL');
  const [heatSpecies, setHeatSpecies] = useState('ALL');
  const [selectedPin, setSelectedPin] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const { playClick, triggerHaptic } = useGameFeedback();

  const captures = gameState.captures || [];
  const filters = ['ALL', 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];

  // Initialize Map
  useEffect(() => {
    if (!window.L || mapRef.current || !containerRef.current) return;

    // CartoDB Dark Matter tiles
    const map = window.L.map(containerRef.current, {
      zoomControl: false, // We'll add it manually to bottom right
      attributionControl: false
    }).setView([20, 0], 2);

    window.L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    window.L.control.zoom({ position: 'bottomright' }).addTo(map);

    markersLayerRef.current = window.L.layerGroup().addTo(map);
    heatLayerRef.current = window.L.layerGroup().addTo(map);

    mapRef.current = map;
    setInitialized(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle Layer Switching & Filtering
  useEffect(() => {
    if (!mapRef.current || !initialized) return;
    
    const map = mapRef.current;
    markersLayerRef.current.clearLayers();
    heatLayerRef.current.clearLayers();

    if (activeLayer === 'DISCOVERIES') {
      const validCaptures = captures.filter(c => c.lat !== undefined && c.lng !== undefined && c.lat !== null);
      
      const bounds = window.L.latLngBounds();
      let hasBounds = false;

      validCaptures.forEach(c => {
        const isVisible = filter === 'ALL' || c.rarity.toUpperCase() === filter;
        const color = RARITY_COLORS[c.rarity] || '#ffffff';
        
        // Custom HTML Marker
        const iconHtml = `
          <div style="
            width: 30px; height: 30px; 
            background: var(--bg-deep); 
            border: 3px solid ${color};
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 14px;
            box-shadow: 0 0 10px ${color}80;
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

      // If we jumped from journal
      if (mapTarget) {
        map.flyTo([mapTarget.lat, mapTarget.lng], 12, { duration: 1 });
        setMapTarget(null); // consume target
      } else if (hasBounds && filter === 'ALL' && !selectedPin) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 });
      }

    } else if (activeLayer === 'HEATZONE') {
      setSelectedPin(null);
      let heatData = [];
      
      if (heatSpecies === 'ALL') {
        Object.values(MOCK_HEATZONE_DATA).forEach(arr => heatData.push(...arr));
      } else {
        heatData = MOCK_HEATZONE_DATA[heatSpecies] || [];
      }

      if (window.L.heatLayer && heatData.length > 0) {
        const heat = window.L.heatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 10,
          gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
        });
        heatLayerRef.current.addLayer(heat);
        
        // Fit bounds to heatdata loosely
        const bounds = window.L.latLngBounds(heatData.map(d => [d[0], d[1]]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 4 });
      }
    }
  }, [activeLayer, filter, captures, initialized, heatSpecies, mapTarget]);

  // Stats for strip
  const totalPins = captures.filter(c => c.lat !== null).length;
  const uniqueLocations = new Set(captures.map(c => c.location_name)).size;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Controls Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Layer Toggle */}
        <div className="glass-panel" style={{ display: 'flex', padding: '4px', borderRadius: '30px' }}>
          <button 
            onClick={() => { playClick(); setActiveLayer('DISCOVERIES'); }}
            style={{ flex: 1, padding: '10px', borderRadius: '26px', border: 'none', background: activeLayer === 'DISCOVERIES' ? 'var(--accent-primary)' : 'transparent', color: activeLayer === 'DISCOVERIES' ? '#fff' : 'var(--text-muted)', fontWeight: 800, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <MapPin size={18} /> DISCOVERIES
          </button>
          <button 
            onClick={() => { playClick(); setActiveLayer('HEATZONE'); }}
            style={{ flex: 1, padding: '10px', borderRadius: '26px', border: 'none', background: activeLayer === 'HEATZONE' ? '#ef4444' : 'transparent', color: activeLayer === 'HEATZONE' ? '#fff' : 'var(--text-muted)', fontWeight: 800, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Layers size={18} /> HEATZONE
          </button>
        </div>

        {/* Dynamic Secondary Bar */}
        {activeLayer === 'DISCOVERIES' ? (
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
              <div className="glass-panel" style={{ padding: '6px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{totalPins} PINS</div>
              <div className="glass-panel" style={{ padding: '6px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--rarity-epic)' }}>{uniqueLocations} REGIONS</div>
            </div>
          </>
        ) : (
          <select 
            value={heatSpecies}
            onChange={(e) => { playClick(); setHeatSpecies(e.target.value); }}
            className="glass-panel"
            style={{ padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, appearance: 'none', outline: 'none' }}
          >
            <option value="ALL">ALL SPECIES (GLOBAL DENSITY)</option>
            {Object.keys(MOCK_HEATZONE_DATA).map(species => (
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
              <div className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Navigation size={10} /> {selectedPin.location_name}
              </div>
              <div className="text-xs" style={{ opacity: 0.5, marginTop: 4 }}>{selectedPin.lat?.toFixed(4)}, {selectedPin.lng?.toFixed(4)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WildMapScreen;
