import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const RAW_DIR = path.join(ROOT_DIR, 'data/raw');

// Helpers
function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')         
    .replace(/[\u0300-\u036f]/g, '') 
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     
    .replace(/[^\w\-]+/g, '') 
    .replace(/\-\-+/g, '-')   
    .replace(/^-+/, '')       
    .replace(/-+$/, '');      
}

const STAT_KEY_MAPPING: Record<string, string> = {
    'LIFE': 'base_hp',
    'base_hp': 'base_hp',
    'armor': 'Armor',
    'Armor': 'Armor',
    'shield': 'Shield',
    'Shield': 'Shield',
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

function normalizeStatKeys(stats: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    for (const [key, value] of Object.entries(stats)) {
        const newKey = STAT_KEY_MAPPING[key] || STAT_KEY_MAPPING[key.toLowerCase()] || key;
        normalized[newKey] = value;
    }
    return normalized;
}

async function ensureDir() {
    await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(filePath: string): Promise<T | null> {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data) as T;
    } catch {
        return null;
    }
}

async function writeJson(filePath: string, data: any) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 4));
}

// Types
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

interface HeroStats extends HeroBio {
    id: string; // slug
    base_hp?: number;
    armor?: number;
    shield?: number;
    perks?: Perk[];
}

interface Hero {
  id: string;
  name: string;
  role: string;
  portrait_url: string | null;
  base_stats: Record<string, number>;
  stadium: boolean;
  abilities?: Ability[];
  perks?: Perk[];
  bio?: HeroBio;
  [key: string]: any;
}

interface Item {
  id: string;
  name: string;
  stat_changes?: Record<string, any>;
  [key: string]: any;
}

interface HeroItemLink {
  hero_id: string;
  item_id: string;
}

