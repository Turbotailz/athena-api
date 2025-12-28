import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data/raw');

const HEROES_URL = 'https://overwatch.blizzard.com/en-us/heroes/';

interface BlizzardHero {
    id: string; // generated UUID or just slug? Let's use slug as ID for now to match process-data logic or generate a placeholder UUID
    name: string;
    role: string;
    portrait_url: string | null;
    // Blizzard data doesn't provide these stats on the listing page
    base_stats: Record<string, number>; 
    enabled: boolean;
    release_date: string | null;
}

// Minimal stats for heroes without data
const EMPTY_STATS = {
    "LIFE": 0,
    "Armor": 0,
    "Shield": 0,
    "Max Ammo": 0,
    "Move Speed": 0,
    "Attack Speed": 0,
    "Melee Damage": 0,
    "Reload Speed": 0,
    "Weapon Power": 0,
    "Ability Power": 0,
    "Critical Damage": 0,
    "Weapon Lifesteal": 0,
    "Ability Lifesteal": 0,
    "Cooldown Reduction": 0
};

async function main() {
    console.log(`Fetching heroes from ${HEROES_URL}...`);
    
    const res = await fetch(HEROES_URL);
    if (!res.ok) throw new Error(`Failed to fetch ${HEROES_URL}: ${res.statusText}`);
    
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const heroes: BlizzardHero[] = [];
    
    // Select all hero card links
    $('a[slot="gallery-items"]').each((_, el) => {
        const $el = $(el);
        const role = $el.attr('data-role'); // "tank", "damage", "support"
        const href = $el.attr('href'); // "/heroes/ana"
        const name = $el.find('h2[slot="heading"]').text().trim();
        const portraitUrl = $el.find('blz-image.heroCardPortrait').attr('src');
        
        if (name && role) {
            // Capitalize role
            const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);
            
            // Create a pseudo-ID or leave it to process-data to handle
            // The current heroes.json uses UUIDs. process-data maps UUID -> Slug.
            // If we use the slug as the ID here, process-data needs to handle that.
            // process-data: uuidToSlug.set(hero.id, slug);
            // So if ID is already a slug, it works if we ensure uniqueness.
            // Let's generate a deterministic UUID or just use a placeholder pattern?
            // Actually, process-data expects `id` to be the key.
            // Let's just use the name or slug as ID for now, and handle it in process-data.
            // But wait, process-data does: const newId = uuidToSlug.get(hero.id)!;
            // It expects `id` to be in `uuidToSlug`.
            // So we can just use the slug as the ID.
            
            heroes.push({
                id: name.toLowerCase().replace(/[\s\W]+/g, '-'), // "soldier-76"
                name: name,
                role: formattedRole,
                portrait_url: portraitUrl || null,
                base_stats: { ...EMPTY_STATS },
                enabled: true,
                release_date: null
            });
        }
    });
    
    console.log(`Found ${heroes.length} heroes.`);
    
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, 'blizzard-heroes.json'), JSON.stringify(heroes, null, 4));
    console.log('Saved to data/raw/blizzard-heroes.json');
}

main().catch(console.error);

