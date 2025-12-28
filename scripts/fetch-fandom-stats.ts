import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const RAW_DIR = path.join(ROOT_DIR, 'data/raw');

const BASE_URL = 'https://overwatch.fandom.com/wiki';

interface Perk {
    name: string;
    type: 'minor' | 'major';
    description: string;
    icon_url: string | null;
}

interface HeroStats {
    id: string; // slug
    base_hp?: number;
    armor?: number;
    shield?: number;
    real_name?: string;
    age?: string;
    nationality?: string;
    occupation?: string;
    base_of_operations?: string;
    affiliation?: string;
    perks?: Perk[];
}

// Basic sleep to be polite
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchHtml(url: string): Promise<string | null> {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
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
    const heroes = JSON.parse(await fs.readFile(heroesPath, 'utf-8'));

    const statsList: HeroStats[] = [];

    for (const hero of heroes) {
        let wikiName = hero.name.replace(/ /g, '_');
        
        // Special cases
        if (hero.id === 'dva') wikiName = 'D.Va';
        if (hero.id === 'lucio') wikiName = 'Lúcio';
        if (hero.id === 'torbjorn') wikiName = 'Torbjörn';
        if (hero.id === 'soldier-76') wikiName = 'Soldier:_76';
        if (hero.id === 'wrecking-ball') wikiName = 'Wrecking_Ball';
        if (hero.id === 'junker-queen') wikiName = 'Junker_Queen';

        const url = `${BASE_URL}/${wikiName}`;
        console.log(`Scraping data for ${hero.name} from ${url}...`);

        const html = await fetchHtml(url);
        if (!html) continue;

        const $ = cheerio.load(html);
        
        // --- 1. Stats & Bio ---
        
        const getSource = (source: string) => {
            let el = $(`[data-source="${source}"] div.pi-data-value`);
            if (!el.length && source.includes('_')) {
                el = $(`[data-source="${source.replace(/_/g, '')}"] div.pi-data-value`);
            }
            if (el.length) {
                el.find('sup').remove();
                el.find('br').replaceWith(', ');
                return el.text().trim();
            }
            return undefined;
        };
        
        const getInt = (source: string) => {
            const text = getSource(source);
            if (text) {
                const roleMatch = text.match(/(\d+)\s*\(Role queue\)/i);
                if (roleMatch) return parseInt(roleMatch[1], 10);
                const match = text.match(/(\d+)/);
                if (match) return parseInt(match[1], 10);
            }
            return 0;
        };

        const hp = getInt('health');
        const armor = getInt('armor');
        const shield = getInt('shield');
        
        const stats: Partial<HeroStats> = {
            id: hero.id,
            base_hp: hp > 0 ? hp : undefined,
            armor: armor > 0 ? armor : undefined,
            shield: shield > 0 ? shield : undefined,
            real_name: getSource('real_name') || getSource('realname'),
            age: getSource('age'),
            nationality: getSource('nationality'),
            occupation: getSource('occupation'),
            base_of_operations: getSource('base_of_operations') || getSource('baseofoperations'),
            affiliation: getSource('affiliation'),
        };

        // --- 2. Perks ---
        
        const perks: Perk[] = [];
        const minorPerks: Perk[] = [];
        const majorPerks: Perk[] = [];

        $('.ability-details').each((i, el) => {
            // Check if inside removed section
            let isRemoved = false;
            let headerFound = false;
            
            // 1. Check siblings (walking backwards)
            let prev = $(el).prev();
            while (prev.length) {
                if (prev.is('h2') || prev.is('h3')) {
                    headerFound = true;
                    if (prev.text().toLowerCase().includes('removed')) {
                        isRemoved = true;
                    }
                    break;
                }
                prev = prev.prev();
            }
            
            // 2. Check parent siblings if not found (nested structure)
            if (!headerFound) {
                let parent = $(el).parent();
                if (parent.length) {
                    prev = parent.prev();
                    while (prev.length) {
                        if (prev.is('h2') || prev.is('h3')) {
                            headerFound = true;
                            if (prev.text().toLowerCase().includes('removed')) {
                                isRemoved = true;
                            }
                            break;
                        }
                        prev = prev.prev();
                    }
                }
            }
            
            if (isRemoved) return;

            const typeText = $(el).find('.type-block').text().toLowerCase();
            let type: 'minor' | 'major' | null = null;
            if (typeText.includes('minor perk')) type = 'minor';
            else if (typeText.includes('major perk')) type = 'major';

            if (type) {
                // Use .text() instead of .contents().filter() to be robust against wrapped names (e.g. links/bold)
                const name = $(el).find('.header').first().text().trim();
                const description = $(el).find('.summary-description').text().trim();
                const imgEl = $(el).find('.ability-icon img');
                let icon_url = imgEl.attr('data-src') || imgEl.attr('src') || null;

                // Handle lazy loading where src is a data URI
                if (icon_url && icon_url.startsWith('data:')) {
                    const dataSrc = imgEl.attr('data-src');
                    if (dataSrc) icon_url = dataSrc;
                }

                if (name) {
                    const perk = { name, type, description, icon_url };
                    if (type === 'minor') minorPerks.push(perk);
                    if (type === 'major') majorPerks.push(perk);
                }
            }
        });
        
        // Enforce limits (2 of each)
        // We assume the first ones found are the active ones, as "Removed" usually comes later or is filtered.
        if (minorPerks.length > 2) {
            console.warn(`  Warning: Found ${minorPerks.length} minor perks for ${hero.name}. Truncating to 2.`);
            minorPerks.splice(2);
        }
        if (majorPerks.length > 2) {
            console.warn(`  Warning: Found ${majorPerks.length} major perks for ${hero.name}. Truncating to 2.`);
            majorPerks.splice(2);
        }

        perks.push(...minorPerks, ...majorPerks);
        
        if (perks.length > 0) {
            stats.perks = perks;
            console.log(`  Found ${perks.length} perks (${minorPerks.length} minor, ${majorPerks.length} major).`);
        }

        statsList.push(stats as HeroStats);
        
        await sleep(100);
    }

    await fs.writeFile(path.join(RAW_DIR, 'fandom-stats.json'), JSON.stringify(statsList, null, 4));
    console.log(`Saved extended stats for ${statsList.length} heroes.`);
}

main().catch(console.error);
