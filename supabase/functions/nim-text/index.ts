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
    const { prompt, systemPrompt } = await req.json()
    const NIM_API_KEY = Deno.env.get('NIM_API_KEY')

    if (!NIM_API_KEY) throw new Error("NIM_API_KEY is not set in environment")

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NIM_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt || 'You are an AI assistant.' },
          { role: 'user', content: prompt }
        ]
      })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || "Failed to fetch from NIM")

    let textStr = data.choices[0].message.content

    return new Response(JSON.stringify({ text: textStr }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
    })
  }
})
