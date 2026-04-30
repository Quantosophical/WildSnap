import { supabase } from '../../supabaseClient';

export const CAPTURE_SYSTEM_PROMPT = `
You are the WildSnap animal identification engine. Analyze the image and respond ONLY with a valid JSON object. No markdown. No code blocks. No explanation. Just the raw JSON object.

Required fields:
{
  "detected": boolean,
  "is_animal": boolean,
  "what_object": "describe what you see if not animal",
  "animal": "common name or empty string",
  "species": "scientific name or empty string",
  "rarity": "Common|Uncommon|Rare|Epic|Legendary",
  "confidence": 0-100,
  "zoo_detected": boolean,
  "zoo_reason": "explanation or empty string",
  "screen_detected": boolean,
  "screen_reason": "explanation or empty string",
  "rejection_reason": "explanation or empty string",
  "behavior": "hunting|feeding|sleeping|playing|fighting|mating_display|grooming|migrating|parenting|alert|swimming|flying|resting|unknown",
  "behavior_multiplier": 1.0,
  "behavior_description": "one sentence or empty string",
  "fun_fact": "one fascinating fact or empty string",
  "points_base": 10
}

is_animal = false for: humans, body parts, plants, food, objects, furniture, vehicles, buildings, landscapes, artwork, text, anything not a living animal.
is_animal = true for: any real living creature from kingdom Animalia — mammals, birds, reptiles, amphibians, fish, insects, arachnids, crustaceans, all count.
screen_detected = true if animal is shown on any screen (TV, phone, monitor, laptop) or in any printed media (photo, poster, book, magazine, painting).
zoo_detected = true if you see cage bars, glass enclosures, zoo signage, artificial habitats, name placards, or clearly captive conditions.
detected = false if: is_animal false OR screen_detected true OR zoo_detected true OR confidence < 40.

Rarity: Common=dogs,cats,pigeons,sparrows(10-25pts) | Uncommon=deer,foxes,owls(50pts) | Rare=eagles,wolves,dolphins(75-100pts) | Epic=leopards,gorillas,sharks(200pts) | Legendary=snow leopards,pangolins,okapis(500pts)

behavior_multiplier: unknown/resting=1.0 | feeding/alert/swimming/flying=1.2 | grooming/playing=1.5 | hunting/migrating/fighting=2.0 | parenting/mating_display=2.5
`;

export async function analyzeCapture(base64Image) {
  const nimApiKey = localStorage.getItem('NIM_API_KEY') || import.meta.env.VITE_NIM_API_KEY;
  
  try {
    let rawText = "";

    if (nimApiKey) {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${nimApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta/llama-3.2-11b-vision-instruct',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: CAPTURE_SYSTEM_PROMPT },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      rawText = data.choices[0].message.content;
    } else {
      // Fallback to Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('identify-animal', {
        body: { base64Image }
      });
      if (error) throw error;
      // Depending on how identify-animal returns it, adjust here. 
      // Assuming it returns { text: "..." } or the raw JSON object directly
      rawText = data.text || (typeof data === 'string' ? data : JSON.stringify(data));
    }

    // Strip markdown code blocks if present
    const cleaned = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch (parseError) {
      // If JSON parse fails, return a clean rejection
      return { 
        detected: false, 
        is_animal: false,
        rejection_reason: 'Could not analyze image. Try again.',
        error: false
      };
    }

    return result;
    
  } catch (networkError) {
    return {
      detected: false,
      is_animal: false,
      rejection_reason: 'Connection error. Check your internet.',
      error: true
    };
  }
}

export function base64ToBlob(base64, mimeType = 'image/jpeg') {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}
