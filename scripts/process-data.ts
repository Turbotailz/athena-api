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
  'LIFE': 'base_hp',
  'Armor': 'armor',
  'Shield': 'shield',
  'Max Ammo': 'max_ammo',
  'Move Speed': 'move_speed',
  'Attack Speed': 'attack_speed',
  'Melee Damage': 'melee_damage',
  'Reload Speed': 'reload_speed',
  'Weapon Power': 'weapon_power',
  'Ability Power': 'ability_power',
  'Critical Damage': 'critical_damage',
  'Weapon Lifesteal': 'weapon_lifesteal',
  'Ability Lifesteal': 'ability_lifesteal',
  'Cooldown Reduction': 'cooldown_reduction'
};

// Types based on JSON structure
interface RawHero {
  id: string;
  name: string;
  role: string;
  portrait_url: string | null;
  base_stats: Record<string, number>;
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
  hero_id?: string; // Potential field if specific to hero in some files
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
}

interface ProcessedItem extends Omit<RawItem, 'portrait_url' | 'raw_portrait_url' | 'stat_changes'> {
  image_url: string | null;
  stat_changes: Record<string, any>;
  hero_id?: string;
}

interface ProcessedPower extends ProcessedItem {
  // Powers are structurally similar but treated differently
}

const SLEEP_MS = 50;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
}

function normalizeStats(stats: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(stats)) {
    const newKey = STAT_MAPPING[key] || slugify(key).replace(/-/g, '_');
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
          'User-Agent': 'OverwatchHeroAPI/1.0 (+https://github.com/Turbotailz/overwatch-hero-api)'
        }
      });
      
      if (res.status === 429) {
        console.warn('Rate limited! Waiting 5s...');
        await sleep(5000);
        // Simple retry once
        const retry = await fetch(url, {
           headers: { 'User-Agent': 'OverwatchHeroAPI/1.0' }
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
  
  const heroesRaw = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'heroes.json'), 'utf-8')) as RawHero[];
  const itemsRaw = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'items-by-locale.json'), 'utf-8')) as RawItem[];
  // heroes-items.json might link them
  const heroItemsLink = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'heroes-items.json'), 'utf-8')) as HeroItemLink[];

  // Determine Version
  const version = await getVersion(path.join(DATA_DIR, 'patches.json'));
  await updatePackageVersion(version);

  const heroesMap = new Map<string, ProcessedHero>();
  const itemsMap = new Map<string, ProcessedItem>();
  const powersMap = new Map<string, ProcessedPower>();
  const uuidToSlug = new Map<string, string>();

  // 1. First pass: Generate Slugs
  console.log('Generating slugs...');
  
  for (const hero of heroesRaw) {
    const slug = slugify(hero.name);
    uuidToSlug.set(hero.id, slug);
  }

  for (const item of itemsRaw) {
    let slug = slugify(item.name);
    let counter = 1;
    const originalSlug = slug;
    while (Array.from(uuidToSlug.values()).includes(slug)) {
       slug = `${originalSlug}-${counter}`;
       counter++;
    }
    uuidToSlug.set(item.id, slug);
  }

  // 2. Process Items and Powers
  console.log(`Processing ${itemsRaw.length} entries...`);
  for (const entry of itemsRaw) {
    const newId = uuidToSlug.get(entry.id)!;
    
    let imagePath = null;
    if (entry.portrait_url) {
      const ext = path.extname(entry.portrait_url) || '.png';
      // Use different prefix if you want, but sticking to existing pattern for cache hits is simpler
      // or we can differentiate: item- vs power-
      // For now, let's keep filename consistent with previous runs to avoid re-downloading everything if slug is same
      const prefix = entry.rarity === 'power' ? 'item' : 'item'; // Keeping 'item' prefix to reuse cached images
      const filename = `${prefix}-${newId}${ext}`;
      imagePath = (await downloadImage(entry.portrait_url, filename)) || null;
    }

    // Strip external URLs & Normalize Stats
    const { portrait_url, raw_portrait_url, stat_changes, ...cleanEntry } = entry as any;
    const processedEntry = {
      ...cleanEntry,
      id: newId,
      image_url: imagePath, 
      stat_changes: normalizeStats(stat_changes || {})
    };

    if (entry.rarity === 'power') {
      powersMap.set(newId, processedEntry);
    } else {
      itemsMap.set(newId, processedEntry);
    }
  }

  // 3. Process Heroes
  console.log(`Processing ${heroesRaw.length} heroes...`);
  for (const hero of heroesRaw) {
    const newId = uuidToSlug.get(hero.id)!;

    let imagePath = null;
    if (hero.portrait_url) {
      const ext = path.extname(hero.portrait_url) || '.webp';
      const filename = `hero-${newId}${ext}`;
      imagePath = (await downloadImage(hero.portrait_url, filename)) || null;
    }

    // Find linked items/powers and translate their IDs
    const linkedIds = heroItemsLink
      .filter(link => link.hero_id === hero.id)
      .map(link => uuidToSlug.get(link.item_id))
      .filter((id): id is string => !!id);

    const linkedItemIds: string[] = [];
    const linkedPowerIds: string[] = [];

    for (const id of linkedIds) {
      if (itemsMap.has(id)) {
        linkedItemIds.push(id);
        // Link item back to hero
        const item = itemsMap.get(id);
        if (item) item.hero_id = newId;
      } else if (powersMap.has(id)) {
        linkedPowerIds.push(id);
        // Link power back to hero
        const power = powersMap.get(id);
        if (power) power.hero_id = newId;
      }
    }

    // Strip external URLs & Normalize Stats
    const { portrait_url, raw_portrait_url, base_stats, ...cleanHero } = hero as any;

    heroesMap.set(newId, {
      ...cleanHero,
      id: newId,
      image_url: imagePath, 
      item_ids: linkedItemIds,
      power_ids: linkedPowerIds,
      base_stats: normalizeStats(base_stats || {})
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

export interface Hero {
  id: string;
  name: string;
  role: string;
  image_url: string | null;
  base_stats: Record<string, number>;
  item_ids: string[];
  power_ids: string[];
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
  hero_id?: string;
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
  hero_id?: string;
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
