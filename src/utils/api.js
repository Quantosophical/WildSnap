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

export const generateNimText = async (prompt, systemPrompt) => {
  try {
    const { data, error } = await supabase.functions.invoke('nim-text', {
      body: { prompt, systemPrompt }
    });

    if (error) {
      console.error("Function error:", error);
      throw new Error(`AI Engine Error: ${error.message || 'Unknown error'}`);
    }
    
    return data.text;
  } catch (error) {
    console.error("Text generation failed:", error);
    throw error;
  }
};

export const generateLore = async (animalName) => {
  const systemPrompt = "You are a wildlife lore generator. Provide a 200-word narrative about this animal's relationship with human civilization, mythology, cultural significance, and its ecological role. Poetic but factual. No markdown, just plain text.";
  const prompt = `Generate lore for: ${animalName}`;
  return await generateNimText(prompt, systemPrompt);
};

export const generateCaption = async (animalName, location, behavior) => {
  const systemPrompt = "You are a social media manager for a wildlife photographer. Write a one sentence, poetic caption referencing the location and behavior. No markdown, no emojis.";
  const prompt = `Animal: ${animalName}\nLocation: ${location}\nBehavior: ${behavior || 'resting'}`;
  return await generateNimText(prompt, systemPrompt);
};

export const generateImpactReport = async (captureDataStr) => {
  const systemPrompt = "You are a conservation impact reporter for WildSnap. Write a genuine, specific 3-sentence impact summary for a wildlife photographer based on their capture data. Be specific about species. Make them feel their contribution matters. Plain text only.";
  return await generateNimText(captureDataStr, systemPrompt);
};

export const generateEncyclopediaStats = async (animalName) => {
  const systemPrompt = "You are a wildlife API. Output ONLY raw JSON (no markdown). For the requested animal, provide: {\"scientific\": \"string\", \"class\": \"string\", \"order\": \"string\", \"family\": \"string\", \"iucn\": \"one of: Extinct, Critically Endangered, Endangered, Vulnerable, Near Threatened, Least Concern, Data Deficient\", \"population\": \"string estimate\", \"diet\": \"string\", \"lifespan\": \"string\", \"threats\": \"string\", \"migration\": \"string\", \"activity\": \"string\", \"facts\": [\"string\", \"string\", \"string\"]}";
  const prompt = animalName;
  const rawText = await generateNimText(prompt, systemPrompt);
  try {
     return JSON.parse(rawText);
  } catch (e) {
     // fallback parsing if the model includes markdown
     const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
     return JSON.parse(jsonStr);
  }
};
