import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');
const PUBLIC_DIR = path.join(__dirname, '../public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const OUT_FILE = path.join(__dirname, '../src/data/generated.ts');

// Ensure directories exist
await fs.mkdir(IMAGES_DIR, { recursive: true });

// Stat Key Normalization Mapping
const STAT_MAPPING: Record<string, string> = {
  'base_hp': 'base_hp',
  'Armor': 'Armor',
  'Shield': 'Shield',
  'max_ammo': 'max_ammo',
  'move_speed': 'move_speed',
  'attack_speed': 'attack_speed',
  'melee_damage': 'melee_damage',
  'reload_speed': 'reload_speed',
  'weapon_power': 'weapon_power',
  'ability_power': 'ability_power',
  'critical_damage': 'critical_damage',
  'weapon_lifesteal': 'weapon_lifesteal',
  'ability_lifesteal': 'ability_lifesteal',
  'cooldown_reduction': 'cooldown_reduction',
  // Legacy/Fallback mappings just in case raw data slips through
  'LIFE': 'base_hp',
  'armor': 'Armor',
  'shield': 'Shield',
  'Move Speed': 'move_speed',
  'Attack Speed': 'attack_speed'
};

interface Ability {
  name: string;
  description: string;
  icon_url: string | null;
}

interface Perk {
  name: string;
  type: 'minor' | 'major';
  description: string;
  icon_url: string | null;
}

interface HeroBio {
  real_name?: string;
  age?: string;
  nationality?: string;
  occupation?: string;
  base_of_operations?: string;
  affiliation?: string;
}

// Types based on JSON structure
interface RawHero {
  id: string;
  name: string;
  role: string;
  portrait_url: string | null;
  base_stats: Record<string, number>;
  stadium?: boolean; // Propagate
  abilities?: Ability[];
  perks?: Perk[];
  bio?: HeroBio;
  // ... other fields
}

interface RawItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  rarity: string;
  upgrade_type: string;
  is_universal: boolean;
  portrait_url: string | null;
  stat_changes: Record<string, number>;
  hero?: string; // Propagate
}

interface HeroItemLink {
  hero_id: string;
  item_id: string;
}

interface Patch {
  id: string;
  version: string; // "Patch: 2.19.1.0"
  release_date: string;
}

interface ProcessedHero extends Omit<RawHero, 'portrait_url' | 'raw_portrait_url' | 'base_stats'> {
  image_url: string | null;
  item_ids: string[];
  power_ids: string[];
  base_stats: Record<string, number>;
  stadium: boolean;
  abilities?: Ability[]; // Propagate
  perks?: Perk[]; // Propagate
  bio?: HeroBio; // Propagate
}

interface ProcessedItem extends Omit<RawItem, 'portrait_url' | 'raw_portrait_url' | 'stat_changes'> {
  image_url: string | null;
  stat_changes: Record<string, any>;
  hero?: string;
}

interface ProcessedPower extends ProcessedItem {
  // Powers are structurally similar but treated differently
}

const SLEEP_MS = 50;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeStats(stats: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(stats)) {
    // Direct lookup or fallback to lowercase lookup
    const newKey = STAT_MAPPING[key] || STAT_MAPPING[key.toLowerCase()] || key;
    normalized[newKey] = value;
  }
  return normalized;
}

async function downloadImage(url: string, filename: string): Promise<string | null> {
  if (!url) return null;
  const filePath = path.join(IMAGES_DIR, filename);
  
  // Return relative path for API
  const publicPath = `/images/${filename}`;

  try {
    // Check if exists
    await fs.access(filePath);
    return publicPath; // Skip if exists
  } catch {
    // Download
    console.log(`Downloading ${url}...`);
    // Add small delay to be polite
    await sleep(SLEEP_MS);
    
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'AthenaAPI/1.0 (+https://github.com/Turbotailz/athena-api)'
        }
      });
      
      if (res.status === 429) {
        console.warn('Rate limited! Waiting 5s...');
        await sleep(5000);
        // Simple retry once
        const retry = await fetch(url, {
           headers: { 'User-Agent': 'AthenaAPI/1.0' }
        });
        if (!retry.ok) throw new Error(`Failed to fetch ${url} (retry): ${retry.statusText}`);
        const buffer = await retry.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(buffer));
        return publicPath;
      }

      if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
      const buffer = await res.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(buffer));
      return publicPath;
    } catch (e) {
      console.error(`Error downloading ${url}:`, e);
      return null;
    }
  }
}

