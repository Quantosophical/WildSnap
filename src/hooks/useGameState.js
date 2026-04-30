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
  const [totalPoints, setTotalPoints] = useState(0);
  const [mastery, setMastery] = useState({});
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRecord, setUserRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  // Offline queue syncing
  useEffect(() => {
    const syncOfflineCaptures = async () => {
      if (navigator.onLine && userId) {
        const queue = JSON.parse(localStorage.getItem('captureQueue') || '[]');
        if (queue.length > 0) {
          console.log(`Syncing ${queue.length} offline captures...`);
          for (const item of queue) {
            try {
              const { error } = await supabase.from('captures').insert([item.insertData]);
              if (!error) {
                // If successful, update user stats appropriately (simplified for sync)
                await supabase.from('users').update({
                  xp: item.newXp,
                  level: item.newLevel,
                  current_streak: item.newStreak,
                  streak_shields: item.newShields,
                  best_streak: item.newMaxStreak,
                  last_capture_date: new Date().toISOString(),
                  total_points: item.newTotalPoints,
                  total_captures: item.newTotalCaptures
                }).eq('id', userId);
              }
            } catch (err) {
              console.error("Failed to sync capture", err);
            }
          }
          localStorage.removeItem('captureQueue');
        }
      }
    };

    window.addEventListener('online', syncOfflineCaptures);
    return () => window.removeEventListener('online', syncOfflineCaptures);
  }, [userId]);

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
          setUserRecord(profileData);
          setXp(profileData.xp || 0);
          setLevel(profileData.level || 1);
          setUsername(profileData.username);
          setAvatarUrl(profileData.avatar_url);
          
          let currentStreak = profileData.current_streak || 0;
          let currentShields = profileData.streak_shields || 0;
          const lastDate = profileData.last_capture_date ? new Date(profileData.last_capture_date) : null;
          setLastCaptureDate(lastDate);
          setTotalPoints(profileData.total_points || 0);
          setMaxStreak(profileData.best_streak || 0);

          if (lastDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const last = new Date(lastDate);
            last.setHours(0, 0, 0, 0);
            const diffTime = Math.abs(today - last);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays > 1) {
              let daysMissed = diffDays - 1;
              if (currentShields >= daysMissed) {
                currentShields -= daysMissed;
              } else {
                currentStreak = 0;
              }
            }
          }
          
          setStreak(currentStreak);
          setShields(currentShields);

          if (currentStreak !== profileData.current_streak || currentShields !== profileData.streak_shields) {
             await supabase.from('users').update({ current_streak: currentStreak, streak_shields: currentShields }).eq('id', session.user.id);
          }
        }

        // Fetch User Captures
        const { data: captureData } = await supabase
          .from('captures')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (captureData) {
          const mObj = {};
          const mappedCaptures = captureData.map((c) => {
            mObj[c.species] = (mObj[c.species] || 0) + 1;
            return {
              id: c.id,
              animal: c.animal_name,
              species: c.species,
              rarity: c.rarity,
              points: c.points_earned,
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
            };
          });
          setCaptures(mappedCaptures);
          setMastery(mObj);
        }
      }
      setLoading(false);
    };

    fetchGameData();
  }, []);

  const updateFriendshipStreaks = async () => {
    try {
      const startOfToday = new Date();
      startOfToday.setHours(0,0,0,0);
      
      const { data: friends } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'accepted');
        
      if (!friends) return;

      for (const friendship of friends) {
        const { data: friendCaptures } = await supabase
          .from('captures')
          .select('id')
          .eq('user_id', friendship.friend_id)
          .gte('created_at', startOfToday.toISOString())
          .limit(1);

        if (friendCaptures && friendCaptures.length > 0) {
           const yesterday = new Date(startOfToday);
           yesterday.setDate(yesterday.getDate() - 1);
           const lastMutualStr = friendship.last_mutual_date ? new Date(friendship.last_mutual_date).toDateString() : null;
           
           let newStreak = friendship.friendship_streak;
           if (lastMutualStr === yesterday.toDateString()) {
             newStreak += 1;
           } else if (lastMutualStr !== startOfToday.toDateString()) {
             newStreak = 1;
           }

           const newBest = Math.max(newStreak, friendship.best_friendship_streak);
           const todayStr = startOfToday.toISOString().split('T')[0];

           await supabase.from('friendships')
             .update({ friendship_streak: newStreak, best_friendship_streak: newBest, last_mutual_date: todayStr })
             .eq('user_id', userId)
             .eq('friend_id', friendship.friend_id);
             
           await supabase.from('friendships')
             .update({ friendship_streak: newStreak, best_friendship_streak: newBest, last_mutual_date: todayStr })
             .eq('user_id', friendship.friend_id)
             .eq('friend_id', userId);
        }
      }
    } catch (e) {
      console.error("Streak check error", e);
    }
  };

  const addCapture = async (captureData, weatherData = null) => {
    if (!userId) return;

    const species = captureData.species;
    const isFirstOfSpecies = !captures.some(c => c.species === species);
    let base = captureData.points_base || 50;
    let multiplier = 1.0;
    
    if (isFirstOfSpecies) multiplier *= 2.0;
    multiplier *= getStreakMultiplier(streak);
    if (captureData.behavior_multiplier) multiplier *= captureData.behavior_multiplier;

    let weatherBonus = 1.0;
    let weatherCode = null;
    if (weatherData) {
       weatherCode = weatherData.weatherCode;
       if (weatherCode >= 51 && weatherCode <= 82 && captureData.animal.toLowerCase().includes('frog')) weatherBonus = 2.5;
       if (weatherCode >= 95 && weatherCode <= 99) weatherBonus = 2.0; 
       multiplier *= weatherBonus;
    }

    const currentMasteryCount = mastery[species] || 0;
    const masteryObj = getMasteryLevel(currentMasteryCount);
    if (masteryObj.level > 0) {
      multiplier *= (1 + (masteryObj.level * 0.1));
    }

    const finalPoints = Math.floor(base * multiplier);
    const newTotalPoints = totalPoints + finalPoints;

    let newStreak = streak;
    let newShields = shields;
    let newMaxStreak = maxStreak;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = lastCaptureDate ? new Date(lastCaptureDate) : null;
    if (lastDate) lastDate.setHours(0,0,0,0);

    if (!lastDate || today > lastDate) {
      newStreak += 1;
      if (newStreak % 7 === 0 && newShields < 3) newShields += 1;
      if (newStreak > newMaxStreak) newMaxStreak = newStreak;
    }
    
    const insertData = {
      user_id: userId,
      animal_name: captureData.animal,
      species: species,
      rarity: captureData.rarity,
      points_earned: finalPoints,
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
      weather_bonus: weatherBonus
    };

    const newXp = xp + finalPoints;
    const newLevel = Math.floor(newXp / 500) + 1;
    const newTotalCaptures = captures.length + 1;

    if (!navigator.onLine) {
      // Offline mode
      const queue = JSON.parse(localStorage.getItem('captureQueue') || '[]');
      queue.push({ insertData, newXp, newLevel, newStreak, newShields, newMaxStreak, newTotalPoints, newTotalCaptures });
      localStorage.setItem('captureQueue', JSON.stringify(queue));
    } else {
      // Online mode
      const { data: insertedCapture, error } = await supabase
        .from('captures')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error("Error saving capture", error);
        throw new Error("Failed to save capture");
      }
      insertData.id = insertedCapture.id;
      insertData.created_at = insertedCapture.created_at;

      // Update Profile
      await supabase.from('users').update({ 
        xp: newXp, 
        level: newLevel,
        current_streak: newStreak,
        streak_shields: newShields,
        best_streak: newMaxStreak,
        last_capture_date: new Date().toISOString(),
        total_points: newTotalPoints,
        total_captures: newTotalCaptures
      }).eq('id', userId);

      updateFriendshipStreaks();
    }

    const newMasteryCount = currentMasteryCount + 1;
    setMastery(prev => ({...prev, [species]: newMasteryCount}));

    const newCaptureObj = {
      id: insertData.id || `temp-${Date.now()}`,
      animal: insertData.animal_name,
      species: insertData.species,
      rarity: insertData.rarity,
      points: insertData.points_earned,
      date: new Date().getTime(),
      image: insertData.image_url,
      fun_fact: insertData.fun_fact,
      lat: insertData.lat,
      lng: insertData.lng,
      location_name: insertData.location_name,
      city_region: insertData.city_region,
      behavior: insertData.behavior,
      behavior_multiplier: insertData.behavior_multiplier,
      weather_code: insertData.weather_code,
      weather_bonus: insertData.weather_bonus,
      stats: {
        speed: insertData.stat_speed,
        stealth: insertData.stat_stealth,
        aggression: insertData.stat_aggression
      }
    };

    setCaptures([newCaptureObj, ...captures]);
    setXp(newXp);
    if (newLevel > level) setLevel(newLevel);
    setStreak(newStreak);
    setShields(newShields);
    setMaxStreak(newMaxStreak);
    setLastCaptureDate(new Date());
    setTotalPoints(newTotalPoints);
    
    return { ...newCaptureObj, isFirstOfSpecies, levelUp: newLevel > level, newMasteryLevel: getMasteryLevel(newMasteryCount).level > masteryObj.level, behaviorMultiplier: captureData.behavior_multiplier };
  };

  return {
    captures,
    xp,
    level,
    streak,
    maxStreak,
    shields,
    lastCaptureDate,
    totalPoints,
    mastery,
    username,
    avatarUrl,
    loading,
    addCapture,
    userId,
    userRecord
  };
};
