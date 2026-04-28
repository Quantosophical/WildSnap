import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export const useGameState = () => {
  const [captures, setCaptures] = useState([]);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Fetch User Profile
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setXp(profileData.xp);
          setLevel(profileData.level);
          setStreak(profileData.streak);
          setUsername(profileData.username);
          setAvatarUrl(profileData.avatar_url);
        }

        // Fetch User Captures
        const { data: captureData } = await supabase
          .from('captures')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (captureData) {
          // Map to match old state format
          const mappedCaptures = captureData.map(c => ({
            id: c.id,
            animal: c.animal_name,
            species: c.species,
            rarity: c.rarity,
            points: c.points_awarded,
            date: new Date(c.created_at).getTime(),
            image: c.image_url,
            fun_fact: c.fun_fact
          }));
          setCaptures(mappedCaptures);
        }
      }
      setLoading(false);
    };

    fetchGameData();
  }, []);

  const addCapture = async (captureData) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const isFirstOfSpecies = !captures.some(c => c.species === captureData.species);
    let finalPoints = captureData.points_base;
    
    if (isFirstOfSpecies) finalPoints *= 2;
    if (streak >= 3) finalPoints = Math.floor(finalPoints * 1.5);

    // Save to DB
    const { data: insertedCapture, error } = await supabase
      .from('captures')
      .insert([{
        user_id: session.user.id,
        animal_name: captureData.animal,
        species: captureData.species,
        rarity: captureData.rarity,
        points_awarded: finalPoints,
        fun_fact: captureData.fun_fact,
        image_url: captureData.image
      }])
      .select()
      .single();

    if (error) {
      console.error("Error saving capture", error);
      throw new Error("Failed to save capture");
    }

    const newCapture = {
      id: insertedCapture.id,
      animal: insertedCapture.animal_name,
      species: insertedCapture.species,
      rarity: insertedCapture.rarity,
      points: insertedCapture.points_awarded,
      date: new Date(insertedCapture.created_at).getTime(),
      image: insertedCapture.image_url,
      fun_fact: insertedCapture.fun_fact
    };

    setCaptures([newCapture, ...captures]);

    const newXp = xp + finalPoints;
    setXp(newXp);
    
    const newLevel = Math.floor(newXp / 500) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
    }

    // Update Profile
    await supabase.from('users').update({ xp: newXp, level: newLevel }).eq('id', session.user.id);
    
    return { ...newCapture, isFirstOfSpecies, levelUp: newLevel > level };
  };

  return {
    captures,
    xp,
    level,
    streak,
    username,
    avatarUrl,
    loading,
    addCapture
  };
};
