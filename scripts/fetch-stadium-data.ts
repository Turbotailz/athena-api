import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data/raw');

// Configuration
// These are "anon" keys which are safe to be public (client-side), 
// but it is better practice to use environment variables.
const SUPABASE_URL = process.env.STADIUM_SUPABASE_URL || 'https://qkdvetofbsoynkfprlos.supabase.co';
const SUPABASE_KEY = process.env.STADIUM_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZHZldG9mYnNveW5rZnBybG9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3Mjc0NDEsImV4cCI6MjA2MTMwMzQ0MX0.Moy2MzlEQ0w1cqvnMs3qAV6Mzdm8R1v_YSo7Zw93mG8';

const HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

async function fetchJson(url: string, options: RequestInit = {}) {
  const res = await fetch(url, { ...options, headers: { ...HEADERS, ...options.headers } });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function main() {
  console.log('Fetching data from StadiumBuilds...');
  const startTime = performance.now();

  // Prepare all fetch promises
  console.log('Starting parallel fetches...');
  
  const tasks = [
    {
      name: 'patches',
      url: `${SUPABASE_URL}/rest/v1/patches?select=*&order=created_at.desc`,
      file: 'stadium-patches.json'
    },
    {
      name: 'heroes',
      url: `${SUPABASE_URL}/rest/v1/heroes?select=*,base_stats&enabled=eq.true&order=name.asc`,
      file: 'stadium-heroes.json'
    },
    {
      name: 'items',
      url: `${SUPABASE_URL}/rest/v1/rpc/get_items_by_locale`,
      options: { method: 'POST', body: JSON.stringify({ p_locale: 'en-GB' }) },
      file: 'stadium-items.json'
    },
    {
      name: 'hero-items',
      url: `${SUPABASE_URL}/rest/v1/hero_items?select=hero_id,item_id`,
      file: 'stadium-heroes-items.json'
    }
  ];

  try {
    const results = await Promise.all(
      tasks.map(async (task) => {
        console.log(`> Fetching ${task.name}...`);
        const data = await fetchJson(task.url, task.options);
        await fs.writeFile(path.join(DATA_DIR, task.file), JSON.stringify(data, null, 4));
        console.log(`✓ Saved ${task.name}`);
        return task.name;
      })
    );

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`Done! Updated ${results.length} files in ${duration}s.`);
    
  } catch (err) {
    console.error('Error fetching data:', err);
    process.exit(1);
  }
}

main().catch(console.error);
