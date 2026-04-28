# 🚀 The Ultimate Beginner's Guide to Setting Up Supabase for WILDSNAP

Don't worry if you've never done this before! This guide is written specifically for you. Follow every single step exactly as written, in order, and you will not run into any errors.

---

## STEP 1: Create Your Free Supabase Account

1. Go to [https://supabase.com](https://supabase.com) in your web browser.
2. Click **"Start your project"** and sign in (you can use your GitHub account or Email).
3. Once logged in, click the green **"New Project"** button.
4. Fill out the details:
   - **Name:** `WildSnap`
   - **Database Password:** Make up a strong password and **save it somewhere safe**. You won't need it for this code, but it's important.
   - **Region:** Pick the one closest to you.
5. Click **"Create new project"**. 
*(Note: It will take about 2-3 minutes for Supabase to finish setting up your database. Wait for it to finish before moving to Step 2).*

---

## STEP 2: Get Your Secret Keys

Now that your project is ready, we need to connect your local code to your new database.

1. On the left-hand menu of your Supabase dashboard, look for the **gear icon ⚙️ (Project Settings)** at the very bottom and click it.
2. In the settings menu, click on **API**.
3. You will see two important URLs/Keys here:
   - **Project URL:** Looks like `https://abcdefghijklmnop.supabase.co`
   - **Project API Keys (anon / public):** A very long string of letters and numbers.

4. Go to your code editor (VS Code) where the `pokemon_idea` folder is open.
5. Create a new file directly in the `pokemon_idea` folder and name it exactly: `.env`
6. Inside that `.env` file, paste this EXACT text, but replace the fake values with your real URL and Anon Key from Supabase:

```env
VITE_SUPABASE_URL=https://your-actual-url-here.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR...your-actual-long-key-here...
```
*(Save the file).*

---

## STEP 3: Setup the Database Tables

We need to tell the database where to store Users and their Captures.

1. Go back to your Supabase Dashboard in your browser.
2. On the left-hand menu, click on the **SQL Editor** (it looks like a little window with `</>` in it).
3. Click the **"New query"** button.
4. Copy the ENTIRE block of SQL code below:

```sql
-- Create users table
CREATE TABLE public.users (
  id uuid references auth.users not null primary key,
  username text unique not null,
  avatar_url text,
  xp bigint default 0,
  level int default 1,
  streak int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create captures table
CREATE TABLE public.captures (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  animal_name text not null,
  species text not null,
  rarity text not null,
  points_awarded int not null,
  fun_fact text,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captures ENABLE ROW LEVEL SECURITY;

-- Allow reading
CREATE POLICY "Public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public read captures" ON public.captures FOR SELECT USING (true);

-- Allow inserting and updating
CREATE POLICY "Users insert own captures" ON public.captures FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
```
5. Paste it into the SQL Editor box.
6. Click the green **"Run"** button in the bottom right corner. You should see a success message.

---

## STEP 4: Create Storage Buckets for Photos and Avatars

We need places to save the actual JPEG images when a user takes a photo or uploads a profile picture.

1. On the left-hand menu of Supabase, click on **Storage** (it looks like a little folder/box icon).
2. Click the **"New Bucket"** button.
3. Name the bucket EXACTLY: `captures`
4. **CRITICAL:** Toggle the switch that says **"Public bucket"** so it turns green.
5. Click **"Save"**.
6. Repeat steps 2-5, but this time name the bucket EXACTLY: `avatars`
7. Now, look for **"Policies"** in the Storage menu (under Configuration on the left).
8. Under your `captures` bucket, click **"New Policy"**.
9. Choose **"For Full Customization"**.
10. Give it a name like: `Allow inserts`
11. Check the box for `INSERT` under Allowed Operations.
12. Click **"Review"** and then **"Save policy"**.
13. Create one more policy, choose "For Full Customization", name it `Allow public read`.
14. Check the box for `SELECT`.
15. Under the "Target Roles" dropdown, select `public`.
16. Click **"Review"** and then **"Save policy"**.
17. **IMPORTANT: Repeat steps 8-16 for the `avatars` bucket** so users can upload and read profile pictures.

---

## STEP 5: Deploy the AI Security Proxy (Edge Function)

We don't want hackers to steal your NVIDIA API key, so we have to put it on a secure Supabase server.

Open your terminal in VS Code (make sure you are inside `C:\Users\basit\OneDrive\Desktop\pokemon_idea`).

Run these commands one by one, waiting for each to finish:

**Command 1: Install the Supabase tools to your computer**
```bash
npm install -g supabase
```

**Command 2: Log in to your Supabase account via terminal**
```bash
npx supabase login
```
*(This will ask you to generate a token. Follow the link it provides in your browser, click "Generate Token", copy it, and paste it back into your terminal).*

**Command 3: Connect your terminal to your project**
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```
*(Replace `YOUR_PROJECT_REF` with the 20-character code found in your Supabase Project URL. Example: if your URL is `https://abcdefghijklmnop.supabase.co`, your ref is `abcdefghijklmnop`).*

**Command 4: Initialize the secure function**
```bash
npx supabase functions new identify-animal
```
*(This creates a folder in your project called `supabase/functions/identify-animal`).*

**Command 5: Add the secure code**
Open the file `supabase/functions/identify-animal/index.ts` in VS Code. Delete everything inside it, and paste this exactly:

```typescript
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
```
*(Save the file).*

**Command 6: Save your NVIDIA Key to Supabase securely**
Run this in the terminal, replacing `YOUR_NVIDIA_KEY` with your actual NIM API key:
```bash
npx supabase secrets set NIM_API_KEY=YOUR_NVIDIA_KEY
```

**Command 7: Push the secure function to the internet**
```bash
npx supabase functions deploy identify-animal
```

---

## 🎮 STEP 6: PLAY!

You are officially done. You just configured a production-grade backend!

To test everything:
1. Run `npm run dev` in your terminal.
2. Go to `http://localhost:5173`.
3. Register a brand new account with a username and password.
4. Take a picture of an animal. The game will now talk to your secure server, save the photo to your storage bucket, calculate your XP, and save it to your database permanently!