async function getVersion(patchesPath: string): Promise<string> {
  try {
    const content = await fs.readFile(patchesPath, 'utf-8');
    const patches = JSON.parse(content) as Patch[];
    if (patches.length === 0) return '1.0.0';

    // Sort by date or trust first? Assuming first is latest based on sample.
    const latest = patches[0];
    
    // Format: "Patch: 2.19.1.0"
    const match = latest.version.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)/);
    if (match) {
      const [_, major, minor, patch] = match;
      // Convert to SemVer: Major.Minor.Patch
      return `${major}.${minor}.${patch}`;
    }
    return '1.0.0';
  } catch (e) {
    console.warn('Could not read patches.json, defaulting to 1.0.0');
    return '1.0.0';
  }
}

async function updatePackageVersion(version: string) {
  const pkgPath = path.join(__dirname, '../package.json');
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
  
  if (pkg.version !== version) {
    console.log(`Updating package version: ${pkg.version} -> ${version}`);
    pkg.version = version;
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}

async function main() {
  console.log('Reading data files...');
  
  // Read from the Normalized "Source of Truth" in data/
  // The normalization script (scripts/normalize-data.ts) handles merging raw/manual/scraped data
  // so this script can focus purely on generating the runtime DB.
  
  const heroesRaw = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'heroes.json'), 'utf-8')) as RawHero[];
  const itemsRaw = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'items.json'), 'utf-8')) as RawItem[];
  
  // Determine Version
  const version = await getVersion(path.join(DATA_DIR, 'patches.json'));
  await updatePackageVersion(version);

  const heroesMap = new Map<string, ProcessedHero>();
  const itemsMap = new Map<string, ProcessedItem>();
  const powersMap = new Map<string, ProcessedPower>();
  
  // Get Base URL for images
  // Ideally passed via env var or config. Defaulting to relative path for now which works if served from same domain
  const ASSET_BASE_URL = process.env.ASSET_BASE_URL || ''; 

  // 1. Process Items and Powers
  console.log(`Processing ${itemsRaw.length} entries...`);
  for (const entry of itemsRaw) {
    // ID is already a slug from normalization
    const newId = entry.id; 
    
    let imagePath: string | null = null;
    if (entry.portrait_url) {
      const ext = path.extname(entry.portrait_url) || '.png';
      // Use different prefix if you want, but sticking to existing pattern for cache hits is simpler
      // or we can differentiate: item- vs power-
      // For now, let's keep filename consistent with previous runs to avoid re-downloading everything if slug is same
      const prefix = entry.rarity === 'power' ? 'item' : 'item'; // Keeping 'item' prefix to reuse cached images
      const filename = `${prefix}-${newId}${ext}`;
      
      // Download if needed (only if url starts with http)
      if (entry.portrait_url.startsWith('http')) {
          await downloadImage(entry.portrait_url, filename);
      }
      
      // Set public path (absolute or relative based on config)
      imagePath = `${ASSET_BASE_URL}/images/${filename}`;
    }

    // Strip external URLs & Normalize Stats
    const { portrait_url, raw_portrait_url, stat_changes, ...cleanEntry } = entry as any;
    const processedEntry = {
      ...cleanEntry,
      id: newId,
      image_url: imagePath, 
      stat_changes: normalizeStats(stat_changes || {}),
      is_universal: entry.is_universal ?? false
    };

    if (entry.rarity === 'power') {
      powersMap.set(newId, processedEntry);
    } else {
      itemsMap.set(newId, processedEntry);
    }
  }

  // 2. Process Heroes
  console.log(`Processing ${heroesRaw.length} heroes...`);
  for (const hero of heroesRaw) {
    const newId = hero.id; // Already slug

    let imagePath: string | null = null;
    if (hero.portrait_url) {
      const ext = path.extname(hero.portrait_url) || '.webp';
      const filename = `hero-${newId}${ext}`;
      
      if (hero.portrait_url.startsWith('http')) {
          await downloadImage(hero.portrait_url, filename);
      }
      imagePath = `${ASSET_BASE_URL}/images/${filename}`;
    }

    // Process Perks images
    const processedPerks: Perk[] = [];
    if (hero.perks) {
        for (const perk of hero.perks) {
            let perkIcon: string | null = null;
            if (perk.icon_url) {
                const ext = path.extname(perk.icon_url.split('?')[0]) || '.png';
                // Sanitize perk name for filename
                const safeName = perk.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const filename = `perk-${newId}-${safeName}${ext}`;
                if (perk.icon_url.startsWith('http')) {
                    const downloadedPath = await downloadImage(perk.icon_url, filename);
                    if (downloadedPath) {
                        perkIcon = `${ASSET_BASE_URL}${downloadedPath}`;
                    }
                } else {
                     // For manual overrides or non-http paths, preserve the original value
                     perkIcon = perk.icon_url;
                }
            }
            processedPerks.push({ ...perk, icon_url: perkIcon });
        }
    }

    // Find linked items/powers (Reverse lookup since items now have `hero` field)
    // Let's populate `item_ids` for convenience in the static DB.
    
    const linkedItemIds: string[] = [];
    const linkedPowerIds: string[] = [];

    // Iterate all items to find ones belonging to this hero
    // (Optimization: could pre-group items by hero, but 20k items is fine for build script)
    
    for (const item of itemsMap.values()) {
        if (item.hero === newId) linkedItemIds.push(item.id);
    }
    for (const power of powersMap.values()) {
        if (power.hero === newId) linkedPowerIds.push(power.id);
    }

    // Strip external URLs & Normalize Stats
    const { portrait_url, raw_portrait_url, base_stats, ...cleanHero } = hero as any;

    heroesMap.set(newId, {
      ...cleanHero,
      id: newId,
      image_url: imagePath, 
      item_ids: linkedItemIds,
      power_ids: linkedPowerIds,
      base_stats: normalizeStats(base_stats || {}),
      abilities: hero.abilities || [],
      perks: processedPerks,
      bio: hero.bio
    });
  }

  // Generate Output
  const outputData = {
    version: version,
    stat_definitions: STAT_MAPPING,
    heroes: Array.from(heroesMap.values()),
    items: Array.from(itemsMap.values()),
    powers: Array.from(powersMap.values())
  };

  const typesContent = `
// This file is auto-generated. Do not edit manually.

export const STAT_DEFINITIONS = ${JSON.stringify(STAT_MAPPING, null, 2)} as const;

export type StatKey = keyof typeof STAT_DEFINITIONS | string;

export interface Ability {
  name: string;
  description: string;
  icon_url: string | null;
}

export interface Perk {
  name: string;
  type: 'minor' | 'major';
  description: string;
  icon_url: string | null;
}

export interface HeroBio {
  real_name?: string;
  age?: string;
  nationality?: string;
  occupation?: string;
  base_of_operations?: string;
  affiliation?: string;
}

export interface Hero {
  id: string;
  name: string;
  role: string;
  image_url: string | null;
  base_stats: Record<string, number>;
  item_ids: string[];
  power_ids: string[];
  stadium: boolean;
  abilities?: Ability[];
  perks?: Perk[];
  bio?: HeroBio;
  [key: string]: any;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  cost: number;
  rarity: string;
  upgrade_type: string;
  is_universal: boolean;
  image_url: string | null;
  stat_changes: Record<string, any>;
  hero?: string;
  [key: string]: any;
}

export interface Power {
  id: string;
  name: string;
  description: string;
  // Powers don't usually have cost/rarity in the same way, but keeping fields if present
  cost: number;
  rarity: 'power';
  upgrade_type: string;
  is_universal: boolean;
  image_url: string | null;
  stat_changes: Record<string, any>;
  hero?: string;
  [key: string]: any;
}
`;

  const dataContent = `
// This file is auto-generated. Do not edit manually.
import type { Hero, Item, Power } from './types.js';
import { STAT_DEFINITIONS } from './types.js';

export const DATA: { 
  version: string; 
  stat_definitions: typeof STAT_DEFINITIONS;
  heroes: Hero[]; 
  items: Item[];
  powers: Power[];
} = ${JSON.stringify(outputData, null, 2)} as const;
`;

  // Ensure src/data exists
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  
  await fs.writeFile(path.join(__dirname, '../src/data/types.ts'), typesContent);
  await fs.writeFile(path.join(__dirname, '../src/data/db.ts'), dataContent);
  
  console.log(`Written data to src/data/db.ts and src/data/types.ts`);
}

main().catch(console.error);
