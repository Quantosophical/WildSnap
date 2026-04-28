import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { base64Data } = await req.json()
    const NIM_API_KEY = Deno.env.get('NIM_API_KEY')

    if (!NIM_API_KEY) throw new Error("NIM_API_KEY is not set in environment")

    const prompt = `You are the WildSnap animal identification engine. When given an image, 
respond ONLY with a JSON object — no markdown, no explanation, 
no backticks — with exactly these fields:

{
  "detected": true/false,
  "is_animal": true/false,
  "animal": "Common name",
  "species": "Scientific name",
  "rarity": "Common|Uncommon|Rare|Epic|Legendary",
  "confidence": 0-100,
  "zoo_detected": true/false,
  "zoo_reason": "explanation if zoo/enclosure detected, else empty string",
  "screen_detected": true/false,
  "screen_reason": "explanation if animal is on a screen or in media, else empty string",
  "rejection_reason": "explanation if not a real animal, else empty string",
  "fun_fact": "one short fascinating fact about this animal, empty string if not an animal",
  "points_base": number,
  "stat_speed": "number 1-100 representing physical speed/agility",
  "stat_stealth": "number 1-100 representing camouflage/stealth ability",
  "stat_aggression": "number 1-100 representing fighting/predatory aggression"
}

DETECTION RULES — follow these strictly:

is_animal must be FALSE for:
- Humans or any part of a human body
- Plants, trees, flowers, fungi
- Food, drinks, packaged goods
- Objects, furniture, vehicles, buildings, signs
- Landscapes, sky, water, terrain with no visible animal
- Artwork, illustrations, cartoons, drawings of animals

is_animal must be TRUE for:
- Any real living creature from kingdom Animalia
- Mammals, birds, reptiles, amphibians, fish, insects, 
  arachnids, crustaceans, mollusks, worms — all count

screen_detected must be TRUE if the animal (real or illustrated) 
is being shown on:
- Any electronic screen (TV, monitor, laptop, phone, tablet, 
  digital billboard, projector)
- Any printed photograph, poster, painting, book, magazine, 
  newspaper, greeting card
- Any framed picture or wall art

zoo_detected must be TRUE if you see:
- Metal bars, wire mesh, glass enclosures
- Zoo signage, name placards, habitat labels
- Artificial rock formations in enclosures
- Crowds of tourists observing an animal
- Concrete or obviously artificial flooring/habitat

detected must be FALSE if any of these are true:
- is_animal is false
- screen_detected is true
- zoo_detected is true
- confidence is below 40

Rarity guide based on IUCN status + how rarely photographed in wild:
- Common: squirrels, pigeons, dogs, cats, sparrows = 10-25pts
- Uncommon: deer, foxes, owls, raccoons = 50pts  
- Rare: eagles, wolves, dolphins, sea turtles = 75-100pts
- Epic: leopards, great white sharks, gorillas = 200pts
- Legendary: snow leopards, pangolins, okapis, 
  Amur tigers = 500pts`

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NIM_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.2-11b-vision-instruct',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: [ { type: 'text', text: prompt }, { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Data}` } } ] }
        ]
      })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || "Failed to fetch from NIM")

    let jsonStr = data.choices[0].message.content
    if (jsonStr.includes('```json')) jsonStr = jsonStr.split('```json')[1].split('```')[0]
    else if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].split('```')[0]

    return new Response(jsonStr.trim(), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})