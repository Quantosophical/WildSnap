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

    const prompt = `You are the WildSnap animal identification engine. When given an image, respond ONLY with a JSON object (no markdown, no explanation) with these fields:
{
  "detected": true/false,
  "animal": "Common name",
  "species": "Scientific name",
  "rarity": "Common|Uncommon|Rare|Epic|Legendary",
  "confidence": 0-100,
  "zoo_detected": true/false,
  "zoo_reason": "explanation if zoo detected",
  "fun_fact": "one short fascinating fact about this animal",
  "points_base": number
}
Rarity rules: base on IUCN conservation status + how commonly photographed in wild.
Zoo detection: look for cage bars, glass enclosures, zoo signage, artificial habitats, name placards, concrete/fake rock enclosures, crowds of tourists.
If no animal detected, return detected: false.`

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