function mergeHeroes(
    stadium: Hero[], 
    blizzard: Hero[], 
    details: { id: string, abilities: Ability[] }[], 
    fandomStats: HeroStats[], 
    manual: Hero[] = []
): { heroes: Hero[], uuidToSlug: Map<string, string> } {
    const heroMap = new Map<string, Hero>();
    const uuidToSlug = new Map<string, string>(); 
    const abilitiesMap = new Map<string, Ability[]>();
    const statsMap = new Map<string, HeroStats>();

    // Index details & stats
    for (const d of details) abilitiesMap.set(d.id, d.abilities);
    for (const s of fandomStats) statsMap.set(s.id, s);

    // 1. Start with Stadium data
    for (const h of stadium) {
        const slug = slugify(h.name);
        uuidToSlug.set(h.id, slug); 
        
        const { created_at, transaction_locale, has_translation, fallback_used, enabled, release_date, ...cleanHero } = h;
        
        // Get extra stats/bio
        const extraStats = statsMap.get(slug);
        const bio: HeroBio | undefined = extraStats ? {
            real_name: extraStats.real_name,
            age: extraStats.age,
            nationality: extraStats.nationality,
            occupation: extraStats.occupation,
            base_of_operations: extraStats.base_of_operations,
            affiliation: extraStats.affiliation
        } : undefined;

        heroMap.set(slug, {
            ...cleanHero,
            id: slug,
            stadium: true,
            abilities: abilitiesMap.get(slug) || [],
            perks: extraStats?.perks || [],
            bio,
            base_stats: normalizeStatKeys(cleanHero.base_stats || {})
        });
    }

    // 2. Add Blizzard data
    let blizzardCount = 0;
    for (const h of blizzard) {
        const slug = slugify(h.name);
        const extraStats = statsMap.get(slug);
        
        const bio: HeroBio | undefined = extraStats ? {
            real_name: extraStats.real_name,
            age: extraStats.age,
            nationality: extraStats.nationality,
            occupation: extraStats.occupation,
            base_of_operations: extraStats.base_of_operations,
            affiliation: extraStats.affiliation
        } : undefined;

        if (!heroMap.has(slug)) {
            const { created_at, ...cleanHero } = h;
            
            const mergedStats: Record<string, number> = normalizeStatKeys(cleanHero.base_stats || {});
            
            if (extraStats) {
                if (extraStats.base_hp) mergedStats['base_hp'] = extraStats.base_hp;
                if (extraStats.armor) mergedStats['Armor'] = extraStats.armor;
                if (extraStats.shield) mergedStats['Shield'] = extraStats.shield;
            }

            heroMap.set(slug, {
                ...cleanHero,
                id: slug,
                stadium: false, 
                base_stats: mergedStats,
                abilities: abilitiesMap.get(slug) || [],
                perks: extraStats?.perks || [],
                bio
            });
            blizzardCount++;
        } else {
            // Merge extras into existing stadium hero
            const existing = heroMap.get(slug)!;
            const updates: Partial<Hero> = {};

            if (!existing.abilities || existing.abilities.length === 0) {
                const abilities = abilitiesMap.get(slug);
                if (abilities?.length) updates.abilities = abilities;
            }
            
            if ((!existing.perks || existing.perks.length === 0) && extraStats?.perks) {
                if (extraStats.perks.length > 0) updates.perks = extraStats.perks;
            }

            if (!existing.bio && bio) {
                updates.bio = bio;
            }

            if (Object.keys(updates).length > 0) {
                heroMap.set(slug, { ...existing, ...updates });
            }
        }
    }
    console.log(`Merged ${blizzardCount} heroes from Blizzard.`);

    // 3. Manual Overrides
    let manualCount = 0;
    for (const h of manual) {
        const slug = slugify(h.name);
        const normalizedOverride = {
            ...h,
            base_stats: h.base_stats ? normalizeStatKeys(h.base_stats) : undefined
        };

        if (heroMap.has(slug)) {
            const existing = heroMap.get(slug)!;
            heroMap.set(slug, { ...existing, ...normalizedOverride });
        } else {
            heroMap.set(slug, { 
                ...normalizedOverride, 
                id: slug, 
                stadium: false,
                abilities: h.abilities || abilitiesMap.get(slug) || [],
                perks: h.perks || extraStats?.perks || [],
                base_stats: normalizedOverride.base_stats || {}
            }); 
            manualCount++;
        }
    }
    console.log(`Applied ${manualCount} manual hero overrides.`);

    return { 
        heroes: Array.from(heroMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
        uuidToSlug
    };
}

function processItems(items: Item[], heroItemsLinks: HeroItemLink[], uuidToSlug: Map<string, string>): Item[] {
    const itemToHeroUuid = new Map<string, string>();
    for (const link of heroItemsLinks) {
        itemToHeroUuid.set(link.item_id, link.hero_id);
    }

    const processedItems: Item[] = [];
    const itemSlugSet = new Set<string>();

    for (const item of items) {
        const { is_universal, created_at, transaction_locale, has_translation, fallback_used, ...cleanItem } = item;
        
        let slug = slugify(item.name);
        let counter = 1;
        const originalSlug = slug;
        while (itemSlugSet.has(slug)) {
            slug = `${originalSlug}-${counter}`;
            counter++;
        }
        itemSlugSet.add(slug);

        let heroSlug = undefined;
        const heroUuid = itemToHeroUuid.get(item.id); 
        if (heroUuid) {
            heroSlug = uuidToSlug.get(heroUuid);
        }

        processedItems.push({
            ...cleanItem,
            id: slug,
            hero: heroSlug,
            stat_changes: item.stat_changes ? normalizeStatKeys(item.stat_changes) : {}
        });
    }
    
    return processedItems;
}

async function main() {
    await ensureDir();
    console.log('Normalizing data...');

    const stadiumHeroes = await readJson<Hero[]>(path.join(RAW_DIR, 'stadium-heroes.json')) || [];
    const blizzardHeroes = await readJson<Hero[]>(path.join(RAW_DIR, 'blizzard-heroes.json')) || [];
    const blizzardDetails = await readJson<{ id: string, abilities: Ability[] }[]>(path.join(RAW_DIR, 'blizzard-hero-details.json')) || [];
    const fandomStats = await readJson<HeroStats[]>(path.join(RAW_DIR, 'fandom-stats.json')) || [];
    const manualHeroes = await readJson<Hero[]>(path.join(DATA_DIR, 'heroes-manual.json')) || [];
    const heroItemsLinks = await readJson<HeroItemLink[]>(path.join(RAW_DIR, 'stadium-heroes-items.json')) || [];
    
    const { heroes: mergedHeroes, uuidToSlug } = mergeHeroes(stadiumHeroes, blizzardHeroes, blizzardDetails, fandomStats, manualHeroes);
    
    await writeJson(path.join(DATA_DIR, 'heroes.json'), mergedHeroes);
    console.log(`Saved ${mergedHeroes.length} heroes to data/heroes.json`);

    const stadiumItems = await readJson<Item[]>(path.join(RAW_DIR, 'stadium-items.json')) || [];
    const processedItems = processItems(stadiumItems, heroItemsLinks, uuidToSlug);
    
    await writeJson(path.join(DATA_DIR, 'items.json'), processedItems);
    console.log(`Saved ${processedItems.length} items to data/items.json`);

    const stadiumPatches = await readJson<any[]>(path.join(RAW_DIR, 'stadium-patches.json')) || [];
    await writeJson(path.join(DATA_DIR, 'patches.json'), stadiumPatches);
    
    console.log('Normalization complete.');
}

main().catch(console.error);
