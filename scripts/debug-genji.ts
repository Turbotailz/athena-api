import * as cheerio from 'cheerio';

const url = 'https://overwatch.fandom.com/wiki/Genji';

async function main() {
    console.log(`Fetching ${url}...`);
    const res = await fetch(url, { headers: { 'User-Agent': 'AthenaAPI/1.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);

    console.log('Finding perks...');
    $('.ability-details').each((i, el) => {
        const name = $(el).find('.header').first().text().trim();
        const typeText = $(el).find('.type-block').text().toLowerCase().trim();
        
        console.log(`\nPerk [${i}]: "${name}" (Type: "${typeText}")`);
        
        // Debug siblings traversal
        let prev = $(el).prev();
        let headerFound = null;
        let steps = 0;
        
        while (prev.length) {
            steps++;
            const tag = prev.prop('tagName').toLowerCase();
            const text = prev.text().trim().substring(0, 50); // truncated
            // console.log(`  Step ${steps}: <${tag}> "${text}"`);

            if (tag === 'h2' || tag === 'h3') {
                headerFound = prev.text().trim();
                console.log(`  -> Found Sibling Header: <${tag}> "${headerFound}"`);
                break;
            }
            prev = prev.prev();
        }
        
        if (!headerFound) {
             console.log('  -> No sibling header found.');
             let parent = $(el).parent();
             if (parent.length) {
                 console.log(`  Checking parent <${parent.prop('tagName').toLowerCase()}> siblings...`);
                 prev = parent.prev();
                 while (prev.length) {
                    const tag = prev.prop('tagName').toLowerCase();
                    if (tag === 'h2' || tag === 'h3') {
                        headerFound = prev.text().trim();
                        console.log(`  -> Found Parent Sibling Header: <${tag}> "${headerFound}"`);
                        break;
                    }
                    prev = prev.prev();
                 }
             }
        }

        if (headerFound && headerFound.toLowerCase().includes('removed')) {
            console.log('  STATUS: MARKED AS REMOVED');
        } else {
            console.log('  STATUS: KEPT');
        }
    });
}

main();

