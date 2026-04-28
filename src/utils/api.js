import { supabase } from './supabase';

export const identifyAnimal = async (base64Image) => {
  // Remove the data:image/jpeg;base64, prefix if present
  const base64Data = base64Image.split(',')[1] || base64Image;

  try {
    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('identify-animal', {
      body: { base64Data }
    });

    if (error) {
      console.error("Function error:", error);
      throw new Error(`AI Engine Error: ${error.message || 'Unknown error'}`);
    }
    
    // The Edge Function already parses the response and returns clean JSON
    return data;
  } catch (error) {
    console.error("Identification failed:", error);
    throw error;
  }
};
