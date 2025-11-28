import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { DATA } from '../../../src/data/db';

const app = new Hono().basePath('/api');

// Enable CORS
app.use('*', cors());

// Meta endpoint
app.get('/meta', (c) => {
  return c.json({
    version: DATA.version,
    hero_count: DATA.heroes.length,
    item_count: DATA.items.length,
    power_count: DATA.powers.length,
    last_updated: DATA.version,
    stat_definitions: DATA.stat_definitions
  });
});

// Heroes endpoints
app.get('/heroes', (c) => {
  const role = c.req.query('role');
  let heroes = DATA.heroes;
  
  if (role) {
    heroes = heroes.filter(h => h.role?.toLowerCase() === role.toLowerCase());
  }
  
  return c.json(heroes);
});

app.get('/heroes/:id', (c) => {
  const id = c.req.param('id');
  const hero = DATA.heroes.find(h => h.id === id);
  
  if (!hero) {
    return c.json({ error: 'Hero not found' }, 404);
  }
  
  const expand = c.req.query('expand'); // e.g. "items,powers"
  const expansions = expand ? expand.split(',') : [];
  
  let result: any = { ...hero };
  
  if (expansions.includes('items')) {
    result.items = hero.item_ids
      .map(itemId => DATA.items.find(i => i.id === itemId))
      .filter(Boolean);
  }

  if (expansions.includes('powers')) {
    result.powers = hero.power_ids
      .map(powerId => DATA.powers.find(p => p.id === powerId))
      .filter(Boolean);
  }
  
  return c.json(result);
});

// Items endpoints
app.get('/items', (c) => {
  const type = c.req.query('type');
  const rarity = c.req.query('rarity');
  let items = DATA.items;
  
  if (type) {
    items = items.filter(i => i.upgrade_type?.toLowerCase() === type.toLowerCase());
  }
  if (rarity) {
    items = items.filter(i => i.rarity?.toLowerCase() === rarity.toLowerCase());
  }
  
  return c.json(items);
});

app.get('/items/:id', (c) => {
  const id = c.req.param('id');
  const item = DATA.items.find(i => i.id === id);
  
  if (!item) {
    return c.json({ error: 'Item not found' }, 404);
  }
  
  return c.json(item);
});

// Powers endpoints
app.get('/powers', (c) => {
  const type = c.req.query('type');
  let powers = DATA.powers;
  
  if (type) {
    powers = powers.filter(p => p.upgrade_type?.toLowerCase() === type.toLowerCase());
  }
  
  return c.json(powers);
});

app.get('/powers/:id', (c) => {
  const id = c.req.param('id');
  const power = DATA.powers.find(p => p.id === id);
  
  if (!power) {
    return c.json({ error: 'Power not found' }, 404);
  }
  
  return c.json(power);
});

// Nitro/Nuxt H3 Handler
export default eventHandler(async (event) => {
  // Convert H3 event to standard Request
  const webReq = toWebRequest(event);
  const res = await app.fetch(webReq);
  return res;
});
