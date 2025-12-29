import * as cheerio from 'cheerio';

export interface PlayerSummary {
  name: string;
  url: string; // The ID part
  avatar: string;
  title: string;
  isPublic: boolean;
}

export interface HeroStats {
  hero: string;
  stats: Record<string, string>;
}

export interface TopHeroStats {
  category: string;
  stats: {
    hero: string;
    value: string;
  }[];
}

export interface PlayerStats {
  summary: {
    name: string;
    title: string;
    endorsementLevel: string;
    masteryLevel?: string;
  };
  quickPlay: {
    topHeroes: TopHeroStats[];
    careerStats: Record<string, Record<string, string>>; // Hero -> { Stat -> Value }
  };
  competitive: {
    topHeroes: TopHeroStats[];
    careerStats: Record<string, Record<string, string>>;
  };
}

export async function searchPlayers(name: string): Promise<PlayerSummary[]> {
  const url = `https://overwatch.blizzard.com/en-gb/search/account-by-name/${encodeURIComponent(name)}/`;
  const res = await fetch(url, {
      headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AthenaAPI/1.0; +https://github.com/Turbotailz/athena-api)'
      }
  });
  
  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  // Transform to our interface
  return (data as any[]).map(p => ({
    name: p.name,
    url: p.url, // This is the ID part e.g. "c64...|767..."
    avatar: p.avatar,
    title: p.title?.en_US || p.title?.en_GB || 'Player',
    isPublic: p.isPublic
  }));
}

export function parseProfile(html: string): PlayerStats {
  const $ = cheerio.load(html);

  const getSummary = () => {
    return {
      name: $('.Profile-playerHeader .Profile-playerHandle').text().trim(),
      title: $('.Profile-playerHeader .Profile-playerTitle').text().trim(),
      endorsementLevel: $('.Profile-playerSummary .Profile-playerSummary--endorsement').text().trim(),
      // rank could be scraped here too
    };
  };

  const getStats = (viewClass: string) => {
    const view = $(`.${viewClass}`);
    if (!view.length) return { topHeroes: [], careerStats: {} };

    // 1. Top Heroes
    const topHeroes: TopHeroStats[] = [];
    const categories: Record<string, string> = {};

    // Map category IDs to names
    view.find('select.topheroes-dropdown option').each((_, el) => {
      const val = $(el).attr('value');
      const text = $(el).text().trim();
      if (val) categories[val] = text;
    });

    // Iterate over progress bar containers
    view.find('.Profile-progressBars').each((_, container) => {
      const categoryId = $(container).attr('data-category-id');
      const categoryName = categoryId ? categories[categoryId] : undefined;

      if (categoryName) {
        const stats: { hero: string; value: string }[] = [];
        $(container).find('.Profile-progressBar').each((_, bar) => {
          const hero = $(bar).find('.Profile-progressBar-title').text().trim();
          const val = $(bar).find('.Profile-progressBar-description').text().trim();
          if (hero) stats.push({ hero, value: val });
        });

        if (stats.length > 0) {
          topHeroes.push({
            category: categoryName,
            stats
          });
        }
      }
    });

    // 2. Career Stats
    const careerStats: Record<string, Record<string, string>> = {};
    const dropdown = view.find('select.stats-dropdown');
    
    dropdown.find('option').each((_, opt) => {
      const heroName = $(opt).text().trim();
      const val = $(opt).attr('value');
      const container = view.find(`.stats-container.option-${val}`);
      
      if (container.length) {
        const heroStatMap: Record<string, string> = {};
        container.find('.stat-item').each((_, item) => {
           const name = $(item).find('.name').text().trim();
           const value = $(item).find('.value').text().trim();
           if (name) heroStatMap[name] = value;
        });
        careerStats[heroName] = heroStatMap;
      }
    });

    return { topHeroes, careerStats };
  };

  return {
    summary: getSummary(),
    quickPlay: getStats('quickPlay-view'),
    competitive: getStats('competitive-view'),
  };
}

export async function getPlayerStats(playerId: string): Promise<PlayerStats | null> {
    // Construct URL
    // playerId is like "c64bbe88bc659aa4e5ea3aa1d506a108|7672a560b2985cb9deec233bb7663c74"
    // URL: https://overwatch.blizzard.com/en-gb/career/{playerId}/
    const url = `https://overwatch.blizzard.com/en-gb/career/${playerId}/`;
    
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AthenaAPI/1.0; +https://github.com/Turbotailz/athena-api)'
        }
    });

    if (!res.ok) return null;

    const html = await res.text();
    return parseProfile(html);
}

