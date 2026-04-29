import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export const getStreakMultiplier = (streak) => {
  if (streak >= 365) return 3.0;
  if (streak >= 100) return 2.0;
  if (streak >= 60) return 1.75;
  if (streak >= 30) return 1.5;
  if (streak >= 14) return 1.2;
  if (streak >= 7) return 1.1;
  return 1.0;
};

export const getMasteryLevel = (count) => {
  if (count >= 25) return { level: 5, name: 'LEGENDARY MASTER', badge: '🌈' };
  if (count >= 10) return { level: 4, name: 'MASTER', badge: '💎' };
  if (count >= 5) return { level: 3, name: 'STUDIED', badge: '🥇' };
  if (count >= 3) return { level: 2, name: 'FAMILIAR', badge: '🥈' };
  if (count >= 1) return { level: 1, name: 'SIGHTED', badge: '🥉' };
  return { level: 0, name: 'UNSEEN', badge: '' };
};

export const useGameState = () => {
  const [captures, setCaptures] = useState([]);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [shields, setShields] = useState(0);
  const [lastCaptureDate, setLastCaptureDate] = useState(null);
  const [conservationPoints, setConservationPoints] = useState(0);
  const [mastery, setMastery] = useState({});
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUserId(session.user.id);

        // Fetch User Profile
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setXp(profileData.xp || 0);
          setLevel(profileData.level || 1);
          setUsername(profileData.username);
          setAvatarUrl(profileData.avatar_url);
          
          // Streak Logic Check
          let currentStreak = profileData.streak || 0;
          let currentShields = profileData.shields || 0;
          const lastDate = profileData.last_capture_date ? new Date(profileData.last_capture_date) : null;
          setLastCaptureDate(lastDate);
          setConservationPoints(profileData.conservation_points || 0);
          setMaxStreak(profileData.max_streak || 0);

          if (lastDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const last = new Date(lastDate);
            last.setHours(0, 0, 0, 0);
            const diffTime = Math.abs(today - last);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays > 1) {
              // Missed a day. Use shield if available
              let daysMissed = diffDays - 1;
              if (currentShields >= daysMissed) {
                currentShields -= daysMissed;
                // Streak maintained via shields
              } else {
                currentStreak = 0; // Streak broken
              }
            }
          }
          
          setStreak(currentStreak);
          setShields(currentShields);

          // Update profile if streak broke
          if (currentStreak !== profileData.streak || currentShields !== profileData.shields) {
             await supabase.from('users').update({ streak: currentStreak, shields: currentShields }).eq('id', session.user.id);
          }
        }

        // Fetch User Captures
        const { data: captureData } = await supabase
          .from('captures')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (captureData) {
          const mappedCaptures = captureData.map((c) => ({
            id: c.id,
            animal: c.animal_name,
            species: c.species,
            rarity: c.rarity,
            points: c.points_awarded,
            date: new Date(c.created_at).getTime(),
            image: c.image_url,
            fun_fact: c.fun_fact,
            lat: c.lat,
            lng: c.lng,
            location_name: c.location_name,
            behavior: c.behavior,
            behavior_multiplier: c.behavior_multiplier,
            weather_code: c.weather_code,
            weather_bonus: c.weather_bonus,
            city_region: c.city_region,
            stats: {
              speed: c.stat_speed,
              stealth: c.stat_stealth,
              aggression: c.stat_aggression
            }
          }));
          setCaptures(mappedCaptures);
        }

        // Fetch Mastery
        const { data: masteryData } = await supabase
          .from('mastery')
          .select('*')
          .eq('user_id', session.user.id);
          
        if (masteryData) {
          const mObj = {};
          masteryData.forEach(m => {
            mObj[m.species] = m.capture_count;
          });
          setMastery(mObj);
        }
      }
      setLoading(false);
    };

    fetchGameData();
  }, []);

  const addCapture = async (captureData, weatherData = null) => {
    if (!userId) return;

    const species = captureData.species;
    const isFirstOfSpecies = !captures.some(c => c.species === species);
    
    // Base Points
    let base = captureData.points_base || 50;
    
    // Multipliers
    let multiplier = 1.0;
    
    // 1. First time bonus
    if (isFirstOfSpecies) multiplier *= 2.0;
    
    // 2. Streak bonus
    multiplier *= getStreakMultiplier(streak);
    
    // 3. Behavior bonus
    if (captureData.behavior_multiplier) {
       multiplier *= captureData.behavior_multiplier;
    }

    // 4. Weather bonus
    let weatherBonus = 1.0;
    let weatherCode = null;
    if (weatherData) {
       weatherCode = weatherData.weatherCode;
       // Example logic for weather bonus (can be expanded)
       if (weatherCode >= 51 && weatherCode <= 82 && captureData.animal.toLowerCase().includes('frog')) weatherBonus = 2.5;
       if (weatherCode >= 95 && weatherCode <= 99) weatherBonus = 2.0; // Thunderstorm
       multiplier *= weatherBonus;
    }

    // 5. Mastery bonus
    const currentMasteryCount = mastery[species] || 0;
    const masteryObj = getMasteryLevel(currentMasteryCount);
    if (masteryObj.level > 0) {
      multiplier *= (1 + (masteryObj.level * 0.1));
    }

    const finalPoints = Math.floor(base * multiplier);

    // Endangerment Check (mock list of endangered keywords)
    const isEndangered = ['tiger', 'leopard', 'gorilla', 'panda', 'rhino', 'elephant', 'turtle', 'pangolin'].some(k => captureData.animal.toLowerCase().includes(k));
    const newConservationPoints = isEndangered ? conservationPoints + 1 : conservationPoints;

    // Update Streak
    let newStreak = streak;
    let newShields = shields;
    let newMaxStreak = maxStreak;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = lastCaptureDate ? new Date(lastCaptureDate) : null;
    if (lastDate) lastDate.setHours(0,0,0,0);

    if (!lastDate || today > lastDate) {
      newStreak += 1;
      if (newStreak % 7 === 0 && newShields < 3) {
        newShields += 1; // Earn a shield every 7 days
      }
      if (newStreak > newMaxStreak) newMaxStreak = newStreak;
    }
    
    // Save to Captures DB
    const insertData = {
      user_id: userId,
      animal_name: captureData.animal,
      species: species,
      rarity: captureData.rarity,
      points_awarded: finalPoints,
      fun_fact: captureData.fun_fact,
      image_url: captureData.image,
      stat_speed: captureData.stat_speed || Math.floor(Math.random() * 100),
      stat_stealth: captureData.stat_stealth || Math.floor(Math.random() * 100),
      stat_aggression: captureData.stat_aggression || Math.floor(Math.random() * 100),
      lat: captureData.lat || null,
      lng: captureData.lng || null,
      location_name: captureData.location_name || 'Location Unknown',
      city_region: captureData.city_region || 'Unknown Region',
      behavior: captureData.behavior,
      behavior_multiplier: captureData.behavior_multiplier || 1.0,
      weather_code: weatherCode,
      weather_bonus: weatherBonus,
      streak_day: newStreak,
      is_endangered: isEndangered
    };

    const { data: insertedCapture, error } = await supabase
      .from('captures')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("Error saving capture", error);
      throw new Error("Failed to save capture");
    }

    // Update Mastery DB
    const newMasteryCount = currentMasteryCount + 1;
    await supabase.from('mastery').upsert({
       user_id: userId,
       species: species,
       capture_count: newMasteryCount,
       last_captured_at: new Date().toISOString()
    }, { onConflict: 'user_id, species' });
    
    setMastery(prev => ({...prev, [species]: newMasteryCount}));

    const newCapture = {
      id: insertedCapture.id,
      animal: insertedCapture.animal_name,
      species: insertedCapture.species,
      rarity: insertedCapture.rarity,
      points: insertedCapture.points_awarded,
      date: new Date(insertedCapture.created_at).getTime(),
      image: insertedCapture.image_url,
      fun_fact: insertedCapture.fun_fact,
      lat: insertedCapture.lat,
      lng: insertedCapture.lng,
      location_name: insertedCapture.location_name,
      city_region: insertedCapture.city_region,
      behavior: insertedCapture.behavior,
      behavior_multiplier: insertedCapture.behavior_multiplier,
      weather_code: insertedCapture.weather_code,
      weather_bonus: insertedCapture.weather_bonus,
      stats: {
        speed: insertedCapture.stat_speed,
        stealth: insertedCapture.stat_stealth,
        aggression: insertedCapture.stat_aggression
      }
    };

    setCaptures([newCapture, ...captures]);

    const newXp = xp + finalPoints;
    setXp(newXp);
    
    const newLevel = Math.floor(newXp / 500) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
    }

    setStreak(newStreak);
    setShields(newShields);
    setMaxStreak(newMaxStreak);
    setLastCaptureDate(new Date());
    setConservationPoints(newConservationPoints);

    // Update Profile
    await supabase.from('users').update({ 
      xp: newXp, 
      level: newLevel,
      streak: newStreak,
      shields: newShields,
      max_streak: newMaxStreak,
      last_capture_date: new Date().toISOString(),
      conservation_points: newConservationPoints
    }).eq('id', userId);
    
    return { ...newCapture, isFirstOfSpecies, levelUp: newLevel > level, newMasteryLevel: getMasteryLevel(newMasteryCount).level > masteryObj.level, behaviorMultiplier: captureData.behavior_multiplier };
  };

  return {
    captures,
    xp,
    level,
    streak,
    maxStreak,
    shields,
    lastCaptureDate,
    conservationPoints,
    mastery,
    username,
    avatarUrl,
    loading,
    addCapture,
    userId
  };
};
