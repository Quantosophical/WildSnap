import { useContext } from 'react';
import { supabase } from '../supabaseClient';
import { AppContext } from '../context/AppContext';
import { base64ToBlob } from '../features/capture/captureLogic';

export function useCapture() {
  const { user, dispatch } = useContext(AppContext);

  const getRarityMultiplier = (rarity) => {
    switch(rarity?.toLowerCase()) {
      case 'common': return 1.0;
      case 'uncommon': return 1.5;
      case 'rare': return 2.0;
      case 'epic': return 3.0;
      case 'legendary': return 5.0;
      default: return 1.0;
    }
  };

  const saveCapture = async (base64Image, result, location = { lat: 0, lng: 0, name: 'Unknown' }) => {
    if (!user) throw new Error("User not logged in");

    // 1. Calculate points
    const rarityMultiplier = getRarityMultiplier(result.rarity);
    // basic streak multiplier: +5% per day, max 2.0
    const streakMultiplier = Math.min(2.0, 1 + (user.current_streak * 0.05));
    const weatherBonus = 1.0; // Todo: fetch weather
    
    // Note: Add clan perk logic if applicable later
    const finalPoints = Math.round(
      (result.points_base || 10) * 
      rarityMultiplier * 
      (result.behavior_multiplier || 1.0) * 
      streakMultiplier * 
      weatherBonus
    );

    // 2. Upload to storage
    const fileName = `${user.id}/${Date.now()}.jpg`;
    const blob = base64ToBlob(base64Image, 'image/jpeg');
    const { error: uploadError } = await supabase.storage
      .from('captures')
      .upload(fileName, blob);

    let photoUrl = null;
    if (!uploadError) {
      photoUrl = supabase.storage.from('captures').getPublicUrl(fileName).data.publicUrl;
    } else {
      console.error("Image upload failed, proceeding without photo_url", uploadError);
    }

    // 3. Insert capture record
    const { error: captureError } = await supabase.from('captures').insert({
      user_id: user.id,
      animal_name: result.animal,
      species: result.species,
      rarity: result.rarity,
      behavior: result.behavior || 'unknown',
      behavior_multiplier: result.behavior_multiplier || 1.0,
      points_earned: finalPoints,
      photo_url: photoUrl,
      lat: location.lat,
      lng: location.lng,
      location_name: location.name,
      weather_code: null,
      weather_bonus: weatherBonus
    });

    if (captureError) throw captureError;

    // 4. Update user stats
    const today = new Date().toISOString().split('T')[0];
    let newStreak = user.current_streak;
    let newBestStreak = user.best_streak;
    
    // Simple streak logic (could be moved to updateStreak utility)
    if (user.last_capture_date !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (user.last_capture_date === yesterday) {
        newStreak += 1;
      } else {
        newStreak = 1; // Reset
      }
      newBestStreak = Math.max(newStreak, user.best_streak);
    }

    const { error: userError } = await supabase.from('users').update({
      total_points: user.total_points + finalPoints,
      total_captures: user.total_captures + 1,
      xp: user.xp + finalPoints,
      last_capture_date: today,
      current_streak: newStreak,
      best_streak: newBestStreak
    }).eq('id', user.id);

    if (userError) throw userError;

    // Refresh user context
    const { data: updatedUser } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (updatedUser) dispatch({ type: 'UPDATE_USER', payload: updatedUser });

    // TODO: updateFriendshipStreaks, handleWarCapture, updateMissionProgress, checkBadges

    return finalPoints;
  };

  return { saveCapture };
}
