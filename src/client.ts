import type { Hero, Item, Power } from './data/types.js';

export class OverwatchHeroClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://overwatch-hero-api.pages.dev') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async getMeta(): Promise<{ version: string; hero_count: number; item_count: number; power_count: number }> {
    const res = await fetch(`${this.baseUrl}/api/meta`);
    if (!res.ok) throw new Error('Failed to fetch meta');
    return res.json() as Promise<{ version: string; hero_count: number; item_count: number; power_count: number }>;
  }

  async getHeroes(role?: string): Promise<Hero[]> {
    const url = new URL(`${this.baseUrl}/api/heroes`);
    if (role) url.searchParams.append('role', role);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch heroes');
    return res.json() as Promise<Hero[]>;
  }

  async getHero(id: string, expand?: { items?: boolean; powers?: boolean }): Promise<Hero & { items?: Item[]; powers?: Power[] }> {
    const url = new URL(`${this.baseUrl}/api/heroes/${id}`);
    const expansions: string[] = [];
    if (expand?.items) expansions.push('items');
    if (expand?.powers) expansions.push('powers');
    
    if (expansions.length > 0) url.searchParams.append('expand', expansions.join(','));
    
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch hero');
    return res.json() as Promise<Hero & { items?: Item[]; powers?: Power[] }>;
  }

  async getItems(type?: string, rarity?: string): Promise<Item[]> {
    const url = new URL(`${this.baseUrl}/api/items`);
    if (type) url.searchParams.append('type', type);
    if (rarity) url.searchParams.append('rarity', rarity);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch items');
    return res.json() as Promise<Item[]>;
  }

  async getItem(id: string): Promise<Item> {
    const res = await fetch(`${this.baseUrl}/api/items/${id}`);
    if (!res.ok) throw new Error('Failed to fetch item');
    return res.json() as Promise<Item>;
  }

  async getPowers(type?: string): Promise<Power[]> {
    const url = new URL(`${this.baseUrl}/api/powers`);
    if (type) url.searchParams.append('type', type);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch powers');
    return res.json() as Promise<Power[]>;
  }

  async getPower(id: string): Promise<Power> {
    const res = await fetch(`${this.baseUrl}/api/powers/${id}`);
    if (!res.ok) throw new Error('Failed to fetch power');
    return res.json() as Promise<Power>;
  }
}
