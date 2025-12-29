import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const RAW_DIR = path.join(ROOT_DIR, 'data/raw');

const BASE_URL = 'https://overwatch.blizzard.com/en-us/heroes';

interface Hero {
    id: string;
    name: string;
    // ...
}

interface Ability {
    name: string;
    description: string;
    icon_url: string | null;
}

interface HeroDetails {
    id: string; // slug
    abilities: Ability[];
}

async function fetchHtml(url: string): Promise<string | null> {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.warn(`Failed to fetch ${url}: ${res.status}`);
            return null;
        }
        return await res.text();
    } catch (e) {
        console.error(`Error fetching ${url}:`, e);
        return null;
    }
}

async function main() {
    console.log('Reading heroes list...');
    const heroesPath = path.join(DATA_DIR, 'heroes.json');
    const heroes = JSON.parse(await fs.readFile(heroesPath, 'utf-8')) as Hero[];

    const details: HeroDetails[] = [];

    for (const hero of heroes) {
        // Blizzard URLs use specific slugs. Usually hero.id (which is a slug) works, 
        // but need to handle special cases like "soldier-76", "dva" (d-va?), "lucio" (l-cio?).
        // Let's assume our slugs are close enough or try to map them.
        // Our slugs: "soldier-76", "dva", "lucio", "wrecking-ball".
        // Blizzard URLs: /heroes/soldier-76/, /heroes/dva/, /heroes/lucio/, /heroes/wrecking-ball/
        // Seems compatible.
        
        // Special case check:
        // D.Va -> dva
        // Lúcio -> lucio
        // Torbjörn -> torbjorn
        // Junker Queen -> junker-queen
        
        let urlSlug = hero.id;
        
        // Manual override for special characters
        if (hero.name === 'Lúcio') urlSlug = 'lucio';
        if (hero.name === 'Torbjörn') urlSlug = 'torbjorn';
        
        const url = `${BASE_URL}/${urlSlug}/`;
        console.log(`Scraping ${hero.name} (${url})...`);
        
        const html = await fetchHtml(url);
        if (!html) continue;

        const $ = cheerio.load(html);
        const abilities: Ability[] = [];

        // Select abilities from the carousel
        // Structure based on hanzo.html:
        // <blz-feature slot="slide" variant="center">
        //   <h3 slot="heading">Name</h3>
        //   <p slot="description">Desc</p>
        //   ... icon is in the tab controls usually? 
        // The tab controls have <blz-tab-control> with <blz-image slot="icon" src="...">
        
        // Let's grab names and descriptions first.
        $('blz-feature[slot="slide"]').each((i, el) => {
            const name = $(el).find('h3[slot="heading"]').text().trim();
            const description = $(el).find('p[slot="description"]').text().trim();
            
            // Find icon. The slides correspond to tab controls by index usually.
            // <blz-tab-controls> has children <blz-tab-control>
            const iconUrl = $('blz-tab-controls blz-tab-control').eq(i).find('blz-image[slot="icon"]').attr('src') || null;

            if (name) {
                abilities.push({
                    name,
                    description,
                    icon_url: iconUrl
                });
            }
        });

        console.log(`  Found ${abilities.length} abilities.`);
        details.push({
            id: hero.id,
            abilities
        });
        
        // Polite delay
        await new Promise(r => setTimeout(r, 100));
    }

    await fs.writeFile(path.join(RAW_DIR, 'blizzard-hero-details.json'), JSON.stringify(details, null, 4));
    console.log(`Saved details for ${details.length} heroes.`);
}

main().catch(console.error);

