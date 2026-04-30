import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function Encyclopedia({ animalName, species, onClose }) {
  const [lore, setLore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLore() {
      // Very simple NIM text generation call
      const nimApiKey = localStorage.getItem('NIM_API_KEY') || import.meta.env.VITE_NIM_API_KEY;
      try {
        // Use NIM API key from local storage/env if available, otherwise fallback to Edge Function
        let loreText = "Lore currently unavailable.";
        
        if (nimApiKey) {
          const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${nimApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'meta/llama-3.1-8b-instruct',
              max_tokens: 250,
              messages: [
                { role: 'system', content: 'You are a wildlife lore generator. Provide a 150-word narrative about this animal\'s ecology and mythology. No markdown.' },
                { role: 'user', content: `Generate lore for: ${animalName}` }
              ]
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            loreText = data.choices[0].message.content.trim();
          }
        } else {
          // Fallback to Supabase Edge Function
          const { data, error } = await supabase.functions.invoke('nim-text', {
            body: { 
              prompt: `Generate lore for: ${animalName}`,
              systemPrompt: 'You are a wildlife lore generator. Provide a 150-word narrative about this animal\'s ecology and mythology. No markdown.'
            }
          });
          
          if (!error && data && data.text) {
            loreText = data.text;
          }
        }
        
        setLore(loreText);
      } catch (e) {
        setLore("Lore currently unavailable.");
      } finally {
        setLoading(false);
      }
    }
    fetchLore();
  }, [animalName]);

  return (
    <div className="animate-slide-up" style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(10, 26, 15, 0.95)', backdropFilter: 'blur(10px)',
      zIndex: 300, overflowY: 'auto', padding: '24px'
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: '24px', right: '24px', 
        background: 'rgba(255,255,255,0.1)', color: 'white', 
        width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem'
      }}>✕</button>

      <div style={{ marginTop: '48px', maxWidth: '600px', margin: '48px auto 0 auto' }}>
        <h1 style={{ fontSize: '3rem', color: 'var(--accent-main)', marginBottom: '8px' }}>{animalName.toUpperCase()}</h1>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-body)', fontWeight: 'normal', marginBottom: '32px' }}>
          {species}
        </h2>

        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--accent-amber)', fontSize: '1.5rem', marginBottom: '16px' }}>WILDLIFE LORE</h3>
          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Deciphering ancient texts...</div>
          ) : (
            <p style={{ lineHeight: 1.6, color: 'var(--text-main)' }}>{lore}</p>
          )}
        </div>
      </div>
    </div>
  );
}
