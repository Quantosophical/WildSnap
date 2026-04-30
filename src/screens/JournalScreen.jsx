import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { AppContext } from '../context/AppContext';
import AnimalCard from '../features/journal/AnimalCard';
import Encyclopedia from '../features/journal/Encyclopedia';

const FILTERS = ['ALL', 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];

export default function JournalScreen() {
  const { user } = useContext(AppContext);
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  useEffect(() => {
    async function fetchCaptures() {
      if (!user) return;
      const { data, error } = await supabase
        .from('captures')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setCaptures(data);
      }
      setLoading(false);
    }
    fetchCaptures();
  }, [user]);

  const filteredCaptures = captures.filter(c => 
    filter === 'ALL' ? true : c.rarity.toUpperCase() === filter
  );

  const uniqueSpeciesCount = new Set(captures.map(c => c.animal_name)).size;

  return (
    <div className="screen-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--accent-main)' }}>FIELD JOURNAL</h1>
        <p style={{ color: 'var(--text-muted)' }}>{uniqueSpeciesCount} SPECIES DISCOVERED</p>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', marginBottom: '24px', paddingBottom: '8px' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              background: filter === f ? 'var(--accent-main)' : 'rgba(255,255,255,0.1)',
              color: filter === f ? '#000' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              whiteSpace: 'nowrap',
              border: '1px solid',
              borderColor: filter === f ? 'var(--accent-main)' : 'var(--border-color)'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>Loading captures...</div>
      ) : filteredCaptures.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>
          No {filter !== 'ALL' ? filter.toLowerCase() : ''} captures yet. Get out there!
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
          gap: '16px',
          paddingBottom: '24px'
        }}>
          {filteredCaptures.map(capture => (
            <AnimalCard 
              key={capture.id} 
              capture={capture} 
              onClick={() => setSelectedAnimal(capture)} 
            />
          ))}
        </div>
      )}

      {/* Encyclopedia Modal */}
      {selectedAnimal && (
        <Encyclopedia 
          animalName={selectedAnimal.animal_name} 
          species={selectedAnimal.species} 
          onClose={() => setSelectedAnimal(null)} 
        />
      )}
    </div>
  );
}
