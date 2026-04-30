import React, { useEffect, useRef, useState, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { AppContext } from '../context/AppContext';

export default function WildMapScreen() {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const heatLayerRef = useRef(null);
  const markersRef = useRef([]);
  
  const { user } = useContext(AppContext);
  const [activeLayer, setActiveLayer] = useState('MY DISCOVERIES');
  const [captures, setCaptures] = useState([]);
  const [globalCaptures, setGlobalCaptures] = useState([]);
  
  // Fetch data
  useEffect(() => {
    async function fetchData() {
      // User's captures
      if (user) {
        const { data: myData } = await supabase
          .from('captures')
          .select('*')
          .eq('user_id', user.id)
          .not('lat', 'is', null);
        if (myData) setCaptures(myData);
      }
      
      // Global captures for heatzone
      const { data: allData } = await supabase
        .from('captures')
        .select('lat, lng, rarity')
        .not('lat', 'is', null)
        .limit(1000);
      if (allData) setGlobalCaptures(allData);
    }
    fetchData();
  }, [user]);

  // Init map
  useEffect(() => {
    if (!window.L || !containerRef.current || mapRef.current) return;

    const map = window.L.map(containerRef.current, {
      center: [20, 0], zoom: 2,
      zoomControl: false
    });
    
    window.L.tileLayer(
      'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
      { attribution: '© OpenStreetMap © CARTO' }
    ).addTo(map);
    
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.L) return;

    // Clear existing
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (activeLayer === 'MY DISCOVERIES') {
      captures.forEach(c => {
        const marker = window.L.circleMarker([c.lat, c.lng], {
          radius: 8,
          fillColor: getRarityColor(c.rarity),
          color: '#000',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map);
        
        marker.bindPopup(`<b>${c.animal_name}</b><br/>${c.points_earned} XP`);
        markersRef.current.push(marker);
      });
      
      if (captures.length > 0) {
        const group = new window.L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
      }

    } else if (activeLayer === 'HEATZONE') {
      if (window.L.heatLayer) {
        const points = globalCaptures.map(c => [c.lat, c.lng, getHeatIntensity(c.rarity)]);
        heatLayerRef.current = window.L.heatLayer(points, { radius: 25, blur: 15 }).addTo(map);
      }
    } else if (activeLayer === 'TERRITORY') {
      // Mock territory for now
      const marker = window.L.circle([40.7128, -74.0060], {
        color: 'var(--accent-purple)',
        fillColor: 'var(--accent-purple)',
        fillOpacity: 0.5,
        radius: 50000 // 50km
      }).addTo(map);
      marker.bindPopup("<b>Hunter's Territory</b>");
      markersRef.current.push(marker);
      map.setView([40.7128, -74.0060], 8);
    }
  }, [activeLayer, captures, globalCaptures]);

  const getRarityColor = (rarity) => {
    switch(rarity?.toLowerCase()) {
      case 'uncommon': return '#00bfff';
      case 'rare': return '#c084fc';
      case 'epic': return '#ffb830';
      case 'legendary': return '#ff4500';
      default: return '#6b8f6b';
    }
  };

  const getHeatIntensity = (rarity) => {
    switch(rarity?.toLowerCase()) {
      case 'legendary': return 1.0;
      case 'epic': return 0.8;
      case 'rare': return 0.6;
      case 'uncommon': return 0.4;
      default: return 0.2;
    }
  };

  return (
    <div className="screen-container" style={{ padding: 0, position: 'relative' }}>
      
      {/* Map Container */}
      <div id="wildmap-container" ref={containerRef} style={{ width: '100%', height: 'calc(100vh - 80px)' }} />

      {/* Header Overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        background: 'linear-gradient(to bottom, rgba(10,26,15,0.9), transparent)',
        padding: '24px', zIndex: 400
      }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--accent-main)', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          WILDMAP
        </h1>
      </div>

      {/* Layer Toggles Overlay */}
      <div style={{
        position: 'absolute', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '8px', zIndex: 400,
        background: 'rgba(15, 31, 18, 0.8)', padding: '8px', borderRadius: '30px',
        backdropFilter: 'blur(10px)'
      }}>
        {['MY DISCOVERIES', 'HEATZONE', 'TERRITORY'].map(layer => (
          <button
            key={layer}
            onClick={() => setActiveLayer(layer)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              background: activeLayer === layer ? 'var(--accent-main)' : 'transparent',
              color: activeLayer === layer ? '#000' : 'var(--text-main)',
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
          >
            {layer}
          </button>
        ))}
      </div>
    </div>
  );
}
